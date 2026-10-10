// Aturan pemilihan tanggal & jam untuk langkah "Tanggal & Waktu".
import { PERIODE } from '../../../data/pilihan'
import { keKunciTanggal, sudahLewat } from '../../../lib/tanggal'
import type { PeriodeWaktu } from '../../../types'

/** Kalender bisa digeser dari bulan ini sampai 6 bulan ke depan. */
export const BATAS_BULAN = 6

/** Bulan sebagai satu angka (tahun * 12 + bulan) agar mudah dibandingkan. */
export const indeksBulan = (d: Date) => d.getFullYear() * 12 + d.getMonth()

export const tahunDariIndeks = (indeks: number) => Math.floor(indeks / 12)
export const bulanDariIndeks = (indeks: number) => indeks % 12

export const jamPeriode = (periode: PeriodeWaktu) => PERIODE.find((p) => p.id === periode)?.jam ?? []

/** Jam belum lewat pada tanggal tsb. Tanpa tanggal: selalu boleh. */
export const jamMasihBisa = (tanggal: string | null, jam: string) => !tanggal || !sudahLewat(tanggal, jam)

/** Semua jam pada periode ini sudah lewat untuk tanggal tsb. */
export const periodeHabis = (tanggal: string | null, periode: PeriodeWaktu) =>
  jamPeriode(periode).every((j) => !jamMasihBisa(tanggal, j))

/** Tanggal bisa dipilih: bukan hari lampau, dan bila hari ini masih ada jam tersisa. */
export function tanggalMasihBisa(kunci: string, kunciHariIni: string): boolean {
  if (kunci < kunciHariIni) return false
  if (kunci > kunciHariIni) return true
  return PERIODE.some((p) => !periodeHabis(kunci, p.id))
}

/** Sel kalender per minggu (mulai Senin), kelipatan 7. Sel di luar bulan bernilai null. */
export function selBulan(indeks: number): (string | null)[] {
  const tahun = tahunDariIndeks(indeks)
  const bulan = bulanDariIndeks(indeks)
  const geser = (new Date(tahun, bulan, 1).getDay() + 6) % 7
  const jumlahHari = new Date(tahun, bulan + 1, 0).getDate()
  return Array.from({ length: Math.ceil((geser + jumlahHari) / 7) * 7 }, (_, i) => {
    const hari = i - geser + 1
    return hari >= 1 && hari <= jumlahHari ? keKunciTanggal(new Date(tahun, bulan, hari)) : null
  })
}

/** Gulir halaman ke bawah secukupnya agar elemen terlihat utuh. */
export function gulirBilaPerlu(el: Element | null, jarak = 16) {
  if (!el) return
  const kurang = el.getBoundingClientRect().bottom + jarak - window.innerHeight
  if (kurang <= 0) return
  const halus = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollBy({ top: kurang, behavior: halus ? 'smooth' : 'auto' })
}
