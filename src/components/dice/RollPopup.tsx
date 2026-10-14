import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import clsx from 'clsx'
import { useUI } from '../../store/ui'

/** Número grande no centro da tela a cada rolagem. */
export function RollPopup() {
  const popup = useUI(s => s.popup)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (!popup) return
    setVisible(true)
    const t = setTimeout(() => setVisible(false), 1500)
    return () => clearTimeout(t)
  }, [popup])
  return (
    <AnimatePresence>
      {visible && popup && (
        <motion.div
          key={popup.id}
          role="status"
          className="pointer-events-none fixed inset-x-0 top-[22%] z-50 text-center"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
        >
          <div className={clsx(
            'font-display text-[120px] leading-none',
            popup.kind === 'crit' ? 'text-gold [text-shadow:0_0_30px_rgba(255,210,74,.9)]' : popup.kind === 'fumble' ? 'text-ember [text-shadow:0_0_24px_rgba(196,20,28,.9)]' : 'text-white [text-shadow:0_0_22px_rgba(196,20,28,.85)]',
          )}>
            {popup.value}
          </div>
          <div className="mx-auto inline-block bg-black/80 px-3 py-1 font-display text-xl tracking-[.25em] text-gold">{popup.label}</div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
