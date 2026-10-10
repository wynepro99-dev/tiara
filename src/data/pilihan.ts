import type { PeriodeWaktu } from '../types'

export interface Pilihan {
  id: string
  label: string
  emoji: string
  keterangan?: string
}

export const AKTIVITAS: Pilihan[] = [
  { id: 'nonton', label: 'Nonton', emoji: '🎬', keterangan: 'Bioskop + popcorn' },
  { id: 'ngopi', label: 'Ngopi', emoji: '☕', keterangan: 'Kafe yang cozy' },
  { id: 'makan', label: 'Makan Malam', emoji: '🍝', keterangan: 'Dinner berdua' },
  { id: 'photobooth', label: 'Photobooth', emoji: '📸', keterangan: 'Foto strip lucu' },
  { id: 'timezone', label: 'Main Timezone', emoji: '🕹️', keterangan: 'Adu skor' },
  { id: 'jalan', label: 'Jalan-jalan', emoji: '🛍️', keterangan: 'Keliling mal' },
  { id: 'piknik', label: 'Piknik', emoji: '🧺', keterangan: 'Taman + bekal' },
  { id: 'dessert', label: 'Cari Dessert', emoji: '🍰', keterangan: 'Yang manis-manis' },
  { id: 'karaoke', label: 'Karaoke', emoji: '🎤', keterangan: 'Nyanyi bareng' },
  { id: 'museum', label: 'Museum / Pameran', emoji: '🖼️', keterangan: 'Lihat seni' },
  { id: 'sunset', label: 'Lihat Sunset', emoji: '🌇', keterangan: 'Senja di luar' },
  { id: 'gramedia', label: 'Ke Toko Buku', emoji: '📚', keterangan: 'Pilih buku' },
]

export const DRESS_CODE: Pilihan[] = [
  { id: 'casual', label: 'Casual', emoji: '👕', keterangan: 'Santai, kaos & jeans' },
  { id: 'skena', label: 'Skena', emoji: '🧢', keterangan: 'Kemeja oversize, tote bag' },
  { id: 'rock', label: 'Rock & Roll', emoji: '🎸', keterangan: 'Serba hitam, jaket' },
  { id: 'formal', label: 'Smart Formal', emoji: '👔', keterangan: 'Rapi tapi santai' },
  { id: 'vintage', label: 'Vintage', emoji: '🎞️', keterangan: 'Ala tahun 90-an' },
  { id: 'kembaran', label: 'Couple Kembaran', emoji: '👫', keterangan: 'Warna senada' },
  { id: 'pastel', label: 'Pastel Soft', emoji: '🌸', keterangan: 'Warna lembut' },
  { id: 'sporty', label: 'Sporty', emoji: '👟', keterangan: 'Sneakers & hoodie' },
]

export interface Periode {
  id: PeriodeWaktu
  label: string
  emoji: string
  rentang: string
  /** Jam yang bisa dipilih, 'HH:MM'. */
  jam: string[]
}

export const PERIODE: Periode[] = [
  { id: 'pagi', label: 'Pagi', emoji: '🌤️', rentang: '07.00 – 10.30', jam: ['07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30'] },
  { id: 'siang', label: 'Siang', emoji: '☀️', rentang: '11.00 – 14.30', jam: ['11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30'] },
  { id: 'sore', label: 'Sore', emoji: '🌇', rentang: '15.00 – 17.30', jam: ['15:00', '15:30', '16:00', '16:30', '17:00', '17:30'] },
  { id: 'malam', label: 'Malam', emoji: '🌙', rentang: '18.00 – 21.30', jam: ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'] },
]

export const labelAktivitas = (id: string) => AKTIVITAS.find((a) => a.id === id)
export const labelDressCode = (id: string) => DRESS_CODE.find((d) => d.id === id)
export const labelPeriode = (id: PeriodeWaktu) => PERIODE.find((p) => p.id === id)
