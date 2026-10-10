import { AnimatePresence, motion, useAnimationControls } from 'motion/react'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { AKTIVITAS } from '../../../data/pilihan'
import { semburDariElemen } from '../../../lib/acara'
import { Tombol } from '../../ui/Tombol'
import { TinggiHalus } from './TinggiHalus'

export const MAKS_IDE = 5
export const MAKS_KARAKTER_IDE = 40

/** Kunci pembanding: abaikan huruf besar/kecil dan semua spasi. */
const kunci = (teks: string) => teks.toLocaleLowerCase('id').replace(/\s+/g, '')
/** Rapikan spasi berlebih sebelum disimpan. */
const rapikan = (teks: string) => teks.trim().replace(/\s+/g, ' ')

interface Kabar {
  teks: string
  jenis: 'info' | 'galat'
}

interface Props {
  ide: string[]
  aktivitas: string[]
  ubahIde: (ide: string[]) => void
  /** Dipanggil bila ide yang diketik ternyata sudah ada di daftar ubin. */
  pilihAktivitas: (id: string) => void
}

/** Input "Punya ide lain?" + chip ide yang bisa dihapus. */
export function IsianIde({ ide, aktivitas, ubahIde, pilihAktivitas }: Props) {
  const idInput = useId()
  const idKabar = useId()
  const [teks, setTeks] = useState('')
  const [kabar, setKabar] = useState<Kabar | null>(null)
  const getar = useAnimationControls()
  const tombolTambah = useRef<HTMLButtonElement>(null)
  const penuh = ide.length >= MAKS_IDE
  const bersih = rapikan(teks)

  // Kabar singkat hilang sendiri setelah beberapa detik.
  useEffect(() => {
    if (!kabar) return
    const t = window.setTimeout(() => setKabar(null), 2800)
    return () => window.clearTimeout(t)
  }, [kabar])

  const tolak = (pesan: string) => {
    setKabar({ teks: pesan, jenis: 'galat' })
    getar.start({ x: [0, -7, 7, -5, 5, -2, 0], transition: { duration: 0.42, ease: 'easeOut' } })
  }

  const tambah = (e: FormEvent) => {
    e.preventDefault()
    if (!bersih) return
    if (penuh) return tolak(`Maksimal ${MAKS_IDE} ide ya`)

    const k = kunci(bersih)
    if (ide.some((i) => kunci(i) === k)) return tolak('Ide itu sudah ada di daftar 😉')

    // Kalau ternyata sama dengan ubin yang ada, cukup centang ubinnya.
    const ubin = AKTIVITAS.find((a) => kunci(a.label) === k)
    if (ubin) {
      if (!aktivitas.includes(ubin.id)) pilihAktivitas(ubin.id)
      setTeks('')
      setKabar({ teks: `“${ubin.label}” sudah ada, aku centang ya ✓`, jenis: 'info' })
      return
    }

    ubahIde([...ide, bersih.slice(0, MAKS_KARAKTER_IDE)])
    setTeks('')
    setKabar(null)
    semburDariElemen(tombolTambah.current, 14)
  }

  const hapus = (target: string) => ubahIde(ide.filter((i) => i !== target))

  const panjang = teks.length
  const hampirPenuh = panjang >= MAKS_KARAKTER_IDE - 8

  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <label htmlFor={idInput} className="text-[13px] font-semibold tracking-[0.16em] text-anggur-muda uppercase">
          Punya ide lain?
        </label>
        <span className="text-[13px] font-medium text-anggur-pudar tabular-nums" aria-label={`${ide.length} dari ${MAKS_IDE} ide`}>
          {ide.length}/{MAKS_IDE} ide
        </span>
      </div>

      <motion.form animate={getar} onSubmit={tambah} className="mt-2.5 flex items-center gap-2" noValidate>
        <div className="relative min-w-0 flex-1">
          <input
            id={idInput}
            type="text"
            value={teks}
            onChange={(e) => {
              setTeks(e.target.value.slice(0, MAKS_KARAKTER_IDE))
              if (kabar?.jenis === 'galat') setKabar(null)
            }}
            maxLength={MAKS_KARAKTER_IDE}
            disabled={penuh}
            placeholder={penuh ? 'Sudah 5 ide 🎉' : 'Mis. bianglala 🎡'}
            enterKeyHint="enter"
            autoComplete="off"
            autoCapitalize="sentences"
            aria-describedby={idKabar}
            className={`h-12 w-full rounded-full bg-white pl-4 text-[16px] text-anggur ring-1 ring-mawar-200 transition-[box-shadow,background-color] duration-200 outline-none placeholder:text-anggur-pudar focus:ring-2 focus:ring-mawar-400 focus-visible:outline-none disabled:bg-mawar-50/70 disabled:placeholder:text-anggur-muda ${panjang > 0 ? 'pr-12' : 'pr-4'} ${
              kabar?.jenis === 'galat' ? 'ring-mawar-400' : ''
            }`}
          />
          {/* Sisa karakter muncul saat mendekati batas */}
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-[12px] font-semibold tabular-nums transition-opacity duration-200 ${
              panjang > 0 ? 'opacity-100' : 'opacity-0'
            } ${hampirPenuh ? 'text-mawar-600' : 'text-anggur-pudar'}`}
          >
            {MAKS_KARAKTER_IDE - panjang}
          </span>
        </div>
        <Tombol
          ref={tombolTambah}
          type="submit"
          varian="kedua"
          disabled={!bersih || penuh}
          // Jaga fokus di input agar keyboard HP tidak menutup saat menekan Tambah.
          onMouseDown={(e) => e.preventDefault()}
          className="shrink-0 px-5"
        >
          Tambah
        </Tombol>
      </motion.form>

      <div id={idKabar} className="h-6 pt-1.5 pl-4" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          {kabar && (
            <motion.p
              key={kabar.teks}
              initial={{ opacity: 0, y: -3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={{ duration: 0.2 }}
              className={`text-[13px] leading-none font-medium ${kabar.jenis === 'galat' ? 'text-mawar-600' : 'text-anggur-muda'}`}
            >
              {kabar.teks}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <TinggiHalus className="-mx-1 overflow-hidden">
        <ul className="flex flex-wrap gap-2 px-1 pt-1 pb-1" aria-label="Ide tambahan">
          <AnimatePresence mode="popLayout" initial={false}>
            {ide.map((i) => (
              <motion.li
                key={kunci(i)}
                layout
                initial={{ opacity: 0, scale: 0.6, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.18 } }}
                transition={{ type: 'spring', stiffness: 520, damping: 32 }}
                className="flex h-10 max-w-full items-center gap-1 rounded-full bg-gradient-to-b from-white to-mawar-50 pr-1 pl-3 text-[14px] font-medium text-anggur shadow-[0_6px_14px_-10px_color-mix(in_srgb,var(--color-mawar-600)_60%,transparent)] ring-1 ring-mawar-200"
              >
                <span aria-hidden="true" className="text-[13px]">✨</span>
                <span className="min-w-0 truncate">{i}</span>
                <button
                  type="button"
                  onClick={() => hapus(i)}
                  aria-label={`Hapus ide ${i}`}
                  className="relative ml-0.5 grid size-8 shrink-0 place-items-center rounded-full text-anggur-muda transition-colors duration-200 after:absolute after:-inset-1.5 after:content-[''] hover:bg-mawar-100 hover:text-mawar-700"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </TinggiHalus>
    </div>
  )
}
