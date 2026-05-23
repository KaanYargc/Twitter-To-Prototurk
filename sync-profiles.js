#!/usr/bin/env node
import TwitterToPrototurk from './index.js';

async function syncProfiles() {
  console.log('\n🔄 PROFIL SENKRONİZASYONU\n');
  console.log('Tüm hesapların profil bilgileri Twitter\'dan çekilip Prototurk\'e aktarılacak.\n');
  
  const bot = new TwitterToPrototurk();
  
  await bot.syncAllProfiles();
  
  console.log('\n✅ Senkronizasyon tamamlandı!');
  console.log('Profiller güncellendi:\n');
  console.log('- Görünen isim');
  console.log('- Bio');
  console.log('- Website');
  console.log('- Profil fotoğrafı\n');
  
  process.exit(0);
}

syncProfiles().catch(console.error);
