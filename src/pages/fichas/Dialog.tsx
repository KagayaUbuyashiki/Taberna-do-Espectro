import { useEffect, useRef, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import clsx from 'clsx'

/** Janela sobre a página (escolhas, edição de arma, subida de nível). Esc ou clique fora fecha. */
export function Dialog({ title, onClose, children, wide, footer }: { title: ReactNode; onClose: () => void; children: ReactNode; wide?: boolean; footer?: ReactNode }) {
  const reduce = useReducedMotion()
  const box = useRef<HTMLDivElement>(null)
  const close = useRef(onClose)
  useEffect(() => { close.current = onClose })
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    box.current?.querySelector<HTMLElement>('input,select,textarea,button:not([data-x])')?.focus()
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') close.current() }
    document.addEventListener('keydown', key)
    return () => { document.removeEventListener('keydown', key); prev?.focus?.() }
  }, [])
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 px-3 py-6 backdrop-blur-sm sm:py-12" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div
        ref={box}
        role="dialog"
        aria-modal="true"
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={clsx('panel w-full min-w-0 border-gold-dim bg-hull', wide ? 'max-w-5xl' : 'max-w-xl')}
      >
        <div className="mb-4 flex items-start justify-between gap-3 border-b border-line pb-3">
          <h2 className="panel-title min-w-0">{title}</h2>
          <button data-x className="btn btn-sm btn-ghost shrink-0" onClick={onClose}>Fechar</button>
        </div>
        <div className="min-w-0">{children}</div>
        {footer && <div className="mt-5 flex flex-wrap items-center justify-end gap-3 border-t border-line pt-4">{footer}</div>}
      </motion.div>
    </div>
  )
}

/** Título de bloco dentro dos painéis. */
export function Sub({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={clsx('font-display text-lg tracking-[.2em] text-bone/90', className)}>{children}</h3>
}

/** Cabeçalho de painel com ações à direita. */
export function PanelHead({ title, children }: { title: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <h2 className="panel-title">{title}</h2>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  )
}
