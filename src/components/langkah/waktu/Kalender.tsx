import { AnimatePresence, motion, type PanInfo, type Variants } from 'motion/react'
import { memo, useState } from 'react'
import { dariKunciTanggal, formatTanggalPanjang, HARI_SINGKAT_SENIN, NAMA_BULAN } from '../../../lib/tanggal'
import { BATAS_BULAN, bulanDariIndeks, indeksBulan, selBulan, tahunDariIndeks, tanggalMasihBisa } from './aturan'

interface Props {
  /** Tanggal terpilih yang masih berlaku ('YYYY-MM-DD'), atau null. */
  terpilih: string | null
  kunciHariIni: string
  /** false bila semua jam hari ini sudah lewat. */
  hariIniMasihBisa: boolean
  onPilih: (kunci: string) => void
}

const EASE_LEMBUT = [0.22, 1, 0.36, 1] as const

// Pergantian bulan: grid lama keluar ke satu sisi, grid baru masuk dari sisi lain.
const varianGrid: Variants = {
  masuk: (arah: number) => ({ x: `${arah * 32}%`, opacity: 0 }),
  tampil: { x: '0%', opacity: 1, transition: { duration: 0.46, ease: EASE_LEMBUT } },
  keluar: (arah: number) => ({ x: `${arah * -32}%`, opacity: 0, transition: { duration: 0.28, ease: [0.4, 0, 1, 1] } }),
}

const varianJudul: Variants = {
  masuk: (arah: number) => ({ x: arah * 18, opacity: 0 }),
  tampil: { x: 0, opacity: 1, transition: { duration: 0.42, ease: EASE_LEMBUT } },
  keluar: (arah: number) => ({ x: arah * -18, opacity: 0, transition: { duration: 0.2 } }),
}

const batasi = (n: number, min: number, maks: number) => Math.min(maks, Math.max(min, n))

