import { motion, type Variants } from 'motion/react'
import { AKTIVITAS } from '../../data/pilihan'
import type { PropsLangkah } from '../../types'
import { Kartu } from '../ui/Kartu'
import { KartuPilihan } from '../ui/KartuPilihan'
import { KepalaLangkah } from '../ui/KepalaLangkah'
import { NavigasiLangkah } from '../ui/NavigasiLangkah'
import { AngkaBergulir } from './isian/AngkaBergulir'
import { IsianIde } from './isian/IsianIde'

const KOLOM = 3

// Ubin muncul bergelombang diagonal dari kiri atas, setelah kartu mulai tampil.
const varianUbin: Variants = {
  awal: { opacity: 0, y: 14, scale: 0.94 },
  tampil: (urutan: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 280, damping: 26, delay: 0.16 + urutan * 0.045 },
  }),
}

export function LangkahAktivitas({ jawaban, ubah, lanjut, kembali }: PropsLangkah) {
  const { aktivitas, ideAktivitas } = jawaban
  const total = aktivitas.length + ideAktivitas.length

  const alihkan = (id: string) => {
    const baru = aktivitas.includes(id) ? aktivitas.filter((a) => a !== id) : [...aktivitas, id]
    // Simpan sesuai urutan daftar agar tiket rapi.
    ubah({ aktivitas: AKTIVITAS.map((a) => a.id).filter((a) => baru.includes(a)) })
  }

  return (
    <Kartu className="px-4 pt-7 pb-6 min-[380px]:px-5 min-[420px]:px-6">
      <KepalaLangkah label="Mau ngapain aja?" judul="Our Little Plans" keterangan="Boleh pilih lebih dari satu" />

      <div className="mt-6 mb-2.5 flex items-end justify-between gap-3 px-0.5">
        <p className="text-[13px] font-semibold tracking-[0.16em] text-anggur-muda uppercase">Aktivitas</p>
        <p
          className={`inline-flex h-7 items-center gap-1 rounded-full px-3 text-[13px] font-semibold transition-colors duration-300 ${
            total > 0 ? 'bg-mawar-500 text-white' : 'bg-mawar-50 text-anggur-pudar'
          }`}
          aria-live="polite"
        >
          <AngkaBergulir nilai={total} />
          <span>dipilih</span>
        </p>
      </div>

      {/* Grid 3 kolom terlalu sempit untuk keterangan kecil; cukup emoji + label agar ubin seragam. */}
      <div
        role="group"
        aria-label="Pilihan aktivitas"
        className="grid grid-cols-3 gap-2 [&_button]:px-1.5 min-[380px]:[&_button]:px-2 [&_button_span]:text-balance"
      >
        {AKTIVITAS.map((a, i) => (
          <motion.div
            key={a.id}
            className="grid"
            custom={(i % KOLOM) + Math.floor(i / KOLOM)}
            variants={varianUbin}
            initial="awal"
            animate="tampil"
          >
            <KartuPilihan
              emoji={a.emoji}
              label={a.label}
              terpilih={aktivitas.includes(a.id)}
              onPilih={() => alihkan(a.id)}
              jenis="centang"
            />
          </motion.div>
        ))}
      </div>

      <div className="mt-6">
        <IsianIde
          ide={ideAktivitas}
          aktivitas={aktivitas}
          ubahIde={(ide) => ubah({ ideAktivitas: ide })}
          pilihAktivitas={alihkan}
        />
      </div>

      <NavigasiLangkah kembali={kembali} lanjut={lanjut} bisaLanjut={total >= 1} petunjuk="Pilih minimal satu ya" />
    </Kartu>
  )
}
