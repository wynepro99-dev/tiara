// Alat kecil bersama: acak berbenih, interpolasi, warna, dan pembuat kanvas.
// Dipakai di thread utama maupun di dalam Web Worker (tanpa akses DOM wajib).

export type Rgb = readonly [number, number, number]
export type Ktx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
export type Kanvas = HTMLCanvasElement | OffscreenCanvas

export const TAU = Math.PI * 2

/** PRNG mulberry32 berbenih. */
export function buatAcak(benih: number) {
  let a = benih >>> 0 || 1
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const jepit = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v)

export function halus(a: number, b: number, v: number) {
  const x = jepit((v - a) / (b - a))
  return x * x * (3 - 2 * x)
}

export function hex(h: string): Rgb {
  const n = parseInt(h.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function rgba(c: Rgb, a = 1) {
  return `rgba(${Math.round(jepit(c[0], 0, 255))},${Math.round(jepit(c[1], 0, 255))},${Math.round(jepit(c[2], 0, 255))},${jepit(a)})`
}

export function campur(a: Rgb, b: Rgb, t: number): Rgb {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]
}

/** f > 1 menerangkan ke arah putih, f < 1 menggelapkan. */
export function terang(c: Rgb, f: number): Rgb {
  if (f >= 1) {
    const k = f - 1
    return [c[0] + (255 - c[0]) * k, c[1] + (255 - c[1]) * k, c[2] + (255 - c[2]) * k]
  }
  return [c[0] * f, c[1] * f, c[2] * f]
}

export function buatKanvas(w: number, h: number): { kanvas: Kanvas; ctx: Ktx } {
  const lebar = Math.max(1, Math.ceil(w))
  const tinggi = Math.max(1, Math.ceil(h))
  if (typeof OffscreenCanvas !== 'undefined') {
    const kanvas = new OffscreenCanvas(lebar, tinggi)
    const ctx = kanvas.getContext('2d')
    if (ctx) return { kanvas, ctx }
  }
  const kanvas = document.createElement('canvas')
  kanvas.width = lebar
  kanvas.height = tinggi
  return { kanvas, ctx: kanvas.getContext('2d')! }
}

/** Pola butiran halus (gelap & terang bercampur) untuk tekstur beludru kelopak. */
const polaCache = new Map<string, Kanvas>()
export function kanvasButir(ukuran = 96, benih = 11, kekuatan = 1): Kanvas {
  const kunci = `${ukuran}-${benih}-${kekuatan}`
  const ada = polaCache.get(kunci)
  if (ada) return ada
  const { kanvas, ctx } = buatKanvas(ukuran, ukuran)
  const acak = buatAcak(benih)
  const data = ctx.createImageData(ukuran, ukuran)
  for (let i = 0; i < data.data.length; i += 4) {
    const v = acak()
    const terangkah = v > 0.5
    const kuat = Math.abs(v - 0.5) * 2
    const c = terangkah ? 255 : 30
    data.data[i] = c
    data.data[i + 1] = terangkah ? 245 : 8
    data.data[i + 2] = terangkah ? 240 : 14
    data.data[i + 3] = Math.round(kuat * kuat * 70 * kekuatan)
  }
  ctx.putImageData(data, 0, 0)
  polaCache.set(kunci, kanvas)
  return kanvas
}
