import axios from 'axios';
import fs from 'fs/promises';

class AccountManager {
  constructor() {
    this.accountsFile = 'accounts.json';
    this.prototurkBaseUrl = 'https://dev.prototurk.com';
  }

  async loadAccounts() {
    try {
      const data = await fs.readFile(this.accountsFile, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('❌ Hesaplar yüklenemedi:', error.message);
      return [];
    }
  }

  async saveAccounts(accounts) {
    await fs.writeFile(this.accountsFile, JSON.stringify(accounts, null, 2));
  }

  async registerPrototurkAccount(twitterUsername, email, password) {
    try {
      console.log(`📝 Prototurk hesabı oluşturuluyor: ${twitterUsername}`);
      
      // Önce CSRF token al
      const homeResponse = await axios.get(this.prototurkBaseUrl);
      const cookies = homeResponse.headers['set-cookie'];
      
      let sessionCookie = '';
      let csrfToken = '';
      
      if (cookies) {
        cookies.forEach(cookie => {
          if (cookie.includes('pt_session=')) {
            sessionCookie = cookie.split(';')[0].split('=')[1];
          }
          if (cookie.includes('pt_csrf=')) {
            csrfToken = cookie.split(';')[0].split('=')[1];
          }
        });
      }

      // Kayıt ol
      const registerResponse = await axios.post(
        `${this.prototurkBaseUrl}/api/auth/register`,
        {
          username: twitterUsername,
          email: email,
          password: password
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Cookie': `pt_session=${sessionCookie}; pt_csrf=${csrfToken}`,
            'x-csrf-token': csrfToken,
            'Origin': this.prototurkBaseUrl,
            'Referer': `${this.prototurkBaseUrl}/register`,
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:149.0) Gecko/20100101 Firefox/149.0'
          }
        }
      );

      // Yeni session bilgilerini al
      const newCookies = registerResponse.headers['set-cookie'];
      let newSession = '';
      let newCsrf = '';
      
      if (newCookies) {
        newCookies.forEach(cookie => {
          if (cookie.includes('pt_session=')) {
            newSession = cookie.split(';')[0].split('=')[1];
          }
          if (cookie.includes('pt_csrf=')) {
            newCsrf = cookie.split(';')[0].split('=')[1];
          }
        });
      }

      console.log('✅ Hesap oluşturuldu:', registerResponse.data);
      
      return {
        success: true,
        session: newSession,
        csrf: newCsrf,
        data: registerResponse.data
      };
    } catch (error) {
      console.error('❌ Hesap oluşturma hatası:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  async setupPrototurkProfile(twitterUsername, session, csrf) {
    try {
      // Twitter'dan profil bilgilerini çek
      const TwitterToPrototurk = (await import('./index.js')).default;
      const bot = new TwitterToPrototurk();
      
      const profileInfo = await bot.getTwitterProfileInfo(twitterUsername);
      
      if (!profileInfo) {
        console.log(`⚠️  ${twitterUsername} profil bilgisi alınamadı`);
        return false;
      }
      
      // Prototurk profilini güncelle
      const account = {
        twitterUsername: twitterUsername,
        prototurkUsername: twitterUsername,
        prototurkSession: session,
        prototurkCsrf: csrf
      };
      
      await bot.updatePrototurkProfile(account, profileInfo);
      
      return true;
    } catch (error) {
      console.error(`⚠️  Profil kurulumu hatası:`, error.message);
      return false;
    }
  }

  async checkIfPolitical(twitterUsername) {
    // Politik anahtar kelimeler (daha kapsamlı)
    const politicalKeywords = [
      // Partiler
      'chp', 'akp', 'mhp', 'hdp', 'iyi parti', 'deva', 'gelecek', 'zafer',
      'cumhuriyet halk', 'adalet ve kalkınma', 'milliyetçi hareket',
      
      // Pozisyonlar
      'cumhurbaşkan', 'başbakan', 'milletvekil', 'bakan', 'vekil',
      'belediye başkan', 'genel başkan',
      
      // Terimler
      'siyaset', 'politika', 'seçim', 'oy', 'parti', 'iktidar',
      'tbmm', 'meclis', 'hükümet', 'muhalefet', 'koalisyon',
      'referandum', 'sandık', 'kampanya',
      
      // İsimler (sadece siyasi liderler)
      'kılıçdaroğlu', 'erdoğan', 'bahçeli', 'akşener', 'babacan',
      'davutoğlu', 'özdağ', 'demirtaş', 'yavaş', 'imamoğlu'
    ];

    try {
      // RSS'den son tweetleri çek
      const Parser = (await import('rss-parser')).default;
      const parser = new Parser();
      const feed = await parser.parseURL(`https://nitter.net/${twitterUsername}/rss`);
      
      if (!feed.items || feed.items.length === 0) {
        console.log(`⚠️  ${twitterUsername}: RSS bulunamadı, politik değil sayılıyor`);
        return false;
      }

      // Son 10 tweet'i kontrol et
      let politicalCount = 0;
      const checkCount = Math.min(10, feed.items.length);
      
      for (let i = 0; i < checkCount; i++) {
        const content = (feed.items[i].contentSnippet || feed.items[i].title || '').toLowerCase();
        
        for (const keyword of politicalKeywords) {
          if (content.includes(keyword)) {
            politicalCount++;
            break;
          }
        }
      }

      // %40'dan fazlası politik içerik içeriyorsa politik hesap
      const isPolitical = (politicalCount / checkCount) > 0.4;
      
      console.log(`🔍 ${twitterUsername}: ${politicalCount}/${checkCount} politik tweet - ${isPolitical ? '❌ POLİTİK' : '✅ POLİTİK DEĞİL'}`);
      
      return isPolitical;
    } catch (error) {
      console.error(`⚠️  ${twitterUsername} kontrol edilemedi:`, error.message);
      return false; // Hata durumunda politik değil say
    }
  }

  generateRandomEmail(username) {
    const domains = ['gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com', 'protonmail.com'];
    const randomNum = Math.floor(Math.random() * 100000);
    const randomDomain = domains[Math.floor(Math.random() * domains.length)];
    return `${username}_${randomNum}@${randomDomain}`;
  }

  generateRandomPassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 20; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  async addTwitterAccount(twitterUsername, autoRegister = true) {
    const accounts = await this.loadAccounts();
    
    // Zaten var mı kontrol et
    const existing = accounts.find(acc => acc.twitterUsername === twitterUsername);
    if (existing) {
      console.log(`ℹ️  ${twitterUsername} zaten kayıtlı, atlanıyor...`);
      return null; // Zaten var, yeni ekleme
    }

    // Politik mi kontrol et
    const isPolitical = await this.checkIfPolitical(twitterUsername);
    
    if (isPolitical) {
      console.log(`⚠️  ${twitterUsername} politik hesap, eklenmedi`);
      return null;
    }

    const newAccount = {
      twitterUsername: twitterUsername,
      prototurkUsername: '',
      prototurkSession: '',
      prototurkCsrf: '',
      email: '',
      password: '',
      isPolitical: false,
      enabled: true,
      createdAt: new Date().toISOString()
    };

    // Otomatik kayıt
    if (autoRegister) {
      const email = this.generateRandomEmail(twitterUsername);
      const password = this.generateRandomPassword();
      
      console.log(`📧 Email: ${email}`);
      console.log(`🔑 Şifre: ${password}`);
      
      const result = await this.registerPrototurkAccount(twitterUsername, email, password);
      
      if (result.success) {
        newAccount.prototurkUsername = twitterUsername;
        newAccount.prototurkSession = result.session;
        newAccount.prototurkCsrf = result.csrf;
        newAccount.email = email;
        newAccount.password = password;
        
        console.log(`✅ Hesap bilgileri JSON'a kaydedildi`);
        
        // Profil bilgilerini güncelle
        console.log(`\n🎨 Profil kuruluyor...`);
        await this.setupPrototurkProfile(twitterUsername, result.session, result.csrf);
        
      } else {
        console.log(`⚠️  ${twitterUsername} için otomatik kayıt başarısız`);
        // Yine de email/şifre kaydet, manuel kullanım için
        newAccount.email = email;
        newAccount.password = password;
      }
    }

    accounts.push(newAccount);
    await this.saveAccounts(accounts);
    
    console.log(`✅ ${twitterUsername} eklendi`);
    return newAccount;
  }

  async getActiveAccounts() {
    const accounts = await this.loadAccounts();
    return accounts.filter(acc => 
      acc.enabled && 
      !acc.isPolitical && 
      acc.prototurkSession && 
      acc.prototurkCsrf
    );
  }
}

export default AccountManager;
