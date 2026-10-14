import { AnimatePresence, motion } from 'motion/react'
import { useUI } from '../store/ui'

export function Toasts() {
  const toasts = useUI(s => s.toasts)
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4" role="status" aria-live="polite">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="max-w-xl border border-gold bg-black/95 px-4 py-2 font-mono text-sm text-bone shadow-lg">
            {t.msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
