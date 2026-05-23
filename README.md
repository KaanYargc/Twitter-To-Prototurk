# Twitter -> Prototurk Otomatik Post Aktarımı

xcancel.com RSS üzerinden Twitter tweetlerini çekip dev.prototurk.com sitesine otomatik post olarak aktaran bot.

## Kurulum

### 1. Bağımlılıkları Yükle
```bash
bun install
```

### 2. .env Dosyasını Oluştur

`.env.example` dosyası zaten hazır, sadece kullanıcı adını değiştirin:

```bash
cp .env.example .env
```

Ardından `.env` dosyasında `TWITTER_USERNAME` değerini düzenleyin.

## Kullanım

### Normal Çalıştırma
```bash
bun start
```

### Development Mode (otomatik yeniden başlatma)
```bash
bun dev
```

## Özellikler

- ✅ xcancel.com RSS ile Twitter tweetlerini çekme (API key gerektirmez!)
- ✅ Prototurk'e otomatik post gönderme
- ✅ Duplicate kontrolü (aynı tweet'i tekrar göndermez)
- ✅ Periyodik kontrol (varsayılan: 5 dakika)
- ✅ Rate limiting koruması
- ✅ HTML temizleme ve formatla
- ✅ Hata yönetimi

## Nasıl Çalışır?

1. xcancel.com'dan RSS feed çeker (`https://xcancel.com/KULLANICI_ADI/rss`)
2. Yeni tweetleri tespit eder
3. Tweet içeriğini temizler (HTML etiketlerini kaldırır)
4. dev.prototurk.com'a post olarak gönderir
5. Son işlenen tweet'i kaydeder (tekrar göndermemek için)
6. Belirlenen aralıklarla tekrar kontrol eder

## Notlar

- **Session Süresi**: Prototurk session'ı belirli bir süre sonra expire olabilir. Bu durumda yeni session bilgileri almanız gerekir.
- **API Key Yok**: Twitter API key'e ihtiyaç yok, RSS kullanıyor!
- **CSRF Token**: Her oturumda değişebilir, hata alırsanız yeni token alın.

## Sorun Giderme

### "Invalid CSRF token" hatası
- Yeni CSRF token alın (tarayıcıdan `/api/posts` isteğine bakın)
- `.env` dosyasını güncelleyin
- Uygulamayı yeniden başlatın

### Tweet'ler gelmiyor
- `TWITTER_USERNAME` değerinin doğru olduğundan emin olun
- xcancel.com'un çalıştığını kontrol edin: `https://xcancel.com/KULLANICI_ADI/rss`
- `last_processed.json` dosyasını silin (tüm tweet'leri yeniden çeker)

### RSS çekme hatası
- xcancel.com erişilebilir mi kontrol edin
- Kullanıcı adı doğru mu kontrol edin
- İnternet bağlantınızı kontrol edin
