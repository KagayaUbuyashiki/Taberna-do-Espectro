import { useCallback, useState } from 'react'
import clsx from 'clsx'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { AssetImg } from '../../components/ui/AssetImg'
import { ASSET } from '../../lib/assets'
import { useStore } from '../../store/campaign'
import { toast } from '../../store/ui'
import { CENAS } from './dados'
import { Projecao } from './Projecao'

/** Cartão escuro com o nome da cena, enquanto a imagem não foi enviada. */
function SemImagem({ nome, grande }: { nome: string; grande?: boolean }) {
  return (
    <div className="relative grid h-full w-full place-items-center bg-gradient-to-br from-console via-hull to-black p-2">
      <div className="scanlines absolute inset-0 opacity-40" aria-hidden />
      <span className={clsx('relative text-center font-display text-gold/85', grande ? 'text-[clamp(2rem,6vw,4.5rem)] tracking-[.25em]' : 'text-lg leading-tight tracking-[.2em]')}>{nome}</span>
    </div>
  )
}

function Imagem({ id, nome, grande, className }: { id: string; nome: string; grande?: boolean; className?: string }) {
  return <AssetImg path={ASSET.scene(id)} alt={nome} className={className ?? 'h-full w-full object-cover'} fallback={<SemImagem nome={nome} grande={grande} />} />
}

/** Faixa de cenas: o mestre clica para pôr uma em destaque e pode projetá-la na tela inteira. */
export function Cenas() {
  const reduce = useReducedMotion()
  const patchCampaign = useStore(s => s.patchCampaign)
  const [sel, setSel] = useState<string | null>(null)
  const [projetar, setProjetar] = useState(false)
  const cena = CENAS.find(c => c.id === sel)
  const fechar = useCallback(() => setProjetar(false), [])

  const anotar = () => {
    if (!cena) return
    patchCampaign(c => ({ ...c, log: [...(c.log || []), { t: Date.now(), txt: `Cena: ${cena.nome}.` }] }))
    toast('Anotado no diário.')
  }

  return (
    <section className="panel" aria-labelledby="cenas-titulo">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="cenas-titulo" className="panel-title">Cenas</h2>
        <span className="font-mono text-xs tracking-[.2em] text-ash">{CENAS.length} CENAS · CLIQUE PARA DESTACAR</span>
      </div>

      <AnimatePresence initial={false} mode="wait">
        {cena && (
          <motion.div key={cena.id} className="mb-4"
            initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0 }} transition={{ duration: 0.25 }}>
            <div className="relative aspect-video max-h-[60vh] w-full overflow-hidden border border-gold/70 bg-black">
              <Imagem id={cena.id} nome={cena.nome} grande />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-4 pb-3 pt-10">
                <div className="kicker text-base">Em cena</div>
                <div className="font-display text-3xl tracking-[.2em] text-bone">{cena.nome}</div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="btn btn-sm btn-primary" onClick={() => setProjetar(true)}>Projetar em tela cheia</button>
              <button type="button" className="btn btn-sm" onClick={anotar}>Anotar no diário</button>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => setSel(null)}>Tirar de cena</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2" role="list">
        {CENAS.map(c => (
          <button key={c.id} type="button" role="listitem" aria-pressed={sel === c.id} onClick={() => setSel(sel === c.id ? null : c.id)}
            className={clsx('group relative aspect-video w-40 shrink-0 snap-start overflow-hidden border bg-black text-left transition-colors sm:w-48',
              sel === c.id ? 'border-gold' : 'border-line-2 hover:border-gold/70')}>
            <AssetImg path={ASSET.scene(c.id)} alt="" className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100" fallback={<SemImagem nome={c.nome} />} />
            <span className={clsx('absolute inset-x-0 bottom-0 bg-black/75 px-2 py-0.5 font-display text-sm tracking-[.18em]', sel === c.id ? 'text-gold' : 'text-bone/85')}>{c.nome}</span>
          </button>
        ))}
      </div>

      {projetar && cena && (
        <Projecao label={`Cena: ${cena.nome}`} onClose={fechar}>
          <div className="absolute inset-0 flex items-center justify-center">
            <Imagem id={cena.id} nome={cena.nome} grande className="max-h-full max-w-full object-contain" />
          </div>
          <div className="pointer-events-none absolute left-4 top-4 font-display text-2xl tracking-[.3em] text-gold/90">{cena.nome}</div>
        </Projecao>
      )}
    </section>
  )
}
