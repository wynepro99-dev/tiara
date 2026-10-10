// Geometri tombol "No" yang kabur: cari posisi acak baru yang tetap di dalam kartu,
// tidak menimpa tombol Yes, dan sebisa mungkin tidak menutupi foto atau judul.
// Semua koordinat relatif terhadap wadah kartu (pojok kiri atas = 0,0).

export interface Titik {
  x: number
  y: number
}

export interface Kotak {
  x: number
  y: number
  w: number
  h: number
}

/** Area yang sebaiknya dihindari. bobot Infinity = sama sekali tidak boleh ditimpa. */
export interface Rintangan {
  kotak: Kotak
  bobot: number
}

interface OpsiPosisi {
  /** Area yang boleh ditempati (sudah dikurangi jarak tepi). */
  batas: Kotak
  ukuran: { w: number; h: number }
  /** Pojok kiri atas posisi lama. */
  asal: Titik
  /** Posisi kursor/jari saat ini, agar tombol tidak mendarat di bawahnya. */
  penunjuk: Titik | null
  rintangan: Rintangan[]
  /** Jarak minimal pusat posisi baru dari pusat posisi lama. */
  jarakMin: number
}

interface Kandidat extends Titik {
  skor: number
  jauhAsal: number
  jauhPenunjuk: number
}

const JUMLAH_KANDIDAT = 160
/** Selisih skor yang masih dianggap sama bagusnya. */
const TOLERANSI_SKOR = 0.2

function luasIrisan(a: Kotak, b: Kotak) {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)
  return w > 0 && h > 0 ? w * h : 0
}

export function pilihPosisi({ batas, ukuran, asal, penunjuk, rintangan, jarakMin }: OpsiPosisi): Titik {
  const rentangX = Math.max(0, batas.w - ukuran.w)
  const rentangY = Math.max(0, batas.h - ukuran.h)
  const luas = ukuran.w * ukuran.h
  const pusatAsal = { x: asal.x + ukuran.w / 2, y: asal.y + ukuran.h / 2 }
  const kandidat: Kandidat[] = []

  for (let i = 0; i < JUMLAH_KANDIDAT; i++) {
    const x = batas.x + Math.random() * rentangX
    const y = batas.y + Math.random() * rentangY
    const kotak = { x, y, w: ukuran.w, h: ukuran.h }

    let skor = 0
    let terlarang = false
    for (const r of rintangan) {
      const iris = luasIrisan(kotak, r.kotak)
      if (!iris) continue
      if (!Number.isFinite(r.bobot)) {
        terlarang = true
        break
      }
      skor += (r.bobot * iris) / luas
    }
    if (terlarang) continue

    const px = x + ukuran.w / 2
    const py = y + ukuran.h / 2
    kandidat.push({
      x,
      y,
      skor,
      jauhAsal: Math.hypot(px - pusatAsal.x, py - pusatAsal.y),
      jauhPenunjuk: penunjuk ? Math.hypot(px - penunjuk.x, py - penunjuk.y) : Infinity,
    })
  }

  // Syarat jarak dilonggarkan bertahap bila kartu terlalu sempit.
  const tingkat: ((k: Kandidat) => boolean)[] = [
    (k) => k.jauhAsal >= jarakMin && k.jauhPenunjuk >= 110,
    (k) => k.jauhAsal >= jarakMin * 0.6 && k.jauhPenunjuk >= 80,
    (k) => k.jauhAsal >= 40,
    () => true,
  ]

  for (const lolos of tingkat) {
    const daftar = kandidat.filter(lolos)
    if (!daftar.length) continue
    // Ambil acak di antara kandidat yang hampir sama bagusnya agar tidak monoton.
    const terbaik = Math.min(...daftar.map((k) => k.skor))
    const pilihan = daftar.filter((k) => k.skor <= terbaik + TOLERANSI_SKOR)
    const p = pilihan[Math.floor(Math.random() * pilihan.length)]
    return { x: Math.round(p.x), y: Math.round(p.y) }
  }

  // Tidak ada tempat sama sekali (sangat jarang): pojok kiri bawah.
  return { x: Math.round(batas.x), y: Math.round(batas.y + rentangY) }
}

/** Jaga posisi tetap di dalam batas, misalnya setelah layar diputar. */
export function jepit(p: Titik, batas: Kotak, ukuran: { w: number; h: number }): Titik {
  return {
    x: Math.min(Math.max(p.x, batas.x), batas.x + Math.max(0, batas.w - ukuran.w)),
    y: Math.min(Math.max(p.y, batas.y), batas.y + Math.max(0, batas.h - ukuran.h)),
  }
}

/**
 * Posisi tata letak elemen relatif terhadap leluhurnya, tanpa terpengaruh transform
 * (animasi masuk halaman memakai scale/translate, jadi getBoundingClientRect kurang tepat).
 */
export function kotakTataLetak(el: HTMLElement, leluhur: HTMLElement): Kotak {
  let x = 0
  let y = 0
  let n: HTMLElement | null = el
  while (n && n !== leluhur) {
    x += n.offsetLeft
    y += n.offsetTop
    n = n.offsetParent as HTMLElement | null
  }
  if (!n) {
    // Rantai offsetParent tidak melewati leluhur: pakai posisi di layar.
    const a = el.getBoundingClientRect()
    const b = leluhur.getBoundingClientRect()
    return { x: a.left - b.left, y: a.top - b.top, w: el.offsetWidth, h: el.offsetHeight }
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight }
}

/** Kotak di layar (DOMRect) diubah menjadi relatif terhadap wadah. */
export function relatifKe(r: DOMRect, wadah: DOMRect): Kotak {
  return { x: r.left - wadah.left, y: r.top - wadah.top, w: r.width, h: r.height }
}

/** Kotak tiap baris teks (bukan seluruh blok), supaya ruang kosong di samping baris pendek tetap terpakai. */
export function kotakBarisTeks(el: HTMLElement, wadah: DOMRect): Kotak[] {
  const range = document.createRange()
  range.selectNodeContents(el)
  return Array.from(range.getClientRects())
    .filter((r) => r.width > 1 && r.height > 1)
    .map((r) => relatifKe(r, wadah))
}
