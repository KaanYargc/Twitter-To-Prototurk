#!/usr/bin/env node
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs/promises';

const accountsFile = './accounts.json';
const prototurkBaseUrl = 'https://dev.prototurk.com';

async function downloadImage(url) {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:149.0) Gecko/20100101 Firefox/149.0'
      }
    });
    
    return {
      buffer: response.data,
      contentType: response.headers['content-type'] || 'image/jpeg'
    };
  } catch (error) {
    console.error('⚠️  Görsel indirme hatası:', url, error.message);
    return null;
  }
}

async function fixAvatar(account, avatarUrl) {
  try {
    console.log(`\n🔧 ${account.prototurkUsername} için avatar düzeltiliyor...`);
    console.log(`   Avatar URL: ${avatarUrl}`);
    
    // Avatar'ı indir
    const imageData = await downloadImage(avatarUrl);
    if (!imageData) {
      console.log(`   ❌ Avatar indirilemedi`);
      return false;
    }
    
    console.log(`   ✅ Avatar indirildi (${imageData.buffer.length} bytes)`);
    
    // Prototurk'e yükle
    const form = new FormData();
    const ext = imageData.contentType.includes('png') ? 'png' : 'jpg';
    form.append('file', imageData.buffer, {
      filename: `avatar.${ext}`,
      contentType: imageData.contentType
    });
    
    const uploadResponse = await axios.post(
      `${prototurkBaseUrl}/api/uploads`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          'Cookie': `pt_session=${account.prototurkSession}; pt_csrf=${account.prototurkCsrf}`,
          'x-csrf-token': account.prototurkCsrf,
          'Origin': prototurkBaseUrl,
          'Referer': `${prototurkBaseUrl}/settings`,
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:149.0) Gecko/20100101 Firefox/149.0'
        },
        timeout: 30000
      }
    );
    
    console.log(`   ✅ Yüklendi: ${uploadResponse.data.key}`);
    
    // Profili güncelle - sadece avatar field'ı
    const updateResponse = await axios.patch(
      `${prototurkBaseUrl}/api/account/profile`,
      { avatar: uploadResponse.data.key },
      {
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `pt_session=${account.prototurkSession}; pt_csrf=${account.prototurkCsrf}`,
          'x-csrf-token': account.prototurkCsrf,
          'Origin': prototurkBaseUrl,
          'Referer': `${prototurkBaseUrl}/settings`,
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:149.0) Gecko/20100101 Firefox/149.0'
        },
        timeout: 10000
      }
    );
    
    console.log(`   ✅ Profil güncellendi:`, updateResponse.data);
    
    // Kontrol et
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const checkResponse = await axios.get(
      `${prototurkBaseUrl}/${account.prototurkUsername}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:149.0) Gecko/20100101 Firefox/149.0'
        }
      }
    );
    
    const hasAvatar = checkResponse.data.includes(uploadResponse.data.key) || 
                     checkResponse.data.includes('cdn.prototurk.com');
    
    if (hasAvatar) {
      console.log(`   🎉 Avatar görünüyor!`);
      return true;
    } else {
      console.log(`   ⚠️  Avatar hala görünmüyor (API sorunu olabilir)`);
      return false;
    }
    
  } catch (error) {
    console.error(`   ❌ Hata:`, error.response?.data || error.message);
    return false;
  }
}

async function main() {
  console.log('🔧 Avatar Düzeltme Aracı\n');
  
  // Hesapları yükle
  const accountsData = await fs.readFile(accountsFile, 'utf-8');
  const accounts = JSON.parse(accountsData);
  
  // Sadece session'ı olan hesaplar
  const activeAccounts = accounts.filter(acc => acc.prototurkSession && acc.prototurkCsrf);
  
  console.log(`📊 ${activeAccounts.length} aktif hesap bulundu\n`);
  
  // Test için bir hesap seç
  const testAccount = activeAccounts.find(acc => acc.twitterUsername === 'Fenerbahce');
  
  if (testAccount) {
    const avatarUrl = 'https://pbs.twimg.com/profile_images/2046246967731253248/2xcwYqCW_400x400.png';
    await fixAvatar(testAccount, avatarUrl);
  } else {
    console.log('❌ Test hesabı bulunamadı');
  }
}

main().catch(console.error);
