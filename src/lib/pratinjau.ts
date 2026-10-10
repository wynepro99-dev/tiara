import { JAWABAN_AWAL, type Jawaban } from '../types'
import { hariIni, keKunciTanggal } from './tanggal'

// Khusus mode pengembangan: buka langsung langkah tertentu dengan data contoh.
//   /?langkah=6          → langsung ke tiket (jawaban kosong)
//   /?langkah=6&contoh=1 → tiket dengan jawaban contoh
// Di build produksi fungsi ini selalu mengembalikan null.
export function contohPratinjau(): { langkah: number; jawaban: Jawaban } | null {
  if (!import.meta.env.DEV) return null
  const q = new URLSearchParams(window.location.search)
  const langkah = q.get('langkah')
  if (langkah === null) return null
  const besok = hariIni()
  besok.setDate(besok.getDate() + 7)
  const jawaban: Jawaban = q.get('contoh')
    ? {
        tanggal: keKunciTanggal(besok),
        periode: 'malam',
        jam: '19:00',
        aktivitas: ['nonton', 'ngopi', 'photobooth'],
        ideAktivitas: ['Naik bianglala'],
        dressCode: 'skena',
        dressCodeLain: '',
        pesan: 'Iya mau! Tapi kamu yang jemput ya, jangan telat 😆',
      }
    : JAWABAN_AWAL
  return { langkah: Number(langkah), jawaban }
}
