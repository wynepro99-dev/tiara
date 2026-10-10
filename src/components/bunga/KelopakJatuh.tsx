import { useEffect, useRef } from 'react'
import { buatMesinKelopak, type MesinKelopak } from './kelopak/mesinKelopak'
import type { PropsKelopakJatuh } from './tipe'

// Lapisan kelopak mawar berguguran (layar penuh, di belakang konten) + lapisan semburan di depan.
export function KelopakJatuh({ kepadatan = 1 }: PropsKelopakJatuh) {
  const kanvasRef = useRef<HTMLCanvasElement>(null)
  const semburRef = useRef<HTMLCanvasElement>(null)
  const mesinRef = useRef<MesinKelopak | null>(null)
  const kepadatanAwal = useRef(kepadatan)

  useEffect(() => {
    const kanvas = kanvasRef.current
    const sembur = semburRef.current
    if (!kanvas || !sembur) return
    const mesin = buatMesinKelopak(kanvas, sembur, kepadatanAwal.current)
    mesinRef.current = mesin
    return () => {
      mesin.hentikan()
      mesinRef.current = null
    }
  }, [])

  useEffect(() => {
    mesinRef.current?.aturKepadatan(kepadatan)
  }, [kepadatan])

  return (
    <>
      <canvas ref={kanvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 h-full w-full" />
      {/* Semburan tampil di atas konten (kartu tidak menutupinya) dan tidak menghalangi ketukan. */}
      <canvas ref={semburRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-40 h-full w-full" />
    </>
  )
}
