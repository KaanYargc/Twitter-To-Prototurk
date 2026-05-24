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
- ✅ **Multi-post desteği** - Aynı anda 10 hesaptan paralel post gönderme
- ⚡ **Paralel toplu like** - Aynı anda 10 hesapla like atma
- ✅ **Otomatik profil senkronizasyonu** - Her 1 saatte bir
- ✅ Çoklu Twitter hesabı desteği
- ✅ Otomatik Prototurk hesabı oluşturma
- ✅ Politik hesap tespiti (otomatik filtreleme)
- ✅ RSS ile tweet çekme (API key gerektirmez)
- ✅ Görsel desteği
- ✅ Duplicate kontrolü (hesap bazında)
- ✅ Rate limiting koruması
- ✅ Paralel işleme (10 hesap + 5 tweet/hesap)

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

### Hesap Yönetimi

```bash
bun run accounts
```

Menü seçenekleri:
1. **Yeni Twitter hesabı ekle (manuel)** - Tek hesap ekle
2. **Popüler hesaplardan ekle** - Kategori seç, hesap seç
3. **Toplu hesap ekle (kategori bazında)** - Bir kategorinin tümünü ekle
4. **Rastgele 10 popüler hesap ekle** - Hızlı test için
5. **TÜM HESAPLARI EKLE (tüm kategoriler)** - ⚠️ Tüm hesapları ekle
6. **Hesapları listele** - Mevcut hesapları gör
7. **Hesap durumunu değiştir (aktif/pasif)** - Hesap aç/kapat
8. **Çıkış**

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
- Bio (otomatik: "resmi ProtoTürk hesabı")
- Website
- Profil fotoğrafı

### Toplu Like Atma

```bash
# Varsayılan ayarlar (10 hesap paralel, 1000ms gecikme)
bun run like https://dev.prototurk.com/yargc/post/019e56d3-c8a7-7319-8397-dbb28f30e6e8

# Özel gecikme (2000ms)
bun run like https://dev.prototurk.com/yargc/post/019e56d3-c8a7-7319-8397-dbb28f30e6e8 2000

# Özel batch boyutu (5 hesap paralel)
bun run like https://dev.prototurk.com/yargc/post/019e56d3-c8a7-7319-8397-dbb28f30e6e8 2000 5
```

Tüm aktif hesaplarla belirtilen post'a like atar:
- ⚡ **Paralel işleme** - Aynı anda 10 hesap (varsayılan)
- ✅ Otomatik session ve CSRF token kullanımı
- ✅ Batch'ler arası gecikme (spam koruması)
- ✅ Detaylı ilerleme göstergesi
- ✅ Başarı/hata raporlaması
- ✅ JSON rapor dosyası oluşturma
- ⚡ **Hızlı** - 50 hesap ~5 saniyede!

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

# Toplu like at (paralel)
bun run like <POST_URL> [DELAY_MS] [BATCH_SIZE]

# Tek hesap test
bun run test

# Hesap yönetimi
bun run accounts

# Development mode
bun dev
```

## 📝 Örnek Kullanım

### Senaryo 1: Hızlı Başlangıç (Otomatik)
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

### Senaryo 2: Manuel Hesap Ekleme
```bash
# 1. Hesap yönetimi menüsünü aç
bun run accounts

# 2. Seçenek 5'i seç: TÜM HESAPLARI EKLE
# → Tüm kategorilerdeki hesaplar eklenir
# → Otomatik Prototurk hesapları oluşturulur
# → Profiller senkronize edilir

# 3. Botu başlat
bun start
```

### Senaryo 3: Belirli Kategori
```bash
# 1. Hesap yönetimi
bun run accounts

# 2. Seçenek 3: Toplu hesap ekle
# → Kategori seç (örn: Spor)
# → O kategorideki tüm hesaplar eklenir

# 3. Profilleri senkronize et
bun run sync

# 4. Botu başlat
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


