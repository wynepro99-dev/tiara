import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { bagikanBerkas, renderKePng } from '../../../lib/bagikan'
import { KERTAS, KERTAS_STUB, TAKIK } from './bentuk'
import { ROTASI_STEMPEL } from './Stempel'

export const NAMA_FILE = 'tiket-kencan-tiara.png'

// Ruang di sekeliling tiket pada PNG. Latarnya persik SOLID: html2canvas tidak menggambar
// takik gradien radial dengan benar, jadi di salinan takik diganti lingkaran berwarna latar ini.
const RUANG_X = 26
const RUANG_Y = 30
const LATAR_PNG = '#fde9e2'
const FONT_PNG = [
  '400 54px "Great Vibes"',
  '600 20px "Cormorant Garamond Variable"',
  'italic 500 19px "Cormorant Garamond Variable"',
  '700 13px "Plus Jakarta Sans Variable"',
  '800 19px "Plus Jakarta Sans Variable"',
]

/** Tuntaskan semua keadaan animasi pada salinan DOM agar PNG tidak menangkap bingkai setengah jadi. */
function rapikanSalinan(salinan: HTMLElement, lebarTiket: number) {
  Object.assign(salinan.style, {
    width: `${lebarTiket + RUANG_X * 2}px`,
    maxWidth: 'none',
    padding: `${RUANG_Y}px ${RUANG_X}px`,
    boxSizing: 'border-box',
    background: LATAR_PNG,
  })

  // Takik: latar kertas jadi solid, lalu "lubangi" dengan lingkaran sewarna latar PNG.
  const bentuk = salinan.querySelector<HTMLElement>('[data-bentuk-tiket]')
  const badan = salinan.querySelector<HTMLElement>('[data-badan-tiket]')
  const stub = salinan.querySelector<HTMLElement>('[data-stub-tiket]')
  if (bentuk && badan && stub) {
    badan.style.background = KERTAS
    stub.style.background = KERTAS_STUB
    const y = badan.offsetHeight
    for (const sisi of ['left', 'right'] as const) {
      const lubang = salinan.ownerDocument.createElement('div')
      Object.assign(lubang.style, {
        position: 'absolute',
        top: `${y - TAKIK}px`,
        [sisi]: '0',
        // Setengah lingkaran saja, agar bayangan di luar tepi tiket tetap utuh.
        width: `${TAKIK}px`,
        height: `${TAKIK * 2}px`,
        borderRadius: sisi === 'left' ? `0 ${TAKIK}px ${TAKIK}px 0` : `${TAKIK}px 0 0 ${TAKIK}px`,
        background: LATAR_PNG,
      })
      bentuk.appendChild(lubang)
    }
  }
  salinan.querySelectorAll<HTMLElement>('[data-diam-saat-tangkap]').forEach((n) => {
    n.style.opacity = '1'
    n.style.transform = 'none'
    n.style.rotate = ''
    n.style.scale = ''
    n.style.translate = ''
  })
  const stempel = salinan.querySelector<HTMLElement>('[data-stempel]')
  if (stempel) {
    stempel.style.opacity = '0.92'
    stempel.style.rotate = ''
    stempel.style.scale = ''
    stempel.style.transform = `rotate(${ROTASI_STEMPEL}deg)`
  }
}

export type StatusBagikan = 'diam' | 'menyiapkan' | 'ketuk-lagi'
export interface DataToast {
  id: number
  jenis: 'sukses' | 'galat'
  teks: string
}

interface Opsi {
  wadah: RefObject<HTMLElement | null>
  /** Berubah setiap kali isi tiket berubah; PNG lama dibuang. */
  kunci: string
  /** Mulai pra-render di latar belakang (setelah animasi masuk selesai). */
  praRender: boolean
  judul: string
  teks: string
}

interface Cache {
  kunci: string
  janji: Promise<File>
  berkas?: File
}

