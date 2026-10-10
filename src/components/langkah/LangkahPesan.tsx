import { AnimatePresence, motion, useAnimationControls } from 'motion/react'
import { useId, useLayoutEffect, useRef } from 'react'
import { KONFIGURASI } from '../../config'
import type { PropsLangkah } from '../../types'
import { Kartu } from '../ui/Kartu'
import { KepalaLangkah } from '../ui/KepalaLangkah'
import { NavigasiLangkah } from '../ui/NavigasiLangkah'
import { useCocokMedia } from './isian/useCocokMedia'

const MAKS_KARAKTER = 280
// Tinggi baris & jarak atas kertas, dipakai bersama oleh teks dan garis agar selalu sejajar.
const TINGGI_BARIS = 32
const JARAK_ATAS = 4
const BARIS_MINIMAL = 5
// Posisi garis dalam satu baris (px dari atas), sedikit di bawah garis dasar huruf.
const POSISI_GARIS = 26

// Diurutkan agar yang pendek bisa berbaris berdampingan di layar sempit.
const SARAN = ['Jangan telat ya! 😆', 'Nggak sabar! 🥰', 'Jemput aku ya 🚗', 'Aku yang pilih tempat makannya']

/** Sambungkan saran ke pesan dengan tepat satu spasi pemisah (atau langsung setelah baris baru). */
const sambung = (pesan: string, saran: string) => {
  const dasar = pesan.replace(/[ \t]+$/, '')
  if (!dasar.trim()) return saran
  return dasar.endsWith('\n') ? dasar + saran : `${dasar} ${saran}`
}

