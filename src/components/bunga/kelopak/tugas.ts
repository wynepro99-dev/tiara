import type { Kanvas } from './alat'
import { lukisDaunKecil, lukisHatiKecil, lukisKelopakLepas, lukisTopengKelopak } from './lukisKelopak'
import { DAUN, PALET, type NamaPalet } from './palet'

// Daftar pekerjaan pra-render sprite. Dijalankan di Web Worker (OffscreenCanvas)
// atau, bila tidak didukung, dicicil di thread utama.

interface Dasar {
  kunci: string
  /** Makin kecil makin didahulukan. */
  prioritas: number
}

export type Tugas = Dasar &
  (
    | { jenis: 'kelopak'; ukuran: number; bentuk: number; palet: NamaPalet; sisi: 'depan' | 'belakang'; lunak: boolean }
    | { jenis: 'topeng'; ukuran: number; bentuk: number; mode: 'bayang' | 'kilau' }
    | { jenis: 'hati'; ukuran: number; palet: NamaPalet }
    | { jenis: 'daun'; ukuran: number; varian: number; sisi: 'depan' | 'belakang' }
  )

export function jalankanTugas(t: Tugas): Kanvas {
  switch (t.jenis) {
    case 'kelopak':
      return lukisKelopakLepas(t.ukuran, t.bentuk, PALET[t.palet], t.sisi, t.lunak)
    case 'topeng':
      return lukisTopengKelopak(t.ukuran, t.bentuk, t.mode)
    case 'hati':
      return lukisHatiKecil(t.ukuran, PALET[t.palet])
    case 'daun':
      return lukisDaunKecil(t.ukuran, DAUN[t.varian % DAUN.length], t.varian, t.sisi)
  }
}

export interface PesanKePekerja {
  tugas: Tugas[]
}

export type PesanDariPekerja =
  | { jenis: 'siap'; didukung: boolean }
  | { jenis: 'hasil'; kunci: string; bitmap: ImageBitmap }
  | { jenis: 'gagal'; kunci: string }
