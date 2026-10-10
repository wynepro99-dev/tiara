import { buatKanvas, campur, hex, kanvasButir, rgba, terang, type Kanvas, type Ktx, type Rgb } from './alat'
import type { PaletDaun, PaletMawar } from './palet'

// Kelopak mawar lepas untuk lapisan kelopak jatuh, hati kecil untuk semburan, dan daun kecil.
// Semua digambar sekali ke sprite; di layar hanya diputar/diskalakan (membalik 3D).

export const JUMLAH_BENTUK = 3

const PANGKAL_PUCAT = hex('#fbe3b0')

/** Jalur kelopak dalam satuan: tinggi 1 (y -0.5 ujung atas, 0.5 pangkal). */
function jalurSatuan(ctx: Ktx, bentuk: number) {
  ctx.beginPath()
  ctx.moveTo(0, 0.5)
  if (bentuk === 0) {
    ctx.bezierCurveTo(0.14, 0.42, 0.48, 0.2, 0.47, -0.1)
    ctx.bezierCurveTo(0.46, -0.36, 0.24, -0.5, 0.07, -0.47)
    ctx.quadraticCurveTo(0, -0.43, -0.07, -0.47)
    ctx.bezierCurveTo(-0.24, -0.5, -0.46, -0.36, -0.47, -0.1)
    ctx.bezierCurveTo(-0.48, 0.2, -0.14, 0.42, 0, 0.5)
  } else if (bentuk === 1) {
    ctx.bezierCurveTo(0.12, 0.4, 0.41, 0.16, 0.41, -0.14)
    ctx.bezierCurveTo(0.41, -0.38, 0.22, -0.5, 0.03, -0.48)
    ctx.bezierCurveTo(-0.17, -0.47, -0.38, -0.36, -0.39, -0.12)
    ctx.bezierCurveTo(-0.4, 0.16, -0.12, 0.4, 0, 0.5)
  } else {
    ctx.bezierCurveTo(0.18, 0.4, 0.52, 0.16, 0.5, -0.14)
    ctx.bezierCurveTo(0.48, -0.4, 0.29, -0.5, 0.13, -0.46)
    ctx.bezierCurveTo(0.07, -0.44, 0.03, -0.41, 0, -0.38)
    ctx.bezierCurveTo(-0.03, -0.41, -0.07, -0.44, -0.13, -0.46)
    ctx.bezierCurveTo(-0.29, -0.5, -0.48, -0.4, -0.5, -0.14)
    ctx.bezierCurveTo(-0.52, 0.16, -0.18, 0.4, 0, 0.5)
  }
  ctx.closePath()
}

