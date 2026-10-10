import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import type { AdeganHati } from './hati/adeganHati'
import { RASIO_TINGGI_HATI, type PropsHatiBunga } from './tipe'

// Gambar cadangan (hati yang sudah mekar penuh, latar transparan) bila WebGL tidak tersedia.
const GAMBAR_CADANGAN = '/hati-bunga.png'
const LAMA_MASUK_CADANGAN = 1.6

function gerakDikurangi() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Cek cepat dukungan WebGL agar three.js tidak diunduh percuma di perangkat yang tidak mendukung. */
function adaWebGL() {
  try {
    const uji = document.createElement('canvas')
    const gl = uji.getContext('webgl2') ?? uji.getContext('webgl')
    if (!gl) return false
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch {
    return false
  }
}

/**
 * Rangkaian mawar 3D (WebGL, three.js dimuat dinamis) berbentuk hati.
 * Saat `mekar` true, kelopak tiap mawar membuka bertahap dari ujung bawah hati ke dua lengkung atas.
 */
export function HatiBunga({ mekar = false, ukuran = 320, className = '', onMekarSelesai }: PropsHatiBunga) {
  const wadahRef = useRef<HTMLDivElement>(null)
  const adeganRef = useRef<AdeganHati | null>(null)
  const selesaiRef = useRef(onMekarSelesai)
  const mekarRef = useRef(mekar)
  const ukuranRef = useRef(ukuran)
  const sudahSelesaiRef = useRef(false)
  const [tampil, setTampil] = useState(false)
  const [gagal, setGagal] = useState(() => !adaWebGL())
  const [cadanganSiap, setCadanganSiap] = useState(false)
  // Animasi masuk dipicu lewat state (bukan prop `initial`) agar tetap jalan walau
  // komponen berada di dalam AnimatePresence initial={false}.
  const [dipasang, setDipasang] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setDipasang(true))
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    selesaiRef.current = onMekarSelesai
  }, [onMekarSelesai])

  useEffect(() => {
    const wadah = wadahRef.current
    if (!wadah || gagal) return
    let batal = false

    import('./hati/adeganHati')
      .then(({ buatAdeganHati }) => {
        if (batal) return
        const adegan = buatAdeganHati(wadah, {
          ukuran: ukuranRef.current,
          gerakDikurangi: gerakDikurangi(),
          onSelesai: () => {
            if (sudahSelesaiRef.current) return
            sudahSelesaiRef.current = true
            selesaiRef.current?.()
          },
          onSiap: () => !batal && setTampil(true),
          onGagal: () => !batal && setGagal(true),
        })
        adeganRef.current = adegan
        if (mekarRef.current) adegan.mekar()
      })
      .catch(() => {
        // three.js gagal dimuat atau konteks WebGL tidak bisa dibuat: pakai gambar cadangan.
        if (!batal) setGagal(true)
      })

    // Lepas konteks WebGL & seluruh sumber daya GPU saat dilepas atau beralih ke cadangan.
    return () => {
      batal = true
      adeganRef.current?.hancurkan()
      adeganRef.current = null
    }
  }, [gagal])

  useEffect(() => {
    mekarRef.current = mekar
    if (mekar) adeganRef.current?.mekar()
  }, [mekar])

  useEffect(() => {
    ukuranRef.current = ukuran
    adeganRef.current?.ubahUkuran(ukuran)
  }, [ukuran])

  // Cadangan: kabarkan selesai setelah gambar selesai masuk agar alur tidak macet.
  useEffect(() => {
    if (!gagal || !mekar || !cadanganSiap) return
    const id = window.setTimeout(() => {
      if (sudahSelesaiRef.current) return
      sudahSelesaiRef.current = true
      selesaiRef.current?.()
    }, LAMA_MASUK_CADANGAN * 1000)
    return () => window.clearTimeout(id)
  }, [gagal, mekar, cadanganSiap])

  return (
    <div aria-hidden="true" className={`relative ${className}`} style={{ width: ukuran, height: ukuran * RASIO_TINGGI_HATI }}>
      {/* Cahaya lembut berbentuk hati selama three.js dimuat, agar tidak ada ruang kosong yang janggal. */}
      <AnimatePresence>
        {!tampil && !gagal && (
          <motion.div
            key="cahaya"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: dipasang ? 1 : 0, transition: { duration: 0.6, delay: 0.15 } }}
            exit={{ opacity: 0, transition: { duration: 0.7 } }}
          >
            <motion.svg
              viewBox="0 0 100 92"
              className="h-full w-full"
              animate={{ opacity: [0.55, 1, 0.55], scale: [0.96, 1, 0.96] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
            >
              <defs>
                <radialGradient id="cahaya-hati" cx="50%" cy="48%" r="60%">
                  <stop offset="0%" stopColor="#f8c83c" stopOpacity="0.3" />
                  <stop offset="55%" stopColor="#e9533f" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#d42a2a" stopOpacity="0" />
                </radialGradient>
                <filter id="kabur-hati" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="5" />
                </filter>
              </defs>
              <path
                d="M50 84 C24 64 9 50 9 31 C9 17 19 9 30 9 C40 9 46 15 50 22 C54 15 60 9 70 9 C81 9 91 17 91 31 C91 50 76 64 50 84Z"
                fill="url(#cahaya-hati)"
                filter="url(#kabur-hati)"
              />
            </motion.svg>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        ref={wadahRef}
        className="absolute inset-0 transition-opacity duration-700 ease-lembut"
        style={{ opacity: tampil && !gagal ? 1 : 0 }}
      />

      {gagal && (
        <motion.img
          src={GAMBAR_CADANGAN}
          alt=""
          draggable={false}
          className="absolute inset-0 h-full w-full object-contain select-none"
          onLoad={() => setCadanganSiap(true)}
          onError={() => setCadanganSiap(true)}
          initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
          animate={
            mekar && cadanganSiap
              ? { opacity: 1, scale: 1, filter: 'blur(0px)' }
              : { opacity: 0, scale: 0.9, filter: 'blur(10px)' }
          }
          transition={{ duration: LAMA_MASUK_CADANGAN, ease: [0.22, 1, 0.36, 1] }}
        />
      )}
    </div>
  )
}
