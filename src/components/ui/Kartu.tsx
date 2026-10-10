import type { ReactNode } from 'react'

/** Kartu putih melayang, wadah langkah 2–6. */
export function Kartu({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`relative w-full overflow-hidden rounded-[30px] bg-krem/95 shadow-melayang ring-1 ring-white/70 backdrop-blur-sm ${className}`}
    >
      {/* Kilau tipis di tepi atas kartu */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/80 to-transparent" />
      <div className="relative">{children}</div>
    </div>
  )
}
