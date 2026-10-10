import { motion } from 'motion/react'
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'

/**
 * Wadah yang tingginya ikut isi secara halus (mis. chip bertambah baris),
 * agar elemen di bawahnya tidak melompat.
 */
export function TinggiHalus({ children, className = '' }: { children: ReactNode; className?: string }) {
  const isi = useRef<HTMLDivElement>(null)
  const [tinggi, setTinggi] = useState<number | 'auto'>('auto')

  useLayoutEffect(() => {
    const el = isi.current
    if (!el) return
    const pengamat = new ResizeObserver(([entri]) => setTinggi(entri.borderBoxSize[0]?.blockSize ?? el.offsetHeight))
    pengamat.observe(el)
    return () => pengamat.disconnect()
  }, [])

  return (
    <motion.div
      initial={false}
      animate={{ height: tinggi }}
      transition={{ type: 'spring', stiffness: 360, damping: 38 }}
      className={className}
    >
      <div ref={isi}>{children}</div>
    </motion.div>
  )
}
