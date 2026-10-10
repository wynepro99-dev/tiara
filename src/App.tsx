import { AnimatePresence, motion, MotionConfig, type Variants } from 'motion/react'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { KelopakJatuh } from './components/bunga'
import { LangkahAjakan } from './components/langkah/LangkahAjakan'
import { LangkahAktivitas } from './components/langkah/LangkahAktivitas'
import { LangkahDressCode } from './components/langkah/LangkahDressCode'
import { LangkahPembuka } from './components/langkah/LangkahPembuka'
import { LangkahPesan } from './components/langkah/LangkahPesan'
import { LangkahTiket } from './components/langkah/LangkahTiket'
import { LangkahWaktu } from './components/langkah/LangkahWaktu'
import { IndikatorLangkah } from './components/ui/IndikatorLangkah'
import { bacaJawaban, bacaLangkah, hapusSemua, simpanJawaban, simpanLangkah } from './lib/penyimpanan'
import { contohPratinjau } from './lib/pratinjau'
import { JAWABAN_AWAL, type Jawaban, type PropsLangkah, type UbahJawaban } from './types'

// Urutan langkah. Langkah isian (waktu → pesan) diberi indikator progres.
const PEMBUKA = 0
const TIKET = 6
const LANGKAH_ISIAN = [2, 3, 4, 5]

const KOMPONEN_ISIAN: Record<number, (p: PropsLangkah) => ReactNode> = {
  1: LangkahAjakan,
  2: LangkahWaktu,
  3: LangkahAktivitas,
  4: LangkahDressCode,
  5: LangkahPesan,
}

const EASE_LEMBUT = [0.22, 1, 0.36, 1] as const

/** Arah perpindahan halaman; `buka` = dari layar pembuka ke ajakan (transisi khusus). */
interface Transisi {
  arah: number
  buka: boolean
}

const varianHalaman: Variants = {
  masuk: ({ arah, buka }: Transisi) =>
    buka
      ? { opacity: 0, x: 0, y: 30, scale: 0.98, filter: 'blur(10px)' }
      : { opacity: 0, x: arah * 44, y: 8, scale: 0.985, filter: 'blur(10px)' },
  tampil: ({ buka }: Transisi) => ({
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: buka ? 0.95 : 0.75, ease: EASE_LEMBUT },
  }),
  // Pembuka: hati sedikit membesar (diatur di LangkahPembuka) lalu seluruh layar memudar kabur
  // sementara kelopak menyembur.
  keluar: ({ arah, buka }: Transisi) =>
    buka
      ? { opacity: 0, x: 0, y: 0, scale: 1.03, filter: 'blur(12px)', transition: { duration: 0.5, ease: [0.4, 0, 0.6, 1] } }
      : {
          opacity: 0,
          x: arah * -44,
          y: -4,
          scale: 0.985,
          filter: 'blur(10px)',
          transition: { duration: 0.38, ease: [0.4, 0, 1, 1] },
        },
}

function awal(): { langkah: number; jawaban: Jawaban } {
  const pratinjau = contohPratinjau()
  if (pratinjau) return pratinjau
  const tersimpan = bacaJawaban<Partial<Jawaban>>()
  const langkah = bacaLangkah()
  return {
    jawaban: { ...JAWABAN_AWAL, ...tersimpan },
    langkah: typeof langkah === 'number' && langkah >= 0 && langkah <= TIKET ? langkah : PEMBUKA,
  }
}

export default function App() {
  const [{ langkah, jawaban }, setKeadaan] = useState(awal)
  const [transisi, setTransisi] = useState<Transisi>({ arah: 1, buka: false })

  useEffect(() => simpanJawaban(jawaban), [jawaban])
  useEffect(() => simpanLangkah(langkah), [langkah])

  const ubah: UbahJawaban = useCallback(
    (perubahan) => setKeadaan((k) => ({ ...k, jawaban: { ...k.jawaban, ...perubahan } })),
    [],
  )

  const keLangkah = useCallback((tujuan: number) => {
    setKeadaan((k) => {
      setTransisi({ arah: tujuan >= k.langkah ? 1 : -1, buka: k.langkah === PEMBUKA && tujuan === PEMBUKA + 1 })
      return { ...k, langkah: Math.max(PEMBUKA, Math.min(TIKET, tujuan)) }
    })
  }, [])

  const lanjut = useCallback(() => keLangkah(langkah + 1), [keLangkah, langkah])
  const kembali = useCallback(() => keLangkah(langkah - 1), [keLangkah, langkah])

  const ulangi = useCallback(() => {
    hapusSemua()
    setTransisi({ arah: -1, buka: false })
    setKeadaan({ langkah: PEMBUKA, jawaban: JAWABAN_AWAL })
  }, [])

  const Isian = KOMPONEN_ISIAN[langkah]
  const urutanIsian = LANGKAH_ISIAN.indexOf(langkah)

  return (
    <MotionConfig reducedMotion="user">
      {/* Kepadatan berubah bertahap: kelebihan kelopak memudar, kekurangan diisi perlahan. */}
      <KelopakJatuh kepadatan={langkah === PEMBUKA ? 1.2 : 0.7} />

      <AnimatePresence mode="wait" custom={transisi} initial={false} onExitComplete={() => window.scrollTo({ top: 0 })}>
        <motion.div
          key={langkah}
          custom={transisi}
          variants={varianHalaman}
          initial="masuk"
          animate="tampil"
          exit="keluar"
          className="relative"
        >
          {langkah === PEMBUKA ? (
            <LangkahPembuka lanjut={lanjut} />
          ) : (
            <main className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col justify-center gap-4 px-4 pt-[max(24px,env(safe-area-inset-top))] pb-[max(24px,env(safe-area-inset-bottom))]">
              {urutanIsian >= 0 && <IndikatorLangkah ke={urutanIsian + 1} total={LANGKAH_ISIAN.length} />}
              {langkah === TIKET ? (
                <LangkahTiket jawaban={jawaban} kembali={kembali} ulangi={ulangi} />
              ) : (
                Isian && <Isian jawaban={jawaban} ubah={ubah} lanjut={lanjut} kembali={kembali} />
              )}
            </main>
          )}
        </motion.div>
      </AnimatePresence>
    </MotionConfig>
  )
}
