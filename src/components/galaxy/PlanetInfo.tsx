import clsx from 'clsx'
import { FUNCOES, MINERIOS, REGIOES, TAGS, TIERS, type Planeta, type Tag, type Tier } from '../../data/galaxy'
import { useGalaxy } from '../../store/galaxy'

export function TierBadge({ tier, className }: { tier: Tier; className?: string }) {
  return (
    <span className={clsx('inline-flex items-center gap-1.5 border px-2 py-0.5 font-display text-xs font-semibold uppercase tracking-[.2em]', className)}
      style={{ borderColor: TIERS[tier].cor, color: TIERS[tier].cor }}>
      Tier {tier} · {TIERS[tier].nome}
    </span>
  )
}

export function TagList({ tags, className }: { tags: Tag[]; className?: string }) {
  return (
    <ul className={clsx('flex flex-wrap gap-1', className)}>
      {tags.map(t => (
        <li key={t} className="border border-line bg-void/60 px-1.5 py-0.5 font-mono text-[11px] uppercase text-ash">#{TAGS[t]}</li>
      ))}
    </ul>
  )
}

/** Ficha do planeta: região, tier, tags, descrição, minérios e funções. */
export function PlanetInfo({ planeta, compacto }: { planeta: Planeta; compacto?: boolean }) {
  return (
    <div className="space-y-3">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-ash">{REGIOES[planeta.regiao].nome} · Quadrante {planeta.grade}</p>
        <h2 className="font-display text-3xl font-extrabold uppercase leading-none tracking-wide">{planeta.nome}</h2>
        <p className="mt-1 text-sm text-ash">{planeta.terreno}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <TierBadge tier={planeta.tier} />
        {planeta.tipo === 'kyber' && <span className="border border-line px-2 py-0.5 font-display text-xs uppercase tracking-[.2em] text-bone">Rastreio de kyber</span>}
        {planeta.tipo === 'segredo' && <span className="border border-ember px-2 py-0.5 font-display text-xs uppercase tracking-[.2em] text-ember">Oculto</span>}
      </div>
      <p className="leading-relaxed">{planeta.descricao}</p>
      <TagList tags={planeta.tags} />
      {!compacto && (planeta.minerios?.length ?? 0) > 0 && (
        <div>
          <h3 className="font-display text-sm uppercase tracking-[.2em] text-ember">Minérios exclusivos</h3>
          <ul className="mt-1 space-y-1 text-sm">
            {planeta.minerios!.map(m => <li key={m}><b className="text-bone">{MINERIOS[m].nome}:</b> <span className="text-ash">{MINERIOS[m].efeito}</span></li>)}
          </ul>
        </div>
      )}
      {!compacto && (planeta.funcoes?.length ?? 0) > 0 && (
        <div>
          <h3 className="font-display text-sm uppercase tracking-[.2em] text-ember">Serviços especiais</h3>
          <ul className="mt-1 space-y-1 text-sm">
            {planeta.funcoes!.map(f => <li key={f}><b className="text-bone">{FUNCOES[f].nome}:</b> <span className="text-ash">{FUNCOES[f].desc}</span></li>)}
          </ul>
        </div>
      )}
    </div>
  )
}

/** Interruptor do modo mestre (libera tudo e mostra os pedidos). */
export function MestreToggle() {
  const mestre = useGalaxy(s => s.mestre)
  const setMestre = useGalaxy(s => s.setMestre)
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 font-display text-xs font-semibold uppercase tracking-[.2em] text-ash">
      <input type="checkbox" className="peer sr-only" checked={mestre} onChange={e => setMestre(e.target.checked)} />
      <span className="relative h-5 w-9 border border-line bg-void transition-colors peer-checked:border-ember peer-checked:bg-blood peer-focus-visible:outline peer-focus-visible:outline-ember">
        <span className={clsx('absolute top-0.5 h-3.5 w-3.5 bg-bone transition-all', mestre ? 'left-[18px]' : 'left-0.5')} />
      </span>
      Modo mestre
    </label>
  )
}