/** Kalender bulanan berbahasa Indonesia, minggu dimulai Senin. */
export const Kalender = memo(function Kalender({ terpilih, kunciHariIni, hariIniMasihBisa, onPilih }: Props) {
  const bulanIni = indeksBulan(dariKunciTanggal(kunciHariIni))
  const bulanAkhir = bulanIni + BATAS_BULAN
  const [lihat, setLihat] = useState(() => (terpilih ? indeksBulan(dariKunciTanggal(terpilih)) : bulanIni))
  const [arah, setArah] = useState(1)

  // Tetap di dalam rentang walau hari berganti saat halaman terbuka.
  const tampil = batasi(lihat, bulanIni, bulanAkhir)
  const bisaMundur = tampil > bulanIni
  const bisaMaju = tampil < bulanAkhir

  const geser = (delta: number) => {
    const tujuan = batasi(tampil + delta, bulanIni, bulanAkhir)
    if (tujuan === tampil) return
    setArah(delta > 0 ? 1 : -1)
    setLihat(tujuan)
  }

  // Usap kiri/kanan di HP untuk ganti bulan.
  const selesaiUsap = (_: PointerEvent, info: PanInfo) => {
    const { x, y } = info.offset
    if (Math.abs(x) < 48 || Math.abs(x) < Math.abs(y) * 1.4) return
    geser(x < 0 ? 1 : -1)
  }

  const namaBulan = NAMA_BULAN[bulanDariIndeks(tampil)]
  const tahun = tahunDariIndeks(tampil)
  const sel = selBulan(tampil)

  return (
    <div className="overflow-hidden rounded-[24px] bg-white/85 px-1.5 pt-2 pb-2.5 ring-1 ring-mawar-100 min-[380px]:px-2.5">
      {/* Kepala: nama bulan + tombol sebelum/berikut */}
      <div className="flex items-center gap-2 pr-0.5 pl-2.5">
        <div className="relative h-11 flex-1 overflow-hidden" aria-live="polite">
          <AnimatePresence initial={false} custom={arah}>
            <motion.p
              key={tampil}
              custom={arah}
              variants={varianJudul}
              initial="masuk"
              animate="tampil"
              exit="keluar"
              className="absolute inset-0 flex items-center gap-2 font-serif text-[25px] leading-none font-semibold text-anggur"
            >
              {namaBulan}
              <span className="font-medium text-anggur-pudar">{tahun}</span>
            </motion.p>
          </AnimatePresence>
        </div>
        <TombolBulan arah={-1} aktif={bisaMundur} onKlik={() => geser(-1)} />
        <TombolBulan arah={1} aktif={bisaMaju} onKlik={() => geser(1)} />
      </div>

      {/* Nama hari */}
      <div className="mt-1 grid grid-cols-7" aria-hidden="true">
        {HARI_SINGKAT_SENIN.map((h, i) => (
          <span
            key={h}
            className={`grid h-8 place-items-center text-[12px] font-semibold tracking-[0.06em] uppercase ${
              i >= 5 ? 'text-mawar-400' : 'text-anggur-pudar'
            }`}
          >
            {h}
          </span>
        ))}
      </div>

      {/* Grid tanggal: tinggi ikut jumlah minggu (5/6 baris × 40px + jarak 4px), berubah halus */}
      <motion.div
        className="relative touch-pan-y"
        initial={false}
        animate={{ height: (sel.length / 7) * 44 - 4 }}
        transition={{ duration: 0.42, ease: EASE_LEMBUT }}
        onPanEnd={selesaiUsap}
      >
        <AnimatePresence initial={false} custom={arah}>
          <motion.div
            key={tampil}
            custom={arah}
            variants={varianGrid}
            initial="masuk"
            animate="tampil"
            exit="keluar"
            className="absolute inset-x-0 top-0 grid grid-cols-7 gap-y-1"
          >
            {sel.map((kunci, i) =>
              kunci ? (
                <SelHari
                  key={kunci}
                  kunci={kunci}
                  dipilih={kunci === terpilih}
                  hariIni={kunci === kunciHariIni}
                  bisa={kunci === kunciHariIni ? hariIniMasihBisa : tanggalMasihBisa(kunci, kunciHariIni)}
                  onPilih={onPilih}
                />
              ) : (
                <span key={`kosong-${i}`} className="h-10" />
              ),
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  )
})

function TombolBulan({ arah, aktif, onKlik }: { arah: 1 | -1; aktif: boolean; onKlik: () => void }) {
  return (
    <button
      type="button"
      onClick={onKlik}
      disabled={!aktif}
      aria-label={arah < 0 ? 'Bulan sebelumnya' : 'Bulan berikutnya'}
      className="grid size-11 place-items-center rounded-full text-mawar-600 transition-[background-color,color,opacity] duration-200 hover:bg-mawar-50 active:bg-mawar-100 disabled:text-anggur-pudar disabled:opacity-35 disabled:hover:bg-transparent"
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path
          d={arah < 0 ? 'M12.5 15L7.5 10L12.5 5' : 'M7.5 5L12.5 10L7.5 15'}
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}

interface PropsSel {
  kunci: string
  dipilih: boolean
  hariIni: boolean
  bisa: boolean
  onPilih: (kunci: string) => void
}

function SelHari({ kunci, dipilih, hariIni, bisa, onPilih }: PropsSel) {
  const tanggal = Number(kunci.slice(8))
  return (
    <button
      type="button"
      disabled={!bisa}
      onClick={() => onPilih(kunci)}
      aria-pressed={dipilih}
      aria-label={`${formatTanggalPanjang(kunci)}${hariIni ? ', hari ini' : ''}`}
      className="group relative grid h-10 place-items-center rounded-full outline-offset-0 disabled:cursor-default"
    >
      {/* Latar saat disentuh / disorot */}
      {bisa && !dipilih && (
        <span className="absolute size-10 rounded-full bg-mawar-50 opacity-0 transition-[opacity,transform] duration-200 group-hover:opacity-100 group-active:scale-90 group-active:bg-mawar-100 group-active:opacity-100" />
      )}

      {/* Lingkaran terpilih: bergeser halus antar tanggal */}
      {dipilih && (
        <motion.span
          layoutId="penanda-tanggal"
          transition={{ type: 'spring', stiffness: 460, damping: 36 }}
          className="absolute size-10 rounded-full bg-gradient-to-b from-mawar-400 to-mawar-600 shadow-[0_6px_14px_-6px_rgb(173_55_86/0.7)]"
        />
      )}

      <span
        className={`relative text-[15px] tabular-nums transition-colors duration-200 ${
          dipilih
            ? 'font-semibold text-white'
            : !bisa
              ? 'text-anggur-pudar/45'
              : hariIni
                ? 'font-bold text-mawar-600'
                : 'font-medium text-anggur'
        }`}
      >
        {tanggal}
      </span>

      {hariIni && (
        <span
          className={`absolute bottom-[5px] size-1 rounded-full transition-colors duration-200 ${
            dipilih ? 'bg-white' : bisa ? 'bg-mawar-500' : 'bg-anggur-pudar/50'
          }`}
        />
      )}
    </button>
  )
}
