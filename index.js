import dotenv from 'dotenv';
import Parser from 'rss-parser';
import axios from 'axios';
import fs from 'fs/promises';
import * as cheerio from 'cheerio';
import AccountManager from './account-manager.js';

dotenv.config();

class TwitterToPrototurk {
  constructor() {
    // RSS Parser
    this.parser = new Parser({
      customFields: {
        item: ['description', 'pubDate', 'link']
      }
    });

    // Account Manager
    this.accountManager = new AccountManager();

    // Prototurk config
    this.prototurkBaseUrl = 'https://dev.prototurk.com';

    // Son işlenen tweet linklerini sakla (hesap bazında)
    this.lastProcessedFile = 'last_processed.json';
  }

  async getLastProcessedLink(username) {
    try {
      const data = await fs.readFile(this.lastProcessedFile, 'utf-8');
      const processed = JSON.parse(data);
      return processed[username] || null;
    } catch (error) {
      return null;
    }
  }

  async saveLastProcessedLink(username, link) {
    try {
      let processed = {};
      try {
        const data = await fs.readFile(this.lastProcessedFile, 'utf-8');
        processed = JSON.parse(data);
      } catch (error) {
        // Dosya yoksa boş obje
      }
      
      processed[username] = {
        lastLink: link,
        timestamp: new Date().toISOString()
      };
      
      await fs.writeFile(this.lastProcessedFile, JSON.stringify(processed, null, 2));
    } catch (error) {
      console.error('⚠️  Son işlenen link kaydedilemedi:', error.message);
    }
  }

  async fetchRSS(username) {
    // Farklı Nitter instance'ları
    const nitterInstances = [
      'https://nitter.net',
      'https://nitter.poast.org',
      'https://nitter.privacydev.net',
      'https://nitter.1d4.us'
    ];
    
    for (const instance of nitterInstances) {
      const rssUrl = `${instance}/${username}/rss`;
      
      try {
        console.log(`📥 RSS çekiliyor: ${rssUrl}`);
        const feed = await this.parser.parseURL(rssUrl);
        
        if (feed.items && feed.items.length > 0) {
          console.log(`✅ ${feed.items.length} tweet bulundu`);
          return feed.items;
        }
      } catch (error) {
        console.log(`⚠️  ${instance} RSS başarısız, sonrakini deniyorum...`);
        continue;
      }
    }
    
    console.error('❌ Tüm Nitter instance\'ları başarısız oldu');
    return [];
  }

