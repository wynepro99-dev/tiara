import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { memo, useEffect, useId, useRef, useState } from 'react'

type Status = 'memuat' | 'ada' | 'gagal'

// Bingkai lengkung: sudut atas = setengah lebar agar puncaknya setengah lingkaran.
const TINGGI_MAKS = 222
const TINGGI_MIN = 136
const RASIO = 180 / 222
/** Tinggi layar yang dipakai isi kartu selain foto (teks, tombol, jarak halaman). Foto mengisi sisanya. */
const RUANG_LAIN = 440
const TEPI = 5
const SUDUT_BAWAH = 26

// Titik wajah di foto (persen) dan pembesaran agar wajah terlihat jelas, bukan seluruh badan.
const FOKUS_X = 51
const FOKUS_Y = 28
const PERBESAR = 1.3

const lengkung = (lebar: number, bawah = SUDUT_BAWAH) => `${lebar / 2}px ${lebar / 2}px ${bawah}px ${bawah}px`

const hitungTinggi = () =>
  typeof window === 'undefined'
    ? TINGGI_MAKS
    : Math.round(Math.min(TINGGI_MAKS, Math.max(TINGGI_MIN, window.innerHeight - RUANG_LAIN)))

/**
 * Tinggi bingkai mengikuti tinggi layar agar kartu muat di HP pendek tanpa digulir.
 * Perubahan kecil (bilah alamat browser HP muncul/hilang) diabaikan supaya foto tidak berdenyut.
 */
function useTinggiFoto() {
  const [tinggi, setTinggi] = useState(hitungTinggi)
  useEffect(() => {
    let lebar = window.innerWidth
    let tinggiLayar = window.innerHeight
    const ubah = () => {
      if (window.innerWidth === lebar && Math.abs(window.innerHeight - tinggiLayar) < 120) return
      lebar = window.innerWidth
      tinggiLayar = window.innerHeight
      setTinggi(hitungTinggi())
    }
    window.addEventListener('resize', ubah)
    return () => window.removeEventListener('resize', ubah)
  }, [])
  return tinggi
}

interface Props {
  src: string
  nama: string
  /** Huruf monogram pada bingkai pengganti. */
  inisial: string
}

/**
 * Foto penerima dalam bingkai lengkung yang melayang pelan; bila foto tidak ada, tampil monogram.
 * Dibungkus memo agar tidak ikut dirender ulang setiap kali tombol No kabur.
 */
