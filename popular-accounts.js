export const popularAccounts = {
  spor: [
    'Besiktas',
    'GalatasaraySK',
    'Fenerbahce',
    'Trabzonspor',
    'fikretorman',
    'sporx',
    'fanatikcomtr',
    'fotomac',
    'GoalTurkiye',
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
    'shiftdeletenet',
    'donanimhaber',
    'TeknolojiOku',
    'logdergisi',
    'chiponline',
    'teknoblog'
  ],
  haber: [
    'bpthaber',
    'cnnturk',
    'haberturk',
    'ntv',
    'dhainternet',
    'anadoluajansi',
    'bbcturkce',
    'euronews_tr',
    'trthaber',
    't24comtr',
    'bianet'
  ],
  eglence: [
    'beyazshow',
    'showtvcomtr',
    'kanald',
    'startv',
    'atv',
    'nowtvturkiye',
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
    'getir'
  ],
  moda: [
    'lcwaikiki',
    'defacto',
    'koton'
  ],
  genel: [
    'gazetesozcu',
    'hurriyet',
    'milliyet'
  ]
};

export const allAccounts = Object.values(popularAccounts).flat();

export function getAccountsByCategory(category) {
  return popularAccounts[category] || [];
}

export function getRandomAccounts(count = 10) {
  const shuffled = [...allAccounts].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}