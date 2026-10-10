import { ACARA_SEMBUR } from '../../../lib/acara'
import type { DetailSemburBunga } from '../tipe'
import { buatAcak, halus, jepit, lerp, TAU } from './alat'
import { JUMLAH_BENTUK } from './lukisKelopak'
import { mintaSprite, type Sprite } from './pabrikSprite'
import { BOBOT_KELOPAK, DAUN, WARNA_HATI, WARNA_KELOPAK } from './palet'
import type { Tugas } from './tugas'

// Mesin kelopak berguguran: partikel didaur ulang, satu loop rAF, membalik 3D lewat
// transformasi afin (rotasi · skala sumbu · rotasi) dengan sprite sisi depan/belakang.
// Sesekali ikut gugur daun mawar kecil; semburan (ACARA_SEMBUR) menambah kelopak & hati kecil.

export interface MesinKelopak {
  aturKepadatan: (k: number) => void
  hentikan: () => void
}

interface Partikel {
  aktif: boolean
  semburan: boolean
  hati: boolean
  daun: boolean
  pensiun: boolean
  x: number
  y: number
  vx: number
  vy: number
  z: number
  ukuran: number
  bentuk: number
  warna: number
  lunak: boolean
  sudut: number
  putar: number
  balik: number
  kecBalik: number
  sumbu: number
  fase: number
  frek: number
  ayun: number
  jatuh: number
  pudar: number
  umur: number
  umurMaks: number
  /** Umur (detik) saat kelopak semburan pindah ke lapisan belakang. */
  depanSampai: number
}

const MAKS_LATAR = 48
const MAKS_SEMBUR = 220
/** Peluang partikel latar berupa daun kecil. */
const PELUANG_DAUN = 0.07
/** Peluang kelopak semburan berupa hati kecil. */
const PELUANG_HATI = 0.16

function partikelKosong(): Partikel {
  return {
    aktif: false, semburan: false, hati: false, daun: false, pensiun: false,
    x: 0, y: 0, vx: 0, vy: 0, z: 0, ukuran: 0, bentuk: 0, warna: 0, lunak: false,
    sudut: 0, putar: 0, balik: 0, kecBalik: 0, sumbu: 0, fase: 0, frek: 0, ayun: 0, jatuh: 0,
    pudar: 0, umur: 0, umurMaks: 0, depanSampai: Infinity,
  }
}

/**
 * @param kanvas       lapisan latar (di belakang konten) untuk kelopak berguguran
 * @param kanvasSembur lapisan depan (di atas konten) khusus semburan, agar tidak tertutup kartu
 */
