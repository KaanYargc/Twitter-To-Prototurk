#!/usr/bin/env node
import AccountManager from './account-manager.js';

async function testSingleAccount() {
  const accountManager = new AccountManager();
  
  // Test için hesap seç
  const testUsername = 'webrazzi'; // Teknoloji haberleri - güvenli
  
  console.log('\n🧪 TEK HESAP TEST MODU\n');
  console.log(`📝 Test hesabı: @${testUsername}\n`);
  console.log('Bu hesap için:');
  console.log('1. Politik kontrolü yapılacak');
  console.log('2. Prototurk hesabı açılacak');
  console.log('3. Profil bilgileri güncellenecek');
  console.log('4. Profil fotoğrafı yüklenecek\n');
  
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const question = (query) => new Promise((resolve) => rl.question(query, resolve));
  
  const confirm = await question('Devam etmek istiyor musunuz? (e/h): ');
  
  if (confirm.toLowerCase() !== 'e') {
    console.log('❌ İptal edildi');
    rl.close();
    return;
  }
  
  console.log('\n🚀 Başlıyor...\n');
  
  try {
    const result = await accountManager.addTwitterAccount(testUsername, true);
    
    if (result) {
      console.log('\n✅ TEST BAŞARILI!');
      console.log('\nHesap bilgileri:');
      console.log(`Twitter: @${result.twitterUsername}`);
      console.log(`Prototurk: @${result.prototurkUsername}`);
      console.log(`Email: ${result.email}`);
      console.log(`Şifre: ${result.password}`);
      console.log(`Session: ${result.prototurkSession ? 'Var' : 'Yok'}`);
      console.log(`\nŞimdi botu başlatabilirsiniz: bun start`);
    } else {
      console.log('\n❌ Test başarısız');
    }
  } catch (error) {
    console.error('\n❌ Hata:', error.message);
  }
  
  rl.close();
}

testSingleAccount().catch(console.error);
