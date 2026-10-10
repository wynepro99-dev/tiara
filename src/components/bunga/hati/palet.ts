// Palet bunga: MERAH dan KUNING sebagai warna utama, ditambah pendamping yang serasi
// (dwiwarna kuning bertepi merah, jingga, aprikot, gading).
// pangkal = warna dalam/bayangan, badan = warna utama, tepi = warna pinggir kelopak,
// semu = seberapa kuat warna tepi merembes (dwiwarna paling kuat).

export interface WarnaMawar {
  pangkal: string
  badan: string
  tepi: string
  semu: number
}

export const WARNA_MAWAR = {
  crimson: { pangkal: '#4f0714', badan: '#b3122e', tepi: '#d3303f', semu: 0.4 },
  scarlet: { pangkal: '#6a0a12', badan: '#d42a2a', tepi: '#e9533f', semu: 0.38 },
  anggur: { pangkal: '#2c030b', badan: '#7a0f1f', tepi: '#a3213a', semu: 0.42 },
  emas: { pangkal: '#c45a00', badan: '#f5b301', tepi: '#fcd860', semu: 0.5 },
  mentega: { pangkal: '#d27a08', badan: '#f8cf3e', tepi: '#fde38a', semu: 0.5 },
  krem: { pangkal: '#dc8a1c', badan: '#fadb78', tepi: '#fff0bf', semu: 0.45 },
  dwiwarna: { pangkal: '#d97806', badan: '#f8c83c', tepi: '#d42a2a', semu: 0.9 },
  jingga: { pangkal: '#ad420b', badan: '#f28c38', tepi: '#f8ae62', semu: 0.45 },
  aprikot: { pangkal: '#c8703a', badan: '#f6b183', tepi: '#fcd6ba', semu: 0.5 },
  gading: { pangkal: '#d9a25a', badan: '#fbefd6', tepi: '#fffaf0', semu: 0.4 },
} satisfies Record<string, WarnaMawar>

export type NamaWarna = keyof typeof WARNA_MAWAR

/** Warna per keluarga beserta bobot kemunculannya. */
export const PILIHAN_KELUARGA: Record<'merah' | 'kuning' | 'peralihan', [NamaWarna, number][]> = {
  merah: [
    ['crimson', 0.5],
    ['scarlet', 0.3],
    ['anggur', 0.2],
  ],
  kuning: [
    ['emas', 0.5],
    ['mentega', 0.38],
    ['krem', 0.12],
  ],
  peralihan: [
    ['dwiwarna', 0.48],
    ['jingga', 0.22],
    ['aprikot', 0.18],
    ['gading', 0.12],
  ],
}

export function pilihBerbobot<T>(daftar: [T, number][], r: number): T {
  let total = 0
  for (const [, b] of daftar) total += b
  let x = r * total
  for (const [nilai, b] of daftar) {
    x -= b
    if (x <= 0) return nilai
  }
  return daftar[daftar.length - 1][0]
}

/** Daun & pengisi. */
export const WARNA_DAUN = { gelap: '#3d5a2c', terang: '#7a9450', tulang: '#b9c78d', semu: '#6e3b2a' }
export const WARNA_PENGISI = { putih: '#fffaf1', putihPusat: '#e6dca6', kuning: '#f5c21b', kuningGelap: '#c98400' }
