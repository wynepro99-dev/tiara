import { motion, type HTMLMotionProps } from 'motion/react'
import { forwardRef } from 'react'

type Varian = 'utama' | 'kedua' | 'hantu'

interface PropsTombol extends HTMLMotionProps<'button'> {
  varian?: Varian
  lebar?: boolean
}

const gaya: Record<Varian, string> = {
  utama:
    'bg-gradient-to-b from-mawar-400 to-mawar-600 text-white shadow-tombol hover:from-mawar-500 hover:to-mawar-700 disabled:from-mawar-200 disabled:to-mawar-300 disabled:shadow-none',
  kedua:
    'bg-white/80 text-mawar-700 ring-1 ring-mawar-200 hover:bg-white hover:ring-mawar-300 disabled:text-anggur-pudar',
  hantu: 'bg-transparent text-anggur-muda hover:text-mawar-700 hover:bg-mawar-50 disabled:text-anggur-pudar',
}

export const Tombol = forwardRef<HTMLButtonElement, PropsTombol>(function Tombol(
  { varian = 'utama', lebar, className = '', disabled, children, ...sisa },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      type="button"
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-[16px] font-semibold tracking-[0.01em] transition-[background-color,color,box-shadow] duration-300 select-none ${gaya[varian]} ${lebar ? 'w-full' : ''} ${className}`}
      {...sisa}
    >
      {children}
    </motion.button>
  )
})
