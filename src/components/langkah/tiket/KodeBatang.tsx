import { useMemo } from 'react'

// Barcode hiasan: pola garis stabil yang diturunkan dari nomor tiket.
// Warna ditulis langsung (bukan kelas/variabel CSS) agar ikut tergambar saat SVG dirender ke PNG.

const TINGGI = 40
const TINGGI_PENDEK = 34
const WARNA = '#4a2130'

interface Batang {
  x: number
  lebar: number
  panjang: boolean
}

function acak(benih: string) {
  let h = 2166136261
  for (let i = 0; i < benih.length; i++) {
    h ^= benih.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  let s = h >>> 0
  // mulberry32
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function buatPola(nomor: string): { batang: Batang[]; total: number } {
  const r = acak(nomor)
  const batang: Batang[] = []
  let x = 0
  const penjaga = () => {
    batang.push({ x, lebar: 1, panjang: true })
    batang.push({ x: x + 2, lebar: 1, panjang: true })
    x += 4
  }
  const isi = (jumlah: number) => {
    for (let i = 0; i < jumlah; i++) {
      // Lebar 1–3 satuan, lebih sering tipis agar terlihat seperti barcode sungguhan.
      const lebar = r() < 0.55 ? 1 : r() < 0.7 ? 2 : 3
      batang.push({ x, lebar, panjang: false })
      x += lebar + (r() < 0.6 ? 1 : 2)
    }
  }
  penjaga()
  isi(14)
  penjaga()
  isi(14)
  penjaga()
  return { batang, total: x - 1 }
}

export function KodeBatang({ nomor, className = '' }: { nomor: string; className?: string }) {
  const { batang, total } = useMemo(() => buatPola(nomor), [nomor])
  return (
    <svg
      viewBox={`0 0 ${total} ${TINGGI}`}
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
      className={className}
      aria-hidden="true"
    >
      {batang.map((b, i) => (
        <rect key={i} x={b.x} y={0} width={b.lebar} height={b.panjang ? TINGGI : TINGGI_PENDEK} fill={WARNA} />
      ))}
    </svg>
  )
}
