import { motion } from 'motion/react'
import type { MouseEvent } from 'react'
import { formatJam } from '../../../lib/tanggal'

interface Props {
  daftar: string[]
  terpilih: string | null
  /** true bila jam itu sudah lewat (tanggal = hari ini). */
  lewat: (jam: string) => boolean
  onPilih: (jam: string, e: MouseEvent<HTMLButtonElement>) => void
}

/** Grid jam spesifik untuk satu periode. */
export function PilihJam({ daftar, terpilih, lewat, onPilih }: Props) {
  return (
    <div role="radiogroup" aria-label="Jam" className="grid grid-cols-4 gap-2">
      {daftar.map((jam, i) => {
        const dipilih = jam === terpilih
        const nonaktif = lewat(jam)
        return (
          <motion.button
            key={jam}
            type="button"
            role="radio"
            aria-checked={dipilih}
            aria-label={`Jam ${formatJam(jam)}${nonaktif ? ', sudah lewat' : ''}`}
            disabled={nonaktif}
            onClick={(e) => onPilih(jam, e)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1], delay: 0.04 + i * 0.03 }}
            className={`group relative h-11 rounded-full transition-[box-shadow] duration-300 disabled:cursor-default ${
              dipilih
                ? ''
                : nonaktif
                  ? 'ring-1 ring-mawar-100/70'
                  : 'bg-white ring-1 ring-mawar-100 hover:ring-mawar-300'
            }`}
          >
            {dipilih && (
              <motion.span
                layoutId="penanda-jam"
                transition={{ type: 'spring', stiffness: 460, damping: 36 }}
                className="absolute inset-0 rounded-full bg-gradient-to-b from-mawar-400 to-mawar-600 shadow-tombol"
              />
            )}
            <span
              className={`relative text-[15px] font-semibold tabular-nums transition-colors duration-200 ${
                dipilih
                  ? 'text-white'
                  : nonaktif
                    ? 'text-anggur-pudar/55 line-through decoration-anggur-pudar/40'
                    : 'text-anggur group-active:text-mawar-600'
              }`}
            >
              {formatJam(jam)}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}
