// Semua tanggal disimpan sebagai 'YYYY-MM-DD' waktu lokal, agar tidak bergeser karena UTC.

const dua = (n: number) => String(n).padStart(2, '0')

export const keKunciTanggal = (d: Date) => `${d.getFullYear()}-${dua(d.getMonth() + 1)}-${dua(d.getDate())}`

export function dariKunciTanggal(kunci: string): Date {
  const [t, b, h] = kunci.split('-').map(Number)
  return new Date(t, b - 1, h)
}

export function hariIni(): Date {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export const NAMA_BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
export const NAMA_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
/** Singkatan hari untuk kepala kalender, dimulai Senin. */
export const HARI_SINGKAT_SENIN = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

/** "Sabtu, 17 Oktober 2026" */
export function formatTanggalPanjang(kunci: string): string {
  const d = dariKunciTanggal(kunci)
  return `${NAMA_HARI[d.getDay()]}, ${d.getDate()} ${NAMA_BULAN[d.getMonth()]} ${d.getFullYear()}`
}

/** "17 Okt 2026" */
export function formatTanggalPendek(kunci: string): string {
  const d = dariKunciTanggal(kunci)
  return `${d.getDate()} ${NAMA_BULAN[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`
}

/** '18:30' → '18.30' (format jam Indonesia) */
export const formatJam = (jam: string) => jam.replace(':', '.')

/** true bila tanggal & jam sudah lewat dari sekarang. */
export function sudahLewat(kunci: string, jam: string): boolean {
  const d = dariKunciTanggal(kunci)
  const [j, m] = jam.split(':').map(Number)
  d.setHours(j, m, 0, 0)
  return d.getTime() <= Date.now()
}
