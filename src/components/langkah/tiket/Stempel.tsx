import { motion } from 'motion/react'
import { useRef } from 'react'

export const ROTASI_STEMPEL = -12
const TINTA = '#b4233c'

// Bintik-bintik warna kertas di atas tinta agar cap terlihat seperti stempel karet sungguhan.
const BINTIK = (() => {
  let s = 7
  const r = () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
  return Array.from({ length: 46 }, () => ({ x: r() * 100, y: r() * 100, rad: 0.25 + r() * 0.9, o: 0.5 + r() * 0.5 }))
})()

interface Props {
  /** Teks kecil di atas & bawah tulisan utama. */
  atas: string
  bawah: string
  /** Mulai animasi jatuh setelah jeda ini (detik). */
  jeda: number
  saatMendarat?: () => void
  className?: string
}

/** Cap "ACCEPTED ♥" miring yang jatuh dari besar lalu menghantam tiket. */
export function Stempel({ atas, bawah, jeda, saatMendarat, className = '' }: Props) {
  // Panggil saatMendarat tepat ketika cap pertama kali menyentuh kertas (skala ≈ 1),
  // bukan menunggu pegas benar-benar diam; onAnimationComplete jadi cadangan (gerak dikurangi).
  const sudahMendarat = useRef(false)
  const mendarat = () => {
    if (sudahMendarat.current) return
    sudahMendarat.current = true
    saatMendarat?.()
  }

  return (
    <motion.div
      data-stempel=""
      className={`pointer-events-none select-none ${className}`}
      initial={{ opacity: 0, scale: 2.6, rotate: ROTASI_STEMPEL - 20 }}
      animate={{ opacity: 0.92, scale: 1, rotate: ROTASI_STEMPEL }}
      transition={{
        delay: jeda,
        scale: { type: 'spring', stiffness: 420, damping: 28, delay: jeda },
        rotate: { type: 'spring', stiffness: 300, damping: 20, delay: jeda },
        opacity: { duration: 0.16, delay: jeda },
      }}
      onUpdate={(v) => typeof v.scale === 'number' && v.scale <= 1.02 && mendarat()}
      onAnimationComplete={mendarat}
    >
      <div className="relative rounded-[10px] border-2 p-[2.5px]" style={{ borderColor: TINTA }}>
        <div className="rounded-[7px] border px-2.5 pt-[3px] pb-[5px] text-center whitespace-nowrap" style={{ borderColor: TINTA, color: TINTA }}>
          <p className="text-[8px] leading-[1.7] font-bold tracking-[0.3em] uppercase">{atas}</p>
          <p className="font-sans text-[15px] leading-none font-extrabold tracking-[0.08em]">
            ACCEPTED <span className="font-serif text-[16px]">♥</span>
          </p>
          <p className="mt-[3px] text-[8px] leading-[1.7] font-bold tracking-[0.3em] tabular-nums">{bawah}</p>
        </div>
        <svg className="absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {BINTIK.map((b, i) => (
            <ellipse key={i} cx={b.x} cy={b.y} rx={b.rad} ry={b.rad * 1.6} fill="#fffbf7" fillOpacity={b.o} />
          ))}
        </svg>
      </div>
    </motion.div>
  )
}
