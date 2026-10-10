import { AnimatePresence, motion } from 'motion/react'

interface Props {
  emoji: string
  label: string
  keterangan?: string
  terpilih: boolean
  onPilih: () => void
  /** 'centang' untuk multi-pilih, 'radio' untuk pilih satu. */
  jenis?: 'centang' | 'radio'
}

/** Ubin pilihan dengan emoji besar, dipakai untuk aktivitas & dress code. */
export function KartuPilihan({ emoji, label, keterangan, terpilih, onPilih, jenis = 'centang' }: Props) {
  return (
    <motion.button
      type="button"
      role={jenis === 'radio' ? 'radio' : 'checkbox'}
      aria-checked={terpilih}
      onClick={onPilih}
      whileTap={{ scale: 0.95 }}
      animate={{ y: terpilih ? -2 : 0 }}
      transition={{ type: 'spring', stiffness: 520, damping: 30 }}
      className={`relative flex flex-col items-center justify-center gap-1 rounded-[20px] px-2 pt-4 pb-3 text-center transition-[background-color,box-shadow] duration-300 ${
        terpilih
          ? 'bg-mawar-50 shadow-[0_10px_24px_-12px_rgb(173_55_86/0.55)] ring-2 ring-mawar-400'
          : 'bg-white ring-1 ring-mawar-100 hover:ring-mawar-200'
      }`}
    >
      <motion.span
        className="text-[34px] leading-none"
        animate={{ scale: terpilih ? 1.12 : 1, rotate: terpilih ? -6 : 0 }}
        transition={{ type: 'spring', stiffness: 420, damping: 16 }}
        aria-hidden="true"
      >
        {emoji}
      </motion.span>
      <span className="mt-1 text-[14px] leading-tight font-semibold text-anggur">{label}</span>
      {keterangan && <span className="text-[12px] leading-tight text-anggur-pudar">{keterangan}</span>}

      <AnimatePresence>
        {terpilih && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 600, damping: 22 }}
            className="absolute top-2 right-2 grid size-5 place-items-center rounded-full bg-mawar-500 text-white"
            aria-hidden="true"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2.5 6.2L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