export const FotoPenerima = memo(function FotoPenerima({ src, nama, inisial }: Props) {
  const [status, setStatus] = useState<Status>('memuat')
  const refImg = useRef<HTMLImageElement>(null)
  const kurangiGerak = useReducedMotion()
  const tinggi = useTinggiFoto()
  const lebar = Math.round(tinggi * RASIO)

  // Gambar dari cache bisa sudah selesai sebelum efek berjalan.
  useEffect(() => {
    const img = refImg.current
    if (img?.complete) setStatus(img.naturalWidth > 0 ? 'ada' : 'gagal')
  }, [])

  return (
    <motion.div
      className="relative mx-auto"
      style={{ width: lebar, height: tinggi }}
      // transform utuh (bukan y) agar dijalankan WAAPI di compositor, tetap halus saat CPU sibuk
      animate={kurangiGerak ? undefined : { transform: ['translateY(0px)', 'translateY(-7px)', 'translateY(0px)'] }}
      transition={{ duration: 5.5, ease: 'easeInOut', repeat: Infinity }}
    >
      {/* Cahaya hangat di belakang bingkai */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-x-12 -inset-y-8 bg-[radial-gradient(closest-side,rgb(244_188_200/0.6),rgb(233_214_179/0.25)_60%,transparent)]"
      />

      {/* Garis emas tipis di luar bingkai */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-[9px] border border-emas/45"
        style={{ borderRadius: lengkung(lebar + 18, SUDUT_BAWAH + 8) }}
      />

      {/* Bingkai putih-emas */}
      <div
        className="relative h-full w-full bg-gradient-to-b from-white via-white to-emas-muda shadow-[0_22px_44px_-20px_rgb(140_42_69/0.5),0_6px_14px_-8px_rgb(140_42_69/0.25)]"
        style={{ borderRadius: lengkung(lebar), padding: TEPI }}
      >
        <div
          className="relative h-full w-full overflow-hidden bg-[linear-gradient(165deg,var(--color-mawar-50)_0%,var(--color-persik-200)_55%,var(--color-mawar-200)_100%)] ring-1 ring-emas/30"
          style={{ borderRadius: lengkung(lebar - TEPI * 2, SUDUT_BAWAH - TEPI) }}
        >
          <AnimatePresence>{status === 'gagal' && <Monogram inisial={inisial} nama={nama} lebar={lebar} />}</AnimatePresence>

          {status !== 'gagal' && (
            <motion.img
              ref={refImg}
              src={src}
              alt={`Foto ${nama}`}
              decoding="async"
              draggable={false}
              onLoad={() => setStatus('ada')}
              onError={() => setStatus('gagal')}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={status === 'ada' ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              // Diperbesar lewat ukuran (bukan transform permanen) dengan wajah sebagai titik tumpu,
              // agar sudut lengkung tetap terpotong rapi di Safari.
              style={{
                left: `${-(PERBESAR - 1) * FOKUS_X}%`,
                top: `${-(PERBESAR - 1) * FOKUS_Y}%`,
                width: `${PERBESAR * 100}%`,
                height: `${PERBESAR * 100}%`,
                objectPosition: `${FOKUS_X}% ${FOKUS_Y}%`,
                transformOrigin: `${FOKUS_X}% ${FOKUS_Y}%`,
              }}
              className="absolute max-w-none object-cover select-none"
            />
          )}

          {/* Kilau kaca tipis di atas foto */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgb(255_255_255/0.28)_0%,transparent_38%,transparent_70%,rgb(107_32_54/0.14)_100%)]"
          />
        </div>
      </div>

      <Kilau className="-top-1 -right-6" ukuran={16} tunda={0} diam={kurangiGerak} />
      <Kilau className="top-[46%] -left-7" ukuran={11} tunda={1.1} diam={kurangiGerak} />
      <Kilau className="-bottom-1 -right-3" ukuran={9} tunda={2.2} diam={kurangiGerak} />
      <Korsase className="absolute -bottom-5 -left-8" />
    </motion.div>
  )
})

function Monogram({ inisial, nama, lebar }: { inisial: string; nama: string; lebar: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0 flex flex-col items-center justify-center"
      role="img"
      aria-label={`Monogram ${nama}`}
    >
      {/* Lengkung dalam tipis */}
      <div
        aria-hidden="true"
        className="absolute inset-[9px] border border-white/80"
        style={{ borderRadius: lengkung(lebar - TEPI * 2 - 18, SUDUT_BAWAH - TEPI - 6) }}
      />
      <span
        aria-hidden="true"
        style={{ fontSize: Math.round(lebar * 0.53) }}
        className="relative -mb-2 -translate-x-2.5 font-script leading-[1.15] text-mawar-600 [text-shadow:0_2px_0_rgb(255_255_255/0.7),0_10px_24px_rgb(173_55_86/0.25)]"
      >
        {inisial}
      </span>
      <svg aria-hidden="true" width="86" height="12" viewBox="0 0 86 12" fill="none" className="relative text-emas">
        <path d="M2 6H33" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <path d="M53 6H84" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <path
          d="M43 10.2C40 8.2 37.2 6.3 37.2 4.1C37.2 2.7 38.3 1.7 39.6 1.7C40.9 1.7 42.1 2.5 43 3.7C43.9 2.5 45.1 1.7 46.4 1.7C47.7 1.7 48.8 2.7 48.8 4.1C48.8 6.3 46 8.2 43 10.2Z"
          fill="var(--color-mawar-500)"
        />
      </svg>
      <span aria-hidden="true" className="relative mt-2 font-serif text-[14px] font-semibold tracking-[0.34em] text-mawar-700 uppercase">
        {nama}
      </span>
    </motion.div>
  )
}

/** Bintang kecil berkilau di sekitar bingkai. */
function Kilau({ className, ukuran, tunda, diam }: { className: string; ukuran: number; tunda: number; diam: boolean | null }) {
  return (
    <motion.svg
      aria-hidden="true"
      width={ukuran}
      height={ukuran}
      viewBox="0 0 16 16"
      className={`pointer-events-none absolute text-emas ${className}`}
      animate={
        diam
          ? { opacity: 0.8 }
          : {
              opacity: [0.25, 1, 0.25],
              transform: ['scale(0.75) rotate(0deg)', 'scale(1) rotate(20deg)', 'scale(0.75) rotate(0deg)'],
            }
      }
      transition={{ duration: 3.2, delay: tunda, repeat: Infinity, ease: 'easeInOut' }}
    >
      <path d="M8 0C8.6 4.6 11.4 7.4 16 8C11.4 8.6 8.6 11.4 8 16C7.4 11.4 4.6 8.6 0 8C4.6 7.4 7.4 4.6 8 0Z" fill="currentColor" />
    </motion.svg>
  )
}

// Palet bunga, selaras dengan lapisan bunga utama: merah, kuning bertepi merah, aprikot, daun hijau alami.
const WARNA = {
  merahTua: '#7a0f1f',
  merah: '#b3122e',
  merahTerang: '#d42a2a',
  kuningMuda: '#fff2a6',
  kuning: '#f7c51e',
  kuningTua: '#f5b301',
  jingga: '#f28c38',
  aprikot: '#f6b183',
  gading: '#fff6da',
  daunMuda: '#8fac5c',
  daun: '#6d8a40',
  daunTua: '#4e6b2e',
}

// Bentuk kelopak (ujung membulat), digambar dari pusat bunga ke atas.
const KELOPAK_MERAH = 'M0 0C-8 -3 -10 -12 -5 -15.4C-2 -17.2 2 -17.2 5 -15.4C10 -12 8 -3 0 0Z'
const KELOPAK_KUNING = 'M0 0C-4 -3 -4.8 -9 -2.3 -11.4C-0.8 -12.6 0.8 -12.6 2.3 -11.4C4.8 -9 4 -3 0 0Z'

/** Hiasan bunga kecil (merah & kuning bertepi merah) di sudut bingkai, seperti korsase. */
function Korsase({ className }: { className: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  const g = (nama: string) => `${id}-${nama}`
  const isi = (nama: string) => `url(#${g(nama)})`

  return (
    <svg
      aria-hidden="true"
      width="88"
      height="66"
      viewBox="0 0 88 66"
      fill="none"
      className={`pointer-events-none drop-shadow-[0_4px_6px_rgb(107_32_54/0.28)] ${className}`}
    >
      <defs>
        <linearGradient id={g('daun')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={WARNA.daunMuda} />
          <stop offset="0.55" stopColor={WARNA.daun} />
          <stop offset="1" stopColor={WARNA.daunTua} />
        </linearGradient>
        {/* Merah: pusat gelap, tepi lebih terang seperti kelopak yang terkena cahaya */}
        <radialGradient id={g('merah')} cx="0" cy="0" r="17" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={WARNA.merahTua} />
          <stop offset="0.4" stopColor={WARNA.merah} />
          <stop offset="0.82" stopColor={WARNA.merahTerang} />
          <stop offset="1" stopColor="#e8604c" />
        </radialGradient>
        {/* Kuning dwiwarna: pangkal kuning muda, ujung jingga lalu merah */}
        <radialGradient id={g('kuning')} cx="0" cy="0" r="12.6" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={WARNA.kuningMuda} />
          <stop offset="0.4" stopColor={WARNA.kuning} />
          <stop offset="0.62" stopColor={WARNA.kuningTua} />
          <stop offset="0.8" stopColor={WARNA.jingga} />
          <stop offset="0.96" stopColor={WARNA.merahTerang} />
        </radialGradient>
        <radialGradient id={g('aprikot')} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#ffe2c2" />
          <stop offset="0.55" stopColor={WARNA.aprikot} />
          <stop offset="1" stopColor={WARNA.jingga} />
        </radialGradient>
      </defs>

      {/* Daun */}
      <path d="M50 27C48.5 17 53.5 8.5 62 4C64.5 13.5 59.5 22 50 27Z" fill={isi('daun')} opacity="0.9" />
      <path d="M34 40C44 28 62 21 80 25C70 37 52 43 34 40Z" fill={isi('daun')} />
      <path d="M36 39.4C50 33 64 28 78 25.6" stroke="#c4d49a" strokeWidth="0.8" strokeLinecap="round" opacity="0.75" />
      <path d="M28 46C25 55 15 62 4 62C8 52 17 46 28 46Z" fill={isi('daun')} />
      <path d="M27 46.6C20 51 12 57 6 61" stroke="#c4d49a" strokeWidth="0.8" strokeLinecap="round" opacity="0.7" />

      {/* Bunga kuning bertepi merah */}
      <g transform="translate(56 20)">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((sudut) => (
          <path key={sudut} d={KELOPAK_KUNING} transform={`rotate(${sudut})`} fill={isi('kuning')} />
        ))}
        {[22.5, 112.5, 202.5, 292.5].map((sudut) => (
          <path key={sudut} d={KELOPAK_KUNING} transform={`rotate(${sudut}) scale(0.62)`} fill={isi('kuning')} opacity="0.95" />
        ))}
        <circle r="2.9" fill="#c98400" />
        {[0, 72, 144, 216, 288].map((sudut) => (
          <circle key={sudut} cx="0" cy="-1.6" r="0.55" transform={`rotate(${sudut})`} fill={WARNA.merahTua} />
        ))}
      </g>

      {/* Kuncup aprikot */}
      <g transform="translate(67 41) rotate(35)">
        <path d="M-3.2 3.6C-4.6 6 -2 7.4 0 6.2C2 7.4 4.6 6 3.2 3.6Z" fill={WARNA.daun} />
        <ellipse rx="4.2" ry="5.6" fill={isi('aprikot')} />
        <path d="M-1.6 -4C0.4 -2 0.6 1.6 -0.6 4.4" stroke={WARNA.jingga} strokeWidth="0.7" strokeLinecap="round" opacity="0.6" />
      </g>

      {/* Bunga merah berlapis */}
      <g transform="translate(27 36)">
        {[0, 72, 144, 216, 288].map((sudut) => (
          <path key={sudut} d={KELOPAK_MERAH} transform={`rotate(${sudut})`} fill={isi('merah')} />
        ))}
        {[36, 108, 180, 252, 324].map((sudut) => (
          <path key={sudut} d={KELOPAK_MERAH} transform={`rotate(${sudut}) scale(0.66)`} fill={isi('merah')} />
        ))}
        {/* Kuncup tengah: tiga kelopak kecil yang saling menutup */}
        {[20, 140, 260].map((sudut) => (
          <path
            key={sudut}
            d={KELOPAK_MERAH}
            transform={`rotate(${sudut}) scale(0.4)`}
            fill={isi('merah')}
            stroke="#e8604c"
            strokeWidth="1.2"
            strokeOpacity="0.55"
          />
        ))}
        <circle r="1.7" fill={WARNA.merahTua} />
      </g>

      {/* Bunga gading kecil pengisi */}
      {[
        [45, 48],
        [49.5, 45],
        [48, 50.5],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="1.7" fill={WARNA.gading} stroke="#e9d6b3" strokeWidth="0.5" />
      ))}
    </svg>
  )
}
