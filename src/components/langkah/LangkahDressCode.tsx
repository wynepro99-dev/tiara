import { AnimatePresence, motion, type Variants } from 'motion/react'
import { useId, useRef, type KeyboardEvent } from 'react'
import { DRESS_CODE, type Pilihan } from '../../data/pilihan'
import type { PropsLangkah } from '../../types'
import { Kartu } from '../ui/Kartu'
import { KartuPilihan } from '../ui/KartuPilihan'
import { KepalaLangkah } from '../ui/KepalaLangkah'
import { NavigasiLangkah } from '../ui/NavigasiLangkah'

const KOLOM = 2
const MAKS_KARAKTER = 40
const LAINNYA: Pilihan = { id: 'lainnya', label: 'Lainnya', emoji: '✨', keterangan: 'Tulis sendiri' }
const SEMUA = [...DRESS_CODE, LAINNYA]

// Ubin muncul bergelombang diagonal, sama seperti langkah aktivitas.
const varianUbin: Variants = {
  awal: { opacity: 0, y: 14, scale: 0.94 },
  tampil: (urutan: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 280, damping: 26, delay: 0.16 + urutan * 0.05 },
  }),
}

export function LangkahDressCode({ jawaban, ubah, lanjut, kembali }: PropsLangkah) {
  const { dressCode, dressCodeLain } = jawaban
  const idInput = useId()
  const grup = useRef<HTMLDivElement>(null)
  // Fokus otomatis hanya saat "Lainnya" baru saja diketuk, bukan saat halaman dibuka ulang.
  const fokuskanIsian = useRef(false)

  const lainnya = dressCode === 'lainnya'
  const bisaLanjut = dressCode !== null && (!lainnya || dressCodeLain.trim().length > 0)
  const panjang = dressCodeLain.length

  const pilih = (id: string) => {
    if (id === 'lainnya' && !lainnya) fokuskanIsian.current = true
    ubah({ dressCode: id })
  }

  // Panah kiri/kanan/atas/bawah berpindah pilihan, seperti radio bawaan.
  const tanganiPanah = (e: KeyboardEvent<HTMLDivElement>) => {
    const langkah = { ArrowRight: 1, ArrowDown: KOLOM, ArrowLeft: -1, ArrowUp: -KOLOM }[e.key]
    if (!langkah || !(e.target instanceof HTMLElement) || e.target.getAttribute('role') !== 'radio') return
    e.preventDefault()
    const sekarang = Math.max(0, SEMUA.findIndex((d) => d.id === dressCode))
    const tujuan = Math.min(SEMUA.length - 1, Math.max(0, sekarang + langkah))
    pilih(SEMUA[tujuan].id)
    grup.current?.querySelectorAll<HTMLElement>('[role="radio"]')[tujuan]?.focus()
  }

  return (
    <Kartu className="px-4 pt-7 pb-6 min-[380px]:px-5 min-[420px]:px-6">
      <KepalaLangkah label="Mau pakai baju apa?" judul="Dress Code" keterangan="Biar kita serasi waktu ketemu" />

      <div
        ref={grup}
        role="radiogroup"
        aria-label="Pilihan dress code"
        onKeyDown={tanganiPanah}
        className="mt-6 grid grid-cols-2 gap-2.5 [&_button_span]:text-balance"
      >
        {SEMUA.map((d, i) => (
          <motion.div
            key={d.id}
            className={`grid ${d.id === 'lainnya' ? 'col-span-2' : ''}`}
            custom={(i % KOLOM) + Math.floor(i / KOLOM)}
            variants={varianUbin}
            initial="awal"
            animate="tampil"
          >
            <KartuPilihan
              emoji={d.emoji}
              label={d.label}
              keterangan={d.keterangan}
              terpilih={dressCode === d.id}
              onPilih={() => pilih(d.id)}
              jenis="radio"
            />
          </motion.div>
        ))}
      </div>

      <AnimatePresence initial={false}>
        {lainnya && (
          <motion.div
            key="isian-lainnya"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ height: { type: 'spring', stiffness: 320, damping: 34 }, opacity: { duration: 0.22 } }}
            className="-mx-1 overflow-hidden px-1"
          >
            <div className="pt-4 pb-1">
              <div className="flex items-end justify-between gap-3 px-0.5">
                <label htmlFor={idInput} className="text-[13px] font-semibold tracking-[0.16em] text-anggur-muda uppercase">
                  Dress code pilihanmu
                </label>
                <span
                  className={`text-[13px] font-medium tabular-nums transition-colors duration-200 ${
                    panjang >= MAKS_KARAKTER - 8 ? 'text-mawar-600' : 'text-anggur-pudar'
                  }`}
                  aria-label={`${panjang} dari ${MAKS_KARAKTER} karakter`}
                >
                  {panjang}/{MAKS_KARAKTER}
                </span>
              </div>
              <input
                id={idInput}
                ref={(el) => {
                  if (el && fokuskanIsian.current) {
                    fokuskanIsian.current = false
                    el.focus({ preventScroll: true })
                  }
                }}
                type="text"
                value={dressCodeLain}
                onChange={(e) => ubah({ dressCodeLain: e.target.value.slice(0, MAKS_KARAKTER) })}
                onBlur={() => {
                  const rapi = dressCodeLain.trim().replace(/\s+/g, ' ')
                  if (rapi !== dressCodeLain) ubah({ dressCodeLain: rapi })
                }}
                onKeyDown={(e) => {
                  // Enter cukup menutup keyboard, tombol Lanjut tetap di bawah.
                  if (e.key === 'Enter') e.currentTarget.blur()
                }}
                maxLength={MAKS_KARAKTER}
                placeholder="Mis. serba putih, batik santai"
                enterKeyHint="done"
                autoComplete="off"
                autoCapitalize="sentences"
                className="mt-2.5 h-12 w-full rounded-full bg-white px-4 text-[16px] text-anggur ring-1 ring-mawar-200 transition-shadow duration-200 outline-none placeholder:text-anggur-pudar focus:ring-2 focus:ring-mawar-400 focus-visible:outline-none"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <NavigasiLangkah
        kembali={kembali}
        lanjut={lanjut}
        bisaLanjut={bisaLanjut}
        petunjuk={lainnya ? 'Tulis dress code-nya dulu ya' : 'Pilih salah satu ya'}
      />
    </Kartu>
  )
}
