import { useId, useMemo } from 'react'

// Ornamen kecil tiket. Semua warna ditulis langsung di atribut SVG agar tetap
// tergambar sama persis ketika tiket dirender ke PNG.

const idAman = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, '')

/** Bunga lima kelopak, kuning di tengah bertepi merah (senada dengan bunga undangan). */
export function BungaKecil({ ukuran = 18, className = '' }: { ukuran?: number; className?: string }) {
  const id = `bunga-${idAman(useId())}`
  return (
    <svg width={ukuran} height={ukuran} viewBox="-10 -10 20 20" className={className} aria-hidden="true">
      <defs>
        <radialGradient id={id} cx="0" cy="0" r="9.5" gradientUnits="userSpaceOnUse">
          <stop offset="0.28" stopColor="#f9cf4f" />
          <stop offset="0.62" stopColor="#f08a3c" />
          <stop offset="1" stopColor="#c8322f" />
        </radialGradient>
      </defs>
      {[0, 72, 144, 216, 288].map((sudut) => (
        <ellipse key={sudut} cx="0" cy="-4.9" rx="3.6" ry="5" fill={`url(#${id})`} transform={`rotate(${sudut})`} />
      ))}
      <circle r="2.2" fill="#9c3d22" />
      <circle r="1" cx="-0.5" cy="-0.5" fill="#e0a043" />
    </svg>
  )
}

/** Garis ornamen ala cetakan pengaman tiket (guilloche), sangat tipis. */
export function Guilloche({ className = '' }: { className?: string }) {
  const id = `guilloche-${idAman(useId())}`
  const jalur = useMemo(() => {
    const hasil: string[] = []
    for (let k = 0; k < 11; k++) {
      let d = ''
      for (let x = 0; x <= 320; x += 4) {
        const t = x / 320
        const y =
          40 +
          14 * Math.sin(t * Math.PI * 6 + k * 0.57) * Math.cos(t * Math.PI * 1.4 - k * 0.21) +
          4 * Math.sin(t * Math.PI * 18 + k)
        d += `${x === 0 ? 'M' : 'L'}${x} ${y.toFixed(2)}`
      }
      hasil.push(d)
    }
    return hasil
  }, [])
  return (
    <svg viewBox="0 0 320 80" preserveAspectRatio="none" className={className} aria-hidden="true">
      {/* Memudar di kedua ujung agar tidak terpotong kasar oleh bingkai */}
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="320" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#e2c79a" stopOpacity="0" />
          <stop offset="0.22" stopColor="#e2c79a" stopOpacity="0.5" />
          <stop offset="0.78" stopColor="#e2c79a" stopOpacity="0.5" />
          <stop offset="1" stopColor="#e2c79a" stopOpacity="0" />
        </linearGradient>
      </defs>
      {jalur.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={`url(#${id})`} strokeWidth="0.7" vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  )
}
