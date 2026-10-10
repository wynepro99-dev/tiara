// Simpan progres di perangkat penerima, agar tidak hilang saat halaman dimuat ulang.
// Jawaban disimpan di localStorage (bertahan), posisi langkah di sessionStorage
// (hanya bertahan di tab yang sama, jadi membuka ulang tautan selalu mulai dari animasi pembuka).
// Semua akses dibungkus try/catch: mode privat atau penyimpanan diblokir tidak boleh merusak halaman.

const KUNCI_JAWABAN = 'undangan-tiara:jawaban:v1'
const KUNCI_LANGKAH = 'undangan-tiara:langkah:v1'

function baca<T>(wadah: () => Storage, kunci: string): T | null {
  try {
    const mentah = wadah().getItem(kunci)
    return mentah ? (JSON.parse(mentah) as T) : null
  } catch {
    return null
  }
}

function tulis(wadah: () => Storage, kunci: string, data: unknown) {
  try {
    wadah().setItem(kunci, JSON.stringify(data))
  } catch {
    /* abaikan */
  }
}

function hapus(wadah: () => Storage, kunci: string) {
  try {
    wadah().removeItem(kunci)
  } catch {
    /* abaikan */
  }
}

const lokal = () => localStorage
const sesi = () => sessionStorage

export const bacaJawaban = <T,>() => baca<T>(lokal, KUNCI_JAWABAN)
export const simpanJawaban = (data: unknown) => tulis(lokal, KUNCI_JAWABAN, data)
export const bacaLangkah = () => baca<number>(sesi, KUNCI_LANGKAH)
export const simpanLangkah = (n: number) => tulis(sesi, KUNCI_LANGKAH, n)

export function hapusSemua() {
  hapus(lokal, KUNCI_JAWABAN)
  hapus(sesi, KUNCI_LANGKAH)
}
