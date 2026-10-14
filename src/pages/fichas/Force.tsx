import { useState } from 'react'
import clsx from 'clsx'
import { type Calc } from '../../rules/engine'
import { d20, rollDamage } from '../../lib/rolls'
import { useStore } from '../../store/campaign'
import { toast } from '../../store/ui'
import { SFX } from '../../lib/sfx'
import { ASSET } from '../../lib/assets'
import { AssetImg } from '../../components/ui/AssetImg'
import { AlienText } from '../../components/AlienText'
import type { Character } from '../../rules/types'
import { Dialog, PanelHead, Sub } from './Dialog'
import { POWER_LIST, POWER_MAP, spendForcePoint } from './util'

type Props = { c: Character; K: Calc }
const patch = (c: Character, p: Partial<Character>) => useStore.getState().patchChar(c.id, p)

/** Pontos de Força, de Destino e Pontuação do Lado Sombrio. */
export function ForcePanel({ c, K }: Props) {
  const wis = K.A.sab
  const pips = Math.max(K.fpMax, c.fp)
  return (
    <section className="panel min-w-0">
      <PanelHead title="A Força" />
      <Sub>Pontos de Força <span className="font-mono text-sm text-holo">· {K.fDice}d{K.fDie} por uso</span></Sub>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1" role="group" aria-label="Pontos de Força">
          {Array.from({ length: pips }, (_, i) => (
            <button key={i} aria-label={`${i + 1} pontos de Força`} aria-pressed={i < c.fp}
              onClick={() => patch(c, { fp: c.fp === i + 1 ? i : i + 1 })}
              className={clsx('h-5 w-5 rotate-45 border transition-colors', i < c.fp ? 'border-holo bg-holo/80' : 'border-line-2 hover:border-holo')} />
          ))}
        </div>
        <span className="font-mono text-lg">{c.fp}/{K.fpMax}</span>
      </div>
      <button className="btn btn-sm mt-2 border-holo text-holo hover:bg-holo/10" disabled={c.fp <= 0} onClick={() => spendForcePoint(c)}>Gastar na última rolagem</button>

      <Sub className="mt-5">Pontos de Destino</Sub>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button className="btn btn-sm btn-ghost" aria-label="Menos um Ponto de Destino" onClick={() => patch(c, { dp: Math.max(0, (c.dp || 0) - 1) })}>−</button>
        <span className="w-8 text-center font-mono text-2xl text-gold">{c.dp || 0}</span>
        <button className="btn btn-sm btn-ghost" aria-label="Mais um Ponto de Destino" onClick={() => patch(c, { dp: (c.dp || 0) + 1 })}>+</button>
        <span className="min-w-0 text-sm text-ash">{c.destiny || 'Destino não definido'}</span>
      </div>

      <Sub className="mt-5">Lado Sombrio <span className="font-mono text-sm text-ash">· {c.ds || 0} de {wis}</span></Sub>
      <div className="mt-2 flex flex-wrap gap-1" role="group" aria-label="Pontuação do Lado Sombrio">
        {Array.from({ length: wis }, (_, i) => (
          <button key={i} aria-label={`Lado Sombrio ${i + 1}`} aria-pressed={i < (c.ds || 0)}
            onClick={() => patch(c, { ds: c.ds === i + 1 ? i : i + 1 })}
            className={clsx('h-5 w-4 border transition-colors', i < (c.ds || 0) ? 'border-ember bg-ember' : 'border-line-2 hover:border-ember')} />
        ))}
      </div>
      {(c.ds || 0) >= wis && <p className="chip mt-2 border-ember text-ember">Caiu para o lado sombrio</p>}
    </section>
  )
}

