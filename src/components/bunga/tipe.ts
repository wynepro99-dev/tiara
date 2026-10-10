// Tipe props publik modul bunga (dipisah agar komponen tidak mengimpor index secara melingkar).

import type { DetailSembur } from '../../lib/acara'

export interface PropsHatiBunga {
  /** Mulai animasi mekar. */
  mekar?: boolean
  /** Lebar dalam px (tinggi = lebar × 0,92). Bawaan 320. */
  ukuran?: number
  className?: string
  /** Dipanggil sekali ketika seluruh bunga selesai mekar (juga pada tampilan cadangan). */
  onMekarSelesai?: () => void
}

export interface PropsKelopakJatuh {
  /** Pengali jumlah kelopak, bawaan 1. Perubahan nilai diterapkan bertahap (memudar). */
  kepadatan?: number
}

/** Tinggi HatiBunga relatif terhadap lebarnya. */
export const RASIO_TINGGI_HATI = 0.92

/** Detail semburan dengan opsi tambahan khusus lapisan kelopak modul ini. */
export interface DetailSemburBunga extends DetailSembur {
  /**
   * Detik sebelum kelopak semburan pindah dari lapisan depan ke lapisan belakang konten.
   * Dipakai saat semburan menandai pergantian halaman, agar sisa kelopak tidak menutupi halaman baru.
   */
  keBelakangSetelah?: number
}