/** Gambar satu sisi kelopak berpusat di tengah kanvas berukuran `sel`. */
function lukisSisi(ctx: Ktx, sel: number, bentuk: number, p: PaletMawar, sisi: 'depan' | 'belakang') {
  const h = sel * 0.86
  const c = sel / 2
  const belakang = sisi === 'belakang'
  const ubah = (w: typeof p.dasar) => (belakang ? terang(campur(w, p.luar, 0.38), 1.06) : w)

  ctx.save()
  ctx.translate(c, c)
  ctx.scale(h, h)
  jalurSatuan(ctx, bentuk)
  ctx.restore()

  const g = ctx.createRadialGradient(c, c + h * 0.48, 0, c, c + h * 0.3, h * 0.95)
  if (p.bibir) {
    g.addColorStop(0, rgba(ubah(p.dalam)))
    g.addColorStop(0.35, rgba(ubah(p.dasar)))
    g.addColorStop(0.62, rgba(ubah(p.tengah)))
    g.addColorStop(0.82, rgba(ubah(p.tepi)))
    g.addColorStop(1, rgba(ubah(p.bibir)))
  } else {
    g.addColorStop(0, rgba(ubah(campur(p.dalam, PANGKAL_PUCAT, 0.3))))
    g.addColorStop(0.14, rgba(ubah(p.dalam)))
    g.addColorStop(0.45, rgba(ubah(p.dasar)))
    g.addColorStop(0.8, rgba(ubah(p.tengah)))
    g.addColorStop(1, rgba(ubah(p.tepi)))
  }
  ctx.fillStyle = g
  ctx.fill()

  ctx.save()
  ctx.clip()
  // Cekung (sisi depan) atau cembung (sisi belakang): pusat lebih gelap/terang.
  const gc = ctx.createRadialGradient(c, c - h * 0.04, 0, c, c - h * 0.04, h * 0.5)
  if (belakang) {
    gc.addColorStop(0, rgba(p.kilau, 0.16))
    gc.addColorStop(1, rgba(p.kilau, 0))
  } else {
    gc.addColorStop(0, rgba(p.bayang, 0.16))
    gc.addColorStop(1, rgba(p.bayang, 0))
  }
  ctx.fillStyle = gc
  ctx.fillRect(0, 0, sel, sel)
  // Lengkung samping: kiri tersorot, kanan teduh.
  const gs = ctx.createLinearGradient(c - h * 0.5, 0, c + h * 0.5, 0)
  gs.addColorStop(0, rgba(p.kilau, belakang ? 0.1 : 0.2))
  gs.addColorStop(0.45, rgba(p.kilau, 0))
  gs.addColorStop(1, rgba(p.bayang, 0.22))
  ctx.fillStyle = gs
  ctx.fillRect(0, 0, sel, sel)
  // Urat menyebar dari pangkal.
  ctx.strokeStyle = belakang ? rgba(p.kilau, 0.16) : rgba(p.bayang, 0.11)
  ctx.lineWidth = Math.max(0.5, h * 0.008)
  ctx.beginPath()
  for (let v = 0; v < 11; v++) {
    const s = -1 + (2 * v) / 10
    const ex = c + s * h * 0.4
    const ey = c - h * (0.44 - Math.abs(s) * 0.2)
    ctx.moveTo(c, c + h * 0.46)
    ctx.quadraticCurveTo(c + s * h * 0.12, c, ex, ey)
  }
  ctx.stroke()
  // Tepi atas sedikit menggulung: pita terang + garis lipatan.
  ctx.save()
  ctx.translate(c, c)
  ctx.scale(h, h)
  jalurSatuan(ctx, bentuk)
  ctx.restore()
  const gt = ctx.createLinearGradient(0, c - h * 0.5, 0, c + h * 0.1)
  gt.addColorStop(0, rgba(terang(p.luar, 1.08), 0.75))
  gt.addColorStop(0.5, rgba(p.luar, 0.15))
  gt.addColorStop(1, rgba(p.luar, 0))
  ctx.strokeStyle = gt
  ctx.lineWidth = h * 0.07
  ctx.stroke()
  ctx.save()
  ctx.translate(c, c + h * 0.035)
  ctx.scale(h * 0.9, h * 0.9)
  jalurSatuan(ctx, bentuk)
  ctx.restore()
  const gl = ctx.createLinearGradient(0, c - h * 0.5, 0, c)
  gl.addColorStop(0, rgba(p.bayang, 0.24))
  gl.addColorStop(1, rgba(p.bayang, 0))
  ctx.strokeStyle = gl
  ctx.lineWidth = Math.max(0.6, h * 0.012)
  ctx.stroke()
  // Butiran beludru
  const pola = ctx.createPattern(kanvasButir(64, 5 + bentuk, belakang ? 0.6 : 1), 'repeat')
  if (pola) {
    ctx.globalCompositeOperation = 'source-atop'
    ctx.globalAlpha = 0.45
    ctx.fillStyle = pola
    ctx.fillRect(0, 0, sel, sel)
  }
  ctx.restore()
}

export function lukisKelopakLepas(sel: number, bentuk: number, p: PaletMawar, sisi: 'depan' | 'belakang', lunak: boolean): Kanvas {
  const { kanvas, ctx } = buatKanvas(sel, sel)
  if (!lunak) {
    lukisSisi(ctx, sel, bentuk, p, sisi)
    return kanvas
  }
  // Versi lunak (lapisan jauh): kecilkan lalu besarkan lagi agar kabur alami seperti ruang tajam kamera.
  const asli = buatKanvas(sel, sel)
  lukisSisi(asli.ctx, sel, bentuk, p, sisi)
  const kecil = Math.max(8, Math.round(sel / 3.2))
  const mini = buatKanvas(kecil, kecil)
  mini.ctx.imageSmoothingQuality = 'high'
  mini.ctx.drawImage(asli.kanvas, 0, 0, kecil, kecil)
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(mini.kanvas, 0, 0, sel, sel)
  return kanvas
}

/** Topeng sebentuk kelopak: 'bayang' untuk menggelapkan saat miring, 'kilau' untuk kilatan cahaya. */
export function lukisTopengKelopak(sel: number, bentuk: number, mode: 'bayang' | 'kilau'): Kanvas {
  const { kanvas, ctx } = buatKanvas(sel, sel)
  const h = sel * 0.86
  const c = sel / 2
  ctx.save()
  ctx.translate(c, c)
  ctx.scale(h, h)
  jalurSatuan(ctx, bentuk)
  ctx.restore()
  if (mode === 'bayang') {
    ctx.fillStyle = 'rgb(66,16,14)'
    ctx.fill()
  } else {
    const g = ctx.createRadialGradient(c - h * 0.12, c - h * 0.12, 0, c - h * 0.05, c - h * 0.05, h * 0.62)
    g.addColorStop(0, 'rgba(255,250,244,0.95)')
    g.addColorStop(0.5, 'rgba(255,246,236,0.35)')
    g.addColorStop(1, 'rgba(255,246,236,0)')
    ctx.fillStyle = g
    ctx.fill()
  }
  return kanvas
}

