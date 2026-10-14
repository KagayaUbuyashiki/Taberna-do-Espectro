import { useState } from 'react'
import clsx from 'clsx'
import { motion, useReducedMotion } from 'motion/react'
import { BESTIARY, COND } from '../../data/saga'
import { sgn } from '../../rules/dice'
import { Portrait } from '../../components/ui/Portrait'
import { pushDamageLog } from './log'
import { BeastArt } from './BeastArt'
import { applyDmgComb, healComb, removeComb, rollInitOne, setCondComb, setTurn, type CombView } from './combat'
import { toast } from '../../store/ui'

const sideOf = (base?: string) => BESTIARY.find(b => b.n === base)?.side ?? ''

/** Faixa de um combatente na ordem de iniciativa. Heróis em dourado, inimigos em brasa; o turno atual acende. */
export function CombatRow({ v, active }: { v: CombView; active: boolean }) {
  const reduce = useReducedMotion()
  const [amt, setAmt] = useState('')
  const pct = v.hpMax > 0 ? Math.max(0, Math.min(100, (v.hp / v.hpMax) * 100)) : 0
  const pc = v.side === 'pc'
  const down = v.cond === 5
  const n = Math.max(0, Math.floor(+amt || 0))

  const dano = () => {
    if (!n) return
    const m = applyDmgComb(v.id, n)
    toast(m)
    pushDamageLog(v.name, n, m)
    setAmt('')
  }
  const cura = () => { if (!n) return; healComb(v.id, n); setAmt('') }

  return (
    <motion.li layout={reduce ? false : 'position'} transition={{ duration: 0.3 }}
      className={clsx('relative grid grid-cols-[auto_minmax(0,1fr)] gap-3 border py-3 pl-4 pr-3 transition-colors sm:grid-cols-[auto_auto_minmax(0,1fr)_auto]',
        active ? 'border-gold bg-gold/10 shadow-[0_0_24px_-6px_var(--color-gold)]' : 'border-line-2 bg-black/50', down && 'opacity-55')}
      aria-current={active ? 'step' : undefined}>
      {/* Faixa lateral: dourado para heróis, brasa para inimigos */}
      <span aria-hidden className={clsx('absolute inset-y-0 left-0 w-1', pc ? 'bg-gold' : 'bg-ember')} />
      {/* Iniciativa */}
      <div className="flex w-12 flex-col items-center justify-center">
        <span className={clsx('font-mono text-3xl leading-none', active ? 'text-gold [text-shadow:0_0_12px_var(--color-gold)]' : 'text-bone')}>{v.init ?? '–'}</span>
        <span className="mt-1 font-mono text-[10px] text-ash">{sgn(v.initMod)}</span>
      </div>

      {/* Retrato */}
      <div className="hidden w-14 sm:block">
        {pc ? <Portrait species={v.species ?? 'humano'} src={v.portrait} className="w-14" />
          : <BeastArt name={v.base ?? v.name} side={sideOf(v.base)} className="aspect-square w-14" />}
      </div>

      {/* Nome, defesas, condição e PV */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {active && <span className="font-display text-xs tracking-[.3em] text-gold">▶ Turno</span>}
          <span className={clsx('min-w-0 truncate font-display text-xl tracking-[.12em]', pc ? 'text-gold' : 'text-bone', down && 'line-through')}>{v.name}</span>
          <span className={clsx('chip !py-0 !text-[11px]', pc ? 'chip-gold' : '!border-ember/60 !text-ember')}>{pc ? 'Herói' : 'Inimigo'}</span>
        </div>
        <p className="mt-0.5 font-mono text-xs text-ash">Ref {v.ref} · Fort {v.fort} · Von {v.will} · Limiar {v.thr}</p>

        {/* Barra de PV fina */}
        <div className="mt-2 h-1 w-full bg-line" role="meter" aria-valuemin={0} aria-valuemax={v.hpMax} aria-valuenow={v.hp} aria-label={`PV de ${v.name}`}>
          <div className={clsx('h-full transition-[width] duration-300', pct <= 50 ? 'bg-ember' : pc ? 'bg-gold' : 'bg-bone/80')} style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-1 font-mono text-xs"><b className={clsx('font-normal', pct <= 50 ? 'text-ember' : 'text-bone')}>{v.hp}/{v.hpMax} PV</b> <span className="text-ash">· {COND[v.cond].l}</span></p>

        {/* Curso da condição */}
        <div className="mt-1.5 flex gap-1" role="group" aria-label={`Curso da condição de ${v.name}`}>
          {COND.map((k, i) => (
            <button key={k.k} type="button" title={k.l} aria-label={k.l} aria-pressed={v.cond === i} onClick={() => setCondComb(v.id, i)}
              className={clsx('h-3 flex-1 border transition-colors',
                i > 0 && v.cond >= i ? (i === 5 ? 'border-ember bg-ember' : 'border-gold-dim bg-gold-dim') : 'border-line-2 bg-black hover:border-gold',
                i === 0 && v.cond === 0 && 'border-gold bg-gold/40')} />
          ))}
        </div>

        {/* Dano e cura */}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <input type="number" inputMode="numeric" min={0} value={amt} placeholder="0" onChange={e => setAmt(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') dano() }}
            className="input !w-20 !px-2 !py-1 font-mono" aria-label={`Valor de dano ou cura para ${v.name}`} />
          <button type="button" className="btn btn-sm btn-danger" onClick={dano} disabled={!n}>Dano</button>
          <button type="button" className="btn btn-sm" onClick={cura} disabled={!n}>Cura</button>
        </div>
      </div>

      {/* Controles do turno */}
      <div className="col-span-2 flex gap-1.5 sm:col-span-1 sm:flex-col">
        <button type="button" className="btn btn-sm flex-1" onClick={() => setTurn(v.id)} title="Agir agora" aria-label={`${v.name} age agora`}>▶</button>
        <button type="button" className="btn btn-sm btn-ghost flex-1 font-mono" onClick={() => rollInitOne(v.id)} title="Rolar iniciativa" aria-label={`Rolar iniciativa de ${v.name}`}>d20</button>
        <button type="button" className="btn btn-sm btn-ghost flex-1" onClick={() => removeComb(v.id)} title="Remover" aria-label={`Remover ${v.name}`}>×</button>
      </div>
    </motion.li>
  )
}
