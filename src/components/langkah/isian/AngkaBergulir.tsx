import { AnimatePresence, motion, type Variants } from 'motion/react'
import { useState } from 'react'

const varian: Variants = {
  masuk: (arah: number) => ({ y: arah > 0 ? '90%' : '-90%', opacity: 0 }),
  tampil: { y: '0%', opacity: 1 },
  keluar: (arah: number) => ({ y: arah > 0 ? '-90%' : '90%', opacity: 0 }),
}

/** Angka yang bergulir naik saat bertambah dan turun saat berkurang. */
export function AngkaBergulir({ nilai, className = '' }: { nilai: number; className?: string }) {
  const [sebelum, setSebelum] = useState(nilai)
  const [arah, setArah] = useState(1)
  // Pola "sesuaikan state saat prop berubah": catat arah tanpa efek.
  if (nilai !== sebelum) {
    setArah(nilai > sebelum ? 1 : -1)
    setSebelum(nilai)
  }

  return (
    <>
      {/* Pembaca layar cukup mendengar angka akhirnya, bukan dua angka yang sedang bertukar. */}
      <span className="sr-only">{nilai}</span>
      <span aria-hidden="true" className={`relative inline-grid overflow-hidden tabular-nums ${className}`}>
        <AnimatePresence mode="popLayout" initial={false} custom={arah}>
          <motion.span
            key={nilai}
            custom={arah}
            variants={varian}
            initial="masuk"
            animate="tampil"
            exit="keluar"
            transition={{ type: 'spring', stiffness: 520, damping: 34 }}
            className="col-start-1 row-start-1 block"
          >
            {nilai}
          </motion.span>
        </AnimatePresence>
      </span>
    </>
  )
}
