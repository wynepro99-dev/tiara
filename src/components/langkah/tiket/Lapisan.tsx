import { AnimatePresence, motion } from 'motion/react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Tombol } from '../../ui/Tombol'
import type { DataToast } from './useBagikanTiket'

// Lapisan mengambang dirender lewat portal ke <body>: induk halaman memakai transform/filter
// saat transisi, yang akan membuat position: fixed menempel ke induk, bukan ke layar.

export function Toast({ toast }: { toast: DataToast | null }) {
  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[max(20px,env(safe-area-inset-bottom))] z-50 flex justify-center px-4"
    >
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98, transition: { duration: 0.22 } }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            className={`flex max-w-[400px] items-center gap-2.5 rounded-full py-2.5 pr-5 pl-3 text-[15px] font-semibold shadow-melayang ring-1 ${
              toast.jenis === 'sukses' ? 'bg-krem text-anggur ring-mawar-100' : 'bg-mawar-700 text-white ring-mawar-800'
            }`}
          >
            <span
              aria-hidden="true"
              className={`grid size-7 shrink-0 place-items-center rounded-full ${toast.jenis === 'sukses' ? 'bg-mawar-500 text-white' : 'bg-white/20'}`}
            >
              {toast.jenis === 'sukses' ? (
                <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6.2L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <span className="text-[15px] leading-none font-bold">!</span>
              )}
            </span>
            {toast.teks}
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body,
  )
}

/** Cadangan untuk peramban dalam aplikasi (Instagram dkk.): tampilkan gambar untuk ditekan lama. */
export function PratinjauGambar({ url, tutup }: { url: string | null; tutup: () => void }) {
  useEffect(() => {
    if (!url) return
    const tekan = (e: KeyboardEvent) => e.key === 'Escape' && tutup()
    window.addEventListener('keydown', tekan)
    return () => window.removeEventListener('keydown', tekan)
  }, [url, tutup])

  return createPortal(
    <AnimatePresence>
      {url && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Simpan gambar tiket"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-anggur/80 px-5 pt-[max(20px,env(safe-area-inset-top))] pb-[max(20px,env(safe-area-inset-bottom))]"
          onClick={tutup}
        >
          <motion.img
            src={url}
            alt="Tiket kencan"
            initial={{ y: 16, scale: 0.97 }}
            animate={{ y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            className="max-h-[72dvh] w-auto max-w-full rounded-[22px] shadow-melayang"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="text-center text-[16px] font-semibold text-white">Tekan lama gambarnya, lalu pilih “Simpan”</p>
          <Tombol varian="kedua" onClick={tutup} autoFocus>
            Tutup
          </Tombol>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
