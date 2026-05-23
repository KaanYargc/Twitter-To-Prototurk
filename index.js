import dotenv from 'dotenv';
import Parser from 'rss-parser';
import axios from 'axios';
import fs from 'fs/promises';
import { JSDOM } from 'jsdom';
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
    const rssUrl = `https://nitter.net/${username}/rss`;
    
    try {
      console.log(`📥 RSS çekiliyor: ${rssUrl}`);
      const feed = await this.parser.parseURL(rssUrl);
      
      if (feed.items && feed.items.length > 0) {
        console.log(`✅ ${feed.items.length} tweet bulundu`);
        return feed.items;
      }
      
      return [];
    } catch (error) {
      console.error('❌ RSS çekme hatası:', error.message);
      return [];
    }
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
      const dom = new JSDOM(htmlContent);
      const images = dom.window.document.querySelectorAll('img');
      const imageUrls = [];
      
      images.forEach(img => {
        const src = img.src;
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
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:149.0) Gecko/20100101 Firefox/149.0'
        }
      });
      
      return {
        buffer: response.data,
        contentType: response.headers['content-type']
      };
    } catch (error) {
      console.error('⚠️  Görsel indirme hatası:', url, error.message);
      return null;
    }
  }

  async updatePrototurkProfile(account, profileData) {
    try {
      console.log(`👤 ${account.twitterUsername} için profil güncelleniyor...`);
      
      const payload = {
        displayName: profileData.displayName,
        bio: profileData.bio || '',
        website: profileData.website || ''
      };
      
      console.log(`   İsim: ${profileData.displayName}`);
      console.log(`   Bio: ${profileData.bio?.substring(0, 50) || 'Yok'}...`);
      
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
          }
        }
      );

      console.log(`✅ Profil güncellendi`);
      
      // Profil fotoğrafı varsa yükle
      if (profileData.avatar) {
        await this.updatePrototurkAvatar(account, profileData.avatar);
      }
      
      return response.data;
    } catch (error) {
      console.error(`⚠️  Profil güncelleme hatası:`, error.response?.data || error.message);
      return null;
    }
  }

  async updatePrototurkAvatar(account, avatarUrl) {
    try {
      console.log(`🖼️  Profil fotoğrafı yükleniyor...`);
      
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
      
      console.log(`✅ Profil fotoğrafı yüklendi:`, response.data);
      
      // Avatar URL'sini profile kaydet
      if (response.data.url || response.data.path) {
        const avatarUrl = response.data.url || response.data.path;
        await axios.patch(
          `${this.prototurkBaseUrl}/api/account/profile`,
          { avatar: avatarUrl },
          {
            headers: {
              'Content-Type': 'application/json',
              'Cookie': `pt_session=${account.prototurkSession}; pt_csrf=${account.prototurkCsrf}`,
              'x-csrf-token': account.prototurkCsrf,
            }
          }
        );
        console.log(`✅ Avatar profilde güncellendi`);
      }
      
      return response.data;
    } catch (error) {
      console.error(`⚠️  Avatar yükleme hatası:`, error.response?.data || error.message);
      return null;
    }
  }

  async getTwitterProfileInfo(username) {
    try {
      console.log(`🔍 ${username} profil bilgileri çekiliyor...`);
      
      // RSS'den profil bilgilerini çek
      const feed = await this.parser.parseURL(`https://nitter.net/${username}/rss`);
      
      if (!feed || !feed.title) {
        console.log(`⚠️  Profil bilgisi bulunamadı`);
        return null;
      }
      
      // Nitter sayfasından detaylı bilgi çek
      const pageResponse = await axios.get(`https://nitter.net/${username}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:149.0) Gecko/20100101 Firefox/149.0'
        }
      });
      
      const { JSDOM } = await import('jsdom');
      const dom = new JSDOM(pageResponse.data);
      const doc = dom.window.document;
      
      // Profil bilgilerini çıkar
      const displayName = doc.querySelector('.profile-card-fullname')?.textContent?.trim() || username;
      const bio = doc.querySelector('.profile-bio')?.textContent?.trim() || '';
      const website = doc.querySelector('.profile-website a')?.href || '';
      const avatarElement = doc.querySelector('.profile-card-avatar');
      const avatarUrl = avatarElement ? `https://nitter.net${avatarElement.src}` : null;
      
      console.log(`✅ Profil bilgileri alındı: ${displayName}`);
      
      return {
        username: username,
        displayName: displayName,
        bio: bio,
        website: website,
        avatar: avatarUrl
      };
    } catch (error) {
      console.error(`⚠️  Profil bilgisi çekme hatası:`, error.message);
      return {
        username: username,
        displayName: username,
        bio: '',
        website: '',
        avatar: null
      };
    }
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

    for (const item of sortedItems) {
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
        
        // Rate limiting için bekleme
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error) {
        console.error(`❌ ${username}: Tweet işlenirken hata: ${item.link}`);
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

    for (const account of accounts) {
      try {
        await this.processAccountTweets(account);
      } catch (error) {
        console.error(`❌ ${account.twitterUsername} işlenirken hata:`, error.message);
      }
      
      // Hesaplar arası bekleme
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  async start() {
    console.log('🚀 Twitter (RSS) -> Prototurk çoklu hesap aktarımı başlatıldı\n');
    
    // İlk çalıştırma
    await this.processNewTweets();

    // Periyodik kontrol
    const intervalMinutes = parseInt(process.env.CHECK_INTERVAL_MINUTES) || 5;
    console.log(`\n⏰ ${intervalMinutes} dakikada bir kontrol edilecek...\n`);
    
    setInterval(async () => {
      console.log(`\n⏰ ${new Date().toLocaleString('tr-TR')} - Kontrol ediliyor...`);
      await this.processNewTweets();
    }, intervalMinutes * 60 * 1000);
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
