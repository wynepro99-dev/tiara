// Ukuran & warna bentuk tiket, dipakai bersama oleh tampilan dan perapian salinan PNG.

export const TAKIK = 14
export const KERTAS = '#fffbf7'
export const KERTAS_STUB = '#fff5ef'

/**
 * Takik setengah lingkaran di garis perforasi dari gradien radial transparan (bukan mask),
 * sehingga latar halaman benar-benar terlihat di layar. `sisiY` '100%' = tepi bawah badan,
 * '0' = tepi atas stub.
 */
export const latarTakik = (warna: string, sisiY: '0' | '100%') =>
  [
    `radial-gradient(circle at 0 ${sisiY}, transparent ${TAKIK}px, ${warna} ${TAKIK + 0.6}px) left / 51% 100% no-repeat`,
    `radial-gradient(circle at 100% ${sisiY}, transparent ${TAKIK}px, ${warna} ${TAKIK + 0.6}px) right / 51% 100% no-repeat`,
  ].join(', ')
