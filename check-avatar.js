#!/usr/bin/env node
import axios from 'axios';

const accounts = [
  {
    name: 'yemeksepeti',
    session: 'fTqcL22JhbKTNPKN_kpQNfAjCumJQPVirekV9PCAvAE',
    csrf: 'ESBP_Akr4UAFjD8p9PorhlcjPB2ULVDIpjqPPz1nBn0'
  },
  {
    name: 'getir',
    session: 'OMzTTUkY9b0Hoak6XPhGq_jcjhlvMFWnPbvMWzSPGKk',
    csrf: 'NEbmi0nbnXPv1BO1dnBopgrNPNEjHXhjeK-2y9qdPRY'
  }
];

const prototurkBaseUrl = 'https://dev.prototurk.com';

async function checkProfile(account) {
  try {
    console.log(`\n🔍 ${account.name} profili kontrol ediliyor...\n`);
    
    // Kullanıcı profilini public endpoint'ten çek
    const publicResponse = await axios.get(
      `${prototurkBaseUrl}/${account.name}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:149.0) Gecko/20100101 Firefox/149.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      }
    );
    
    // HTML'den avatar bilgisini çıkar
    const html = publicResponse.data;
    
    // Avatar img tag'ini bul
    const avatarMatch = html.match(/src="([^"]*avatar[^"]*)"/i) || 
                       html.match(/src="(https:\/\/cdn\.prototurk\.com\/posts[^"]*\.(jpg|png|jpeg|webp))"/i);
    
    if (avatarMatch) {
      console.log(`✅ Avatar bulundu: ${avatarMatch[1]}`);
    } else {
      console.log(`⚠️  Avatar bulunamadı (HTML'de avatar tag'i yok)`);
    }
    
    // Meta tag'lerde avatar var mı?
    const ogImageMatch = html.match(/<meta property="og:image" content="([^"]+)"/i);
    if (ogImageMatch) {
      console.log(`📷 OG Image: ${ogImageMatch[1]}`);
    }
    
    // Profile link
    console.log(`🔗 Profil: ${prototurkBaseUrl}/${account.name}`);
    
  } catch (error) {
    console.error(`❌ ${account.name} kontrol hatası:`, error.message);
  }
}

async function checkAll() {
  for (const account of accounts) {
    await checkProfile(account);
  }
}

checkAll();
