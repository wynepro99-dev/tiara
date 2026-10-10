import { AnimatePresence, motion, type Variants } from 'motion/react'
import { useCallback, useLayoutEffect, useRef, type MouseEvent } from 'react'
import { PERIODE } from '../../data/pilihan'
import { semburDariElemen } from '../../lib/acara'
import { formatJam, formatTanggalPanjang, keKunciTanggal } from '../../lib/tanggal'
import type { PeriodeWaktu, PropsLangkah } from '../../types'
import { Kartu } from '../ui/Kartu'
import { KepalaLangkah } from '../ui/KepalaLangkah'
import { NavigasiLangkah } from '../ui/NavigasiLangkah'
import { gulirBilaPerlu, jamMasihBisa, jamPeriode, periodeHabis, tanggalMasihBisa } from './waktu/aturan'
import { Kalender } from './waktu/Kalender'
import { PilihJam } from './waktu/PilihJam'
import { PilihPeriode } from './waktu/PilihPeriode'
import { useSekarang } from './waktu/useSekarang'

const EASE_LEMBUT = [0.22, 1, 0.36, 1] as const

// Bagian yang muncul/hilang dengan tinggi yang mengembang halus.
const varianBuka: Variants = {
  tutup: { height: 0, opacity: 0, transition: { duration: 0.3, ease: EASE_LEMBUT } },
  buka: { height: 'auto', opacity: 1, transition: { height: { duration: 0.45, ease: EASE_LEMBUT }, opacity: { duration: 0.3, delay: 0.08 } } },
}

const gayaLabel = 'text-[13px] font-semibold tracking-[0.16em] text-anggur-muda uppercase'

export function LangkahWaktu({ jawaban, ubah, lanjut, kembali }: PropsLangkah) {
  const sekarang = useSekarang()
  const kunciHariIni = keKunciTanggal(new Date(sekarang))

  // Jawaban tersimpan bisa sudah basi (dibuka lagi di hari lain): yang tak berlaku dianggap belum dipilih.
  const tanggal = jawaban.tanggal && tanggalMasihBisa(jawaban.tanggal, kunciHariIni) ? jawaban.tanggal : null
  const periode = jawaban.periode && !periodeHabis(tanggal, jawaban.periode) ? jawaban.periode : null
  const jam =
    periode && jawaban.jam && jamPeriode(periode).includes(jawaban.jam) && jamMasihBisa(tanggal, jawaban.jam)
      ? jawaban.jam
      : null
  const lengkap = Boolean(tanggal && periode && jam)

  const dataPeriode = PERIODE.find((p) => p.id === periode)
  const habis = PERIODE.filter((p) => periodeHabis(tanggal, p.id)).map((p) => p.id)

  const petunjuk = !tanggal ? 'Pilih tanggal dulu ya' : !periode ? 'Pagi, siang, sore, atau malam?' : 'Jam berapa enaknya?'

  const bagianJam = useRef<HTMLDivElement>(null)
  const bagianBawah = useRef<HTMLDivElement>(null)

  // Ganti tanggal: periode/jam yang jadi lewat dikosongkan.
  const pilihTanggal = (kunci: string) => {
    const periodeBaru = periode && !periodeHabis(kunci, periode) ? periode : null
    const jamBaru = periodeBaru && jam && jamMasihBisa(kunci, jam) ? jam : null
    ubah({ tanggal: kunci, periode: periodeBaru, jam: jamBaru })
  }

  // Kalender di-memo; fungsi pemilihnya dibuat stabil lewat ref agar tidak ikut render ulang.
  const refPilihTanggal = useRef(pilihTanggal)
  useLayoutEffect(() => {
    refPilihTanggal.current = pilihTanggal
  })
  const onPilihTanggal = useCallback((kunci: string) => refPilihTanggal.current(kunci), [])

  // Ganti periode: jam dikosongkan bila tidak ada di daftar baru.
  const pilihPeriode = (p: PeriodeWaktu) => {
    ubah({ tanggal, periode: p, jam: jam && jamPeriode(p).includes(jam) ? jam : null })
  }

  const pilihJam = (j: string, e: MouseEvent<HTMLButtonElement>) => {
    // Sembur kelopak kecil saat semua pilihan baru saja lengkap.
    if (!lengkap && tanggal && periode) semburDariElemen(e.currentTarget, 16)
    ubah({ tanggal, periode, jam: j })
  }

  return (
    <Kartu className="px-4 pt-7 pb-6 min-[380px]:px-5 min-[420px]:px-6">
      <KepalaLangkah label="Kapan kita ketemu?" judul="Pick a Date" keterangan="Kamu yang pilih, aku yang atur" />

      <div className="mt-5">
        <Kalender
          terpilih={tanggal}
          kunciHariIni={kunciHariIni}
          hariIniMasihBisa={tanggalMasihBisa(kunciHariIni, kunciHariIni)}
          onPilih={onPilihTanggal}
        />
      </div>

      <div className="mt-6">
        <p className={`mb-2.5 px-0.5 ${gayaLabel}`}>Waktunya</p>
        <PilihPeriode terpilih={periode} habis={habis} onPilih={pilihPeriode} />
      </div>

      {/* Jam spesifik muncul setelah periode dipilih */}
      <AnimatePresence initial={false}>
        {dataPeriode && (
          <motion.div
            key="jam"
            variants={varianBuka}
            initial="tutup"
            animate="buka"
            exit="tutup"
            onAnimationComplete={(d) => d === 'buka' && gulirBilaPerlu(bagianJam.current)}
            className="-mx-2 overflow-hidden px-2"
          >
            {/* Bantalan bawah agar cincin & bayangan jam terpilih tidak terpotong */}
            <div ref={bagianJam} className="pt-5 pb-5">
              <div className="mb-2.5 flex items-baseline justify-between gap-3 px-0.5">
                <p className={gayaLabel}>Jamnya</p>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.p
                    key={dataPeriode.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18 }}
                    className="text-[13px] font-medium text-anggur-pudar tabular-nums"
                  >
                    {dataPeriode.rentang}
                  </motion.p>
                </AnimatePresence>
              </div>
              <PilihJam
                key={dataPeriode.id}
                daftar={dataPeriode.jam}
                terpilih={jam}
                lewat={(j) => !jamMasihBisa(tanggal, j)}
                onPilih={pilihJam}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={bagianBawah}>
        {/* Ringkasan kecil saat semua sudah lengkap */}
        <AnimatePresence initial={false}>
          {lengkap && tanggal && jam && (
            <motion.div
              key="ringkasan"
              variants={varianBuka}
              initial="tutup"
              animate="buka"
              exit="tutup"
              onAnimationComplete={(d) => d === 'buka' && gulirBilaPerlu(bagianBawah.current)}
              className="-mx-1 overflow-hidden px-1"
              aria-live="polite"
            >
              <div className="pb-0.5">
                <div className="relative rounded-[20px] bg-gradient-to-br from-mawar-50 via-krem to-persik-100 px-4 py-3.5 text-center ring-1 ring-mawar-100">
                  <p className="text-[12px] font-semibold tracking-[0.18em] text-mawar-500 uppercase">Jadi kita ketemu</p>
                  <p className="mt-1 font-serif text-[21px] leading-tight font-semibold text-balance text-anggur lining-nums">
                    {formatTanggalPanjang(tanggal)}
                    <span className="text-mawar-400"> · </span>
                    <span>{formatJam(jam)}</span>
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <NavigasiLangkah kembali={kembali} lanjut={lanjut} bisaLanjut={lengkap} petunjuk={petunjuk} />
      </div>
    </Kartu>
  )
}