/** Poderes da Força: usar (teste de Usar a Força), recuperar com 1 PF, aprender e esquecer. */
export function PowersPanel({ c, K }: Props) {
  const [learn, setLearn] = useState(false)
  const [drop, setDrop] = useState<number | null>(null)
  const full = c.powers.length >= K.powersAllowed

  const use = (i: number) => {
    const p = c.powers[i]
    const P = POWER_MAP[p.n]
    const sk = K.sk['Usar a Força']
    if (!sk.usable) { toast('Precisa ser treinado em Usar a Força.'); return }
    const r = d20(p.n, sk.tot, c.name)
    SFX.force()
    let powers = c.powers.map((x, j) => (j === i ? { ...x, used: true } : x))
    const next: Partial<Character> = {}
    if (P?.desc === 'lado sombrio') { next.ds = Math.min(K.A.sab, (c.ds || 0) + 1); toast('Poder do lado sombrio: +1 na Pontuação do Lado Sombrio.') }
    if (r.nat === 20) { powers = powers.map(x => ({ ...x, used: false })); toast('20 natural: todos os poderes voltam no fim do turno.') }
    patch(c, { ...next, powers })
    if (P?.tiers) {
      const tier = [...P.tiers].reverse().find(t => r.total >= t[0])
      useStore.getState().pushRoll({ label: `${p.n}: efeito`, who: c.name, total: r.total, det: tier ? `CD ${tier[0]}: ${tier[1]}` : `falhou, abaixo da CD ${P.tiers[0][0]}` })
      const last = tier?.[1].split(',').pop()?.trim()
      if (last && /^\d+d6$/.test(last)) rollDamage(`${p.n}: dano`, last, c.name)
    } else if (P?.dmg) rollDamage(`${p.n}: dano`, P.dmg, c.name)
  }
  const recover = (i: number) => {
    if (c.fp <= 0) { toast('Sem Pontos de Força.'); return }
    patch(c, { fp: c.fp - 1, powers: c.powers.map((x, j) => (j === i ? { ...x, used: false } : x)) })
  }

  return (
    <section className="panel min-w-0">
      <PanelHead title="Poderes da Força">
        <span className="font-mono text-lg">{c.powers.length}/{K.powersAllowed}</span>
      </PanelHead>
      {!K.forceSens ? <p className="text-sm text-ash">Exige o talento Sensitividade da Força.</p> : (
        <>
          <div className="mb-3 flex flex-wrap gap-2">
            <button className="btn btn-sm border-holo text-holo hover:bg-holo/10" disabled={full} onClick={() => setLearn(true)}>+ Aprender poder</button>
            <button className="btn btn-sm btn-ghost" disabled={!c.powers.some(p => p.used)} onClick={() => patch(c, { powers: c.powers.map(p => ({ ...p, used: false })) })}>Recuperar todos (1 min de descanso)</button>
          </div>
          {!c.powers.length && <p className="text-sm text-ash">{K.powersAllowed ? 'Nenhum poder aprendido ainda.' : 'Pegue o talento Treinamento da Força para aprender poderes.'}</p>}
          <ul className="grid gap-3 sm:grid-cols-2">
            {c.powers.map((p, i) => {
              const P = POWER_MAP[p.n]
              const dark = P?.desc === 'lado sombrio'
              return (
                <li key={i} className={clsx('flex min-w-0 flex-col border bg-black/40', dark ? 'border-ember/60' : 'border-line-2', p.used && 'opacity-55')}>
                  <div className="relative aspect-[16/7] overflow-hidden border-b border-line bg-black">
                    <AssetImg path={ASSET.power(p.n)} className="h-full w-full object-cover" fallback={
                      <div className="scanlines grid h-full place-items-center">
                        <AlienText text={p.n} size={14} className={dark ? 'text-ember/70' : 'text-holo/70'} />
                      </div>
                    } />
                    {p.used && <span className="absolute right-2 top-2 chip border-ash bg-black/80">Usado</span>}
                  </div>
                  <div className="flex flex-1 flex-col gap-1 p-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <b className={clsx('font-display text-xl tracking-[.08em]', dark ? 'text-ember' : 'text-bone')}>{p.n}</b>
                      {P?.desc && <span className={clsx('chip', dark ? 'border-ember text-ember' : 'border-holo text-holo')}>{P.desc}</span>}
                    </div>
                    {P && <p className="text-xs text-ash">{P.t} · {P.a}</p>}
                    {P?.tiers && <p className="font-mono text-xs text-bone/80">{P.tiers.map(t => `CD ${t[0]}: ${t[1]}`).join(' · ')}</p>}
                    {P && <p className="text-sm text-bone/80">{P.d}</p>}
                    <div className="mt-auto flex flex-wrap gap-2 pt-2">
                      {p.used
                        ? <button className="btn btn-sm" disabled={c.fp <= 0} onClick={() => recover(i)}>Recuperar (1 PF)</button>
                        : <button className="btn btn-sm border-holo text-holo hover:bg-holo/10" onClick={() => use(i)}>Usar a Força</button>}
                      {drop === i
                        ? <><button className="btn btn-sm btn-danger" onClick={() => { patch(c, { powers: c.powers.filter((_, j) => j !== i) }); setDrop(null) }}>Esquecer</button><button className="btn btn-sm btn-ghost" onClick={() => setDrop(null)}>Não</button></>
                        : <button className="btn btn-sm btn-ghost" aria-label={`Esquecer ${p.n}`} onClick={() => setDrop(i)}>×</button>}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </>
      )}
      {learn && (
        <Dialog wide title="Aprender poder da Força" onClose={() => setLearn(false)}>
          <p className="mb-3 text-sm text-ash">Treinamento da Força: 1 + mod. de Sab poderes (mín. 1) por talento. O mesmo poder pode ser aprendido mais de uma vez. Vagas: {K.powersAllowed - c.powers.length}.</p>
          <ul className="grid max-h-[60vh] gap-2 overflow-y-auto pr-1 md:grid-cols-2">
            {POWER_LIST.map(p => (
              <li key={p.n} className="flex min-w-0 items-start gap-3 border border-line-2 bg-black/40 p-3">
                <div className="min-w-0 flex-1">
                  <b className={clsx('font-display text-lg tracking-[.08em]', p.desc === 'lado sombrio' ? 'text-ember' : 'text-bone')}>{p.n}</b>
                  {p.desc && <span className="chip ml-2">{p.desc}</span>}
                  <p className="text-xs text-ash">{p.t} · {p.a}</p>
                  <p className="text-sm text-bone/80">{p.d}</p>
                </div>
                <button className="btn btn-sm" disabled={full} onClick={() => { patch(c, { powers: [...c.powers, { n: p.n, used: false }] }); if (c.powers.length + 1 >= K.powersAllowed) setLearn(false) }}>+</button>
              </li>
            ))}
          </ul>
        </Dialog>
      )}
    </section>
  )
}
