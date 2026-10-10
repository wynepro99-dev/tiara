import { AnimatePresence, motion } from 'motion/react'
import { Tombol } from './Tombol'

interface Props {
  kembali: () => void
  lanjut: () => void
  bisaLanjut: boolean
  labelLanjut?: string
  /** Petunjuk singkat saat belum bisa lanjut, contoh "Pilih tanggal dulu ya". */
  petunjuk?: string
}

/** Baris tombol Kembali / Lanjut di bagian bawah kartu. */
export function NavigasiLangkah({ kembali, lanjut, bisaLanjut, labelLanjut = 'Lanjut', petunjuk }: Props) {
  return (
    <div className="mt-6">
      <div className="h-5 text-center">
        <AnimatePresence>
          {!bisaLanjut && petunjuk && (
            <motion.p
              key={petunjuk}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="text-[13px] text-anggur-pudar"
            >
              {petunjuk}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <Tombol varian="hantu" onClick={kembali} className="px-4" aria-label="Kembali ke langkah sebelumnya">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Kembali
        </Tombol>
        <Tombol onClick={lanjut} disabled={!bisaLanjut} className="flex-1">
          {labelLanjut}
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Tombol>
      </div>
    </div>
  )
}
