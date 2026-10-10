import { hex, type Rgb } from './alat'

// Palet kelopak gugur, selaras dengan rangkaian hati: merah & kuning sebagai warna utama,
// ditambah dwiwarna (kuning bertepi merah) dan jingga/aprikot sebagai jembatan.
// Setiap palet menyimpan gradasi dari pangkal (gelap, jenuh) ke tepi (terang, tembus cahaya).

export interface PaletMawar {
  /** Bayangan terdalam di pusat & celah antar kelopak. */
  bayang: Rgb
  /** Pangkal kelopak (oklusi, lebih gelap & jenuh). */
  dalam: Rgb
  /** Badan kelopak. */
  dasar: Rgb
  /** Menjelang tepi. */
  tengah: Rgb
  /** Tepi kelopak yang tersorot & sedikit tembus cahaya. */
  tepi: Rgb
  /** Sisi luar kelopak (terlihat saat tepi menggulung balik). */
  luar: Rgb
  /** Kilau beludru. */
  kilau: Rgb
  /** Khusus dwiwarna: warna tepi merah. */
  bibir?: Rgb
}

export const PALET = {
  crimson: {
    bayang: hex('#3a0410'),
    dalam: hex('#6a0818'),
    dasar: hex('#a3102a'),
    tengah: hex('#bc1630'),
    tepi: hex('#d42a3c'),
    luar: hex('#d6465a'),
    kilau: hex('#ffd9dc'),
  },
  scarlet: {
    bayang: hex('#470a08'),
    dalam: hex('#860f10'),
    dasar: hex('#c2211f'),
    tengah: hex('#d8332a'),
    tepi: hex('#ea4a34'),
    luar: hex('#ee6650'),
    kilau: hex('#ffe0d4'),
  },
  anggur: {
    bayang: hex('#1c0206'),
    dalam: hex('#3e0510'),
    dasar: hex('#6a0c1c'),
    tengah: hex('#821326'),
    tepi: hex('#9c2034'),
    luar: hex('#a83a4c'),
    kilau: hex('#f3c4cc'),
  },
  emas: {
    bayang: hex('#6e3a00'),
    dalam: hex('#b46800'),
    dasar: hex('#eb9f00'),
    tengah: hex('#f6b80c'),
    tepi: hex('#ffd658'),
    luar: hex('#ffe49a'),
    kilau: hex('#fff6d6'),
  },
  mentega: {
    bayang: hex('#7c5512'),
    dalam: hex('#c48d22'),
    dasar: hex('#efc23e'),
    tengah: hex('#f7d35a'),
    tepi: hex('#ffeba0'),
    luar: hex('#fff2c2'),
    kilau: hex('#fffbe8'),
  },
  dwiwarna: {
    bayang: hex('#6a2a00'),
    dalam: hex('#c98400'),
    dasar: hex('#f3c240'),
    tengah: hex('#f8d36a'),
    tepi: hex('#e0473a'),
    luar: hex('#fbe0a0'),
    kilau: hex('#fff3d8'),
    bibir: hex('#c41a2c'),
  },
  jingga: {
    bayang: hex('#5e2004'),
    dalam: hex('#a8420c'),
    dasar: hex('#e8782a'),
    tengah: hex('#f28c38'),
    tepi: hex('#ffb46a'),
    luar: hex('#ffc890'),
    kilau: hex('#fff0de'),
  },
  aprikot: {
    bayang: hex('#7a3a1c'),
    dalam: hex('#cc7442'),
    dasar: hex('#f0a272'),
    tengah: hex('#f6b183'),
    tepi: hex('#ffd6ba'),
    luar: hex('#ffe4d0'),
    kilau: hex('#fff6ee'),
  },
} satisfies Record<string, PaletMawar>

export type NamaPalet = keyof typeof PALET

/** Warna kelopak lepas (jatuh) mengikuti palet rangkaian hati. */
export const WARNA_KELOPAK: NamaPalet[] = ['crimson', 'scarlet', 'anggur', 'emas', 'mentega', 'dwiwarna', 'jingga', 'aprikot']

/** Bobot kemunculan: ~38% merah, ~34% kuning, ~28% jingga/aprikot/dwiwarna. */
export const BOBOT_KELOPAK = [0.16, 0.16, 0.06, 0.18, 0.16, 0.1, 0.1, 0.08]

/** Hati kecil mengilap yang ikut tersembur. */
export const WARNA_HATI: NamaPalet[] = ['crimson', 'scarlet', 'emas', 'jingga']

/** Daun mawar kecil yang sesekali ikut gugur. */
export interface PaletDaun {
  gelap: Rgb
  dasar: Rgb
  terang: Rgb
  tulang: Rgb
}

export const DAUN: PaletDaun[] = [
  { gelap: hex('#2f4524'), dasar: hex('#4f6b3a'), terang: hex('#6f8a48'), tulang: hex('#a9bd7c') },
  { gelap: hex('#36502a'), dasar: hex('#5a7840'), terang: hex('#7a9450'), tulang: hex('#b5c88a') },
]
