import { useEffect, useState } from 'react'

/** Waktu sekarang (ms) yang diperbarui berkala, agar jam yang baru saja lewat ikut nonaktif. */
export function useSekarang(selangMs = 30_000): number {
  const [sekarang, setSekarang] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setSekarang(Date.now()), selangMs)
    return () => window.clearInterval(id)
  }, [selangMs])
  return sekarang
}
