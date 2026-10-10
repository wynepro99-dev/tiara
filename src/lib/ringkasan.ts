import { KONFIGURASI } from '../config'
import { labelAktivitas, labelDressCode, labelPeriode } from '../data/pilihan'
import type { Jawaban } from '../types'
import { formatJam, formatTanggalPanjang } from './tanggal'

export interface Ringkasan {
  tanggal: string
  periode: string
  jam: string
  aktivitas: { label: string; emoji: string }[]
  dressCode: { label: string; emoji: string } | null
  pesan: string
  nomorTiket: string
}

/** Kode tiket stabil dari isi jawaban, contoh "TS-0417-8K2Q". */
export function buatNomorTiket(j: Jawaban): string {
  const sumber = JSON.stringify([j.tanggal, j.jam, j.aktivitas, j.ideAktivitas, j.dressCode, j.dressCodeLain, j.pesan])
  let h = 2166136261
  for (let i = 0; i < sumber.length; i++) {
    h ^= sumber.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  const huruf = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let kode = ''
  let n = h >>> 0
  for (let i = 0; i < 4; i++) {
    kode += huruf[n % huruf.length]
    n = Math.floor(n / huruf.length)
  }
  const tgl = j.tanggal ? j.tanggal.slice(5).replace('-', '') : '0000'
  return `TS-${tgl}-${kode}`
}

export function buatRingkasan(j: Jawaban): Ringkasan {
  const aktivitas = [
    ...j.aktivitas.map((id) => labelAktivitas(id)).filter((a) => a !== undefined).map((a) => ({ label: a.label, emoji: a.emoji })),
    ...j.ideAktivitas.map((ide) => ({ label: ide, emoji: '✨' })),
  ]
  const dc = j.dressCode === 'lainnya'
    ? { label: j.dressCodeLain.trim() || 'Bebas', emoji: '✨' }
    : j.dressCode
      ? (() => {
          const d = labelDressCode(j.dressCode)
          return d ? { label: d.label, emoji: d.emoji } : null
        })()
      : null

  return {
    tanggal: j.tanggal ? formatTanggalPanjang(j.tanggal) : '-',
    periode: j.periode ? labelPeriode(j.periode)?.label ?? '-' : '-',
    jam: j.jam ? formatJam(j.jam) : '-',
    aktivitas,
    dressCode: dc,
    pesan: j.pesan.trim(),
    nomorTiket: buatNomorTiket(j),
  }
}

/** Teks rekap untuk dikirim lewat WhatsApp. */
export function buatPesanWhatsApp(j: Jawaban): string {
  const r = buatRingkasan(j)
  const baris = [
    `Hai ${KONFIGURASI.panggilanPengundang}! 💌`,
    `Aku mau jalan sama kamu 🥰`,
    '',
    `🎟️ *Tiket Kencan* — ${r.nomorTiket}`,
    `📅 ${r.tanggal}`,
    `⏰ ${r.periode}, jam ${r.jam}`,
    `🎯 ${r.aktivitas.length ? r.aktivitas.map((a) => a.label).join(', ') : 'Terserah kamu'}`,
    `👗 Dress code: ${r.dressCode?.label ?? 'Bebas'}`,
  ]
  if (r.pesan) baris.push('', `💬 "${r.pesan}"`)
  baris.push('', `— ${KONFIGURASI.panggilanPenerima}`)
  return baris.join('\n')
}

export function buatTautanWhatsApp(j: Jawaban): string {
  const teks = encodeURIComponent(buatPesanWhatsApp(j))
  return KONFIGURASI.nomorWhatsApp
    ? `https://wa.me/${KONFIGURASI.nomorWhatsApp}?text=${teks}`
    : `https://wa.me/?text=${teks}`
}