export function useBagikanTiket({ wadah, kunci, praRender, judul, teks }: Opsi) {
  const cache = useRef<Cache | null>(null)
  const sibuk = useRef(false)
  const [status, setStatus] = useState<StatusBagikan>('diam')
  const [toast, setToast] = useState<DataToast | null>(null)
  /** URL objek gambar untuk pratinjau tekan-lama (peramban dalam aplikasi). */
  const [pratinjau, setPratinjau] = useState<string | null>(null)

  const tampilkanToast = useCallback((jenis: DataToast['jenis'], isi: string) => {
    setToast({ id: Date.now(), jenis, teks: isi })
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3200)
    return () => clearTimeout(t)
  }, [toast])

  const siapkan = useCallback((): Promise<File> => {
    if (cache.current?.kunci === kunci) return cache.current.janji
    const el = wadah.current
    if (!el) return Promise.reject(new Error('Tiket belum tampil'))
    const lebarTiket = (el.querySelector<HTMLElement>('[data-tiket]') ?? el).offsetWidth
    const entri: Cache = { kunci, janji: Promise.resolve(null as unknown as File) }
    entri.janji = renderKePng(el, {
      latar: LATAR_PNG,
      font: FONT_PNG,
      saatKloning: (_, salinan) => rapikanSalinan(salinan, lebarTiket),
    }).then((blob) => {
      const berkas = new File([blob], NAMA_FILE, { type: 'image/png', lastModified: Date.now() })
      entri.berkas = berkas
      return berkas
    })
    entri.janji.catch(() => {
      if (cache.current === entri) cache.current = null
    })
    cache.current = entri
    return entri.janji
  }, [kunci, wadah])

  // Pra-render diam-diam saat peramban senggang, agar ketukan "Bagikan" bisa langsung
  // memanggil navigator.share (iOS Safari menolak bila ada jeda async yang lama).
  useEffect(() => {
    if (!praRender) return
    let idLuang: number | undefined
    const jalankan = () => void siapkan().catch(() => {})
    const t = window.setTimeout(() => {
      if ('requestIdleCallback' in window) idLuang = window.requestIdleCallback(jalankan, { timeout: 1500 })
      else jalankan()
    }, 250)
    return () => {
      clearTimeout(t)
      if (idLuang !== undefined) window.cancelIdleCallback(idLuang)
    }
  }, [praRender, siapkan])

  const akhiri = useCallback(
    (hasil: Awaited<ReturnType<typeof bagikanBerkas>>, berkas: File) => {
      setStatus(hasil === 'ketuk-lagi' ? 'ketuk-lagi' : 'diam')
      if (hasil === 'dibagikan') tampilkanToast('sukses', 'Yay, tiketnya terbagikan 💌')
      else if (hasil === 'diunduh') tampilkanToast('sukses', 'Tiket tersimpan ke unduhan 💌')
      else if (hasil === 'pratinjau') setPratinjau(URL.createObjectURL(berkas))
    },
    [tampilkanToast],
  )

  const bagikan = useCallback(async () => {
    if (sibuk.current) return
    sibuk.current = true
    const data = { title: judul, text: teks }
    try {
      const siap = cache.current?.kunci === kunci ? cache.current.berkas : undefined
      if (siap) {
        // Jalur cepat: navigator.share dipanggil sinkron di dalam ketukan.
        akhiri(await bagikanBerkas(siap, data), siap)
        return
      }
      setStatus('menyiapkan')
      // Beri satu bingkai agar label "Menyiapkan gambar..." sempat tergambar sebelum render berat.
      await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)))
      let berkas: File
      try {
        berkas = await siapkan()
      } catch {
        setStatus('diam')
        tampilkanToast('galat', 'Gagal menyiapkan gambar, coba lagi ya')
        return
      }
      akhiri(await bagikanBerkas(berkas, data), berkas)
    } catch {
      setStatus('diam')
      tampilkanToast('galat', 'Tiket belum bisa dibagikan, coba lagi ya')
    } finally {
      sibuk.current = false
    }
  }, [akhiri, judul, kunci, siapkan, tampilkanToast, teks])

  const tutupPratinjau = useCallback(() => {
    setPratinjau((url) => {
      if (url) URL.revokeObjectURL(url)
      return null
    })
  }, [])

  return { status, bagikan, toast, pratinjau, tutupPratinjau }
}
