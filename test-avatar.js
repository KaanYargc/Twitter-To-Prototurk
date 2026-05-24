#!/usr/bin/env node
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

// Test için getir hesabını kullan
const account = {
  prototurkSession: "OMzTTUkY9b0Hoak6XPhGq_jcjhlvMFWnPbvMWzSPGKk",
  prototurkCsrf: "NEbmi0nbnXPv1BO1dnBopgrNPNEjHXhjeK-2y9qdPRY"
};

const prototurkBaseUrl = 'https://dev.prototurk.com';

async function testAvatarUpload() {
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
    
    console.log('📤 Prototurk\'e yükleniyor...\n');
    
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
    
    console.log('✅ Upload response:', JSON.stringify(uploadResponse.data, null, 2));
    console.log('\n');
    
    if (uploadResponse.data && uploadResponse.data.key) {
      console.log(`🔄 Avatar key ile profil güncelleniyor: ${uploadResponse.data.key}\n`);
      
      // Sadece avatar field'ı ile güncelle
      const updatePayload = {
        avatar: uploadResponse.data.key
      };
      
      console.log('📤 Payload:', JSON.stringify(updatePayload, null, 2));
      console.log('\n');
      
      const updateResponse = await axios.patch(
        `${prototurkBaseUrl}/api/account/profile`,
        updatePayload,
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
      
      console.log('✅ Update response:', JSON.stringify(updateResponse.data, null, 2));
      console.log('\n✅ Avatar başarıyla güncellendi!');
    }
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    }
  }
}

testAvatarUpload();
