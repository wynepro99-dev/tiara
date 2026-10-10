import { motion, useReducedMotion, type Variants } from 'motion/react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { KONFIGURASI } from '../../config'
import { semburKelopak } from '../../lib/acara'
import { HatiBunga, type DetailSemburBunga } from '../bunga'
import { RASIO_TINGGI_HATI } from '../bunga/tipe'

// Layar pembuka: hati dari mawar yang mekar + nama pengundang & penerima.
// Seluruh layar bisa diketuk untuk membuka undangan.

const EASE_LEMBUT = [0.22, 1, 0.36, 1] as const
/** Layar mulai menerima ketukan setelah jeda ini (ms), agar tidak terbuka tak sengaja. */
const JEDA_AKTIF_MS = 1200
/** Petunjuk tidak muncul sebelum nama penerima selesai tampil. */
const PETUNJUK_PALING_CEPAT_MS = 3400
/** Petunjuk tetap muncul setelah jeda ini walau kabar mekar belum datang (jaringan lambat). */
const CADANGAN_PETUNJUK_MS = 7000
/** Jeda dari ketukan sampai pindah langkah, memberi waktu semburan kelopak terlihat. */
const JEDA_LANJUT_MS = 350
const UKURAN_HATI_MAKS = 500
/** Porsi lebar layar untuk kanvas hati (kanvas punya margin sendiri, mawar terluar tetap berjarak dari tepi). */
const PORSI_LEBAR = 0.96

// Teks muncul berurutan selaras dengan gelombang mekar (dari bawah ke atas, ±4,5 detik).
// Memakai `transform` (bukan `y`) agar animasi berjalan di compositor dan tetap mulus walau
// thread utama sibuk menyiapkan three.js pada detik pertama.
interface KustomTeks {
  tunda: number
  lama?: number
  gerak: boolean
}

const varianTeks: Variants = {
  awal: (k: KustomTeks) => ({
    opacity: 0,
    transform: k.gerak ? 'translateY(10px)' : 'translateY(0px)',
    filter: k.gerak ? 'blur(8px)' : 'blur(0px)',
  }),
  tampil: (k: KustomTeks) => ({
    opacity: 1,
    transform: 'translateY(0px)',
    filter: 'blur(0px)',
    transition: { delay: k.tunda, duration: k.lama ?? 0.95, ease: EASE_LEMBUT },
  }),
  pergi: (k: KustomTeks) => ({
    opacity: 0,
    transform: k.gerak ? 'translateY(-6px)' : 'translateY(0px)',
    filter: k.gerak ? 'blur(4px)' : 'blur(0px)',
    transition: { duration: 0.35, ease: [0.4, 0, 1, 1] },
  }),
}

