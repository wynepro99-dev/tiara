# Undangan untuk Tiara Suci 💌

Undangan kencan interaktif dari **Ahmad Wahyu Aji** untuk **Tiara Suci**:
hati dari bunga yang mekar → ajakan (tombol "No" yang kabur) → pilih tanggal & jam →
aktivitas → dress code → kotak pesan → tiket kencan yang bisa dibagikan sebagai gambar
atau dikirim lewat WhatsApp.

Dibuat dengan React + Vite + TypeScript, Tailwind CSS v4, Motion, dan html2canvas-pro.

## Sebelum dibagikan

1. **Nomor WhatsApp kamu** (penerima rekap jawaban Tiara) — sudah diisi di
   `src/config.ts`. Bisa ditimpa lewat variabel lingkungan `VITE_NOMOR_WA` di Vercel
   (format `6281234567890`, tanpa `+`).
2. **Foto Tiara** — simpan sebagai `public/foto-tiara.jpg` (potret, ±800×1000 px).
   Bila tidak ada, tampil bingkai monogram "T".
3. Nama & panggilan bisa diubah di `src/config.ts`.

## Menjalankan di komputer

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # hasil di folder dist/
```

Pratinjau langkah tertentu saat pengembangan: `http://localhost:5173/?langkah=6&contoh=1`
(1 ajakan, 2 waktu, 3 aktivitas, 4 dress code, 5 pesan, 6 tiket).

## Deploy

### GitHub

```bash
git add .
git commit -m "Undangan untuk Tiara"
git branch -M main
git remote add origin https://github.com/<username>/<nama-repo>.git
git push -u origin main
```

### Vercel

1. Buka https://vercel.com/new dan impor repo GitHub tadi.
2. Framework terdeteksi otomatis sebagai **Vite** (build `npm run build`, output `dist`).
3. (Opsional) Di **Environment Variables** tambahkan `VITE_NOMOR_WA` bila ingin mengganti nomor.
4. Klik **Deploy**. Setiap `git push` berikutnya akan otomatis ter-deploy ulang.

## Catatan

- Progres jawaban tersimpan di perangkat Tiara, jadi tidak hilang saat halaman dimuat ulang.
  Membuka ulang tautan selalu dimulai dari animasi bunga.
- Tombol "Bagikan tiketnya" memakai menu berbagi bawaan HP (Web Share API); di perangkat
  yang tidak mendukung, gambar tiket akan diunduh.
- `scripts/tangkap.mjs` adalah alat bantu pengembangan (screenshot + ukur FPS memakai Google Chrome).
