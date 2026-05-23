#!/usr/bin/env node
import TwitterToPrototurk from './index.js';

async function testBot() {
  console.log('\n🧪 BOT TEST MODU\n');
  
  const bot = new TwitterToPrototurk();
  
  // Sadece bir kez çalıştır
  console.log('📥 Tweetler çekiliyor...\n');
  await bot.processNewTweets();
  
  console.log('\n✅ Test tamamlandı!');
  console.log('\nTam otomatik mod için: bun start');
  
  process.exit(0);
}

testBot().catch(console.error);
