// Pengaturan utama undangan. Ubah di sini, semua halaman ikut berubah.

const nomorDariEnv = (import.meta.env.VITE_NOMOR_WA as string | undefined)?.replace(/\D/g, '')

export const KONFIGURASI = {
  namaPengundang: 'Ahmad Wahyu Aji',
  panggilanPengundang: 'Ahmad',
  namaPenerima: 'Tiara Suci',
  panggilanPenerima: 'Tiara',

  // Nomor WhatsApp pengundang (penerima rekap), format internasional tanpa "+".
  // Variabel lingkungan VITE_NOMOR_WA di Vercel, bila diisi, menimpa nilai ini.
  nomorWhatsApp: nomorDariEnv || '6282131233836',

  // Taruh foto di public/foto-tiara.jpg. Bila file tidak ada, tampil bingkai monogram.
  fotoPenerima: '/foto-tiara.jpg',
} as const
