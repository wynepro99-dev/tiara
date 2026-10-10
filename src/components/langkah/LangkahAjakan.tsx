import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from 'react'
import { KONFIGURASI } from '../../config'
import { semburDariElemen } from '../../lib/acara'
import type { PropsLangkah } from '../../types'
import { Kartu } from '../ui/Kartu'
import { Tombol } from '../ui/Tombol'
import { FotoPenerima } from './ajakan/FotoPenerima'
import {
  jepit,
  kotakBarisTeks,
  kotakTataLetak,
  pilihPosisi,
  relatifKe,
  type Kotak,
  type Rintangan,
  type Titik,
} from './ajakan/posisiKabur'

// Teks tombol No berganti tiap kali dicoba, lalu berputar lagi dari "Yakin?".
const LABEL_NO = ['No', 'Yakin?', 'Pikir lagi deh 🥺', 'Masa sih?', 'Nggak bisa 😝', 'Klik Yes aja']
const CANDAAN = [
  'Eh, tombolnya kabur 🙈',
  'Yes-nya makin besar tuh 👀',
  'Tombol No lagi malu-malu',
  'Pilihannya cuma satu kok 😌',
  'Udah, Yes aja ya 💕',
]

const SKALA_YES_MAKS = 1.3
const TAMBAH_SKALA_YES = 0.06
/** Jarak kursor (px) dari tepi tombol No yang membuatnya kabur. */
const JARAK_DEKAT = 28
/** Jarak aman tombol No dari tepi kartu. */
const TEPI_KARTU = 14
const JEDA_LANJUT = 900
/** Klik Yes sesaat setelah menekan No dianggap sisa ketukan ganda, bukan pilihan. */
const JEDA_KETUK_GANDA = 400

const EASE_LEMBUT = [0.22, 1, 0.36, 1] as const
const PEGAS_KABUR = { type: 'spring', stiffness: 320, damping: 24, mass: 0.9 } as const

/** Animasi masuk berurutan (hanya opacity & y, gerakan lain tetap memakai transisi bawaan). */
const muncul = (urutan: number) => {
  const masuk = { duration: 0.7, ease: EASE_LEMBUT, delay: 0.14 + urutan * 0.08 }
  return {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { type: 'spring', stiffness: 500, damping: 30, opacity: masuk, y: masuk },
  } as const
}

const labelNo = (n: number) => (n === 0 ? LABEL_NO[0] : LABEL_NO[1 + ((n - 1) % (LABEL_NO.length - 1))])

