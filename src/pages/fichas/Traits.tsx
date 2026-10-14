import { useState } from 'react'
import clsx from 'clsx'
import { ABIL_SHORT, FORCE_TREES, GEAR, TREE_OF } from '../../data/saga'
import { treesFor, type Calc } from '../../rules/engine'
import { sgn } from '../../rules/dice'
import { useStore } from '../../store/campaign'
import type { Character } from '../../rules/types'
import { Dialog, PanelHead, Sub } from './Dialog'
import { FeatPicker, TalentPicker } from './Pickers'
import { addFeats, featDef, rollSkill, SKILL_FEAT, TREE_MAP } from './util'

type Props = { c: Character; K: Calc }
const patch = (c: Character, p: Partial<Character>) => useStore.getState().patchChar(c.id, p)

/** Perícias clicáveis; em Editar marca as treinadas. */
export function SkillsPanel({ c, K }: Props) {
  const [edit, setEdit] = useState(false)
  const toggle = (n: string, on: boolean) => patch(c, { trained: on ? [...c.trained, n] : c.trained.filter(s => s !== n) })
  const rows = K.skills.filter(s => edit || !s.know || s.tr)
  return (
    <section className="panel min-w-0">
      <PanelHead title="Perícias">
        <button className={clsx('btn btn-sm', edit ? 'btn-primary' : 'btn-ghost')} onClick={() => setEdit(e => !e)}>{edit ? 'Pronto' : 'Editar'}</button>
      </PanelHead>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <tbody>
            {rows.map(s => (
              <tr key={s.n} className={clsx('border-b border-line', s.usable && !edit && 'cursor-pointer hover:bg-gold/5')}
                onClick={edit ? undefined : () => rollSkill(c, K, s.n)} title={edit ? undefined : s.usable ? 'Clique para rolar' : 'Exige treinamento'}>
                <td className="w-6 py-1.5 pr-1">
                  {edit
                    ? <input type="checkbox" checked={s.tr} onChange={e => toggle(s.n, e.target.checked)} aria-label={`Treinado em ${s.n}`} />
                    : <span className={clsx('block h-2.5 w-2.5 rotate-45 border', s.tr ? 'border-gold bg-gold' : 'border-line-2')} title={s.tr ? 'Treinada' : 'Não treinada'} />}
                </td>
                <td className="min-w-0 py-1.5">
                  {s.usable && !edit
                    ? <button className="text-left hover:text-gold" onClick={e => { e.stopPropagation(); rollSkill(c, K, s.n) }}>{s.n}</button>
                    : <span className={clsx(!s.usable && 'text-ash')}>{s.n}</span>}
                  {s.focus && <span className="chip chip-gold ml-1.5 px-1 py-0 text-xs">Foco</span>}
                  {s.reroll && <span className="chip ml-1.5 border-holo px-1 py-0 text-xs text-holo" title="Traço de espécie">re-rola</span>}
                </td>
                <td className="px-2 py-1.5 font-mono text-xs text-ash">{ABIL_SHORT[s.a]}</td>
                <td className={clsx('py-1.5 text-right font-mono text-base', s.usable ? 'text-gold' : 'text-ash/60')}>{s.usable ? sgn(s.tot) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!edit && <p className="mt-2 text-xs text-ash">Conhecimentos não treinados ficam ocultos. Em Editar você marca perícias treinadas.</p>}
    </section>
  )
}

/** Talentos, aptidões (talentos de classe) e traços da espécie. */
export function FeatsPanel({ c, K }: Props) {
  const [add, setAdd] = useState<'feat' | 'talent' | null>(null)
  const trees = [...new Set(c.cls.flatMap(k => treesFor(c, k)))]
  const dropFeat = (i: number) => {
    const f = c.feats[i]
    patch(c, {
      feats: c.feats.filter((_, j) => j !== i),
      trained: f.startsWith(SKILL_FEAT) ? c.trained.filter(s => s !== f.slice(SKILL_FEAT.length, -1)) : c.trained,
    })
  }
  return (
    <section className="panel min-w-0">
      <PanelHead title="Talentos e aptidões">
        <button className="btn btn-sm" onClick={() => setAdd('feat')}>+ Talento</button>
        <button className="btn btn-sm" onClick={() => setAdd('talent')}>+ Aptidão</button>
      </PanelHead>
      <Sub>Talentos</Sub>
      <ul className="mt-2 flex flex-wrap gap-2">
        {c.feats.map((f, i) => (
          <li key={i} className="chip max-w-full border-gold-dim text-bone" title={featDef(f)?.d || ''}>
            <span className="min-w-0 truncate">{f}</span>
            <button className="ml-1 text-ash hover:text-ember" onClick={() => dropFeat(i)} aria-label={`Remover ${f}`}>×</button>
          </li>
        ))}
        {!c.feats.length && <li className="text-sm text-ash">Nenhum.</li>}
      </ul>

      <Sub className="mt-5">Aptidões <span className="text-sm text-ash">(talentos de classe)</span></Sub>
      <ul className="mt-2 flex flex-col gap-2">
        {c.talents.map((t, i) => {
          const tree = TREE_OF[t]
          const T = (TREE_MAP[tree] || []).find(x => x.n === t)
          return (
            <li key={i} className="border-l-2 border-gold-dim pl-3">
              <div className="flex flex-wrap items-center gap-2">
                <b className={clsx('font-display text-lg tracking-[.08em]', T?.dark ? 'text-ember' : 'text-gold')}>{t}</b>
                {tree && <span className={clsx('chip', FORCE_TREES.includes(tree) && 'border-holo text-holo')}>{tree}</span>}
                <button className="text-ash hover:text-ember" onClick={() => patch(c, { talents: c.talents.filter((_, j) => j !== i) })} aria-label={`Remover ${t}`}>×</button>
              </div>
              {T?.d && <p className="text-sm text-bone/75">{T.d}</p>}
            </li>
          )
        })}
        {!c.talents.length && <li className="text-sm text-ash">Nenhuma.</li>}
      </ul>

      <Sub className="mt-5">Traços da espécie</Sub>
      <ul className="mt-2 list-inside list-disc text-sm text-bone/75">
        {(K.sp.traits as string[]).map(t => <li key={t}>{t}</li>)}
      </ul>

      {add === 'feat' && (
        <Dialog wide title="Adicionar talento" onClose={() => setAdd(null)}>
          <p className="mb-3 text-sm text-ash">Talentos sem pré-requisito cumprido ficam apagados.</p>
          <FeatPicker c={c} allowed={null} onPick={n => { patch(c, addFeats(c, [n])); setAdd(null) }} />
        </Dialog>
      )}
      {add === 'talent' && (
        <Dialog wide title="Adicionar aptidão" onClose={() => setAdd(null)}>
          <TalentPicker c={c} trees={trees} onPick={n => { patch(c, { talents: [...c.talents, n] }); setAdd(null) }} />
        </Dialog>
      )}
    </section>
  )
}

/** Créditos, equipamento e carga. */
export function GearPanel({ c, K }: Props) {
  const [item, setItem] = useState('')
  const weight = c.gear.reduce((s, g) => s + (+g.w || 0) * (g.q || 1), 0)
  // Carga (livro p. 140): pesada a partir de (½ Vig)² kg; erguer no máximo Vig² kg, só cambaleando. Pequeno ×0,75.
  const size = K.sp.size === 'Pequeno' ? 0.75 : 1
  const light = (K.A.vig / 2) ** 2 * size
  const heavy = K.A.vig ** 2 * size
  const load = weight > heavy ? 'acima do limite' : weight >= light ? 'carga pesada' : 'carga normal'
  const setGear = (gear: Character['gear']) => patch(c, { gear })
  const add = () => {
    const v = item.trim()
    if (!v) return
    const g = GEAR.find(x => x[0] === v)
    setGear([...c.gear, { n: v, q: 1, w: g ? +g[2] : 0 }])
    setItem('')
  }
  const fmt = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
  return (
    <section className="panel min-w-0">
      <PanelHead title="Equipamento" />
      <label className="field max-w-[12rem]">Créditos
        <input className="input py-1.5 font-mono" type="number" value={c.credits || 0} onChange={e => patch(c, { credits: +e.target.value || 0 })} />
      </label>
      <div className="mt-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
          <span className="font-mono">{fmt(weight)} kg</span>
          <span className={clsx('font-display tracking-[.15em]', weight > heavy ? 'text-ember' : weight >= light ? 'text-gold' : 'text-ash')}>{load}</span>
        </div>
        <div className="mt-1 h-1.5 w-full bg-black/70 ring-1 ring-line-2">
          <div className={clsx('h-full', weight > heavy ? 'bg-ember' : 'bg-gold-dim')} style={{ width: `${Math.min(100, (weight / heavy) * 100)}%` }} />
        </div>
        <p className="mt-1 text-xs text-ash">Carga pesada a partir de {fmt(light)} kg · máximo (cambaleando) {fmt(heavy)} kg</p>
      </div>
      <ul className="mt-3 flex flex-col">
        {c.gear.map((g, i) => (
          <li key={i} className="flex items-center gap-2 border-b border-line py-1.5">
            <span className="min-w-0 flex-1 truncate">{g.n}</span>
            <span className="font-mono text-xs text-ash">{fmt((+g.w || 0) * (g.q || 1))} kg</span>
            <button className="px-1 text-ash hover:text-gold" aria-label={`Menos ${g.n}`} onClick={() => setGear(g.q > 1 ? c.gear.map((x, j) => (j === i ? { ...x, q: x.q - 1 } : x)) : c.gear)}>−</button>
            <span className="w-6 text-center font-mono">{g.q || 1}</span>
            <button className="px-1 text-ash hover:text-gold" aria-label={`Mais ${g.n}`} onClick={() => setGear(c.gear.map((x, j) => (j === i ? { ...x, q: (x.q || 1) + 1 } : x)))}>+</button>
            <button className="px-1 text-ash hover:text-ember" aria-label={`Remover ${g.n}`} onClick={() => setGear(c.gear.filter((_, j) => j !== i))}>×</button>
          </li>
        ))}
      </ul>
      <form className="mt-3 flex gap-2" onSubmit={e => { e.preventDefault(); add() }}>
        <input className="input min-w-0 flex-1 py-1.5" list="fichas-gear" placeholder="Adicionar item" aria-label="Item" value={item} onChange={e => setItem(e.target.value)} />
        <datalist id="fichas-gear">{GEAR.map(g => <option key={String(g[0])} value={String(g[0])} />)}</datalist>
        <button className="btn btn-sm">+</button>
      </form>
    </section>
  )
}

/** Destino, idiomas e anotações. */
export function NotesPanel({ c }: { c: Character }) {
  return (
    <section className="panel min-w-0">
      <PanelHead title="História e anotações" />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="field">Destino<input className="input" value={c.destiny} onChange={e => patch(c, { destiny: e.target.value })} /></label>
        <label className="field">Idiomas<input className="input" value={c.langs} onChange={e => patch(c, { langs: e.target.value })} /></label>
      </div>
      <label className="field mt-3">Anotações
        <textarea className="input min-h-36" value={c.notes} onChange={e => patch(c, { notes: e.target.value })} />
      </label>
    </section>
  )
}
