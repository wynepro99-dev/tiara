import { motion, useAnimationControls } from 'motion/react'
import type { ReactNode } from 'react'
import { KONFIGURASI } from '../../../config'
import type { Ringkasan } from '../../../lib/ringkasan'
import { KERTAS, KERTAS_STUB, latarTakik } from './bentuk'
import { BungaKecil, Guilloche } from './Hiasan'
import { KodeBatang } from './KodeBatang'
import { Stempel } from './Stempel'

// Bentuk tiket: badan + sobekan (stub), dipisah garis perforasi bertakik (lihat bentuk.ts).
// Elemen bertanda data-* dipakai saat merapikan salinan DOM untuk PNG (useBagikanTiket).

const JEDA_STEMPEL = 1.05

const EASE_LEMBUT = [0.22, 1, 0.36, 1] as const

function Baris({ label, urutan, children, className = '' }: { label: string; urutan: number; children: ReactNode; className?: string }) {
  return (
    <motion.div
      data-diam-saat-tangkap=""
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.32 + urutan * 0.08, duration: 0.55, ease: EASE_LEMBUT }}
      className={`min-w-0 ${className}`}
    >
      <p className="text-[11px] leading-none font-bold tracking-[0.24em] text-anggur-muda uppercase">{label}</p>
      <div className="mt-1.5">{children}</div>
    </motion.div>
  )
}

const Kosong = () => <span className="font-sans text-[18px] leading-tight font-semibold text-anggur-muda">-</span>

interface Props {
  r: Ringkasan
  /** Teks tanggal ringkas untuk stempel, contoh "17 · 10 · 2026". */
  tanggalStempel: string
  /** Dipanggil saat stempel menghantam tiket (puncak animasi masuk). */
  saatStempel?: () => void
  /** Tampilkan kilau yang menyapu tiket setelah stempel. */
  kilau?: boolean
}