export function LangkahPembuka({ lanjut }: { lanjut: () => void }) {
  const gerakDikurangi = useReducedMotion() ?? false
  const ruangRef = useRef<HTMLDivElement>(null)
  const hatiRef = useRef<HTMLDivElement>(null)
  const dibukaRef = useRef(false)
  const waktuPasangRef = useRef(0)
  const [ukuran, setUkuran] = useState<number | null>(null)
  const [siapKetuk, setSiapKetuk] = useState(false)
  const [mekarSelesai, setMekarSelesai] = useState(false)
  const [dibuka, setDibuka] = useState(false)
  // Mulai urutan teks setelah mount. Tidak memakai prop `initial` karena AnimatePresence di App
  // memakai initial={false} (yang ikut mematikan animasi awal komponen di dalamnya).
  const [mulai, setMulai] = useState(false)

  // Ukuran hati mengikuti ruang yang tersisa (lebar & tinggi), jadi layar tidak pernah perlu digulir.
  useLayoutEffect(() => {
    const ruang = ruangRef.current
    if (!ruang) return
    const ukur = () => {
      const { width, height } = ruang.getBoundingClientRect()
      const baru = Math.floor(Math.max(160, Math.min(width * PORSI_LEBAR, height / RASIO_TINGGI_HATI, UKURAN_HATI_MAKS)))
      setUkuran((lama) => (lama !== null && Math.abs(lama - baru) < 2 ? lama : baru))
    }
    ukur()
    const pengamat = new ResizeObserver(ukur)
    pengamat.observe(ruang)
    return () => pengamat.disconnect()
  }, [])

  useEffect(() => {
    waktuPasangRef.current = performance.now()
    const idMulai = requestAnimationFrame(() => setMulai(true))
    const aktif = window.setTimeout(() => setSiapKetuk(true), JEDA_AKTIF_MS)
    const petunjuk = window.setTimeout(() => setMekarSelesai(true), CADANGAN_PETUNJUK_MS)
    return () => {
      cancelAnimationFrame(idMulai)
      window.clearTimeout(aktif)
      window.clearTimeout(petunjuk)
    }
  }, [])

  const tandaiMekarSelesai = useCallback(() => {
    const sisa = PETUNJUK_PALING_CEPAT_MS - (performance.now() - waktuPasangRef.current)
    if (sisa > 0) window.setTimeout(() => setMekarSelesai(true), sisa)
    else setMekarSelesai(true)
  }, [])

  const buka = useCallback(() => {
    if (!siapKetuk || dibukaRef.current) return
    dibukaRef.current = true
    setDibuka(true)
    const kotak = hatiRef.current?.getBoundingClientRect()
    // Kelopak menyembur di depan hati, lalu pindah ke belakang tepat saat layar ini selesai memudar
    // sehingga sisa kelopak tidak menutupi kartu ajakan yang masuk.
    const sembur: DetailSemburBunga = {
      x: kotak ? kotak.left + kotak.width / 2 : window.innerWidth / 2,
      y: kotak ? kotak.top + kotak.height * 0.46 : window.innerHeight / 2,
      jumlah: 72,
      keBelakangSetelah: (JEDA_LANJUT_MS + 500) / 1000,
    }
    semburKelopak(sembur)
    window.setTimeout(lanjut, JEDA_LANJUT_MS)
  }, [lanjut, siapKetuk])

  const padaTombol = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      buka()
    }
  }

  const keadaan = dibuka ? 'pergi' : mulai ? 'tampil' : 'awal'
  const teks = (tunda: number, lama?: number) => ({
    variants: varianTeks,
    custom: { tunda, lama, gerak: !gerakDikurangi } satisfies KustomTeks,
    initial: 'awal',
    animate: keadaan,
  })

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Buka undangan dari ${KONFIGURASI.namaPengundang} untuk ${KONFIGURASI.namaPenerima}`}
      aria-disabled={!siapKetuk}
      onClick={buka}
      onKeyDown={padaTombol}
      className={`relative z-10 mx-auto flex h-dvh w-full max-w-[560px] flex-col items-center justify-center overflow-hidden pt-[max(22px,env(safe-area-inset-top))] pb-[calc(max(14px,env(safe-area-inset-bottom))+44px)] outline-none select-none focus-visible:ring-2 focus-visible:ring-mawar-300 focus-visible:ring-inset ${siapKetuk ? 'cursor-pointer' : ''}`}
    >
      <header className="flex shrink-0 flex-col items-center px-5 text-center">
        <motion.p {...teks(0.2)} className="flex items-center gap-3 font-serif text-[14px] font-semibold tracking-[0.42em] text-anggur-muda uppercase">
          <span aria-hidden="true" className="h-px w-7 bg-gradient-to-r from-transparent to-mawar-300" />
          <span className="-mr-[0.42em]">Invitation</span>
          <span aria-hidden="true" className="h-px w-7 bg-gradient-to-l from-transparent to-mawar-300" />
        </motion.p>
        <motion.p {...teks(0.45)} className="mt-1.5 font-serif text-[19px] leading-tight text-anggur-muda italic">
          From
        </motion.p>
        <motion.h1
          {...teks(0.7)}
          className="font-serif text-[clamp(30px,8.6vw,38px)] leading-[1.12] font-medium tracking-[0.01em] text-anggur"
        >
          {KONFIGURASI.namaPengundang}
        </motion.h1>
      </header>

      {/* Ruang hati: mengisi sisa tinggi, tetapi tidak lebih tinggi dari hati selebar layar,
          sehingga kelebihan ruang terbagi rata di atas & bawah susunan. */}
      <div
        ref={ruangRef}
        className="relative my-1 min-h-0 w-full flex-1 max-h-[min(calc(min(100vw,560px)*0.96*0.92),460px)]"
      >
        {ukuran !== null && (
          <motion.div
            ref={hatiRef}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            animate={dibuka ? { scale: 1.08 } : { scale: 1 }}
            transition={{ duration: 0.9, ease: EASE_LEMBUT }}
          >
            <HatiBunga mekar ukuran={ukuran} onMekarSelesai={tandaiMekarSelesai} />
          </motion.div>
        )}
      </div>

      <footer className="flex shrink-0 flex-col items-center px-5 text-center">
        <motion.p {...teks(1.9)} className="font-serif text-[19px] leading-tight text-anggur-muda italic">
          For
        </motion.p>
        <motion.p
          {...teks(2.25, 1.2)}
          className="-mt-0.5 font-script text-[clamp(52px,15vw,64px)] leading-[1.12] text-mawar-700"
        >
          {KONFIGURASI.namaPenerima}
        </motion.p>
      </footer>

      <motion.div
        className="absolute inset-x-0 bottom-[max(14px,env(safe-area-inset-bottom))] flex h-11 items-center justify-center gap-2.5 text-[14px] font-medium tracking-[0.04em] text-anggur-muda"
        initial={{ opacity: 0, y: 6 }}
        animate={mekarSelesai && !dibuka ? { opacity: 1, y: 0 } : { opacity: 0, y: dibuka ? -4 : 6 }}
        transition={{ duration: dibuka ? 0.3 : 0.8, ease: EASE_LEMBUT }}
      >
        <span aria-hidden="true" className="relative flex size-2.5 items-center justify-center">
          {!gerakDikurangi && mekarSelesai && (
            <motion.span
              className="absolute inset-0 rounded-full bg-mawar-400"
              animate={{ scale: [1, 2.6], opacity: [0.45, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
            />
          )}
          <span className="size-2 rounded-full bg-mawar-500" />
        </span>
        <motion.span
          animate={gerakDikurangi || !mekarSelesai ? undefined : { opacity: [0.65, 1, 0.65] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          Ketuk untuk membuka
        </motion.span>
      </motion.div>
    </div>
  )
}