  async postToPrototurk(account, content, images = []) {
    try {
      console.log(`📤 ${account.twitterUsername} için Prototurk'e gönderiliyor...`);
      
      const prototurkHeaders = {
        'Content-Type': 'application/json',
        'Cookie': `pt_session=${account.prototurkSession}; pt_csrf=${account.prototurkCsrf}`,
        'x-csrf-token': account.prototurkCsrf,
        'Origin': this.prototurkBaseUrl,
        'Referer': `${this.prototurkBaseUrl}/${account.prototurkUsername}`,
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:149.0) Gecko/20100101 Firefox/149.0'
      };
      
      // contentJson oluştur
      const contentJsonParts = [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: content
            }
          ]
        }
      ];
      
      // Görselleri ekle
      if (images && images.length > 0) {
        console.log(`🖼️  ${images.length} görsel ekleniyor...`);
        
        for (const imageUrl of images) {
          const imageData = await this.downloadImage(imageUrl);
          if (imageData) {
            const uploadedUrl = await this.uploadImageToPrototurk(account, imageData.buffer, imageData.contentType);
            if (uploadedUrl) {
              contentJsonParts.push({
                type: "image",
                attrs: {
                  src: uploadedUrl,
                  alt: "Tweet görseli",
                  title: null
                }
              });
            }
          }
        }
      }
      
      const payload = {
        content: content,
        contentJson: {
          type: "doc",
          content: contentJsonParts
        },
        category: "genel",
        status: "published"
      };
      
      const response = await axios.post(
        `${this.prototurkBaseUrl}/api/posts`,
        payload,
        { headers: prototurkHeaders }
      );

      console.log(`✅ ${account.twitterUsername} için başarıyla gönderildi:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ ${account.twitterUsername} için Prototurk API hatası:`, error.response?.data || error.message);
      throw error;
    }
  }

  extractImagesFromContent(htmlContent) {
    try {
      const $ = cheerio.load(htmlContent);
      const imageUrls = [];
      
      $('img').each((index, img) => {
        const src = $(img).attr('src');
        if (src && !src.includes('emoji') && !src.includes('icon')) {
          // Nitter'daki görselleri tam URL'e çevir
          const fullUrl = src.startsWith('http') ? src : `https://nitter.net${src}`;
          imageUrls.push(fullUrl);
        }
      });
      
      return imageUrls;
    } catch (error) {
      console.error('⚠️  Görsel çıkarma hatası:', error.message);
      return [];
    }
  }

  async downloadImage(url) {
    try {
      console.log(`   📥 Görsel indiriliyor: ${url}`);
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 15000, // 15 saniye timeout
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:149.0) Gecko/20100101 Firefox/149.0',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive'
        },
        maxRedirects: 5
      });
      
      console.log(`   ✅ Görsel indirildi (${response.data.length} bytes, ${response.headers['content-type']})`);
      
      return {
        buffer: response.data,
        contentType: response.headers['content-type'] || 'image/jpeg'
      };
    } catch (error) {
      console.error('⚠️  Görsel indirme hatası:', url, error.message);
      return null;
    }
  }

  async updatePrototurkProfile(account, profileData) {
    try {
      console.log(`\n👤 ${account.twitterUsername} için profil güncelleniyor...`);
      
      // Önce profil fotoğrafını yükle (varsa)
      let avatarKey = null;
      if (profileData.avatar) {
        avatarKey = await this.uploadPrototurkAvatar(account, profileData.avatar);
      }
      
      // Profil bilgilerini hazırla
      const payload = {
        name: profileData.displayName,
        about: profileData.bio || '',
        websiteUrl: profileData.website || ''
      };
      
      // Avatar key varsa ekle
      if (avatarKey) {
        payload.avatar = avatarKey;
      }
      
      console.log(`   İsim: ${profileData.displayName}`);
      console.log(`   Bio: ${profileData.bio?.substring(0, 50) || 'Yok'}${profileData.bio?.length > 50 ? '...' : ''}`);
      console.log(`   Website: ${profileData.website || 'Yok'}`);
      if (avatarKey) {
        console.log(`   Avatar Key: ${avatarKey}`);
      }
      
      const response = await axios.patch(
        `${this.prototurkBaseUrl}/api/account/profile`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Cookie': `pt_session=${account.prototurkSession}; pt_csrf=${account.prototurkCsrf}`,
            'x-csrf-token': account.prototurkCsrf,
            'Origin': this.prototurkBaseUrl,
            'Referer': `${this.prototurkBaseUrl}/settings`,
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:149.0) Gecko/20100101 Firefox/149.0'
          },
          timeout: 10000
        }
      );

      console.log(`   ✅ Profil güncellendi`);
      
      return response.data;
    } catch (error) {
      console.error(`❌ Profil güncelleme hatası:`, error.response?.data || error.message);
      if (error.response) {
        console.error(`   Status: ${error.response.status}`);
      }
      return null;
    }
  }

  async uploadPrototurkAvatar(account, avatarUrl) {
    try {
      console.log(`🖼️  Profil fotoğrafı yükleniyor: ${avatarUrl}`);
      
      // Avatar'ı indir
      const imageData = await this.downloadImage(avatarUrl);
      if (!imageData) {
        console.log(`⚠️  Avatar indirilemedi`);
        return null;
      }
      
      // Prototurk'e yükle
      const FormData = (await import('form-data')).default;
      const form = new FormData();
      
      const ext = imageData.contentType.includes('png') ? 'png' : 'jpg';
      form.append('file', imageData.buffer, {
        filename: `avatar.${ext}`,
        contentType: imageData.contentType
      });
      
      console.log(`   📤 Prototurk'e yükleniyor...`);
      
      const uploadResponse = await axios.post(
        `${this.prototurkBaseUrl}/api/uploads`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            'Cookie': `pt_session=${account.prototurkSession}; pt_csrf=${account.prototurkCsrf}`,
            'x-csrf-token': account.prototurkCsrf,
            'Origin': this.prototurkBaseUrl,
            'Referer': `${this.prototurkBaseUrl}/settings`,
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:149.0) Gecko/20100101 Firefox/149.0'
          },
          timeout: 30000
        }
      );
      
      console.log(`   ✅ Profil fotoğrafı yüklendi`);
      
      // Avatar key'ini döndür
      if (uploadResponse.data && uploadResponse.data.key) {
        return uploadResponse.data.key;
      } else {
        console.log(`   ⚠️  Avatar key bulunamadı`);
        return null;
      }
      
    } catch (error) {
      console.error(`❌ Avatar yükleme hatası:`, error.response?.data || error.message);
      if (error.response) {
        console.error(`   Status: ${error.response.status}`);
        console.error(`   Headers:`, error.response.headers);
      }
      return null;
    }
  }

  async getTwitterProfileInfo(username) {
    // Farklı Nitter instance'ları
    const nitterInstances = [
      'https://nitter.net',
      'https://nitter.poast.org',
      'https://nitter.privacydev.net',
      'https://nitter.1d4.us'
    ];
    
    for (const instance of nitterInstances) {
      try {
        console.log(`🔍 ${username} profil bilgileri çekiliyor (${instance})...`);
        
        // RSS feed'i çek
        const feed = await this.parser.parseURL(`${instance}/${username}/rss`);
        
        if (!feed || !feed.title) {
          continue;
        }
        
        // RSS'den profil bilgilerini çıkar
        // Title formatı: "Display Name / @username"
        let displayName = username; // Varsayılan
        if (feed.title.includes(' / @')) {
          displayName = feed.title.split(' / @')[0].trim();
        }
        
        // Avatar URL - RSS feed.image.url'den
        let avatarUrl = null;
        if (feed.image && feed.image.url) {
          // Nitter proxy URL'ini gerçek Twitter URL'ine çevir
          // Örnek: https://nitter.net/pic/pbs.twimg.com%2Fprofile_images%2F...
          avatarUrl = feed.image.url;
          
          // URL decode et ve gerçek Twitter URL'ini oluştur
          if (avatarUrl.includes('nitter.net/pic/')) {
            const encodedPath = avatarUrl.split('nitter.net/pic/')[1];
            const decodedPath = decodeURIComponent(encodedPath);
            // Eğer decode edilmiş path zaten https:// ile başlıyorsa, olduğu gibi kullan
            avatarUrl = decodedPath.startsWith('http') ? decodedPath : `https://${decodedPath}`;
            console.log(`   Avatar URL decode edildi: ${avatarUrl}`);
          }
        }
        
        // Bio için HTML sayfasını parse et (Cheerio ile)
        let bio = '';
        try {
          const response = await axios.get(`${instance}/${username}`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
              'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
              'Accept-Encoding': 'gzip, deflate, br',
              'Connection': 'keep-alive',
              'Upgrade-Insecure-Requests': '1',
              'Sec-Fetch-Dest': 'document',
              'Sec-Fetch-Mode': 'navigate',
              'Sec-Fetch-Site': 'none',
              'Cache-Control': 'max-age=0'
            },
            timeout: 10000
          });
          
          const $ = cheerio.load(response.data);
          
          // Bio bilgisini çek - div.profile-bio içindeki p tag'inden
          const bioElement = $('.profile-bio p');
          if (bioElement.length > 0) {
            bio = bioElement.text().trim();
          }
          
          // Alternatif: doğrudan div.profile-bio
          if (!bio) {
            bio = $('div.profile-bio').text().trim();
          }
          
          // Diğer alternatifler
          if (!bio) {
            bio = $('.profile-card-bio').text().trim();
          }
          
          if (!bio) {
            bio = $('.profile-card-extra .profile-bio p').text().trim();
          }
          
        } catch (error) {
          // Bio alınamazsa boş bırak
          console.log(`⚠️  Bio çekilemedi: ${error.message}`);
        }
        
        // Bio bulunamadıysa, displayName'den anlamlı bir bio oluştur
        if (!bio) {
          bio = `${displayName} resmi ProtoTürk hesabı`;
        }
        
        console.log(`✅ Profil bilgileri alındı:`);
        console.log(`   İsim: ${displayName}`);
        console.log(`   Bio: ${bio}`);
        console.log(`   Avatar: ${avatarUrl ? 'Var' : 'Yok'}`);
        
        return {
          username: username,
          displayName: displayName,
          bio: bio,
          website: `https://twitter.com/${username}`,
          avatar: avatarUrl
        };
        
      } catch (error) {
        console.log(`⚠️  ${instance} başarısız, sonrakini deniyorum...`);
        continue;
      }
    }
    
    // Hiçbir instance çalışmadı
    console.error(`❌ Tüm Nitter instance'ları başarısız oldu`);
    return {
      username: username,
      displayName: username,
      bio: `${username} resmi ProtoTürk hesabı`,
      website: `https://twitter.com/${username}`,
      avatar: null
    };
  }

  async uploadImageToPrototurk(account, imageBuffer, contentType) {
    try {
      const FormData = (await import('form-data')).default;
      const form = new FormData();
      
      // Dosya uzantısını content-type'dan belirle
      const ext = contentType.includes('png') ? 'png' : 'jpg';
      form.append('file', imageBuffer, {
        filename: `image.${ext}`,
        contentType: contentType
      });
      
      const response = await axios.post(
        `${this.prototurkBaseUrl}/api/uploads`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            'Cookie': `pt_session=${account.prototurkSession}; pt_csrf=${account.prototurkCsrf}`,
            'x-csrf-token': account.prototurkCsrf,
          }
        }
      );
      
      console.log(`✅ Görsel yüklendi:`, response.data);
      return response.data.url || response.data.path;
      
    } catch (error) {
      console.error('⚠️  Görsel yükleme hatası:', error.response?.data || error.message);
      return null;
    }
  }

  cleanTweetContent(htmlContent) {
    // HTML etiketlerini temizle
    let content = htmlContent
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .trim();
    
    return content;
  }

  async processAccountTweets(account) {
    const username = account.twitterUsername;
    const items = await this.fetchRSS(username);

    if (items.length === 0) {
      console.log(`ℹ️  ${username}: RSS'de içerik bulunamadı.`);
      return;
    }

    const lastProcessedData = await this.getLastProcessedLink(username);
    const lastProcessedLink = lastProcessedData?.lastLink;
    const newItems = [];

    // Yeni tweet'leri bul
    for (const item of items) {
      if (lastProcessedLink && item.link === lastProcessedLink) {
        break; // Daha önce işlenmiş tweet'e ulaştık
      }
      newItems.push(item);
    }

    if (newItems.length === 0) {
      console.log(`ℹ️  ${username}: Yeni tweet bulunamadı.`);
      return;
    }

    console.log(`🔄 ${username}: ${newItems.length} yeni tweet bulundu, işleniyor...`);

    // Eski -> yeni sırasında işle
    const sortedItems = newItems.reverse();

    // Tweet'leri paralel gönder (max 5 aynı anda)
    const batchSize = 5;
    
    for (let i = 0; i < sortedItems.length; i += batchSize) {
      const batch = sortedItems.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (item) => {
          try {
            const content = this.cleanTweetContent(item.contentSnippet || item.description || item.title);
            const images = this.extractImagesFromContent(item.content || item.description || '');
            
            console.log(`\n📝 ${username}: ${content.substring(0, 50)}...`);
            console.log(`🔗 Link: ${item.link}`);
            if (images.length > 0) {
              console.log(`🖼️  ${images.length} görsel bulundu`);
            }
            
            await this.postToPrototurk(account, content, images);
            await this.saveLastProcessedLink(username, item.link);
            
          } catch (error) {
            console.error(`❌ ${username}: Tweet işlenirken hata: ${item.link}`);
          }
        })
      );
      
      // Batch'ler arası kısa bekleme
      if (i + batchSize < sortedItems.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  async processNewTweets() {
    const accounts = await this.accountManager.getActiveAccounts();
    
    if (accounts.length === 0) {
      console.log('⚠️  Aktif hesap bulunamadı!');
      return;
    }

    console.log(`\n📊 ${accounts.length} hesap işlenecek...\n`);

    // Paralel işleme için Promise.all kullan (max 10 hesap aynı anda)
    const batchSize = 10;
    
    for (let i = 0; i < accounts.length; i += batchSize) {
      const batch = accounts.slice(i, i + batchSize);
      console.log(`\n🔄 Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} hesap paralel işleniyor...\n`);
      
      await Promise.all(
        batch.map(async (account) => {
          try {
            await this.processAccountTweets(account);
          } catch (error) {
            console.error(`❌ ${account.twitterUsername} işlenirken hata:`, error.message);
          }
        })
      );
      
      // Batch'ler arası kısa bekleme
      if (i + batchSize < accounts.length) {
        console.log('\n⏳ Sonraki batch için 3 saniye bekleniyor...\n');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    console.log('\n✅ Tüm hesaplar işlendi!\n');
  }

  async start() {
    console.log('🚀 Twitter (RSS) -> Prototurk çoklu hesap aktarımı başlatıldı\n');
    
    // İlk çalıştırma - profil senkronizasyonu
    console.log('🔄 PROFIL SENKRONİZASYONU\n');
    console.log('Tüm hesapların profil bilgileri Twitter\'dan çekilip Prototurk\'e aktarılacak.\n');
    await this.syncAllProfiles();
    
    // Tweet'leri çek
    await this.processNewTweets();

    // Periyodik kontrol
    const intervalMinutes = parseInt(process.env.CHECK_INTERVAL_MINUTES) || 5;
    console.log(`\n⏰ ${intervalMinutes} dakikada bir kontrol edilecek...\n`);
    
    setInterval(async () => {
      console.log(`\n⏰ ${new Date().toLocaleString('tr-TR')} - Kontrol ediliyor...`);
      await this.processNewTweets();
    }, intervalMinutes * 60 * 1000);
    
    // Her 1 saatte bir profil senkronizasyonu
    setInterval(async () => {
      console.log(`\n🔄 ${new Date().toLocaleString('tr-TR')} - Profil senkronizasyonu...`);
      await this.syncAllProfiles();
    }, 60 * 60 * 1000); // 1 saat
  }

  async syncAllProfiles() {
    const accounts = await this.accountManager.getActiveAccounts();
    
    if (accounts.length === 0) {
      return;
    }

    console.log(`\n🎨 ${accounts.length} hesabın profili senkronize ediliyor...\n`);

    // Paralel profil senkronizasyonu (max 10 aynı anda)
    const batchSize = 10;
    
    for (let i = 0; i < accounts.length; i += batchSize) {
      const batch = accounts.slice(i, i + batchSize);
      console.log(`🔄 Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} profil paralel güncelleniyor...\n`);
      
      await Promise.all(
        batch.map(async (account) => {
          try {
            await this.syncProfile(account);
          } catch (error) {
            console.error(`❌ ${account.twitterUsername} profil senkronizasyonu hatası:`, error.message);
          }
        })
      );
      
      // Batch'ler arası kısa bekleme
      if (i + batchSize < accounts.length) {
        console.log('\n⏳ Sonraki batch için 2 saniye bekleniyor...\n');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log('\n✅ Profil senkronizasyonu tamamlandı\n');
  }

  async syncProfile(account) {
    console.log(`🔄 ${account.twitterUsername} profili güncelleniyor...`);
    
    // Twitter'dan profil bilgilerini çek
    const profileInfo = await this.getTwitterProfileInfo(account.twitterUsername);
    
    if (!profileInfo) {
      console.log(`⚠️  ${account.twitterUsername} profil bilgisi alınamadı`);
      return;
    }
    
    // Prototurk profilini güncelle
    await this.updatePrototurkProfile(account, profileInfo);
  }

  // Yeni hesap ekleme fonksiyonu
  async addAccount(twitterUsername) {
    return await this.accountManager.addTwitterAccount(twitterUsername, true);
  }
}

// Başlat
const bot = new TwitterToPrototurk();
bot.start().catch(console.error);

export default TwitterToPrototurk;
