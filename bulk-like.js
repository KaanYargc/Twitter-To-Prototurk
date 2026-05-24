import axios from 'axios';
import fs from 'fs';

// Accounts.json dosyasını oku
const accounts = JSON.parse(fs.readFileSync('./accounts.json', 'utf-8'));

// Post URL'sinden post ID'sini çıkar
function extractPostId(url) {
  // URL formatı: https://dev.prototurk.com/username/post/POST_ID
  const match = url.match(/\/post\/([a-f0-9-]+)/i);
  return match ? match[1] : null;
}

// Bir hesapla like at
async function likePost(account, postId) {
  // Session ve CSRF token kontrolü
  if (!account.prototurkSession || !account.prototurkCsrf) {
    console.log(`❌ ${account.prototurkUsername || account.twitterUsername}: Session veya CSRF token eksik`);
    return { success: false, reason: 'no_credentials' };
  }

  if (!account.enabled) {
    console.log(`⏭️  ${account.prototurkUsername}: Hesap devre dışı`);
    return { success: false, reason: 'disabled' };
  }

  try {
    const response = await axios.post(
      `https://dev.prototurk.com/api/posts/${postId}/like`,
      {},
      {
        headers: {
          'Accept': '*/*',
          'Accept-Encoding': 'gzip, deflate, br, zstd',
          'Accept-Language': 'en-US,en;q=0.9',
          'Connection': 'keep-alive',
          'Content-Length': '0',
          'Cookie': `pt_session=${account.prototurkSession}; pt_csrf=${account.prototurkCsrf}`,
          'Host': 'dev.prototurk.com',
          'Origin': 'https://dev.prototurk.com',
          'Priority': 'u=0',
          'Referer': `https://dev.prototurk.com/`,
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
          'Sec-GPC': '1',
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:149.0) Gecko/20100101 Firefox/149.0',
          'x-csrf-token': account.prototurkCsrf
        },
        timeout: 10000
      }
    );

    if (response.status === 200) {
      console.log(`✅ ${account.prototurkUsername}: Like başarılı`);
      return { success: true };
    } else {
      console.log(`⚠️  ${account.prototurkUsername}: Beklenmeyen yanıt (${response.status})`);
      return { success: false, reason: 'unexpected_response', status: response.status };
    }
  } catch (error) {
    if (error.response) {
      console.log(`❌ ${account.prototurkUsername}: Hata (${error.response.status}) - ${error.response.statusText}`);
      return { success: false, reason: 'api_error', status: error.response.status };
    } else if (error.code === 'ECONNABORTED') {
      console.log(`⏱️  ${account.prototurkUsername}: Zaman aşımı`);
      return { success: false, reason: 'timeout' };
    } else {
      console.log(`❌ ${account.prototurkUsername}: ${error.message}`);
      return { success: false, reason: 'network_error', message: error.message };
    }
  }
}

// Paralel like işlemi (batch processing)
async function processBatch(accounts, postId, batchNumber, totalBatches) {
  const promises = accounts.map(async (account, index) => {
    const globalIndex = (batchNumber - 1) * 10 + index + 1;
    const totalAccounts = totalBatches * 10 - (10 - accounts.length);
    
    console.log(`[${globalIndex}/${totalAccounts}] ${account.prototurkUsername || account.twitterUsername} - Batch ${batchNumber}`);
    
    const result = await likePost(account, postId);
    return {
      username: account.prototurkUsername || account.twitterUsername,
      ...result
    };
  });

  return await Promise.all(promises);
}

// Ana fonksiyon
async function bulkLike(postUrl, delayMs = 1000, batchSize = 10) {
  console.log('🚀 Toplu Like İşlemi Başlatılıyor...\n');
  
  const postId = extractPostId(postUrl);
  
  if (!postId) {
    console.error('❌ Geçersiz post URL\'si! Format: https://dev.prototurk.com/username/post/POST_ID');
    process.exit(1);
  }

  console.log(`📝 Post ID: ${postId}`);
  console.log(`👥 Toplam Hesap: ${accounts.length}`);
  console.log(`🔄 Paralel İşlem: ${batchSize} hesap/batch`);
  console.log(`⏱️  Batch'ler arası bekleme: ${delayMs}ms\n`);
  console.log('─'.repeat(60) + '\n');

  const results = {
    success: 0,
    failed: 0,
    skipped: 0,
    details: []
  };

  // Hesapları batch'lere böl
  const batches = [];
  for (let i = 0; i < accounts.length; i += batchSize) {
    batches.push(accounts.slice(i, i + batchSize));
  }

  console.log(`📦 Toplam ${batches.length} batch oluşturuldu\n`);

  // Her batch'i işle
  for (let i = 0; i < batches.length; i++) {
    const batchNumber = i + 1;
    console.log(`\n🔄 Batch ${batchNumber}/${batches.length} işleniyor...`);
    
    const batchResults = await processBatch(batches[i], postId, batchNumber, batches.length);
    
    // Sonuçları topla
    batchResults.forEach(result => {
      results.details.push(result);
      
      if (result.success) {
        results.success++;
      } else if (result.reason === 'disabled' || result.reason === 'no_credentials') {
        results.skipped++;
      } else {
        results.failed++;
      }
    });

    console.log(`✅ Batch ${batchNumber} tamamlandı!`);

    // Son batch değilse bekle
    if (i < batches.length - 1) {
      console.log(`⏳ ${delayMs}ms bekleniyor...\n`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  console.log('\n' + '─'.repeat(60));
  console.log('\n📊 ÖZET:');
  console.log(`✅ Başarılı: ${results.success}`);
  console.log(`❌ Başarısız: ${results.failed}`);
  console.log(`⏭️  Atlanan: ${results.skipped}`);
  console.log(`📈 Toplam: ${accounts.length}`);
  console.log(`🎯 Başarı Oranı: ${((results.success / accounts.length) * 100).toFixed(1)}%`);

  // Detaylı raporu dosyaya kaydet
  const reportPath = `./like-report-${Date.now()}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n💾 Detaylı rapor kaydedildi: ${reportPath}`);
}

// Komut satırı argümanlarını kontrol et
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Kullanım: bun run bulk-like.js <POST_URL> [DELAY_MS] [BATCH_SIZE]');
  console.log('\nÖrnek:');
  console.log('  bun run bulk-like.js https://dev.prototurk.com/yargc/post/019e56d3-c8a7-7319-8397-dbb28f30e6e8');
  console.log('  bun run bulk-like.js https://dev.prototurk.com/yargc/post/019e56d3-c8a7-7319-8397-dbb28f30e6e8 2000');
  console.log('  bun run bulk-like.js https://dev.prototurk.com/yargc/post/019e56d3-c8a7-7319-8397-dbb28f30e6e8 2000 5');
  console.log('\nParametreler:');
  console.log('  POST_URL    : Like atılacak post URL\'si (zorunlu)');
  console.log('  DELAY_MS    : Batch\'ler arası bekleme süresi (varsayılan: 1000ms)');
  console.log('  BATCH_SIZE  : Aynı anda kaç hesap işlensin (varsayılan: 10)');
  process.exit(1);
}

const postUrl = args[0];
const delayMs = args[1] ? parseInt(args[1]) : 1000;
const batchSize = args[2] ? parseInt(args[2]) : 10;

// İşlemi başlat
const startTime = Date.now();
bulkLike(postUrl, delayMs, batchSize).then(() => {
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n⏱️  Toplam işlem süresi: ${totalTime}s`);
}).catch(error => {
  console.error('❌ Beklenmeyen hata:', error);
  process.exit(1);
});
