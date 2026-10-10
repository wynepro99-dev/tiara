import { useCallback, useSyncExternalStore } from 'react'

/** true bila media query cocok; ikut berubah saat layar diputar atau diubah ukurannya. */
export function useCocokMedia(kueri: string): boolean {
  const langganan = useCallback(
    (beriTahu: () => void) => {
      const mql = window.matchMedia(kueri)
      mql.addEventListener('change', beriTahu)
      return () => mql.removeEventListener('change', beriTahu)
    },
    [kueri],
  )
  return useSyncExternalStore(
    langganan,
    () => window.matchMedia(kueri).matches,
    () => false,
  )
}
