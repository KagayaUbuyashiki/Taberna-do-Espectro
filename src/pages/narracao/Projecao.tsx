import { useCallback, useEffect, useLayoutEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { toast } from '../../store/ui'

/** Pede tela cheia; devolve false se o navegador recusar ou não suportar. */
async function pedirTelaCheia(el: HTMLElement | null) {
  if (!el || !document.fullscreenEnabled || typeof el.requestFullscreen !== 'function') return false
  if (document.fullscreenElement === el) return true
  try { await el.requestFullscreen(); return true } catch { return false }
}

/**
 * Camada que cobre a tela inteira (abertura, cena projetada). Tenta tela cheia ao abrir;
 * se o navegador recusar, segue ocupando a janela. Clique, Esc ou sair da tela cheia fecham.
 */
export function Projecao({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const cheia = useRef(false)
  const pedindo = useRef(false)
  const fechar = useRef(onClose)
  useLayoutEffect(() => { fechar.current = onClose }, [onClose])

  const entrar = useCallback(async (avisar: boolean) => {
    if (pedindo.current) return
    pedindo.current = true
    const ok = await pedirTelaCheia(ref.current)
    pedindo.current = false
    cheia.current = ok
    if (!ok && avisar) toast('Tela cheia indisponível aqui: exibindo na janela.')
  }, [])

  // Ainda dentro do gesto do clique que abriu a camada
  useLayoutEffect(() => { void entrar(true) }, [entrar])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') fechar.current() }
    // Esc dentro da tela cheia só sai dela no navegador: fechamos junto
    const onFs = () => { if (cheia.current && !document.fullscreenElement) { cheia.current = false; fechar.current() } }
    window.addEventListener('keydown', onKey)
    document.addEventListener('fullscreenchange', onFs)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('fullscreenchange', onFs)
      document.body.style.overflow = overflow
      cheia.current = false
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    }
  }, [])

  return createPortal(
    <div ref={ref} role="dialog" aria-modal="true" aria-label={label} onClick={() => fechar.current()}
      className="fixed inset-0 z-[90] cursor-pointer overflow-hidden bg-black text-bone">
      {children}
      <div className="absolute bottom-[calc(16px+env(safe-area-inset-bottom,0px))] right-4 flex items-center gap-3">
        <button type="button" className="btn btn-sm btn-ghost bg-black/60"
          onClick={e => { e.stopPropagation(); void entrar(true) }}>Tela cheia</button>
        <span className="font-mono text-xs text-ash">clique ou Esc para sair</span>
      </div>
    </div>,
    document.body,
  )
}
