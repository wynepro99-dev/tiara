// Tata letak rangkaian bunga berbentuk hati (murni data & matematika, tanpa three.js).
// Satuan: lebar hati = 2 (x dari -1 sampai 1), sumbu y ke atas, pusat di (0, 0).

import { DATA_DAUN, DATA_MAWAR, DATA_PENGISI } from './dataTata'

/** Pembangkit acak deterministik (mulberry32) agar variasi selalu sama. */
export function buatAcak(benih: number) {
  let a = benih >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type KeluargaWarna = 'merah' | 'kuning' | 'peralihan'

export interface PosMawar {
  x: number
  y: number
  r: number
  /** Mawar di cincin tepi (pembentuk siluet). */
  tepi: boolean
  keluarga: KeluargaWarna
}

export interface PosDaun {
  x: number
  y: number
  /** Arah ujung daun (radian, 0 = kanan). */
  sudut: number
  panjang: number
}

export interface PosPengisi {
  x: number
  y: number
  jenis: 'putih' | 'kuning'
}

export interface TataLetakHati {
  mawar: PosMawar[]
  daun: PosDaun[]
  pengisi: PosPengisi[]
  /** Garis hati (poligon) untuk bayangan lembut. */
  garis: [number, number][]
}

const GESER_Y = 0.1586
const KELUARGA: KeluargaWarna[] = ['merah', 'kuning', 'peralihan']

/** Titik pada garis hati klasik, parameter t 0..2π (t = 0 di lekuk atas). */
function titikHati(t: number): [number, number] {
  const s = Math.sin(t)
  const x = s * s * s
  const y = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16
  return [x, y + GESER_Y]
}

export function bacaTataLetak(): TataLetakHati {
  const garis: [number, number][] = []
  for (let i = 0; i < 180; i++) garis.push(titikHati((i / 180) * Math.PI * 2))
  return {
    mawar: DATA_MAWAR.map(([x, y, r, tepi, k]) => ({ x, y, r, tepi: tepi === 1, keluarga: KELUARGA[k] })),
    daun: DATA_DAUN.map(([x, y, sudut, panjang]) => ({ x, y, sudut, panjang })),
    pengisi: DATA_PENGISI.map(([x, y, j]) => ({ x, y, jenis: j === 1 ? 'kuning' : 'putih' })),
    garis,
  }
}
