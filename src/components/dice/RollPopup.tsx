import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import clsx from 'clsx'
import { useUI } from '../../store/ui'
import { useEfeitos } from '../../combate/efeitos'

/** Número grande no centro da tela a cada rolagem (no canto de cima, menor, quando o tiro está passando no mapa). */
export function RollPopup() {
  const popup = useUI(s => s.popup)
  const [visible, setVisible] = useState(false)
  const [canto, setCanto] = useState(false)
  useEffect(() => {
    if (!popup) return
    setCanto(useEfeitos.getState().lista.some(e => e.k !== 'alcance' && Date.now() - e.t < 2500))
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
          className={clsx('pointer-events-none fixed z-50 flex justify-center', canto ? 'right-4 top-20 sm:right-8' : 'inset-x-0 top-[22%]')}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
        >
          <div className={clsx('scanlines border border-gold/70 bg-black/90 text-center shadow-[0_0_40px_rgba(0,0,0,.9)]', canto ? 'min-w-40 px-5 pb-2 pt-1' : 'min-w-56 px-8 pb-4 pt-2')}>
          <div className={clsx(
            'font-display leading-none', canto ? 'text-6xl' : 'text-[120px]',
            popup.kind === 'crit' ? 'text-gold [text-shadow:0_0_30px_rgba(255,210,74,.9)]' : popup.kind === 'fumble' ? 'text-ember [text-shadow:0_0_24px_rgba(196,20,28,.9)]' : 'text-white [text-shadow:0_0_22px_rgba(196,20,28,.85)]',
          )}>
            {popup.value}
          </div>
          <div className={clsx('font-display tracking-[.25em] text-gold', canto ? 'max-w-64 text-sm' : 'text-xl')}>{popup.label}</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