export function LangkahAjakan({ lanjut }: PropsLangkah) {
  const { panggilanPenerima, fotoPenerima } = KONFIGURASI
  const kurangiGerak = useReducedMotion()

  const refWadah = useRef<HTMLDivElement>(null)
  const refFoto = useRef<HTMLDivElement>(null)
  const refLabel = useRef<HTMLParagraphElement>(null)
  const refJudul = useRef<HTMLHeadingElement>(null)
  const refSub = useRef<HTMLParagraphElement>(null)
  const refBaris = useRef<HTMLDivElement>(null)
  const refRumah = useRef<HTMLDivElement>(null)
  const refCandaan = useRef<HTMLDivElement>(null)
  const refYes = useRef<HTMLButtonElement>(null)
  const refNo = useRef<HTMLButtonElement>(null)

  const [percobaan, setPercobaan] = useState(0)
  const [posNo, setPosNo] = useState<Titik | null>(null)
  const [diterima, setDiterima] = useState(false)
  const kabur = percobaan > 0

  const refPos = useRef<Titik | null>(null)
  const permintaan = useRef<{ penunjuk: Titik | null } | null>(null)
  const waktuKabur = useRef(-Infinity)
  const waktuTekanNo = useRef(-Infinity)
  const waktuTekanYes = useRef(-Infinity)
  const sudahYa = useRef(false)
  const timer = useRef<number | undefined>(undefined)

  useLayoutEffect(() => {
    refPos.current = posNo
  }, [posNo])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  // Sebelum kabur, tombol No menempel di ruang cadangan di samping Yes.
  useLayoutEffect(() => {
    if (kabur) return
    const wadah = refWadah.current
    const rumah = refRumah.current
    if (!wadah || !rumah) return
    const ukur = () => {
      const k = kotakTataLetak(rumah, wadah)
      setPosNo((p) => (p && p.x === k.x && p.y === k.y ? p : { x: k.x, y: k.y }))
    }
    ukur()
    const pengamat = new ResizeObserver(ukur)
    pengamat.observe(wadah)
    return () => pengamat.disconnect()
  }, [kabur])

  // Setelah kabur, jaga tetap di dalam kartu bila ukuran layar berubah.
  useEffect(() => {
    if (!kabur) return
    const wadah = refWadah.current
    if (!wadah) return
    const pengamat = new ResizeObserver(() => {
      const no = refNo.current
      if (!no) return
      const batas = batasKartu(wadah)
      setPosNo((p) => {
        if (!p) return p
        const q = jepit(p, batas, { w: no.offsetWidth, h: no.offsetHeight })
        return q.x === p.x && q.y === p.y ? p : q
      })
    })
    pengamat.observe(wadah)
    return () => pengamat.disconnect()
  }, [kabur])

  const mintaKabur = useCallback((penunjuk: Titik | null) => {
    if (sudahYa.current) return
    const kini = performance.now()
    if (kini - waktuKabur.current < 160) return
    waktuKabur.current = kini
    permintaan.current = { penunjuk }
    setPercobaan((n) => n + 1)
  }, [])

  // Hitung posisi baru setelah label berganti, supaya lebar tombol yang baru ikut diperhitungkan.
  // Berjalan sebelum layar digambar, jadi tidak ada kedipan di posisi lama.
  useLayoutEffect(() => {
    const minta = permintaan.current
    if (!percobaan || !minta) return
    permintaan.current = null
    const wadah = refWadah.current
    const no = refNo.current
    const yes = refYes.current
    const baris = refBaris.current
    if (!wadah || !no || !yes || !baris) return

    const layar = wadah.getBoundingClientRect()
    const ukuran = { w: no.offsetWidth, h: no.offsetHeight }

    // Zona Yes dihitung dari ukuran terbesarnya, di tengah baris (posisi akhirnya).
    const kBaris = kotakTataLetak(baris, wadah)
    const wYes = yes.offsetWidth * SKALA_YES_MAKS + 28
    const hYes = yes.offsetHeight * SKALA_YES_MAKS + 22
    const zonaYes: Kotak = {
      x: kBaris.x + kBaris.w / 2 - wYes / 2,
      y: kBaris.y + kBaris.h / 2 - hYes / 2,
      w: wYes,
      h: hYes,
    }

    const rintangan: Rintangan[] = [{ kotak: zonaYes, bobot: Infinity }]
    // Teks lebih dijaga daripada bingkai foto; bagian wajah di foto lebih dijaga daripada tepinya.
    if (refFoto.current) {
      const f = relatifKe(refFoto.current.getBoundingClientRect(), layar)
      rintangan.push({ kotak: f, bobot: 0.3 })
      rintangan.push({ kotak: { x: f.x + f.w * 0.18, y: f.y + f.h * 0.08, w: f.w * 0.64, h: f.h * 0.5 }, bobot: 1.6 })
    }
    if (refJudul.current) for (const k of kotakBarisTeks(refJudul.current, layar)) rintangan.push({ kotak: k, bobot: 3 })
    if (refLabel.current) for (const k of kotakBarisTeks(refLabel.current, layar)) rintangan.push({ kotak: k, bobot: 2.4 })
    if (refSub.current) for (const k of kotakBarisTeks(refSub.current, layar)) rintangan.push({ kotak: k, bobot: 2.4 })
    if (refCandaan.current) rintangan.push({ kotak: kotakTataLetak(refCandaan.current, wadah), bobot: 1.2 })

    const baru = pilihPosisi({
      batas: batasKartu(wadah),
      ukuran,
      asal: refPos.current ?? { x: 0, y: 0 },
      penunjuk: minta.penunjuk,
      rintangan,
      jarakMin: Math.min(130, Math.min(wadah.clientWidth, wadah.clientHeight) * 0.35),
    })
    setPosNo(baru)
  }, [percobaan])

  // Desktop: No kabur saat kursor mendekat.
  useEffect(() => {
    const gerak = (e: globalThis.PointerEvent) => {
      if (e.pointerType !== 'mouse' || sudahYa.current) return
      // Kursor yang sedang di atas Yes tidak dihitung "mendekati No".
      if (refYes.current?.contains(e.target as Node)) return
      const wadah = refWadah.current
      const no = refNo.current
      const pos = refPos.current
      if (!wadah || !no || !pos) return
      const r = wadah.getBoundingClientRect()
      const px = e.clientX - r.left
      const py = e.clientY - r.top
      const dx = Math.max(pos.x - px, 0, px - (pos.x + no.offsetWidth))
      const dy = Math.max(pos.y - py, 0, py - (pos.y + no.offsetHeight))
      if (Math.hypot(dx, dy) < JARAK_DEKAT) mintaKabur({ x: px, y: py })
    }
    window.addEventListener('pointermove', gerak, { passive: true })
    return () => window.removeEventListener('pointermove', gerak)
  }, [mintaKabur])

  // HP: batalkan sentuhan pada No agar tidak sempat menjadi klik (React memasang touchstart secara pasif).
  useEffect(() => {
    const no = refNo.current
    if (!no) return
    const cegah = (e: TouchEvent) => {
      if (e.cancelable) e.preventDefault()
    }
    no.addEventListener('touchstart', cegah, { passive: false })
    return () => no.removeEventListener('touchstart', cegah)
  }, [])

  const tekanNo = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    e.preventDefault()
    waktuTekanNo.current = performance.now()
    const r = refWadah.current?.getBoundingClientRect()
    mintaKabur(r ? { x: e.clientX - r.left, y: e.clientY - r.top } : null)
  }

  const tombolNo = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault()
    mintaKabur(null)
  }

  const klikNo = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    // Sudah ditangani pointerdown/keydown; klik yang tersisa cukup diabaikan.
    if (performance.now() - waktuKabur.current < 600) return
    mintaKabur(null)
  }

  const klikYes = (e: MouseEvent<HTMLButtonElement>) => {
    if (sudahYa.current) return
    // Klik sentuh/mouse harus berawal di Yes, bukan sisa sentuhan pada No yang baru saja kabur.
    if (e.detail !== 0 && waktuTekanYes.current < waktuTekanNo.current) return
    // Ketukan ganda cepat pada No bisa mendarat di Yes yang sedang bergeser: abaikan.
    if (e.detail !== 0 && performance.now() - waktuTekanNo.current < JEDA_KETUK_GANDA) return
    sudahYa.current = true
    setDiterima(true)
    semburDariElemen(refYes.current, 48)
    timer.current = window.setTimeout(lanjut, JEDA_LANJUT)
  }

  const skalaYes = Math.min(1 + percobaan * TAMBAH_SKALA_YES, SKALA_YES_MAKS)
  const candaan = diterima
    ? `Makasih, ${panggilanPenerima}! Aku senang banget 🥰`
    : kabur
      ? CANDAAN[(percobaan - 1) % CANDAAN.length]
      : ''

  return (
    <Kartu>
      {/* Garis emas tipis di dalam kartu */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-[10px] rounded-[22px] border border-emas-muda/70" />

      <div ref={refWadah} className="relative px-6 pt-9 pb-5 text-center [@media(max-height:700px)]:pt-7">
        <motion.div
          ref={refFoto}
          className="mx-auto w-fit"
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: EASE_LEMBUT, delay: 0.1 }}
        >
          <FotoPenerima src={fotoPenerima} nama={panggilanPenerima} inisial={panggilanPenerima.charAt(0)} />
        </motion.div>

        <motion.p
          ref={refLabel}
          {...muncul(1)}
          className="mt-8 text-[12px] font-semibold tracking-[0.24em] text-mawar-500 uppercase [@media(max-height:700px)]:mt-6"
        >
          Untuk {panggilanPenerima}
        </motion.p>

        <motion.h2
          ref={refJudul}
          {...muncul(2)}
          className="mt-1 font-script text-[clamp(38px,11vw,48px)] leading-[1.12] [word-spacing:0.06em] text-mawar-700"
        >
          <span className="block">Would You Like</span>
          <span className="block">To Go Out</span>
          <span className="block">With Me?</span>
        </motion.h2>

        <motion.p ref={refSub} {...muncul(3)} className="mt-2 font-serif text-[20px] leading-snug text-anggur-muda italic">
          Mau jalan bareng aku?
        </motion.p>

        {/* Baris tombol; tingginya dicadangkan untuk Yes yang membesar */}
        <motion.div ref={refBaris} {...muncul(4)} className="mt-5 flex h-[68px] items-center justify-center gap-3">
          <motion.div layout="position" transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="relative z-10">
            <motion.div
              animate={diterima ? { scale: [skalaYes, skalaYes * 1.16, skalaYes * 1.04] } : { scale: skalaYes }}
              transition={
                diterima
                  ? { duration: 0.55, ease: 'easeOut' }
                  : { type: 'spring', stiffness: 320, damping: 16 }
              }
              className="relative"
            >
              {/* Denyut halus di sekitar Yes setelah No beberapa kali kabur */}
              {percobaan >= 2 && !diterima && !kurangiGerak && (
                <motion.span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-mawar-300"
                  initial={{ opacity: 0.7, transform: 'scale(1)' }}
                  animate={{ opacity: 0, transform: 'scale(1.35)' }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
                />
              )}
              <Tombol
                ref={refYes}
                onPointerDown={() => {
                  waktuTekanYes.current = performance.now()
                }}
                onClick={klikYes}
                aria-disabled={diterima || undefined}
                className="min-w-[112px] whitespace-nowrap"
              >
                {diterima ? 'Yay! 💖' : 'Yes'}
              </Tombol>
            </motion.div>
          </motion.div>

          {/* Ruang cadangan untuk No sebelum kabur (lebar = min-w tombol) */}
          {!kabur && <div ref={refRumah} aria-hidden="true" className="h-12 w-[112px] shrink-0" />}
        </motion.div>

        <div ref={refCandaan} className="mt-1 flex h-6 items-center justify-center" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            {candaan && (
              <motion.p
                key={candaan}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3, ease: EASE_LEMBUT }}
                className="text-[14px] font-medium text-anggur-muda"
              >
                {candaan}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Tombol No: selalu absolut di dalam kartu, mulanya tepat di ruang cadangan */}
        <motion.div
          className="absolute top-0 left-0 z-20"
          style={{ visibility: posNo ? 'visible' : 'hidden' }}
          initial={false}
          animate={{
            x: posNo?.x ?? 0,
            y: posNo?.y ?? 0,
            opacity: diterima ? 0 : 1,
            scale: diterima ? 0.8 : 1,
          }}
          transition={{
            x: kabur ? PEGAS_KABUR : { duration: 0 },
            y: kabur ? PEGAS_KABUR : { duration: 0 },
            opacity: { duration: 0.25 },
            scale: { duration: 0.25 },
          }}
        >
          <Tombol
            ref={refNo}
            varian="kedua"
            {...muncul(4)}
            onPointerDown={tekanNo}
            onKeyDown={tombolNo}
            onClick={klikNo}
            tabIndex={diterima ? -1 : 0}
            className={`min-w-[112px] touch-manipulation whitespace-nowrap [-webkit-touch-callout:none] ${
              kabur ? 'bg-white! shadow-[0_10px_24px_-12px_rgb(140_42_69/0.45)]' : ''
            } ${diterima ? 'pointer-events-none' : ''}`}
          >
            {labelNo(percobaan)}
          </Tombol>
        </motion.div>
      </div>
    </Kartu>
  )
}

/** Area yang boleh ditempati tombol No: seluruh kartu dikurangi jarak tepi. */
function batasKartu(wadah: HTMLElement): Kotak {
  return {
    x: TEPI_KARTU,
    y: TEPI_KARTU,
    w: wadah.clientWidth - TEPI_KARTU * 2,
    h: wadah.clientHeight - TEPI_KARTU * 2,
  }
}
