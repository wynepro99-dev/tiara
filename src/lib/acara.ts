// Event global sederhana agar komponen mana pun bisa memicu semburan kelopak
// tanpa harus tahu di mana lapisan kelopak dirender.

export const ACARA_SEMBUR = 'sembur-kelopak'

export interface DetailSembur {
  /** Titik asal dalam koordinat viewport (px). */
  x: number
  y: number
  /** Jumlah kelopak, bawaan 36. */
  jumlah?: number
}

export function semburKelopak(detail: DetailSembur) {
  window.dispatchEvent(new CustomEvent<DetailSembur>(ACARA_SEMBUR, { detail }))
}

/** Sembur dari tengah sebuah elemen. */
export function semburDariElemen(el: Element | null, jumlah?: number) {
  if (!el) return
  const r = el.getBoundingClientRect()
  semburKelopak({ x: r.left + r.width / 2, y: r.top + r.height / 2, jumlah })
}
