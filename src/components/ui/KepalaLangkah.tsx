import type { ReactNode } from 'react'

interface Props {
  /** Label kecil di atas judul, contoh "Kapan kita ketemu?" */
  label?: string
  /** Judul berhuruf sambung. */
  judul: ReactNode
  keterangan?: ReactNode
}

export function KepalaLangkah({ label, judul, keterangan }: Props) {
  return (
    <header className="text-center">
      {label && (
        <p className="text-[12px] font-semibold tracking-[0.22em] text-mawar-500 uppercase">{label}</p>
      )}
      <h2 className="mt-1 font-script text-[44px] leading-[1.05] text-mawar-700">{judul}</h2>
      {keterangan && <p className="mx-auto mt-2 max-w-[30ch] text-[15px] leading-relaxed text-anggur-muda">{keterangan}</p>}
    </header>
  )
}