export function buatMesinKelopak(kanvas: HTMLCanvasElement, kanvasSembur: HTMLCanvasElement, kepadatanAwal: number): MesinKelopak {
  const ctxLatar = kanvas.getContext('2d')!
  const ctxSembur = kanvasSembur.getContext('2d')!
  let ctx = ctxLatar
  let semburTergambar = false
  const acak = buatAcak((Date.now() & 0xffff) + 7)
  const media = window.matchMedia('(prefers-reduced-motion: reduce)')
  let gerakDikurangi = media.matches
  let dpr = Math.min(2, window.devicePixelRatio || 1)
  let lebar = 1
  let tinggi = 1
  let kepadatan = kepadatanAwal

  const latar: Partikel[] = Array.from({ length: MAKS_LATAR }, partikelKosong)
  const sembur: Partikel[] = Array.from({ length: MAKS_SEMBUR }, partikelKosong)

  // ---- Sprite ----
  const SEL = 80
  const depan: (Sprite | null)[][] = []
  const belakang: (Sprite | null)[][] = []
  const depanLunak: (Sprite | null)[][] = []
  const belakangLunak: (Sprite | null)[][] = []
  const bayang: (Sprite | null)[] = new Array(JUMLAH_BENTUK).fill(null)
  const kilau: (Sprite | null)[] = new Array(JUMLAH_BENTUK).fill(null)
  const hati: (Sprite | null)[] = new Array(WARNA_HATI.length).fill(null)
  const daunDepan: (Sprite | null)[] = new Array(DAUN.length).fill(null)
  const daunBelakang: (Sprite | null)[] = new Array(DAUN.length).fill(null)
  const tugas: Tugas[] = []
  for (let b = 0; b < JUMLAH_BENTUK; b++) {
    depan.push(new Array(WARNA_KELOPAK.length).fill(null))
    belakang.push(new Array(WARNA_KELOPAK.length).fill(null))
    depanLunak.push(new Array(WARNA_KELOPAK.length).fill(null))
    belakangLunak.push(new Array(WARNA_KELOPAK.length).fill(null))
    tugas.push({ jenis: 'topeng', kunci: `kj:tb:${b}`, prioritas: 3, ukuran: SEL, bentuk: b, mode: 'bayang' })
    tugas.push({ jenis: 'topeng', kunci: `kj:tk:${b}`, prioritas: 3.5, ukuran: SEL, bentuk: b, mode: 'kilau' })
    WARNA_KELOPAK.forEach((palet, w) => {
      tugas.push({ jenis: 'kelopak', kunci: `kj:d:${b}:${w}`, prioritas: 3, ukuran: SEL, bentuk: b, palet, sisi: 'depan', lunak: false })
      tugas.push({ jenis: 'kelopak', kunci: `kj:b:${b}:${w}`, prioritas: 3, ukuran: SEL, bentuk: b, palet, sisi: 'belakang', lunak: false })
      tugas.push({ jenis: 'kelopak', kunci: `kj:dl:${b}:${w}`, prioritas: 9, ukuran: SEL, bentuk: b, palet, sisi: 'depan', lunak: true })
      tugas.push({ jenis: 'kelopak', kunci: `kj:bl:${b}:${w}`, prioritas: 9, ukuran: SEL, bentuk: b, palet, sisi: 'belakang', lunak: true })
    })
  }
  WARNA_HATI.forEach((palet, w) => tugas.push({ jenis: 'hati', kunci: `kj:h:${w}`, prioritas: 9, ukuran: SEL, palet }))
  DAUN.forEach((_, v) => {
    tugas.push({ jenis: 'daun', kunci: `kj:ld:${v}`, prioritas: 6, ukuran: SEL, varian: v, sisi: 'depan' })
    tugas.push({ jenis: 'daun', kunci: `kj:lb:${v}`, prioritas: 6, ukuran: SEL, varian: v, sisi: 'belakang' })
  })
  const lepasSprite = mintaSprite(tugas, (kunci, s) => {
    const b = kunci.split(':')
    const i = Number(b[2])
    const j = Number(b[3])
    if (b[1] === 'd') depan[i][j] = s
    else if (b[1] === 'b') belakang[i][j] = s
    else if (b[1] === 'dl') depanLunak[i][j] = s
    else if (b[1] === 'bl') belakangLunak[i][j] = s
    else if (b[1] === 'tb') bayang[i] = s
    else if (b[1] === 'tk') kilau[i] = s
    else if (b[1] === 'h') hati[i] = s
    else if (b[1] === 'ld') daunDepan[i] = s
    else if (b[1] === 'lb') daunBelakang[i] = s
  })

  const pilihWarna = () => {
    let r = acak()
    for (let i = 0; i < BOBOT_KELOPAK.length; i++) {
      r -= BOBOT_KELOPAK[i]
      if (r <= 0) return i
    }
    return 0
  }

  const skalaLayar = () => jepit(Math.sqrt((lebar * tinggi) / (390 * 844)), 0.8, 1.45)

  function targetJumlah() {
    const dasar = 18 * skalaLayar()
    const n = Math.round(dasar * kepadatan * (gerakDikurangi ? 0.3 : 1))
    return Math.max(0, Math.min(MAKS_LATAR, n))
  }

  function siapkanLatar(p: Partikel, diAtas: boolean) {
    p.aktif = true
    p.semburan = false
    p.hati = false
    p.pensiun = false
    p.z = acak()
    p.daun = acak() < PELUANG_DAUN
    const ukuranLayar = Math.min(1.25, Math.max(0.9, lebar / 430))
    p.ukuran = lerp(13, 30, p.z) * ukuranLayar * (0.9 + acak() * 0.2) * (p.daun ? 0.85 : 1)
    p.lunak = p.z < 0.32
    p.bentuk = Math.floor(acak() * JUMLAH_BENTUK)
    p.warna = p.daun ? Math.floor(acak() * DAUN.length) : pilihWarna()
    const lambat = gerakDikurangi ? 0.35 : 1
    p.jatuh = lerp(26, 62, p.z) * (0.85 + acak() * 0.3) * lambat
    p.frek = (0.7 + acak() * 0.9) * (gerakDikurangi ? 0.5 : 1)
    p.ayun = lerp(14, 40, p.z) * (0.6 + acak() * 0.6) * lambat
    p.fase = acak() * TAU
    p.sudut = acak() * TAU
    p.putar = (acak() - 0.5) * 1.2 * lambat
    p.balik = acak() * TAU
    p.kecBalik = (acak() < 0.5 ? -1 : 1) * (1 + acak() * 2.2) * (gerakDikurangi ? 0.3 : 1)
    p.sumbu = acak() * TAU
    p.x = -lebar * 0.1 + acak() * lebar * 1.15
    if (diAtas) {
      p.y = -p.ukuran - acak() * 60
      p.pudar = 1
    } else {
      p.y = acak() * tinggi
      p.pudar = 0
    }
    p.vx = 0
    p.vy = p.jatuh
  }

  // ---- Waktu & loop ----
  let waktu = 0
  let terakhir = 0
  let rafId = 0
  let jeda = document.hidden
  let jedaSpawn = 0

  function aturUkuranKanvas() {
    dpr = Math.min(2, window.devicePixelRatio || 1)
    const w = kanvas.clientWidth || window.innerWidth
    const h = kanvas.clientHeight || window.innerHeight
    if (lebar > 1 && tinggi > 1) {
      const rx = w / lebar
      for (const p of latar) if (p.aktif) p.x *= rx
    }
    lebar = w
    tinggi = h
    const bw = Math.round(w * dpr)
    const bh = Math.round(h * dpr)
    for (const k of [kanvas, kanvasSembur]) {
      if (k.width !== bw || k.height !== bh) {
        k.width = bw
        k.height = bh
      }
    }
  }

  function perbaruiJumlah(dt: number) {
    const target = targetJumlah()
    let aktif = 0
    for (const p of latar) if (p.aktif && !p.pensiun) aktif++
    if (aktif > target) {
      // Pensiunkan yang berlebih: memudar perlahan, tidak didaur ulang.
      let lebih = aktif - target
      for (const p of latar) {
        if (lebih <= 0) break
        if (p.aktif && !p.pensiun) {
          p.pensiun = true
          lebih--
        }
      }
    } else if (aktif < target) {
      jedaSpawn -= dt
      if (jedaSpawn <= 0) {
        const p = latar.find((q) => !q.aktif)
        if (p) siapkanLatar(p, target - aktif < 5)
        jedaSpawn = target - aktif > 5 ? 0.05 : 0.35
      }
    }
  }

  function perbaruiLatar(p: Partikel, dt: number, angin: number) {
    const ayunan = Math.cos(p.frek * waktu + p.fase)
    p.vx = angin * lerp(0.5, 1, p.z) + p.ayun * p.frek * ayunan
    // Melambat di ujung ayunan, menukik di tengah (gerak daun jatuh).
    p.vy = p.jatuh * (1 + 0.38 * Math.cos(2 * (p.frek * waktu + p.fase)))
    p.x += p.vx * dt
    p.y += p.vy * dt
    const tumbang = 0.65 + 0.7 * (0.5 + 0.5 * Math.sin(waktu * 0.45 + p.fase * 2))
    p.balik += p.kecBalik * tumbang * dt
    p.sudut += (p.putar + ayunan * 0.35) * dt
    if (p.pensiun) {
      p.pudar -= dt / 1.4
      if (p.pudar <= 0) p.aktif = false
    } else if (p.pudar < 1) p.pudar = Math.min(1, p.pudar + dt / 1.2)
    const m = p.ukuran * 2
    if (p.y > tinggi + m || p.x > lebar + m * 2 || p.x < -m * 3) {
      if (p.pensiun) p.aktif = false
      else siapkanLatar(p, true)
    }
  }

  function perbaruiSembur(p: Partikel, dt: number, angin: number) {
    p.umur += dt
    if (p.umur >= p.umurMaks) {
      p.aktif = false
      return
    }
    // Gravitasi + hambatan udara; setelah melambat kelopak mulai berayun seperti jatuh bebas.
    const hambat = Math.exp(-2.4 * dt)
    p.vx = p.vx * hambat + angin * 0.4 * (1 - hambat)
    p.vy = p.vy * Math.exp(-2.1 * dt) + 300 * dt
    const tenang = halus(0.5, 1.4, p.umur)
    const ayunan = Math.cos(p.frek * p.umur * 2 + p.fase)
    p.x += (p.vx + ayunan * p.ayun * tenang) * dt
    p.y += p.vy * dt
    p.kecBalik *= Math.exp(-0.9 * dt)
    p.putar *= Math.exp(-0.9 * dt)
    p.balik += p.kecBalik * dt
    p.sudut += p.putar * dt
  }

  function gambarPartikel(p: Partikel) {
    let alpha: number
    let sk = 1
    if (p.semburan) {
      const sisa = 1 - halus(p.umurMaks * 0.55, p.umurMaks, p.umur)
      alpha = sisa * lerp(0.75, 1, p.z)
      sk = lerp(0.35, 1, halus(0, 0.16, p.umur))
    } else {
      alpha = p.pudar * lerp(0.5, 0.95, p.z)
    }
    if (alpha <= 0.01) return
    const cb = Math.cos(p.balik)
    const tanda = cb < 0 ? -1 : 1
    const c = tanda * Math.max(0.07, Math.abs(cb))
    let spr: Sprite | null
    if (p.hati) spr = hati[p.warna]
    else if (p.daun) spr = (tanda > 0 ? daunDepan : daunBelakang)[p.warna]
    else if (p.lunak) spr = (tanda > 0 ? depanLunak : belakangLunak)[p.bentuk][p.warna] ?? (tanda > 0 ? depan : belakang)[p.bentuk][p.warna]
    else spr = (tanda > 0 ? depan : belakang)[p.bentuk][p.warna]
    if (!spr) return
    // Goyang sumbu kedua (kelopak sedikit melengkung saat berputar).
    const sx = 1 - 0.16 * (0.5 + 0.5 * Math.sin(p.balik * 0.5 + p.fase))
    const ca = Math.cos(p.sudut), sa = Math.sin(p.sudut)
    const cbt = Math.cos(p.sumbu), sbt = Math.sin(p.sumbu)
    const k = (p.ukuran * sk * dpr) / (SEL * 0.86)
    // M = R(sudut) · S(sx, c) · R(sumbu); hati berputar seperti koin (sumbu vertikal).
    let a: number, b: number, cc: number, d: number
    if (p.hati) {
      a = ca * c
      b = sa * c
      cc = -sa
      d = ca
    } else {
      const m00 = sx * cbt, m01 = -sx * sbt, m10 = c * sbt, m11 = c * cbt
      a = ca * m00 - sa * m10
      b = sa * m00 + ca * m10
      cc = ca * m01 - sa * m11
      d = sa * m01 + ca * m11
    }
    ctx.setTransform(a * k, b * k, cc * k, d * k, p.x * dpr, p.y * dpr)
    const o = -SEL / 2
    ctx.globalAlpha = alpha
    ctx.drawImage(spr, o, o)
    // Gelap saat miring (cahaya mengenai permukaan secara menyudut).
    const gelap = (1 - Math.abs(cb)) * 0.42 + (tanda < 0 ? 0.05 : 0)
    const topeng = p.hati || p.daun ? null : bayang[p.bentuk]
    if (topeng && gelap > 0.03) {
      ctx.globalAlpha = alpha * gelap
      ctx.drawImage(topeng, o, o)
    }
    // Kilatan singkat saat permukaan menghadap cahaya.
    if (!p.hati && !p.daun && tanda > 0) {
      const kil = Math.pow(Math.max(0, Math.cos(p.balik - 0.55)), 10) * 0.42
      const tk = kilau[p.bentuk]
      if (tk && kil * alpha > 0.02) {
        ctx.globalAlpha = alpha * kil
        ctx.drawImage(tk, o, o)
      }
    }
  }

  function bingkai(now: number) {
    rafId = 0
    const dt = terakhir ? Math.min(0.05, (now - terakhir) / 1000) : 0
    terakhir = now
    waktu += dt
    const angin = (12 + 14 * Math.sin(waktu * 0.11) + 7 * Math.sin(waktu * 0.29 + 1.3)) * (gerakDikurangi ? 0.4 : 1)

    perbaruiJumlah(dt)
    ctx = ctxLatar
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, kanvas.width, kanvas.height)
    // Jauh dulu (z kecil) agar kedalaman benar: dua lintasan sederhana tanpa pengurutan.
    for (let lapis = 0; lapis < 2; lapis++) {
      for (const p of latar) {
        if (!p.aktif) continue
        if (lapis === 0) perbaruiLatar(p, dt, angin)
        if (!p.aktif || (p.z < 0.5) !== (lapis === 0)) continue
        gambarPartikel(p)
      }
    }
    // Semburan: perbarui, lalu yang sudah waktunya pindah digambar di lapisan belakang.
    let adaDepan = false
    for (const p of sembur) {
      if (!p.aktif) continue
      perbaruiSembur(p, dt, angin)
      if (!p.aktif) continue
      if (p.umur >= p.depanSampai) gambarPartikel(p)
      else adaDepan = true
    }
    ctx.globalAlpha = 1

    // Lapisan depan hanya dibersihkan & digambar selama ada semburan di sana.
    if (adaDepan || semburTergambar) {
      ctx = ctxSembur
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, kanvasSembur.width, kanvasSembur.height)
      for (const p of sembur) if (p.aktif && p.umur < p.depanSampai) gambarPartikel(p)
      ctx.globalAlpha = 1
      semburTergambar = adaDepan
    }
    jadwal()
  }

  function jadwal() {
    if (!rafId && !jeda) rafId = requestAnimationFrame(bingkai)
  }

  function padaSembur(e: Event) {
    const d = (e as CustomEvent<DetailSemburBunga>).detail
    if (!d) return
    const depanSampai = d.keBelakangSetelah ?? Infinity
    const jumlah = Math.round((d.jumlah ?? 36) * (gerakDikurangi ? 0.3 : 1))
    const kuat = gerakDikurangi ? 0.5 : 1
    let dibuat = 0
    for (const p of sembur) {
      if (dibuat >= jumlah) break
      if (p.aktif) continue
      dibuat++
      p.aktif = true
      p.semburan = true
      p.pensiun = false
      p.daun = false
      p.hati = acak() < PELUANG_HATI
      p.z = 0.45 + acak() * 0.55
      p.ukuran = lerp(14, 30, p.z) * (p.hati ? 0.75 : 1)
      p.lunak = false
      p.bentuk = Math.floor(acak() * JUMLAH_BENTUK)
      p.warna = p.hati ? Math.floor(acak() * WARNA_HATI.length) : pilihWarna()
      const arah = -Math.PI / 2 + (acak() - 0.5) * 2.5
      const laju = (260 + acak() * 520) * kuat
      p.x = d.x + (acak() - 0.5) * 12
      p.y = d.y + (acak() - 0.5) * 12
      p.vx = Math.cos(arah) * laju
      p.vy = Math.sin(arah) * laju
      p.sudut = acak() * TAU
      p.putar = (acak() - 0.5) * 9 * kuat
      p.balik = acak() * TAU
      p.kecBalik = (acak() < 0.5 ? -1 : 1) * (4 + acak() * 7) * kuat
      p.sumbu = acak() * TAU
      p.fase = acak() * TAU
      p.frek = 0.8 + acak() * 0.8
      p.ayun = 20 + acak() * 30
      p.umur = 0
      p.umurMaks = 2 + acak() * 1.3
      p.depanSampai = depanSampai
    }
    jadwal()
  }

  const padaVisibilitas = () => {
    jeda = document.hidden
    if (jeda) {
      cancelAnimationFrame(rafId)
      rafId = 0
    } else {
      terakhir = 0
      jadwal()
    }
  }
  const padaMedia = () => {
    gerakDikurangi = media.matches
  }
  const pengamatUkuran = new ResizeObserver(() => aturUkuranKanvas())

  aturUkuranKanvas()
  // Isi awal tersebar di layar lalu memudar masuk, agar tidak menunggu kelopak dari atas.
  const awal = targetJumlah()
  for (let i = 0; i < awal; i++) siapkanLatar(latar[i], false)

  window.addEventListener(ACARA_SEMBUR, padaSembur)
  document.addEventListener('visibilitychange', padaVisibilitas)
  media.addEventListener('change', padaMedia)
  pengamatUkuran.observe(kanvas)
  jadwal()

  return {
    aturKepadatan(k: number) {
      kepadatan = Math.max(0, k)
    },
    hentikan() {
      cancelAnimationFrame(rafId)
      rafId = 0
      window.removeEventListener(ACARA_SEMBUR, padaSembur)
      document.removeEventListener('visibilitychange', padaVisibilitas)
      media.removeEventListener('change', padaMedia)
      pengamatUkuran.disconnect()
      lepasSprite()
    },
  }
}
