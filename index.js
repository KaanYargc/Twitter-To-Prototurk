import dotenv from 'dotenv';
import Parser from 'rss-parser';
import axios from 'axios';
import fs from 'fs/promises';

dotenv.config();

class TwitterToPrototurk {
  constructor() {
    // RSS Parser
    this.parser = new Parser({
      customFields: {
        item: ['description', 'pubDate', 'link']
      }
    });

    // Prototurk config
    this.prototurkBaseUrl = 'https://dev.prototurk.com';
    this.prototurkHeaders = {
      'Content-Type': 'application/json',
      'Cookie': `pt_session=${process.env.PROTOTURK_SESSION}; pt_csrf=${process.env.PROTOTURK_CSRF}`,
      'x-csrf-token': process.env.PROTOTURK_CSRF,
      'Origin': this.prototurkBaseUrl,
      'Referer': `${this.prototurkBaseUrl}/${process.env.TWITTER_USERNAME}`,
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:149.0) Gecko/20100101 Firefox/149.0'
    };

    // Son işlenen tweet linkini sakla
    this.lastProcessedFile = 'last_processed.json';
  }

  async getLastProcessedLink() {
    try {
      const data = await fs.readFile(this.lastProcessedFile, 'utf-8');
      return JSON.parse(data).lastLink;
    } catch (error) {
      return null;
    }
  }

  async saveLastProcessedLink(link) {
    await fs.writeFile(this.lastProcessedFile, JSON.stringify({ 
      lastLink: link, 
      timestamp: new Date().toISOString() 
    }));
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

  async postToPrototurk(content) {
    try {
      console.log('📤 Prototurk\'e gönderiliyor...');
      
      const payload = {
        content: content,
        contentJson: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: content
                }
              ]
            }
          ]
        },
        category: "genel",
        status: "published"
      };
      
      const response = await axios.post(
        `${this.prototurkBaseUrl}/api/posts`,
        payload,
        { headers: this.prototurkHeaders }
      );

      console.log('✅ Başarıyla gönderildi:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Prototurk API hatası:', error.response?.data || error.message);
      throw error;
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

  async processNewTweets() {
    const username = process.env.TWITTER_USERNAME;
    const items = await this.fetchRSS(username);

    if (items.length === 0) {
      console.log('ℹ️  RSS\'de içerik bulunamadı.');
      return;
    }

    const lastProcessedLink = await this.getLastProcessedLink();
    const newItems = [];

    // Yeni tweet'leri bul
    for (const item of items) {
      if (lastProcessedLink && item.link === lastProcessedLink) {
        break; // Daha önce işlenmiş tweet'e ulaştık
      }
      newItems.push(item);
    }

    if (newItems.length === 0) {
      console.log('ℹ️  Yeni tweet bulunamadı.');
      return;
    }

    console.log(`🔄 ${newItems.length} yeni tweet bulundu, işleniyor...`);

    // Eski -> yeni sırasında işle
    const sortedItems = newItems.reverse();

    for (const item of sortedItems) {
      try {
        const content = this.cleanTweetContent(item.contentSnippet || item.description || item.title);
        console.log(`\n📝 Tweet: ${content.substring(0, 50)}...`);
        console.log(`🔗 Link: ${item.link}`);
        
        await this.postToPrototurk(content);
        await this.saveLastProcessedLink(item.link);
        
        // Rate limiting için bekleme
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`❌ Tweet işlenirken hata: ${item.link}`);
      }
    }
  }

  async start() {
    console.log('🚀 Twitter (RSS) -> Prototurk otomatik aktarım başlatıldı\n');
    console.log(`👤 Kullanıcı: ${process.env.TWITTER_USERNAME}\n`);
    
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
}

// Başlat
const bot = new TwitterToPrototurk();
bot.start().catch(console.error);
