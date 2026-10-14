import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { FORCE_TREES } from '../../data/saga'
import { calc, featOk, featReqText, talentOk } from '../../rules/engine'
import type { Character } from '../../rules/types'
import { choiceOptions, FEAT_LIST, TREE_MAP } from './util'

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Lista de talentos com pré-requisitos; os que não cumprem ficam apagados. `allowed` restringe (talentos bônus de classe). */
export function FeatPicker({ c, allowed, onPick }: { c: Character; allowed: string[] | null; onPick: (name: string) => void }) {
  const K = useMemo(() => calc(c), [c])
  const [q, setQ] = useState('')
  const [choice, setChoice] = useState<Record<string, string>>({})
  const [soOk, setSoOk] = useState(false)
  const list = allowed ? FEAT_LIST.filter(f => allowed.some(a => a === f.n || a.startsWith(f.n + ' ('))) : FEAT_LIST
  const rows = list.map(f => {
    const opts = choiceOptions(c, f, allowed)
    let ok = featOk(c, f, K)
    if (opts && !opts.length) ok = false
    return { f, opts, ok }
  }).filter(r => (!q || norm(r.f.n + ' ' + r.f.d).includes(norm(q))) && (!soOk || r.ok))
  return (
    <div className="min-w-0">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <input className="input max-w-xs" placeholder="Buscar talento" aria-label="Buscar talento" value={q} onChange={e => setQ(e.target.value)} />
        <label className="flex items-center gap-2 text-sm text-ash"><input type="checkbox" checked={soOk} onChange={e => setSoOk(e.target.checked)} /> Só os disponíveis</label>
      </div>
      <ul className="grid max-h-[55vh] gap-2 overflow-y-auto pr-1 md:grid-cols-2">
        {rows.map(({ f, opts, ok }) => {
          const rq = featReqText(f)
          const sel = opts ? (choice[f.n] && opts.includes(choice[f.n]) ? choice[f.n] : opts[0]) : ''
          return (
            <li key={f.n} className={clsx('flex min-w-0 flex-col gap-2 border border-line-2 bg-black/50 p-3', !ok && 'opacity-45')}>
              <div className="min-w-0">
                <b className="font-display text-lg tracking-[.1em] text-bone">{f.n}</b>
                {rq && <span className="ml-2 text-xs text-ash">({rq})</span>}
                <p className="text-sm text-bone/75">{f.d}</p>
              </div>
              <div className="mt-auto flex flex-wrap items-center gap-2">
                {opts && ok && (
                  <select className="input w-auto min-w-0 flex-1 py-1 text-sm" aria-label={`Escolha para ${f.n}`} value={sel} onChange={e => setChoice(s => ({ ...s, [f.n]: e.target.value }))}>
                    {opts.map(o => <option key={o}>{o}</option>)}
                  </select>
                )}
                <button className="btn btn-sm ml-auto" disabled={!ok} onClick={() => onPick(opts ? `${f.n} (${sel})` : f.n)}>Pegar</button>
              </div>
            </li>
          )
        })}
        {!rows.length && <li className="text-ash">Nenhum talento encontrado.</li>}
      </ul>
    </div>
  )
}

/** Aptidões (talentos de classe) das árvores dadas. */
export function TalentPicker({ c, trees, selected, onPick }: { c: Character; trees: string[]; selected?: string | null; onPick: (name: string) => void }) {
  const K = useMemo(() => calc(c), [c])
  return (
    <div className="grid max-h-[60vh] gap-3 overflow-y-auto pr-1 md:grid-cols-2">
      {trees.map(t => (
        <section key={t} className="min-w-0 border border-line-2 bg-black/40 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="font-display text-xl tracking-[.15em] text-gold">{t}</h3>
            {FORCE_TREES.includes(t) && <span className="chip border-holo text-holo">Força</span>}
          </div>
          <ul className="flex flex-col gap-1.5">
            {(TREE_MAP[t] || []).map(x => {
              const ok = talentOk(c, x, K)
              const on = selected === x.n
              const req = [...(x.p || []), ...(x.pf || []), x.bab ? `BBA +${x.bab}` : '', x.dark ? 'Lado Sombrio 1+' : ''].filter(Boolean).join(', ')
              return (
                <li key={x.n}>
                  <button
                    disabled={!ok && !on}
                    onClick={() => onPick(x.n)}
                    aria-pressed={on}
                    className={clsx('w-full border px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                      on ? 'border-gold bg-gold/10' : 'border-line-2 hover:border-gold')}
                  >
                    <b className={clsx('font-display text-base tracking-[.1em]', x.dark ? 'text-ember' : 'text-bone')}>{x.n}</b>
                    {req && <span className="ml-2 text-xs text-ash">({req})</span>}
                    <span className="block text-sm text-bone/75">{x.d}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
