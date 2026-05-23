#!/usr/bin/env node
import AccountManager from './account-manager.js';
import { popularAccounts, allAccounts, getRandomAccounts } from './popular-accounts.js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  const accountManager = new AccountManager();
  
  console.log('\n🚀 Twitter -> Prototurk Hesap Yönetimi\n');
  console.log('1. Yeni Twitter hesabı ekle (manuel)');
  console.log('2. Popüler hesaplardan ekle');
  console.log('3. Toplu hesap ekle (kategori bazında)');
  console.log('4. Rastgele 10 popüler hesap ekle');
  console.log('5. Hesapları listele');
  console.log('6. Hesap durumunu değiştir (aktif/pasif)');
  console.log('7. Çıkış\n');
  
  const choice = await question('Seçiminiz: ');
  
  switch (choice.trim()) {
    case '1':
      const username = await question('Twitter kullanıcı adı: ');
      await accountManager.addTwitterAccount(username.trim(), true);
      break;
      
    case '2':
      console.log('\n📋 Popüler Hesap Kategorileri:\n');
      const categories = Object.keys(popularAccounts);
      categories.forEach((cat, idx) => {
        console.log(`${idx + 1}. ${cat} (${popularAccounts[cat].length} hesap)`);
      });
      
      const catChoice = await question('\nKategori numarası: ');
      const catIdx = parseInt(catChoice) - 1;
      
      if (catIdx >= 0 && catIdx < categories.length) {
        const category = categories[catIdx];
        const accounts = popularAccounts[category];
        
        console.log(`\n📋 ${category} kategorisindeki hesaplar:\n`);
        accounts.forEach((acc, idx) => {
          console.log(`${idx + 1}. @${acc}`);
        });
        
        const accChoice = await question('\nHesap numarası (0 = tümü): ');
        const accIdx = parseInt(accChoice) - 1;
        
        if (accChoice === '0') {
          console.log(`\n🔄 ${accounts.length} hesap ekleniyor...\n`);
          for (const acc of accounts) {
            await accountManager.addTwitterAccount(acc, true);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        } else if (accIdx >= 0 && accIdx < accounts.length) {
          await accountManager.addTwitterAccount(accounts[accIdx], true);
        }
      }
      break;
      
    case '3':
      console.log('\n📋 Kategoriler:\n');
      Object.keys(popularAccounts).forEach((cat, idx) => {
        console.log(`${idx + 1}. ${cat}`);
      });
      
      const bulkCatChoice = await question('\nKategori numarası: ');
      const bulkCatIdx = parseInt(bulkCatChoice) - 1;
      const bulkCategories = Object.keys(popularAccounts);
      
      if (bulkCatIdx >= 0 && bulkCatIdx < bulkCategories.length) {
        const category = bulkCategories[bulkCatIdx];
        const accounts = popularAccounts[category];
        
        console.log(`\n🔄 ${category} kategorisinden ${accounts.length} hesap ekleniyor...\n`);
        
        for (const acc of accounts) {
          await accountManager.addTwitterAccount(acc, true);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        console.log('\n✅ Tüm hesaplar eklendi!');
      }
      break;
      
    case '4':
      const randomAccounts = getRandomAccounts(10);
      console.log('\n🎲 Rastgele 10 hesap ekleniyor...\n');
      
      for (const acc of randomAccounts) {
        await accountManager.addTwitterAccount(acc, true);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      console.log('\n✅ Rastgele hesaplar eklendi!');
      break;
      
    case '5':
      const accounts = await accountManager.loadAccounts();
      console.log('\n📋 Kayıtlı Hesaplar:\n');
      accounts.forEach((acc, index) => {
        console.log(`${index + 1}. @${acc.twitterUsername}`);
        console.log(`   Prototurk: ${acc.prototurkUsername || 'Kayıtsız'}`);
        console.log(`   Email: ${acc.email || 'Yok'}`);
        console.log(`   Şifre: ${acc.password || 'Yok'}`);
        console.log(`   Politik: ${acc.isPolitical ? 'Evet' : 'Hayır'}`);
        console.log(`   Durum: ${acc.enabled ? 'Aktif' : 'Pasif'}`);
        console.log(`   Session: ${acc.prototurkSession ? 'Var' : 'Yok'}`);
        console.log(`   Oluşturma: ${acc.createdAt || 'Bilinmiyor'}\n`);
      });
      break;
      
    case '6':
      const allAccounts = await accountManager.loadAccounts();
      console.log('\n📋 Hesaplar:\n');
      allAccounts.forEach((acc, index) => {
        console.log(`${index + 1}. @${acc.twitterUsername} - ${acc.enabled ? 'Aktif' : 'Pasif'}`);
      });
      
      const accountIndex = await question('\nHesap numarası: ');
      const idx = parseInt(accountIndex) - 1;
      
      if (idx >= 0 && idx < allAccounts.length) {
        allAccounts[idx].enabled = !allAccounts[idx].enabled;
        await accountManager.saveAccounts(allAccounts);
        console.log(`✅ ${allAccounts[idx].twitterUsername} ${allAccounts[idx].enabled ? 'aktif' : 'pasif'} edildi`);
      }
      break;
      
    case '7':
      console.log('👋 Çıkılıyor...');
      rl.close();
      return;
      
    default:
      console.log('❌ Geçersiz seçim');
  }
  
  rl.close();
}

main().catch(console.error);
