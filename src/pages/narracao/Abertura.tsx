import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { SFX } from '../../lib/sfx'
import type { Campaign } from '../../rules/types'
import { paragrafos } from './dados'
import { Projecao } from './Projecao'

/** Frase de entrada própria da mesa (letreiro original, sem citar filmes). */
const ENTRADA = 'Muito além das rotas conhecidas, entre sóis que ninguém mais lembra...'

/** Campo de estrelas estático desenhado num canvas. */
function Estrelas() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = ref.current
    const x = cv?.getContext('2d')
    if (!cv || !x) return
    const desenha = () => {
      const dpr = window.devicePixelRatio || 1
      cv.width = innerWidth * dpr
      cv.height = innerHeight * dpr
      x.clearRect(0, 0, cv.width, cv.height)
      for (let i = 0; i < 500; i++) {
        x.fillStyle = Math.random() > 0.94 ? `rgba(255,224,150,${Math.random()})` : `rgba(255,255,255,${Math.random()})`
        x.fillRect(Math.random() * cv.width, Math.random() * cv.height, Math.random() * 1.6 * dpr, Math.random() * 1.6 * dpr)
      }
    }
    desenha()
    window.addEventListener('resize', desenha)
    return () => window.removeEventListener('resize', desenha)
  }, [])
  return <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden />
}

/** Abertura em tela cheia: frase de entrada, título que encolhe e texto subindo em perspectiva. */
export function Abertura({ crawl, onClose }: { crawl: Campaign['crawl']; onClose: () => void }) {
  const reduce = useReducedMotion()
  const stage = useRef<HTMLDivElement>(null)
  const texto = useRef<HTMLDivElement>(null)
  // Quanto o texto precisa subir (em % do palco) para sumir por inteiro
  const [fim, setFim] = useState<number | null>(null)
  const ps = paragrafos(crawl.body)
  const titulo = crawl.title.toUpperCase()

  useLayoutEffect(() => {
    if (reduce || !stage.current || !texto.current) return
    const H = stage.current.clientHeight || 1
    const h = texto.current.offsetHeight
    setFim(Math.max(260, (h / H) * 100 * 1.7 + 80))
  }, [reduce, crawl.body])

  // Nota de abertura quando o título aparece (só se o som estiver ligado)
  useEffect(() => {
    if (reduce) return
    const t = setTimeout(() => SFX.crit(), 6000)
    return () => clearTimeout(t)
  }, [reduce])

  return (
    <Projecao label="Abertura da sessão" onClose={onClose}>
      <Estrelas />
      {reduce ? (
        // Sem animação: o texto aparece parado e pode ser rolado
        <div className="absolute inset-0 overflow-y-auto px-6 py-16">
          <div className="mx-auto max-w-[720px] text-justify font-body text-[clamp(1.05rem,2.6vw,1.6rem)] font-semibold leading-relaxed text-gold">
            <p className="mb-8 text-center font-body text-base font-normal text-holo">{ENTRADA}</p>
            <h3 className="text-center font-display text-[1em] tracking-[.2em]">{crawl.ep}</h3>
            <h2 className="mb-6 text-center font-display text-[1.6em] tracking-[.18em]">{titulo}</h2>
            {ps.map((p, i) => <p key={i} className="mb-5">{p}</p>)}
          </div>
        </div>
      ) : (
        <>
          <motion.div className="absolute inset-0 flex items-center justify-center px-[10%] text-center font-body text-[clamp(1rem,2.6vw,1.6rem)] text-holo"
            initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0] }} transition={{ duration: 6, times: [0, 0.15, 0.75, 1], ease: 'easeInOut' }}>
            {ENTRADA}
          </motion.div>
          <motion.div className="pointer-events-none absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 2.4 }} animate={{ opacity: [1, 1, 0], scale: [2.4, 0.2, 0.05] }}
            transition={{ delay: 6, duration: 8, times: [0, 0.9, 1], ease: 'easeIn' }}>
            <span className="px-4 text-center font-display text-[clamp(2rem,9vw,7rem)] leading-none tracking-[.12em] text-gold [text-shadow:0_0_24px_rgba(255,210,74,.35)]">
              {titulo}
            </span>
          </motion.div>
          <div ref={stage} className="absolute inset-0 flex justify-center overflow-hidden [perspective:360px]">
            <motion.div ref={texto}
              className="absolute w-[min(780px,86vw)] text-justify font-body text-[clamp(1.1rem,3vw,2.1rem)] font-semibold leading-[1.45] text-gold"
              style={{ top: '100%', rotateX: 24, transformOrigin: '50% 0' }}
              animate={fim != null ? { top: `-${fim}%` } : undefined}
              transition={{ delay: 9, duration: 70 * ((fim ?? 260) + 100) / 360, ease: 'linear' }}>
              <h3 className="mb-[.3em] text-center font-display text-[1em] font-normal tracking-[.2em]">{crawl.ep}</h3>
              <h2 className="mb-[1em] text-center font-display text-[1.3em] font-normal tracking-[.18em]">{titulo}</h2>
              {ps.map((p, i) => <p key={i} className="mb-[1em]">{p}</p>)}
            </motion.div>
          </div>
        </>
      )}
    </Projecao>
  )
}
