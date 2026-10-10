#!/usr/bin/env node
// Alat bantu pengembangan: ambil screenshot halaman di beberapa titik waktu,
// catat galat konsol, dan ukur kelancaran animasi (FPS).
//
// Contoh:
//   node scripts/tangkap.mjs --url "http://localhost:5173/?demo=a" --keluar /tmp/hasil/demo-a \
//        --waktu 300,1500,4000 --lebar 390 --tinggi 844 --fps
//
// Menghasilkan /tmp/hasil/demo-a-300.png, -1500.png, -4000.png
// Opsi:
//   --klik "teks:Yes"     klik elemen berisi teks tsb sebelum mulai menghitung waktu (bisa diulang, dipisah ||)
//   --klik "css:button"   klik selektor CSS
//   --gerak-dikurangi     emulasikan prefers-reduced-motion
//   --fps                 ukur FPS selama 3 detik setelah screenshot terakhir
//   --cpu 4               perlambat CPU 4x (simulasi HP kelas menengah)

import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { chromium } from 'playwright-core'

const arg = process.argv.slice(2)
const ambil = (nama, bawaan) => {
  const i = arg.indexOf(`--${nama}`)
  if (i === -1) return bawaan
  const v = arg[i + 1]
  return v === undefined || v.startsWith('--') ? true : v
}

const url = ambil('url', 'http://localhost:5173/')
const keluar = ambil('keluar', '/tmp/tangkap/hasil')
const waktu = String(ambil('waktu', '1500')).split(',').map(Number)
const lebar = Number(ambil('lebar', 390))
const tinggi = Number(ambil('tinggi', 844))
const klik = ambil('klik', null)
const ukurFps = Boolean(ambil('fps', false))
const gerakDikurangi = Boolean(ambil('gerak-dikurangi', false))
const halamanPenuh = Boolean(ambil('penuh', false))
const perlambatCpu = Number(ambil('cpu', 1))

mkdirSync(dirname(keluar), { recursive: true })

const peramban = await chromium.launch({ channel: 'chrome', headless: true })
const konteks = await peramban.newContext({
  viewport: { width: lebar, height: tinggi },
  deviceScaleFactor: 2,
  isMobile: lebar < 600,
  hasTouch: lebar < 600,
  reducedMotion: gerakDikurangi ? 'reduce' : 'no-preference',
})
const halaman = await konteks.newPage()
if (perlambatCpu > 1) {
  const cdp = await konteks.newCDPSession(halaman)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: perlambatCpu })
}
const galat = []
halaman.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') galat.push(`[${m.type()}] ${m.text()}`)
})
halaman.on('pageerror', (e) => galat.push(`[pageerror] ${e.message}`))

await halaman.goto(url, { waitUntil: 'networkidle' })

if (typeof klik === 'string') {
  for (const target of klik.split('||')) {
    const [jenis, ...sisa] = target.split(':')
    const nilai = sisa.join(':')
    const loc = jenis === 'teks' ? halaman.getByText(nilai, { exact: false }).first() : halaman.locator(nilai).first()
    await loc.click({ timeout: 5000 })
    await halaman.waitForTimeout(900)
  }
}

const mulai = Date.now()
for (const t of waktu.sort((a, b) => a - b)) {
  const sisa = t - (Date.now() - mulai)
  if (sisa > 0) await halaman.waitForTimeout(sisa)
  const berkas = `${keluar}-${t}.png`
  await halaman.screenshot({ path: berkas, fullPage: halamanPenuh })
  console.log(`📸 ${berkas}`)
}

if (ukurFps) {
  const hasil = await halaman.evaluate(
    () =>
      new Promise((selesai) => {
        const bingkai = []
        let akhir = performance.now()
        const awal = akhir
        const langkah = (t) => {
          bingkai.push(t - akhir)
          akhir = t
          if (t - awal < 3000) requestAnimationFrame(langkah)
          else {
            const rata = bingkai.reduce((a, b) => a + b, 0) / bingkai.length
            const lambat = bingkai.filter((d) => d > 25).length
            selesai({ fps: Math.round(1000 / rata), jumlahBingkai: bingkai.length, bingkaiLambat: lambat, terlama: Math.round(Math.max(...bingkai)) })
          }
        }
        requestAnimationFrame(langkah)
      }),
  )
  console.log(`🎞️  FPS ${JSON.stringify(hasil)}`)
}

console.log(galat.length ? `⚠️  Konsol:\n${galat.join('\n')}` : '✅ Tidak ada galat konsol')
await peramban.close()
