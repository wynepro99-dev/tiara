// Antarmuka publik modul bunga.
// - <HatiBunga mekar onMekarSelesai /> : rangkaian mawar 3D (WebGL, three.js dimuat dinamis) berbentuk hati
//                                        yang mekar bergelombang dari ujung bawah; cadangan gambar bila WebGL gagal.
// - <KelopakJatuh kepadatan />          : lapisan kanvas fixed layar penuh berisi kelopak berguguran,
//                                        juga mendengarkan event ACARA_SEMBUR (lib/acara.ts).

export { HatiBunga } from './HatiBunga'
export { KelopakJatuh } from './KelopakJatuh'
export type { DetailSemburBunga, PropsHatiBunga, PropsKelopakJatuh } from './tipe'
