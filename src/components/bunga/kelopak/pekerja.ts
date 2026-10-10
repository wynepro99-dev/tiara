// Web Worker pra-render sprite dengan OffscreenCanvas agar thread utama tetap lancar.
import { jalankanTugas, type PesanDariPekerja, type PesanKePekerja, type Tugas } from './tugas'

const lingkup = self as unknown as Worker

function cekDukungan() {
  try {
    if (typeof OffscreenCanvas === 'undefined') return false
    const uji = new OffscreenCanvas(2, 2)
    const ctx = uji.getContext('2d')
    if (!ctx || typeof uji.transferToImageBitmap !== 'function') return false
    ctx.fillRect(0, 0, 1, 1)
    return true
  } catch {
    return false
  }
}

const kirim = (pesan: PesanDariPekerja, pindah: Transferable[] = []) => lingkup.postMessage(pesan, pindah)

const antrean: Tugas[] = []
let berjalan = false

function proses() {
  const batas = performance.now() + 12
  while (antrean.length && performance.now() < batas) {
    let terbaik = 0
    for (let i = 1; i < antrean.length; i++) if (antrean[i].prioritas < antrean[terbaik].prioritas) terbaik = i
    const tugas = antrean.splice(terbaik, 1)[0]
    try {
      const kanvas = jalankanTugas(tugas) as OffscreenCanvas
      const bitmap = kanvas.transferToImageBitmap()
      kirim({ jenis: 'hasil', kunci: tugas.kunci, bitmap }, [bitmap])
    } catch {
      kirim({ jenis: 'gagal', kunci: tugas.kunci })
    }
  }
  // Beri jeda agar pesan baru (prioritas lebih tinggi) sempat masuk antrean.
  if (antrean.length) setTimeout(proses, 0)
  else berjalan = false
}

lingkup.addEventListener('message', (e: MessageEvent<PesanKePekerja>) => {
  antrean.push(...e.data.tugas)
  if (!berjalan) {
    berjalan = true
    setTimeout(proses, 0)
  }
})

kirim({ jenis: 'siap', didukung: cekDukungan() })