export function LangkahPesan({ jawaban, ubah, lanjut, kembali }: PropsLangkah) {
  const { pesan } = jawaban
  const idPesan = useId()
  const idHitung = useId()
  const kertas = useRef<HTMLTextAreaElement>(null)
  const getar = useAnimationControls()
  // Label panjang baru muat di tombol Lanjut pada layar yang cukup lebar.
  const lapang = useCocokMedia('(min-width: 420px)')
  const panjang = pesan.length
  const sisa = MAKS_KARAKTER - panjang

  // Kertas memanjang mengikuti isi, dibulatkan per baris agar garis tetap utuh.
  useLayoutEffect(() => {
    const el = kertas.current
    if (!el) return
    el.style.height = 'auto'
    const baris = Math.max(BARIS_MINIMAL, Math.ceil((el.scrollHeight - JARAK_ATAS * 2) / TINGGI_BARIS))
    el.style.height = `${baris * TINGGI_BARIS + JARAK_ATAS * 2}px`
  }, [pesan])

  const tambahSaran = (saran: string) => {
    const baru = sambung(pesan, saran)
    if (baru.length > MAKS_KARAKTER) {
      getar.start({ x: [0, -6, 6, -4, 4, 0], transition: { duration: 0.36, ease: 'easeOut' } })
      return
    }
    ubah({ pesan: baru })
  }

  const kirim = () => {
    const rapi = pesan.trim()
    if (rapi !== pesan) ubah({ pesan: rapi })
    lanjut()
  }

  return (
    <Kartu className="px-4 pt-7 pb-6 min-[380px]:px-5 min-[420px]:px-6">
      <KepalaLangkah
        label={`Ada pesan buat ${KONFIGURASI.panggilanPengundang}?`}
        judul="Leave a Note"
        keterangan={<span className="block text-balance">Boleh dikosongkan, tapi pasti aku baca berkali-kali</span>}
      />

      <motion.div
        initial={{ opacity: 0, y: 12, rotate: -0.6 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 24, delay: 0.18 }}
        className="mt-6"
      >
        <motion.div
          animate={getar}
          className="relative rounded-[22px] bg-gradient-to-b from-white to-persik-50 px-4 pt-4 pb-3 shadow-[0_1px_0_white_inset,0_14px_30px_-18px_color-mix(in_srgb,var(--color-mawar-700)_45%,transparent)] ring-1 ring-mawar-100 transition-shadow duration-300 focus-within:ring-2 focus-within:ring-mawar-300"
        >
          {/* Garis margin vertikal ala kertas surat */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-y-3 left-9 w-px bg-mawar-200/70" />

          <label htmlFor={idPesan} className="block pl-7 font-script text-[30px] leading-none text-mawar-700">
            Dear {KONFIGURASI.panggilanPengundang},
          </label>

          <textarea
            id={idPesan}
            ref={kertas}
            value={pesan}
            onChange={(e) => ubah({ pesan: e.target.value.slice(0, MAKS_KARAKTER) })}
            maxLength={MAKS_KARAKTER}
            rows={BARIS_MINIMAL}
            placeholder="Tulis apa saja di sini…"
            aria-describedby={idHitung}
            spellCheck={false}
            autoCapitalize="sentences"
            className="mt-1 block w-full resize-none overflow-hidden bg-transparent pr-1 pl-7 font-serif text-[20px] text-anggur italic caret-mawar-500 outline-none placeholder:text-anggur-pudar/80 focus-visible:outline-none"
            style={{
              lineHeight: `${TINGGI_BARIS}px`,
              paddingTop: JARAK_ATAS,
              paddingBottom: JARAK_ATAS,
              // Garis tipis di bawah setiap baris teks; ikut bergulir bersama isi.
              backgroundImage: `repeating-linear-gradient(to bottom, transparent 0 ${POSISI_GARIS - 1}px, var(--color-mawar-100) ${POSISI_GARIS - 1}px ${POSISI_GARIS}px, transparent ${POSISI_GARIS}px ${TINGGI_BARIS}px)`,
              backgroundOrigin: 'content-box',
              backgroundClip: 'content-box',
              backgroundAttachment: 'local',
            }}
          />

          <div className="mt-1.5 flex items-center justify-between gap-3 pl-7">
            <span
              id={idHitung}
              className={`text-[13px] font-medium tabular-nums transition-colors duration-200 ${
                sisa <= 20 ? 'text-mawar-600' : 'text-anggur-pudar'
              }`}
              aria-live={sisa <= 20 ? 'polite' : 'off'}
            >
              {panjang}/{MAKS_KARAKTER}
            </span>
            <span className="font-script text-[26px] leading-none text-mawar-600">— {KONFIGURASI.panggilanPenerima}</span>
          </div>
        </motion.div>
      </motion.div>

      <div className="mt-5 flex items-end justify-between gap-3 px-0.5">
        <p className="text-[13px] font-semibold tracking-[0.16em] text-anggur-muda uppercase">Saran cepat</p>
        <p className="text-[13px] text-anggur-pudar">ketuk untuk menambah</p>
      </div>
      <ul className="mt-2.5 flex flex-wrap gap-1.5" aria-label="Saran pesan cepat">
        {SARAN.map((s, i) => {
          const terpakai = pesan.includes(s)
          const nonaktif = terpakai || sambung(pesan, s).length > MAKS_KARAKTER
          return (
            <motion.li
              key={s}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26, delay: 0.3 + i * 0.06 }}
            >
              <motion.button
                type="button"
                onClick={() => tambahSaran(s)}
                disabled={nonaktif}
                whileTap={nonaktif ? undefined : { scale: 0.95 }}
                aria-label={terpakai ? `${s} (sudah ditambahkan)` : `Tambahkan: ${s}`}
                className={`relative inline-flex min-h-11 items-center rounded-full px-3 text-[14px] font-medium whitespace-nowrap transition-[background-color,color,box-shadow,opacity] duration-200 ${
                  terpakai
                    ? 'bg-mawar-50 text-mawar-700 ring-1 ring-mawar-300'
                    : 'bg-white text-anggur ring-1 ring-mawar-200 hover:bg-mawar-50/60 hover:ring-mawar-300 disabled:opacity-45 disabled:hover:bg-white'
                }`}
              >
                {s}
                {/* Lencana centang: tidak mengubah lebar chip sehingga baris tidak bergeser */}
                <AnimatePresence>
                  {terpakai && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 600, damping: 22 }}
                      className="absolute -top-1 -right-1 grid size-[18px] place-items-center rounded-full bg-mawar-500 text-white ring-2 ring-krem"
                      aria-hidden="true"
                    >
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6.2L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </motion.li>
          )
        })}
      </ul>

      <NavigasiLangkah kembali={kembali} lanjut={kirim} bisaLanjut labelLanjut={lapang ? 'Lihat Tiket 🎟️' : 'Tiket 🎟️'} />
    </Kartu>
  )
}
