/* Etapas 5 e 6: talentos (com poderes da Força) e aptidão. */
import { useState } from 'react'
import clsx from 'clsx'
import { ABIL_SHORT, FORCE_TREES, POWERS } from '../../data/saga'
import { calc, featOk, featReqText, has, talentOk, treesFor } from '../../rules/engine'
import {
  FEAT_LIST, TREE_MAP, autoFeats, choiceOptions, cl, freeFeatSlots, pickFeat, unpickFeat, type Feat, type StepProps, type Talent,
} from './draft'

const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

function Remover({ label, onClick }: { label: string; onClick: () => void }) {
  return <button type="button" aria-label={`Remover ${label}`} onClick={onClick} className="ml-1 px-1 text-ash hover:text-gold">×</button>
}

/* ===== 5. Talentos ===== */
export function PassoTalentos({ d, up }: StepProps) {
  const c = d.c
  const auto = autoFeats(c)
  const slots = freeFeatSlots(c)
  const K = calc(c)
  const pw = K.powersAllowed
  const semReq = cl(c).start.filter(f => !auto.includes(f))
  const cheio = d.picks.length >= slots

  return (
    <div className="grid gap-5 2xl:grid-cols-2">
      <section className="panel min-w-0 space-y-4 self-start">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="panel-title">Talentos</h2>
          <span className="font-mono text-xl text-gold">{d.picks.length} / {slots} escolhidos</span>
        </div>
        <div>
          <h3 className="font-display text-sm tracking-[.25em] text-gold">Recebidos automaticamente</h3>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {auto.length ? auto.map((f, i) => <span key={f + i} className="chip">{f}</span>) : <span className="text-sm text-ash">nenhum</span>}
          </div>
          {semReq.length > 0 && <p className="mt-2 text-sm text-ash">Sem o pré-requisito para: {semReq.join(', ')}.</p>}
        </div>
        <div>
          <h3 className="font-display text-sm tracking-[.25em] text-gold">Escolhidos</h3>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {d.picks.length ? d.picks.map((p, i) => (
              <span key={p + i} className="chip chip-gold">{p}<Remover label={p} onClick={() => up(x => unpickFeat(x, i))} /></span>
            )) : <span className="text-sm text-ash">Escolha na lista.</span>}
          </div>
        </div>

        {pw > 0 && (
          <div className="space-y-2 border-t border-line pt-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="panel-title">Poderes da Força</h2>
              <span className="font-mono text-xl text-gold">{d.powers.length} / {pw}</span>
            </div>
            <p className="text-sm text-ash">Treinamento da Força: 1 + mod. de Sab (mín. 1). O mesmo poder pode ser escolhido mais de uma vez.</p>
            <div className="flex flex-wrap gap-1.5">
              {d.powers.map((p, i) => (
                <span key={p + i} className="chip chip-gold">{p}<Remover label={p} onClick={() => up(x => { x.powers.splice(i, 1) })} /></span>
              ))}
            </div>
            <ul className="max-h-[32rem] space-y-1.5 overflow-y-auto pr-1">
              {POWERS.map(p => (
                <li key={p.n} className={clsx('flex items-start gap-3 border border-line-2 bg-black/60 px-3 py-2', d.powers.length >= pw && 'opacity-50')}>
                  <span className="min-w-0 flex-1">
                    <b className="font-display text-lg font-normal tracking-[.12em] text-bone">{p.n}</b>
                    {p.desc && <span className={clsx('chip ml-2 !text-xs', p.desc === 'lado sombrio' ? '!border-ember !text-ember' : 'chip-gold')}>{p.desc}</span>}
                    <small className="block text-xs text-ash">{p.t} · {p.d}</small>
                  </span>
                  <button type="button" className="btn btn-sm" aria-label={`Escolher ${p.n}`} disabled={d.powers.length >= pw} onClick={() => up(x => { x.powers.push(p.n) })}>+</button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="panel min-w-0 space-y-3">
        <h2 className="panel-title">Escolher talento</h2>
        {cheio ? <p className="text-ash">Você já escolheu todos os talentos do 1º nível. Remova um para trocar.</p> : <Seletor d={d} up={up} />}
      </section>
    </div>
  )
}

function Seletor({ d, up }: StepProps) {
  const c = d.c
  const K = calc(c)
  const [busca, setBusca] = useState('')
  const [soDisp, setSoDisp] = useState(false)
  const [esc, setEsc] = useState<Record<string, string>>({})

  const linhas = FEAT_LIST.map(f => {
    const opts = choiceOptions(c, f)
    const ok = featOk(c, f, K) && (!opts || opts.length > 0)
    return { f, opts, ok }
  }).filter(({ f, ok }) => (!soDisp || ok) && (!busca || norm(f.n + ' ' + f.d).includes(norm(busca))))

  const pegar = (f: Feat, opts: string[] | null) => {
    let nome = f.n
    if (opts) {
      const v = opts.includes(esc[f.n]) ? esc[f.n] : opts[0]
      if (!v) return
      nome = `${f.n} (${v})`
    }
    up(x => pickFeat(x, nome))
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <input className="input min-w-0 flex-1" type="search" placeholder="Buscar talento" aria-label="Buscar talento" value={busca} onChange={e => setBusca(e.target.value)} />
        <label className="flex items-center gap-2 font-display tracking-[.15em] text-ash">
          <input type="checkbox" className="size-4 accent-[#ffd24a]" checked={soDisp} onChange={e => setSoDisp(e.target.checked)} />
          Só disponíveis
        </label>
      </div>
      <ul className="max-h-[42rem] space-y-1.5 overflow-y-auto pr-1">
        {linhas.map(({ f, opts, ok }) => {
          const rq = featReqText(f)
          return (
            <li key={f.n} className={clsx('flex flex-wrap items-start gap-3 border px-3 py-2', ok ? 'border-line-2 bg-black/60' : 'border-line bg-black/30 opacity-50')}>
              <span className="min-w-0 flex-1 basis-48">
                <b className="font-display text-lg font-normal tracking-[.12em] text-bone">{f.n}</b>
                {rq && <span className="ml-1 text-xs text-ash">({rq})</span>}
                <small className="block text-xs text-ash">{f.d}</small>
                {opts && ok && (
                  <select className="input mt-1.5 !py-1 text-sm" aria-label={`Escolha para ${f.n}`} value={opts.includes(esc[f.n]) ? esc[f.n] : opts[0]} onChange={e => setEsc(s => ({ ...s, [f.n]: e.target.value }))}>
                    {opts.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                )}
              </span>
              <button type="button" className="btn btn-sm" disabled={!ok} onClick={() => pegar(f, opts)}>Pegar</button>
            </li>
          )
        })}
        {!linhas.length && <li className="text-ash">Nenhum talento encontrado.</li>}
      </ul>
    </>
  )
}

/* ===== 6. Aptidão ===== */
function reqTalento(x: Talent) {
  return [
    ...(x.p || []), ...(x.pf || []),
    ...Object.entries(x.abil || {}).map(([k, v]) => `${ABIL_SHORT[k]} ${v}`),
    x.bab ? `BBA +${x.bab}` : '', x.dark ? 'Lado Sombrio 1+' : '',
  ].filter(Boolean).join(', ')
}

export function PassoAptidao({ d, up }: StepProps) {
  const c = { ...d.c, talents: [] }
  const K = calc(c)
  const arvores = treesFor(d.c, d.c.cls[0])
  return (
    <div className="space-y-4">
      <p className="text-bone/90">
        Escolha uma aptidão de qualquer árvore da sua classe{has(d.c, 'Sensitividade da Força') ? ' ou das árvores da Força' : ''}.
        {' '}Selecionada: <b className="font-display text-xl font-normal tracking-[.12em] text-gold">{d.talent || 'nenhuma'}</b>
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        {arvores.map(t => (
          <section key={t} className="panel min-w-0 space-y-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="panel-title">{t}</h2>
              {FORCE_TREES.includes(t) && <span className="chip chip-gold">Força</span>}
            </div>
            <div className="space-y-1.5">
              {(TREE_MAP[t] || []).map(x => {
                const ok = talentOk(c, x, K)
                const on = d.talent === x.n
                const rq = reqTalento(x)
                return (
                  <button
                    key={x.n}
                    type="button"
                    aria-pressed={on}
                    disabled={!ok && !on}
                    onClick={() => up(n => { n.talent = x.n })}
                    className={clsx('block w-full border px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-45', on ? 'border-gold bg-gold/10' : 'border-line-2 bg-black/60 hover:border-gold/50')}
                  >
                    <b className={clsx('font-display text-lg font-normal tracking-[.12em]', on ? 'text-gold' : 'text-bone')}>{x.n}</b>
                    {rq && <span className="ml-1 text-xs text-ash">({rq})</span>}
                    <small className="block text-xs text-ash">{x.d}</small>
                  </button>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
