import { AnimatePresence, motion, PresenceContext, useReducedMotion } from 'motion/react'
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { KONFIGURASI } from '../../config'
import { semburKelopak } from '../../lib/acara'
import { buatRingkasan, buatTautanWhatsApp } from '../../lib/ringkasan'
import type { Jawaban } from '../../types'
import { Tombol } from '../ui/Tombol'
import { KartuTiket } from './tiket/KartuTiket'
import { PratinjauGambar, Toast } from './tiket/Lapisan'
import { TautanAkhir } from './tiket/TautanAkhir'
import { useBagikanTiket } from './tiket/useBagikanTiket'

const EASE_LEMBUT = [0.22, 1, 0.36, 1] as const

function IkonWhatsApp({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.42.25-.69.25-1.29.18-1.41-.08-.13-.28-.2-.57-.35m-5.42 7.4h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88a9.82 9.82 0 0 1 6.99 2.9 9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89a11.82 11.82 0 0 0-3.48-8.41Z" />
    </svg>
  )
}

function IkonBagikan({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" aria-hidden="true">
      <path d="M10 12.5V3m0 0L6.5 6.5M10 3l3.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 9.5H5a1.5 1.5 0 0 0-1.5 1.5v4.5A1.5 1.5 0 0 0 5 17h10a1.5 1.5 0 0 0 1.5-1.5V11A1.5 1.5 0 0 0 15 9.5h-1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

/** '2026-10-17' → '17 · 10 · 2026' untuk teks kecil di stempel. */
const tanggalUntukStempel = (kunci: string | null) => (kunci ? kunci.split('-').reverse().join(' · ') : 'SEE YOU SOON')

export function LangkahTiket({ jawaban, kembali, ulangi }: { jawaban: Jawaban; kembali: () => void; ulangi: () => void }) {
  const r = useMemo(() => buatRingkasan(jawaban), [jawaban])
  const kunci = useMemo(() => JSON.stringify(jawaban), [jawaban])
  const tautanWa = useMemo(() => buatTautanWhatsApp(jawaban), [jawaban])
  const gerakDikurangi = useReducedMotion()
  const wadah = useRef<HTMLDivElement>(null)
  const [masukSelesai, setMasukSelesai] = useState(false)

  const waktu = [r.periode, r.jam].filter((t) => t !== '-').join(', jam ')
  const { status, bagikan, toast, pratinjau, tutupPratinjau } = useBagikanTiket({
    wadah,
    kunci,
    praRender: masukSelesai,
    judul: `Tiket Kencan ${r.nomorTiket}`,
    teks: ['Tiket kencan kita 💌', [r.tanggal !== '-' && r.tanggal, waktu].filter(Boolean).join(' · ')].filter(Boolean).join('\n'),
  })

  // Puncak animasi: stempel menghantam tiket → sembur kelopak sekali dari atas tiket.
  const saatStempel = useCallback(() => {
    if (!gerakDikurangi && wadah.current) {
      const kotak = wadah.current.getBoundingClientRect()
      semburKelopak({ x: kotak.left + kotak.width / 2, y: kotak.top + 28, jumlah: 40 })
    }
    // Beri waktu kelopak beterbangan sebelum pra-render (yang memakai utas utama).
    window.setTimeout(() => setMasukSelesai(true), gerakDikurangi ? 200 : 2000)
  }, [gerakDikurangi])

  // Halaman dimuat ulang tepat di langkah ini: App mematikan animasi awal (AnimatePresence
  // initial={false}), jadi stempel langsung tampil tanpa memicu saatStempel.
  const presensi = useContext(PresenceContext)
  const [tanpaAnimasiMasuk] = useState(() => presensi?.initial === false)

  // Jaring pengaman juga bila animasi tidak pernah tuntas (mis. tab di latar belakang).
  useEffect(() => {
    const t = window.setTimeout(() => setMasukSelesai(true), tanpaAnimasiMasuk ? 500 : 4500)
    return () => clearTimeout(t)
  }, [tanpaAnimasiMasuk])

  const menyiapkan = status === 'menyiapkan'

  return (
    <div className="flex flex-col gap-5">
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE_LEMBUT, delay: 0.1 }}
        className="text-center"
      >
        <p className="text-[12px] font-semibold tracking-[0.22em] text-mawar-500 uppercase">It&rsquo;s a date!</p>
        <p className="mx-auto mt-1 max-w-[32ch] text-[15px] leading-relaxed text-balance text-anggur-muda">
          Ini tiket kencan kita. Simpan, lalu kirim ke {KONFIGURASI.panggilanPengundang} ya
        </p>
      </motion.header>

      {/* Wadah tangkapan PNG. Di layar transparan; saat dirender diberi latar persik + ruang. */}
      <div ref={wadah} role="group" aria-label={`Tiket kencan ${r.nomorTiket}`}>
        <KartuTiket r={r} tanggalStempel={tanggalUntukStempel(jawaban.tanggal)} saatStempel={saatStempel} kilau={!gerakDikurangi} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE_LEMBUT, delay: 0.85 }}
        className="flex flex-col gap-3"
      >
        {/* Tidak memakai disabled agar warna & kontras tetap; ketukan ganda dicegah di useBagikanTiket. */}
        <Tombol lebar onClick={bagikan} aria-busy={menyiapkan} className={menyiapkan ? 'cursor-progress' : ''}>
          {/* Label berganti seketika (tanpa menunggu animasi keluar) agar umpan balik langsung terlihat. */}
          <motion.span
            key={menyiapkan ? 'siap' : 'bagikan'}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="inline-flex items-center gap-2"
          >
            {menyiapkan ? (
              <>
                <span aria-hidden="true" className="size-[18px] animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Menyiapkan gambar...
              </>
            ) : (
              <>
                <IkonBagikan className="size-5" />
                Bagikan tiketnya
              </>
            )}
          </motion.span>
        </Tombol>

        <AnimatePresence initial={false}>
          {status === 'ketuk-lagi' && (
            <motion.p
              role="status"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="-mt-1 text-center text-[14px] font-semibold text-mawar-700"
            >
              Gambar siap, ketuk lagi untuk membagikan
            </motion.p>
          )}
        </AnimatePresence>

        <motion.a
          href={tautanWa}
          target="_blank"
          rel="noopener noreferrer"
          whileTap={{ scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#11823f] to-[#0b6b33] px-6 text-[16px] font-semibold tracking-[0.01em] text-white shadow-[0_1px_0_rgb(255_255_255/0.25)_inset,0_8px_20px_-8px_rgb(11_107_51/0.65)] transition-[background-color,box-shadow] duration-300 select-none hover:from-[#0f7a3b] hover:to-[#095f2d]"
        >
          <IkonWhatsApp className="size-5" />
          Chat WhatsApp
        </motion.a>
        <p className="text-center text-[14px] text-anggur-muda">Rekap jawabanmu akan terisi otomatis</p>
      </motion.div>

      <TautanAkhir kembali={kembali} ulangi={ulangi} />

      <Toast toast={toast} />
      <PratinjauGambar url={pratinjau} tutup={tutupPratinjau} />
    </div>
  )
}