/** Hati kecil mengilap untuk semburan. */
export function lukisHatiKecil(sel: number, p: PaletMawar): Kanvas {
  const { kanvas, ctx } = buatKanvas(sel, sel)
  const s = sel * 0.82
  const c = sel / 2
  ctx.save()
  ctx.translate(c, c + s * 0.04)
  ctx.scale(s, s)
  ctx.beginPath()
  ctx.moveTo(0, 0.42)
  ctx.bezierCurveTo(-0.28, 0.22, -0.5, 0.04, -0.5, -0.17)
  ctx.bezierCurveTo(-0.5, -0.36, -0.36, -0.46, -0.24, -0.46)
  ctx.bezierCurveTo(-0.12, -0.46, -0.04, -0.4, 0, -0.3)
  ctx.bezierCurveTo(0.04, -0.4, 0.12, -0.46, 0.24, -0.46)
  ctx.bezierCurveTo(0.36, -0.46, 0.5, -0.36, 0.5, -0.17)
  ctx.bezierCurveTo(0.5, 0.04, 0.28, 0.22, 0, 0.42)
  ctx.closePath()
  ctx.restore()
  const g = ctx.createRadialGradient(c - s * 0.16, c - s * 0.18, 0, c, c, s * 0.62)
  g.addColorStop(0, rgba(terang(p.tepi, 1.15)))
  g.addColorStop(0.45, rgba(p.tengah))
  g.addColorStop(1, rgba(p.dalam))
  ctx.fillStyle = g
  ctx.fill()
  ctx.save()
  ctx.clip()
  ctx.translate(c - s * 0.2, c - s * 0.2)
  ctx.rotate(-0.6)
  ctx.scale(1, 0.55)
  const gk = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 0.18)
  gk.addColorStop(0, 'rgba(255,255,255,0.75)')
  gk.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gk
  ctx.fillRect(-s * 0.2, -s * 0.2, s * 0.4, s * 0.4)
  ctx.restore()
  return kanvas
}

/** Daun mawar kecil (lonjong bergerigi halus, tulang daun di tengah). Sisi belakang lebih pucat. */
export function lukisDaunKecil(sel: number, p: PaletDaun, varian: number, sisi: 'depan' | 'belakang'): Kanvas {
  const { kanvas, ctx } = buatKanvas(sel, sel)
  const h = sel * 0.84
  const c = sel / 2
  const belakang = sisi === 'belakang'
  const lebar = varian % 2 === 0 ? 0.3 : 0.25
  const warna = (w: Rgb) => (belakang ? terang(campur(w, p.tulang, 0.3), 1.08) : w)

  // Garis daun dalam satuan (ujung y = -0.5, pangkal y = 0.5), tepi bergerigi kecil.
  ctx.save()
  ctx.translate(c, c)
  ctx.scale(h, h)
  ctx.beginPath()
  const titik = 28
  for (let sisiX = 1; sisiX >= -1; sisiX -= 2) {
    for (let i = 0; i <= titik; i++) {
      const t = sisiX > 0 ? i / titik : 1 - i / titik
      const y = 0.5 - t
      const profil = Math.pow(Math.sin(Math.PI * Math.pow(t, 0.8)), 0.9)
      const gerigi = i % 2 === 0 ? 1 : 0.9
      const x = sisiX * lebar * profil * (t > 0.12 && t < 0.94 ? gerigi : 1)
      if (sisiX > 0 && i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
  }
  ctx.closePath()
  ctx.restore()

  const g = ctx.createLinearGradient(c - h * lebar, c, c + h * lebar, c)
  g.addColorStop(0, rgba(warna(p.terang)))
  g.addColorStop(0.5, rgba(warna(p.dasar)))
  g.addColorStop(1, rgba(warna(p.gelap)))
  ctx.fillStyle = g
  ctx.fill()

  ctx.save()
  ctx.clip()
  // Tulang daun utama & cabang.
  ctx.strokeStyle = rgba(p.tulang, belakang ? 0.75 : 0.55)
  ctx.lineWidth = Math.max(0.7, h * 0.014)
  ctx.beginPath()
  ctx.moveTo(c, c + h * 0.5)
  ctx.lineTo(c, c - h * 0.46)
  ctx.stroke()
  ctx.lineWidth = Math.max(0.5, h * 0.007)
  ctx.beginPath()
  for (let i = 1; i <= 5; i++) {
    const y = c + h * (0.36 - i * 0.14)
    for (const s of [-1, 1]) {
      ctx.moveTo(c, y + h * 0.04)
      ctx.quadraticCurveTo(c + s * h * lebar * 0.4, y, c + s * h * lebar * 0.85, y - h * 0.05)
    }
  }
  ctx.stroke()
  // Kilap lembut sisi depan.
  if (!belakang) {
    const gk = ctx.createRadialGradient(c - h * 0.08, c - h * 0.1, 0, c - h * 0.08, c - h * 0.1, h * 0.4)
    gk.addColorStop(0, 'rgba(255,255,240,0.22)')
    gk.addColorStop(1, 'rgba(255,255,240,0)')
    ctx.fillStyle = gk
    ctx.fillRect(0, 0, sel, sel)
  }
  ctx.restore()
  return kanvas
}
