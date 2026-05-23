# Twitter -> Prototurk Çoklu Hesap Otomasyonu

Twitter'dan otomatik olarak tweet çekip dev.prototurk.com sitesine çoklu hesaplarla post olarak aktaran bot.

## 🚀 Hızlı Başlangıç

```bash
# 1. Bağımlılıkları yükle
bun install

# 2. Otomatik kurulum (tek komut!)
bun run setup
```

Bu komut:
- ✅ Popüler hesaplardan rastgele seçer
- ✅ Politik kontrolü yapar
- ✅ Prototurk hesapları oluşturur
- ✅ Profilleri ayarlar (isim, bio, foto)
- ✅ İlk tweet'leri çeker
- ✅ Tüm bilgileri kaydeder

## ✨ Özellikler

- ✅ **Tek komutla kurulum** - Her şey otomatik
- ✅ **Otomatik profil senkronizasyonu** - Her 1 saatte bir
- ✅ Çoklu Twitter hesabı desteği
- ✅ Otomatik Prototurk hesabı oluşturma
- ✅ Politik hesap tespiti (otomatik filtreleme)
- ✅ RSS ile tweet çekme (API key gerektirmez)
- ✅ Görsel desteği
- ✅ Duplicate kontrolü (hesap bazında)
- ✅ Rate limiting koruması

## 📦 Kurulum Detayları

### Otomatik Kurulum (Önerilen)

```bash
bun run setup
# Kaç hesap? 3
# → 3 hesap otomatik oluşturulur ve çalışmaya başlar
```

### Manuel Kurulum

```bash
# Tek hesap test
bun run test

# Hesap yönetimi
bun run accounts
```

## 🎯 Kullanım

### Sürekli Çalıştırma

```bash
bun start
```

Bot:
- Her 5 dakikada bir yeni tweet'leri kontrol eder
- Her 1 saatte bir profilleri senkronize eder
- Bulduğu tweet'leri ilgili Prototurk hesabına gönderir
- Otomatik çalışır, müdahale gerektirmez

### Profil Senkronizasyonu

```bash
bun run sync
```

Tüm hesapların profillerini Twitter'dan çekip Prototurk'e aktarır:
- Görünen isim
- Bio
- Website
- Profil fotoğrafı

### Development Mode

```bash
bun dev
```

## 📁 Dosya Yapısı

- `auto-setup.js` - **Tek komutla kurulum** ⭐
- `sync-profiles.js` - **Profil senkronizasyonu** ⭐
- `index.js` - Ana bot kodu
- `account-manager.js` - Hesap yönetimi
- `popular-accounts.js` - Popüler hesap listesi
- `accounts.json` - Hesap bilgileri (otomatik oluşturulur)
- `last_processed.json` - Son işlenen tweetler

## 🤖 Politik Hesap Tespiti

Bot şu kelimeleri arar:
- Parti isimleri (chp, akp, mhp, vb.)
- Politik terimler (siyaset, seçim, hükümet, vb.)
- Politikacı isimleri

Son 10 tweet'in %40'ından fazlası bu kelimeleri içeriyorsa hesap politik sayılır ve eklenmez.

## 📊 Popüler Hesap Kategorileri

- **Spor** - Beşiktaş, Galatasaray, Fenerbahçe, vb.
- **Mizah** - Uykusuz Dergi, Leman, Penguen, vb.
- **Teknoloji** - Webrazzi, ShiftDelete, Donanimhaber, vb.
- **Haber** - CNN Türk, Habertürk, NTV, vb.
- **Eğlence** - TV kanalları
- **Müzik** - Radyo kanalları
- **Yemek** - Yemeksepeti, Getir, vb.
- **Moda** - LC Waikiki, Defacto, vb.

## 🔐 Güvenlik

- `accounts.json` hassas bilgiler içerir
- `.gitignore` dosyasında zaten var
- Email ve şifreler otomatik oluşturulur
- Session bilgileri güvenli saklanır

## 🛠️ Komutlar

```bash
# Otomatik kurulum ve başlatma
bun run setup

# Sürekli çalıştır
bun start

# Profilleri senkronize et
bun run sync

# Tek hesap test
bun run test

# Hesap yönetimi
bun run accounts

# Development mode
bun dev
```

## 📝 Örnek Kullanım

```bash
# 1. Otomatik kurulum
bun run setup
# Kaç hesap? 5

# 2. Bot otomatik çalışır
# → 5 hesap oluşturulur
# → Profiller ayarlanır  
# → Tweet'ler çekilir
# → Her 1 saatte profiller güncellenir

# 3. Sürekli çalıştır
bun start
```

## 🎉 Başarı Hikayeleri

Test sonuçları:
- ✅ yemeksepeti hesabı oluşturuldu
- ✅ getir hesabı oluşturuldu
- ✅ Profiller otomatik senkronize
- ✅ Tweet'ler başarıyla aktarılıyor
- ✅ Görsel yükleme çalışıyor

## 🚀 Gelecek Özellikler

- [ ] Web arayüzü
- [ ] Webhook desteği
- [ ] Gelişmiş filtreleme
- [ ] İstatistikler ve raporlama


