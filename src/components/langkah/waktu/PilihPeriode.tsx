import { motion } from 'motion/react'
import { PERIODE } from '../../../data/pilihan'
import type { PeriodeWaktu } from '../../../types'

interface Props {
  terpilih: PeriodeWaktu | null
  /** Periode yang semua jamnya sudah lewat (khusus hari ini). */
  habis: PeriodeWaktu[]
  onPilih: (periode: PeriodeWaktu) => void
}

/** Empat ubin Pagi / Siang / Sore / Malam dalam satu baris. */
export function PilihPeriode({ terpilih, habis, onPilih }: Props) {
  return (
    <div role="radiogroup" aria-label="Waktu umum" className="grid grid-cols-4 gap-2">
      {PERIODE.map((p) => {
        const dipilih = p.id === terpilih
        const nonaktif = habis.includes(p.id)
        return (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={dipilih}
            aria-label={`${p.label}, ${p.rentang}${nonaktif ? ', sudah lewat' : ''}`}
            disabled={nonaktif}
            onClick={() => onPilih(p.id)}
            className={`group relative min-h-[72px] rounded-[18px] transition-[background-color,box-shadow,opacity] duration-300 disabled:cursor-default ${
              dipilih ? '' : 'bg-white ring-1 ring-mawar-100 hover:ring-mawar-200 disabled:opacity-45 disabled:hover:ring-mawar-100'
            }`}
          >
            {/* Sorotan terpilih yang bergeser antar ubin */}
            {dipilih && (
              <motion.span
                layoutId="penanda-periode"
                transition={{ type: 'spring', stiffness: 440, damping: 36 }}
                className="absolute inset-0 rounded-[18px] bg-mawar-50 shadow-[0_10px_22px_-12px_rgb(173_55_86/0.6)] ring-2 ring-mawar-400"
              />
            )}
            <motion.span
              className="relative flex flex-col items-center justify-center gap-1.5 py-2"
              whileTap={nonaktif ? undefined : { scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 520, damping: 28 }}
            >
              <motion.span
                className={`text-[24px] leading-none ${nonaktif ? 'grayscale' : ''}`}
                animate={{ scale: dipilih ? 1.16 : 1, rotate: dipilih ? -6 : 0, y: dipilih ? -1 : 0 }}
                transition={{ type: 'spring', stiffness: 420, damping: 16 }}
                aria-hidden="true"
              >
                {p.emoji}
              </motion.span>
              <span
                className={`text-[14px] leading-tight font-semibold transition-colors duration-300 ${
                  dipilih ? 'text-mawar-700' : 'text-anggur'
                }`}
              >
                {p.label}
              </span>
            </motion.span>
          </button>
        )
      })}
    </div>
  )
}
