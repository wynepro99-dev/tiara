import { motion } from 'motion/react'

/** Indikator progres untuk langkah isian (1 sampai total). */
export function IndikatorLangkah({ ke, total }: { ke: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-3" aria-label={`Langkah ${ke} dari ${total}`}>
      <div className="flex items-center gap-1.5">
        {Array.from({ length: total }, (_, i) => {
          const aktif = i + 1 === ke
          const selesai = i + 1 < ke
          return (
            <motion.span
              key={i}
              className="block h-1.5 rounded-full"
              initial={false}
              animate={{
                width: aktif ? 28 : 8,
                backgroundColor: aktif || selesai ? 'var(--color-mawar-500)' : 'var(--color-mawar-200)',
              }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            />
          )
        })}
      </div>
      <span className="text-[12px] font-semibold tracking-[0.12em] text-anggur-pudar tabular-nums">
        {ke}/{total}
      </span>
    </div>
  )
}
