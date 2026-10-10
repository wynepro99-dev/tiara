// Render elemen ke PNG (html2canvas-pro, dimuat saat dibutuhkan) lalu bagikan lewat
// Web Share API, dengan cadangan unduh / pratinjau tekan-lama untuk peramban dalam aplikasi.

export interface OpsiRender {
  /** Ubah salinan DOM sebelum dirender, mis. menuntaskan keadaan animasi. */
  saatKloning?: (dokumen: Document, salinan: HTMLElement) => void
  /** Warna latar kanvas; null = transparan. */
  latar?: string | null
  /** Bawaan: rasio piksel perangkat, dibatasi 2–3. */
  skala?: number
  /** Deskriptor font yang wajib termuat sebelum menggambar, mis. '400 48px "Great Vibes"'. */
  font?: string[]
}

async function tungguFont(daftar: string[] = []) {
  if (!document.fonts) return
  try {
    await Promise.all(daftar.map((f) => document.fonts.load(f)))
    await document.fonts.ready
  } catch {
    /* font gagal dimuat: tetap render dengan font cadangan */
  }
}

function keBlob(kanvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((selesai, gagal) =>
    kanvas.toBlob((b) => (b ? selesai(b) : gagal(new Error('Kanvas tidak menghasilkan gambar'))), 'image/png'),
  )
}

export async function renderKePng(el: HTMLElement, opsi: OpsiRender = {}): Promise<Blob> {
  const [{ default: html2canvas }] = await Promise.all([import('html2canvas-pro'), tungguFont(opsi.font)])
  const skala = opsi.skala ?? Math.min(3, Math.max(2, window.devicePixelRatio || 1))
  const kanvas = await html2canvas(el, {
    scale: skala,
    backgroundColor: opsi.latar ?? null,
    useCORS: true,
    logging: false,
    // Salin hanya jalur menuju elemen target: kanvas kelopak, overlay, dan toast dilewati.
    ignoreElements: (n) => document.body.contains(n) && n !== el && !n.contains(el) && !el.contains(n),
    onclone: (dokumen, salinan) => opsi.saatKloning?.(dokumen, salinan),
  })
  return keBlob(kanvas)
}

export function bisaBagikanBerkas(berkas: File): boolean {
  try {
    return typeof navigator.share === 'function' && Boolean(navigator.canShare?.({ files: [berkas] }))
  } catch {
    return false
  }
}

/** Peramban dalam aplikasi (Instagram, Facebook, TikTok, dll.) biasanya tidak bisa membagikan maupun mengunduh. */
export function diDalamAplikasi(): boolean {
  return /Instagram|FBAN|FBAV|FB_IAB|Line\/|MicroMessenger|musical_ly|TikTok|Snapchat/i.test(navigator.userAgent)
}

export function unduhBerkas(berkas: Blob, namaFile: string) {
  const url = URL.createObjectURL(berkas)
  const a = document.createElement('a')
  a.href = url
  a.download = namaFile
  a.rel = 'noopener'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 30_000)
}

export type HasilBagikan = 'dibagikan' | 'dibatalkan' | 'ketuk-lagi' | 'diunduh' | 'pratinjau'

const namaGalat = (e: unknown) => (e && typeof e === 'object' && 'name' in e ? String(e.name) : '')

/**
 * Bagikan berkas. PENTING untuk iOS Safari: panggil langsung dari handler ketukan
 * tanpa `await` apa pun sebelumnya, agar navigator.share masih dianggap aksi pengguna.
 */
export async function bagikanBerkas(berkas: File, data: { title: string; text: string }): Promise<HasilBagikan> {
  if (bisaBagikanBerkas(berkas)) {
    try {
      await navigator.share({ files: [berkas], ...data })
      return 'dibagikan'
    } catch (e) {
      const nama = namaGalat(e)
      if (nama === 'AbortError') return 'dibatalkan'
      if (nama === 'NotAllowedError') return 'ketuk-lagi'
      // Galat lain (mis. DataError): lanjut ke cadangan di bawah.
    }
  }
  if (diDalamAplikasi()) return 'pratinjau'
  unduhBerkas(berkas, berkas.name)
  return 'diunduh'
}