export function KartuTiket({ r, tanggalStempel, saatStempel, kilau = true }: Props) {
  const tumbuk = useAnimationControls()
  const waktu = [r.periode, r.jam].filter((t) => t !== '-').join(' · ') || '-'
  const dressPanjang = (r.dressCode?.label.length ?? 0) > 16

  const mendarat = () => {
    tumbuk.start({ y: [0, 2.5, 0], scale: [1, 0.993, 1], transition: { duration: 0.34, ease: 'easeOut' } })
    saatStempel?.()
  }

  return (
    <motion.div
      data-tiket=""
      data-diam-saat-tangkap=""
      initial={{ opacity: 0, y: 64, scale: 0.96, rotateX: 14 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
      transition={{
        type: 'spring',
        stiffness: 120,
        damping: 19,
        mass: 0.9,
        opacity: { duration: 0.5, ease: 'easeOut' },
      }}
      style={{ transformPerspective: 1000 }}
    >
      <motion.div data-diam-saat-tangkap="" animate={tumbuk}>
        <div data-bentuk-tiket="" className="relative rounded-[26px] shadow-[0_2px_4px_rgb(140_42_69/0.05),0_22px_44px_-22px_rgb(140_42_69/0.42)]">
          {/* ===== Badan tiket ===== */}
          <div
            data-badan-tiket=""
            className="relative rounded-t-[26px] px-[22px] pt-[22px] pb-6 min-[380px]:px-6"
            style={{ background: latarTakik(KERTAS, '100%') }}
          >
            {/* Kilau kertas & ornamen pengaman di bagian atas */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-36 rounded-t-[26px]"
              style={{ background: 'linear-gradient(180deg, rgb(255 255 255 / 0.95), rgb(255 255 255 / 0))' }}
            />
            <Guilloche className="pointer-events-none absolute top-[50px] left-[10px] h-[76px] w-[calc(100%-20px)]" />
            {/* Bingkai emas tipis; berhenti di atas takik */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-[9px] top-[9px] bottom-[20px] rounded-[18px] border border-emas-muda" />

            {kilau && (
              <div data-html2canvas-ignore="" aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 bottom-[18px] overflow-hidden rounded-t-[26px]">
                <motion.div
                  className="absolute inset-0"
                  initial={{ x: '-100%' }}
                  animate={{ x: '110%' }}
                  transition={{ delay: JEDA_STEMPEL + 0.35, duration: 1.3, ease: [0.45, 0, 0.2, 1] }}
                >
                  <div className="absolute inset-y-[-30%] left-0 w-24 rotate-[18deg] bg-gradient-to-r from-transparent via-white/70 to-transparent" />
                </motion.div>
              </div>
            )}

            <header className="relative text-center">
              <div className="flex items-center justify-center gap-2.5">
                <span className="h-px w-8 bg-emas" />
                <p className="text-[12px] leading-none font-extrabold tracking-[0.36em] text-mawar-600">ADMIT TWO</p>
                <span className="h-px w-8 bg-emas" />
              </div>
              <h3 className="mt-2.5 font-script text-[54px] leading-[1.1] text-mawar-700">Date Ticket</h3>
              <p className="mt-0.5 font-serif text-[19px] leading-snug font-semibold text-balance text-anggur">
                {KONFIGURASI.namaPengundang} <span className="mx-0.5 font-script text-[24px] font-normal text-mawar-500">&amp;</span>{' '}
                {KONFIGURASI.namaPenerima}
              </p>
              <div className="mt-3 flex items-center justify-center gap-2" aria-hidden="true">
                <span className="h-px flex-1" style={{ background: 'linear-gradient(90deg, rgb(233 214 179 / 0), #e9d6b3)' }} />
                <BungaKecil ukuran={18} />
                <span className="h-px flex-1" style={{ background: 'linear-gradient(270deg, rgb(233 214 179 / 0), #e9d6b3)' }} />
              </div>
            </header>

            <div className="relative mt-4 grid gap-y-4">
              <Baris label="Tanggal" urutan={0}>
                {r.tanggal === '-' ? <Kosong /> : <p className="font-serif text-[22px] leading-tight font-semibold text-anggur">{r.tanggal}</p>}
              </Baris>

              <div className={`grid gap-4 border-t border-dashed border-emas-muda pt-4 ${dressPanjang ? 'grid-cols-1' : 'grid-cols-2'}`}>
                <Baris label="Waktu" urutan={1}>
                  {waktu === '-' ? <Kosong /> : <p className="font-serif text-[20px] leading-tight font-semibold text-anggur">{waktu}</p>}
                </Baris>
                <Baris label="Dress code" urutan={2}>
                  {r.dressCode ? (
                    <p className="font-serif text-[20px] leading-tight font-semibold [overflow-wrap:anywhere] text-anggur">
                      <span className="mr-1.5 font-sans text-[17px]">{r.dressCode.emoji}</span>
                      {r.dressCode.label}
                    </p>
                  ) : (
                    <Kosong />
                  )}
                </Baris>
              </div>

              <Baris label="Aktivitas" urutan={3} className="border-t border-dashed border-emas-muda pt-4">
                {r.aktivitas.length ? (
                  <ul className="flex flex-wrap gap-x-4 gap-y-1">
                    {r.aktivitas.map((a, i) => (
                      <li key={`${a.label}-${i}`} className="flex max-w-full min-w-0 items-baseline gap-1.5 font-serif text-[19px] leading-snug font-semibold text-anggur">
                        <span className="shrink-0 font-sans text-[16px]">{a.emoji}</span>
                        <span className="min-w-0 [overflow-wrap:anywhere]">{a.label}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Kosong />
                )}
              </Baris>

              {r.pesan && (
                <Baris label="Pesan" urutan={4} className="border-t border-dashed border-emas-muda pt-4">
                  <blockquote className="relative pl-6">
                    <span aria-hidden="true" className="absolute top-[-6px] left-0 font-serif text-[44px] leading-none text-mawar-300">
                      &ldquo;
                    </span>
                    <p className="font-serif text-[19px] leading-[1.45] font-medium whitespace-pre-line italic [overflow-wrap:anywhere] text-anggur">
                      {r.pesan}
                    </p>
                    <footer className="mt-1 text-right font-script text-[24px] leading-tight text-mawar-600">
                      — {KONFIGURASI.panggilanPenerima}
                    </footer>
                  </blockquote>
                </Baris>
              )}
            </div>
          </div>

          {/* ===== Sobekan (stub) ===== */}
          <div
            data-stub-tiket=""
            className="relative rounded-b-[26px] px-[22px] pt-5 pb-[18px] min-[380px]:px-6"
            style={{ background: latarTakik(KERTAS_STUB, '0') }}
          >
            {/* Garis perforasi di antara dua takik */}
            <div aria-hidden="true" className="absolute top-[-1px] right-[22px] left-[22px] border-t-2 border-dashed border-emas-muda" />

            <div className="flex items-end">
              <div className="min-w-0">
                <KodeBatang nomor={r.nomorTiket} className="block h-[42px] w-[140px] min-[380px]:w-[156px]" />
                <p className="mt-1.5 text-[13px] leading-none font-bold tracking-[0.2em] text-anggur tabular-nums">{r.nomorTiket}</p>
              </div>
            </div>

            <Stempel
              atas={KONFIGURASI.namaPenerima}
              bawah={tanggalStempel}
              jeda={JEDA_STEMPEL}
              saatMendarat={mendarat}
              className="absolute top-[-12px] right-[14px] min-[380px]:right-[20px]"
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
