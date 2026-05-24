#!/usr/bin/env node
import axios from 'axios';
import FormData from 'form-data';

const account = {
  prototurkSession: "OMzTTUkY9b0Hoak6XPhGq_jcjhlvMFWnPbvMWzSPGKk",
  prototurkCsrf: "NEbmi0nbnXPv1BO1dnBopgrNPNEjHXhjeK-2y9qdPRY"
};

const prototurkBaseUrl = 'https://dev.prototurk.com';

async function testAvatarEndpoints() {
  try {
    // Avatar URL'ini indir
    const avatarUrl = 'https://pbs.twimg.com/profile_images/2012071776352878592/MiEJC72k_400x400.jpg';
    console.log(`📥 Avatar indiriliyor: ${avatarUrl}\n`);
    
    const imageResponse = await axios.get(avatarUrl, {
      responseType: 'arraybuffer',
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:149.0) Gecko/20100101 Firefox/149.0'
      }
    });
    
    console.log(`✅ Avatar indirildi (${imageResponse.data.length} bytes)\n`);
    
    // Farklı endpoint'leri dene
    const endpointsToTry = [
      '/api/account/avatar',
      '/api/account/profile/avatar',
      '/api/profile/avatar',
      '/api/user/avatar',
      '/api/avatar'
    ];
    
    for (const endpoint of endpointsToTry) {
      console.log(`\n🧪 Test ediliyor: ${endpoint}`);
      
      try {
        // FormData ile dene
        const form = new FormData();
        form.append('file', imageResponse.data, {
          filename: 'avatar.jpg',
          contentType: 'image/jpeg'
        });
        
        const response = await axios.post(
          `${prototurkBaseUrl}${endpoint}`,
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
        
        console.log(`   ✅ Response (${response.status}):`, response.data);
        
        // Profili kontrol et
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const checkResponse = await axios.get(
          `${prototurkBaseUrl}/getir`,
          {
            headers: {
              'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:149.0) Gecko/20100101 Firefox/149.0'
            }
          }
        );
        
        const hasAvatar = checkResponse.data.includes('cdn.prototurk.com/posts');
        
        if (hasAvatar) {
          console.log(`   🎉 BAŞARILI! ${endpoint} çalıştı!`);
          break;
        } else {
          console.log(`   ⚠️  Avatar hala görünmüyor`);
        }
        
      } catch (error) {
        if (error.response) {
          console.log(`   ❌ ${error.response.status}:`, error.response.data);
        } else {
          console.log(`   ❌ Hata:`, error.message);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
  }
}

testAvatarEndpoints();
