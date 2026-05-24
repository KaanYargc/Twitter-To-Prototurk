import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs/promises';

dotenv.config();

async function checkProfile() {
  const accounts = JSON.parse(await fs.readFile('accounts.json', 'utf-8'));
  const account = accounts[0]; // yemeksepeti
  
  console.log(`\n🔍 ${account.prototurkUsername} profilini kontrol ediyorum...\n`);
  
  try {
    // Profili çek
    const response = await axios.get(
      `https://dev.prototurk.com/api/users/${account.prototurkUsername}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:149.0) Gecko/20100101 Firefox/149.0'
        }
      }
    );
    
    const profile = response.data;
    
    console.log('=== MEVCUT PROFİL ===');
    console.log('Username:', profile.username);
    console.log('Display Name:', profile.displayName || 'YOK');
    console.log('Bio:', profile.bio || 'YOK');
    console.log('Website:', profile.website || 'YOK');
    console.log('Avatar:', profile.avatar || 'YOK');
    console.log('\n=== TAM RESPONSE ===');
    console.log(JSON.stringify(profile, null, 2));
    
  } catch (error) {
    console.error('❌ Hata:', error.response?.data || error.message);
  }
}

checkProfile();
