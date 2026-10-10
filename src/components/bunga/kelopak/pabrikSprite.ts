import { jalankanTugas, type PesanDariPekerja, type Tugas } from './tugas'

// Pabrik sprite bersama (tingkat modul): cache lintas mount, Web Worker bila didukung,
// cadangan dicicil di thread utama. Hasil dikirim bertahap sesuai prioritas.

export type Sprite = CanvasImageSource
type Pendengar = (kunci: string, sprite: Sprite) => void

const cache = new Map<string, Sprite>()
const pendengar = new Map<string, Set<Pendengar>>()
const menunggu = new Map<string, Tugas>()

let mode: 'belum' | 'menunggu' | 'pekerja' | 'utama' = 'belum'
let pekerja: Worker | null = null
let tertunda: Tugas[] = []
const antreanUtama: Tugas[] = []
let utamaBerjalan = false

function terima(kunci: string, sprite: Sprite) {
  cache.set(kunci, sprite)
  menunggu.delete(kunci)
  const set = pendengar.get(kunci)
  if (!set) return
  pendengar.delete(kunci)
  for (const cb of set) cb(kunci, sprite)
}

function prosesUtama() {
  const batas = performance.now() + 6
  while (antreanUtama.length && performance.now() < batas) {
    let terbaik = 0
    for (let i = 1; i < antreanUtama.length; i++) if (antreanUtama[i].prioritas < antreanUtama[terbaik].prioritas) terbaik = i
    const tugas = antreanUtama.splice(terbaik, 1)[0]
    if (cache.has(tugas.kunci)) continue
    terima(tugas.kunci, jalankanTugas(tugas))
  }
  if (antreanUtama.length) setTimeout(prosesUtama, 0)
  else utamaBerjalan = false
}

function keUtama(daftar: Tugas[]) {
  antreanUtama.push(...daftar)
  if (!utamaBerjalan) {
    utamaBerjalan = true
    setTimeout(prosesUtama, 0)
  }
}

function alihKeUtama() {
  mode = 'utama'
  pekerja?.terminate()
  pekerja = null
  tertunda = []
  keUtama([...menunggu.values()])
}

function siapkan() {
  if (mode !== 'belum') return
  if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined') {
    mode = 'utama'
    return
  }
  try {
    pekerja = new Worker(new URL('./pekerja.ts', import.meta.url), { type: 'module' })
  } catch {
    mode = 'utama'
    return
  }
  mode = 'menunggu'
  const batasWaktu = setTimeout(alihKeUtama, 3000)
  pekerja.addEventListener('message', (e: MessageEvent<PesanDariPekerja>) => {
    const d = e.data
    if (d.jenis === 'siap') {
      clearTimeout(batasWaktu)
      if (!d.didukung) return alihKeUtama()
      mode = 'pekerja'
      if (tertunda.length) pekerja?.postMessage({ tugas: tertunda })
      tertunda = []
    } else if (d.jenis === 'hasil') {
      terima(d.kunci, d.bitmap)
    } else {
      const tugas = menunggu.get(d.kunci)
      if (tugas) keUtama([tugas])
    }
  })
  pekerja.addEventListener('error', () => {
    clearTimeout(batasWaktu)
    alihKeUtama()
  })
}

function kirim(daftar: Tugas[]) {
  if (mode === 'pekerja') pekerja?.postMessage({ tugas: daftar })
  else if (mode === 'menunggu') tertunda.push(...daftar)
  else keUtama(daftar)
}

/**
 * Minta sejumlah sprite. `cb` dipanggil per sprite begitu siap (langsung bila sudah di cache).
 * Mengembalikan fungsi untuk berhenti mendengarkan.
 */
export function mintaSprite(daftar: Tugas[], cb: Pendengar): () => void {
  siapkan()
  const baru: Tugas[] = []
  const milik: string[] = []
  for (const t of daftar) {
    const ada = cache.get(t.kunci)
    if (ada) {
      cb(t.kunci, ada)
      continue
    }
    let set = pendengar.get(t.kunci)
    if (!set) {
      set = new Set()
      pendengar.set(t.kunci, set)
    }
    set.add(cb)
    milik.push(t.kunci)
    if (!menunggu.has(t.kunci)) {
      menunggu.set(t.kunci, t)
      baru.push(t)
    }
  }
  if (baru.length) kirim(baru)
  return () => {
    for (const k of milik) pendengar.get(k)?.delete(cb)
  }
}
