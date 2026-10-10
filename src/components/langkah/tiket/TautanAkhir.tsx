import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useState } from 'react'

const gayaTautan =
  'inline-flex min-h-11 items-center rounded-full px-3 text-[15px] font-semibold text-anggur-muda underline decoration-mawar-200 decoration-[1.5px] underline-offset-4 transition-colors duration-200 hover:text-mawar-700 hover:decoration-mawar-400'

/** "Ubah jawaban" dan "Mulai dari awal" dengan konfirmasi di tempat (tanpa window.confirm). */
export function TautanAkhir({ kembali, ulangi }: { kembali: () => void; ulangi: () => void }) {
  const [konfirmasi, setKonfirmasi] = useState(false)
  // Ref stabil: fokus dipindah sekali saat kotak konfirmasi terpasang (setelah animasi keluar tautan).
  const fokuskan = useCallback((el: HTMLButtonElement | null) => el?.focus(), [])

  useEffect(() => {
    if (!konfirmasi) return
    const tekan = (e: KeyboardEvent) => e.key === 'Escape' && setKonfirmasi(false)
    window.addEventListener('keydown', tekan)
    return () => window.removeEventListener('keydown', tekan)
  }, [konfirmasi])

  return (
    <div className="min-h-[52px]">
      <AnimatePresence mode="wait" initial={false}>
        {konfirmasi ? (
          <motion.div
            key="konfirmasi"
            role="group"
            aria-label="Konfirmasi mulai dari awal"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-[20px] bg-white/70 px-4 py-3 text-center ring-1 ring-mawar-100"
          >
            <p className="text-[15px] text-balance text-anggur">Semua jawaban akan dihapus. Yakin mulai lagi?</p>
            <div className="mt-2 flex items-center justify-center gap-2">
              <button
                ref={fokuskan}
                type="button"
                onClick={() => setKonfirmasi(false)}
                className="min-h-11 rounded-full px-4 text-[15px] font-semibold text-anggur-muda transition-colors hover:bg-mawar-50 hover:text-mawar-700"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={ulangi}
                className="min-h-11 rounded-full bg-mawar-50 px-4 text-[15px] font-semibold text-mawar-700 ring-1 ring-mawar-200 transition-colors hover:bg-mawar-100"
              >
                Ya, mulai dari awal
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="tautan"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center justify-center gap-1"
          >
            <button type="button" onClick={kembali} className={gayaTautan}>
              Ubah jawaban
            </button>
            <span aria-hidden="true" className="text-anggur-pudar">
              ·
            </span>
            <button type="button" onClick={() => setKonfirmasi(true)} className={gayaTautan}>
              Mulai dari awal
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
