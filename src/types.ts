export type PeriodeWaktu = 'pagi' | 'siang' | 'sore' | 'malam'

export interface Jawaban {
  /** Tanggal terpilih dalam format lokal 'YYYY-MM-DD'. */
  tanggal: string | null
  periode: PeriodeWaktu | null
  /** Jam spesifik 'HH:MM' (24 jam). */
  jam: string | null
  /** Id dari AKTIVITAS yang dipilih. */
  aktivitas: string[]
  /** Ide aktivitas yang diketik sendiri. */
  ideAktivitas: string[]
  /** Id dari DRESS_CODE, atau 'lainnya'. */
  dressCode: string | null
  /** Isi bebas bila dressCode === 'lainnya'. */
  dressCodeLain: string
  pesan: string
}

export const JAWABAN_AWAL: Jawaban = {
  tanggal: null,
  periode: null,
  jam: null,
  aktivitas: [],
  ideAktivitas: [],
  dressCode: null,
  dressCodeLain: '',
  pesan: '',
}

export type UbahJawaban = (perubahan: Partial<Jawaban>) => void

/** Props bersama untuk langkah 2–6 (di dalam kartu). */
export interface PropsLangkah {
  jawaban: Jawaban
  ubah: UbahJawaban
  lanjut: () => void
  kembali: () => void
}
