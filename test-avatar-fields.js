#!/usr/bin/env node
import axios from 'axios';
import FormData from 'form-data';

const account = {
  prototurkSession: "OMzTTUkY9b0Hoak6XPhGq_jcjhlvMFWnPbvMWzSPGKk",
  prototurkCsrf: "NEbmi0nbnXPv1BO1dnBopgrNPNEjHXhjeK-2y9qdPRY"
};

const prototurkBaseUrl = 'https://dev.prototurk.com';

async function testDifferentFields() {
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
    
    // Prototurk'e yükle
    const form = new FormData();
    form.append('file', imageResponse.data, {
      filename: 'avatar.jpg',
      contentType: 'image/jpeg'
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
    
    console.log('✅ Upload response:', uploadResponse.data);
    console.log('\n');
    
    const uploadedKey = uploadResponse.data.key;
    const uploadedUrl = uploadResponse.data.url;
    
    // Farklı field isimleriyle dene
    const fieldsToTry = [
      { avatar: uploadedKey },
      { avatarKey: uploadedKey },
      { avatar: uploadedUrl },
      { avatarUrl: uploadedUrl },
      { profileImage: uploadedKey },
      { profileImageKey: uploadedKey },
      { image: uploadedKey },
      { photo: uploadedKey }
    ];
    
    for (const payload of fieldsToTry) {
      const fieldName = Object.keys(payload)[0];
      console.log(`\n🧪 Test ediliyor: ${fieldName} = ${payload[fieldName]}`);
      
      try {
        const updateResponse = await axios.patch(
          `${prototurkBaseUrl}/api/account/profile`,
          payload,
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
        
        console.log(`   ✅ Response:`, updateResponse.data);
        
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
        
        const hasAvatar = checkResponse.data.includes(uploadedKey) || 
                         checkResponse.data.includes(uploadedUrl) ||
                         checkResponse.data.includes('cdn.prototurk.com/posts');
        
        if (hasAvatar) {
          console.log(`   🎉 BAŞARILI! ${fieldName} field'ı çalıştı!`);
          break;
        } else {
          console.log(`   ⚠️  Avatar hala görünmüyor`);
        }
        
      } catch (error) {
        console.log(`   ❌ Hata:`, error.response?.data || error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
    if (error.response) {
      console.error('Data:', error.response.data);
    }
  }
}

testDifferentFields();
