// Popüler Türk Twitter hesapları (Politik olmayan)
export const popularAccounts = {
  spor: [
    'besiktas',
    'galatasaray', 
    'fenerbahce',
    'trabzonspor',
    'fikretorman',
    'sporx',
    'fanatik',
    'fotomac',
    'goaldotcom_tr',
    'ntvspor'
  ],
  
  mizah: [
    'uykusuzdergi',
    'leman',
    'penguen',
    'girgir',
    'karikaturturk',
    'mizahsokakta',
    'komikresimler',
    'capsdunyasi'
  ],
  
  teknoloji: [
    'webrazzi',
    'shiftdelete',
    'donanimhaber',
    'teknolojioku',
    'log',
    'chip_online',
    'pcnet',
    'teknoblog'
  ],
  
  haber: [
    'cnnturk',
    'haberturk',
    'ntv',
    'dha',
    'aa_turkish',
    'bbcturkce',
    'euronews_tr',
    'trthaber'
  ],
  
  eglence: [
    'beyazshow',
    'showtvcomtr',
    'kanald',
    'startv',
    'atv',
    'fox',
    'tv8',
    'teve2'
  ],
  
  muzik: [
    'kral_muzik',
    'powerfm',
    'powerturk',
    'radyod',
    'radyoviva',
    'slowturk',
    'joyturk',
    'radyoeksen'
  ],
  
  yemek: [
    'yemeksepeti',
    'getir',
    'trendyol',
    'migros',
    'carrefoursa',
    'a101',
    'bim',
    'sok_marketler'
  ],
  
  moda: [
    'lcwaikiki',
    'defacto',
    'koton',
    'mango_turkey',
    'zara_turkey',
    'hm_turkey',
    'pull_bear_tr',
    'bershka_tr'
  ],
  
  genel: [
    'sozcu',
    'hurriyet',
    'milliyet',
    'sabah',
    'posta',
    'takvim',
    'yenisafak',
    'aksam'
  ]
};

// Tüm hesapları tek listede
export const allAccounts = Object.values(popularAccounts).flat();

// Kategori bazında hesap getir
export function getAccountsByCategory(category) {
  return popularAccounts[category] || [];
}

// Rastgele N hesap seç
export function getRandomAccounts(count = 10) {
  const shuffled = [...allAccounts].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
