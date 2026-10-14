import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { RANGES } from '../data/saga'
import { PageHeader } from '../components/ui/PageHeader'
import { AssetImg } from '../components/ui/AssetImg'
import { ASSET } from '../lib/assets'
import { calc, uid } from '../rules/engine'
import type { MapToken } from '../rules/types'
import { useStore } from '../store/campaign'
import { toast } from '../store/ui'
import { combView, type CombView } from './mesa/combat'
import { SCENES } from './mapas/scenes'
import { fogOf, inkOn } from './mapas/geometry'
import { TacticalMap, type MapState, type RangeKey, type TokInfo, type Tool } from './mapas/TacticalMap'

const TOOLS: [Tool, string, string][] = [
  ['mover', '✥', 'Mover'], ['medir', '⟷', 'Medir'], ['parede', '▭', 'Parede'], ['apagar', '⌫', 'Apagar parede'], ['cobrir', '▒', 'Cobrir névoa'], ['revelar', '◌', 'Revelar'],
]
const HERO = '#ffd24a'
const ENEMY = '#c4141c'
const CHAR = 'char:'

const initials = (name: string) => name.split(/\s+/).filter(Boolean).map(w => w[0]).join('').toUpperCase()
/** Rótulo da ficha: iniciais; inimigos levam o número do fim do nome ("Stormtrooper 2" → "S2"). */
function tokLabel(name: string, pc: boolean) {
  const num = pc ? '' : (name.match(/\d+$/) ?? [''])[0]
  return (initials(name.replace(/\s*\d+$/, '')).slice(0, Math.max(1, 3 - num.length)) + num).slice(0, 3) || 'X'
}

export default function Mapas() {
  const m = useStore(s => s.campaign.map)
  const combat = useStore(s => s.campaign.combat)
  const chars = useStore(s => s.chars)
  const patchCampaign = useStore(s => s.patchCampaign)
  const [tool, setTool] = useState<Tool>('mover')
  const [gmView, setGmView] = useState(true)
  const [range, setRange] = useState<RangeKey>('pistolas')
  const [zoom, setZoom] = useState<'ajustar' | number>('ajustar')
  const [sel, setSel] = useState<string | null>(null)
  const [novo, setNovo] = useState<{ l: string; c: string } | null>(null)

  const views = useMemo(() => combat.list.map(x => combView(x, chars)).filter((v): v is CombView => !!v), [combat.list, chars])
  const byId = useMemo(() => Object.fromEntries(views.map(v => [v.id, v])), [views])
  // PV de cada ficha ligada: a combatente ou a personagem.
  const info = useMemo<TokInfo>(() => {
    const out: TokInfo = {}
    m.tokens.forEach(t => {
      if (!t.ref) return
      const v = byId[t.ref]
      if (v) { out[t.ref] = { pct: v.hpMax ? v.hp / v.hpMax : 0, down: v.cond === 5 }; return }
      const c = t.ref.startsWith(CHAR) ? chars[t.ref.slice(CHAR.length)] : undefined
      if (c) { const max = calc(c).hpMax; out[t.ref] = { pct: max ? c.hp / max : 0, down: c.cond === 5 } }
    })
    return out
  }, [m.tokens, byId, chars])
  const nameOf = (t: MapToken) => !t.ref ? '' : t.ref.startsWith(CHAR) ? chars[t.ref.slice(CHAR.length)]?.name ?? '' : byId[t.ref]?.name ?? ''
  const selTok = m.tokens.find(t => t.id === sel)

  const patchMap = (fn: (mp: MapState) => MapState) => patchCampaign(c => ({ ...c, map: fn({ ...c.map, fog: fogOf(c.map) }) }))

  const setSize = (k: 'cols' | 'rows', raw: string) => {
    const [lo, hi] = k === 'cols' ? [8, 60] : [6, 40]
    const v = Math.max(lo, Math.min(hi, Math.floor(+raw) || 10))
    patchMap(mp => {
      const n = { ...mp, [k]: v }
      return { ...n, fog: '0'.repeat(n.cols * n.rows), tokens: n.tokens.map(t => ({ ...t, x: Math.min(t.x, n.cols - 1), y: Math.min(t.y, n.rows - 1) })) }
    })
  }

  // Combatentes da mesa: heróis à esquerda, inimigos à direita.
  const trazerCombate = () => {
    let i = 0
    patchMap(mp => {
      const tokens = [...mp.tokens]
      views.forEach(v => {
        const pc = v.side === 'pc'
        if (tokens.some(t => t.ref === v.id || (pc && t.ref === CHAR + v.charId))) return
        tokens.push({ id: uid(), ref: v.id, label: tokLabel(v.name, pc), color: pc ? HERO : ENEMY, x: pc ? 1 + (i % 3) : mp.cols - 2 - (i % 3), y: Math.min(mp.rows - 1, 2 + Math.floor(i / 3)) })
        i++
      })
      return { ...mp, tokens }
    })
    if (!i) toast('Nenhum combatente novo na mesa.')
  }
  // Fichas dos personagens da campanha (fora do combate também).
  const trazerHerois = () => {
    let i = 0
    patchMap(mp => {
      const tokens = [...mp.tokens]
      Object.values(chars).forEach(c => {
        const noCombate = views.find(v => v.charId === c.id)
        if (tokens.some(t => t.ref === CHAR + c.id || (noCombate && t.ref === noCombate.id))) return
        tokens.push({ id: uid(), ref: CHAR + c.id, label: tokLabel(c.name || 'Herói', true), color: HERO, x: 1 + (i % 3), y: Math.min(mp.rows - 1, 2 + Math.floor(i / 3)) })
        i++
      })
      return { ...mp, tokens }
    })
    if (!i) toast('Todos os heróis já estão no mapa.')
  }
  const colocar = () => {
    if (!novo) return
    patchMap(mp => ({ ...mp, tokens: [...mp.tokens, { id: uid(), label: (novo.l || 'X').toUpperCase().slice(0, 3), color: novo.c, x: Math.floor(mp.cols / 2), y: Math.floor(mp.rows / 2) }] }))
    setNovo(null)
  }
  const remover = (id: string) => { patchMap(mp => ({ ...mp, tokens: mp.tokens.filter(t => t.id !== id) })); if (sel === id) setSel(null) }

  return (
    <div className="space-y-6">
      <PageHeader bg="mapas" kicker="Holomesa tática" title="Mapas"
        actions={<span className="chip chip-gold font-mono">1 quadrado = 1,5 m</span>}>
        Grade de combate com fichas, paredes, névoa de guerra e régua de alcance. Diagonais contam 1 e 2 quadrados alternados.
      </PageHeader>

      {/* Cenário e tamanho */}
      <section className="panel">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_1fr_1fr_minmax(0,1.4fr)_minmax(0,1fr)]">
          <label className="field min-w-0">Cenário
            <select className="input !py-1.5" value={m.scene} onChange={e => patchMap(mp => ({ ...mp, scene: e.target.value }))}>
              {Object.entries(SCENES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label className="field min-w-0">Colunas
            <input key={`c${m.cols}`} className="input !py-1.5 font-mono" type="number" min={8} max={60} defaultValue={m.cols} onBlur={e => setSize('cols', e.target.value)} onKeyDown={e => { if (e.key === 'Enter') setSize('cols', e.currentTarget.value) }} />
          </label>
          <label className="field min-w-0">Linhas
            <input key={`r${m.rows}`} className="input !py-1.5 font-mono" type="number" min={6} max={40} defaultValue={m.rows} onBlur={e => setSize('rows', e.target.value)} onKeyDown={e => { if (e.key === 'Enter') setSize('rows', e.currentTarget.value) }} />
          </label>
          <label className="field min-w-0">Alcance da régua
            <select className="input !py-1.5" value={range} onChange={e => setRange(e.target.value as RangeKey)}>
              {(Object.keys(RANGES) as RangeKey[]).map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </label>
          <label className="field min-w-0">Zoom
            <select className="input !py-1.5" value={String(zoom)} onChange={e => setZoom(e.target.value === 'ajustar' ? 'ajustar' : +e.target.value)}>
              <option value="ajustar">Ajustar à tela</option><option value="0.75">75%</option><option value="1">100%</option><option value="1.5">150%</option>
            </select>
          </label>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        {/* Mapa na moldura com scanlines e barra de ferramentas */}
        <section className="scanlines min-w-0 border border-line-2 bg-panel/90 p-2 sm:p-3">
          <div className="mb-2 flex flex-wrap items-center gap-1.5" role="toolbar" aria-label="Ferramentas do mapa">
            {TOOLS.map(([id, ico, l]) => (
              <button key={id} type="button" aria-pressed={tool === id} onClick={() => setTool(id)}
                className={clsx('btn btn-sm', tool === id ? 'btn-primary' : 'btn-ghost')}>
                <span aria-hidden className="font-mono">{ico}</span>{l}
              </button>
            ))}
          </div>
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <button type="button" className="btn btn-sm" onClick={trazerCombate}>Trazer combatentes</button>
            <button type="button" className="btn btn-sm" onClick={trazerHerois}>Trazer heróis</button>
            <button type="button" className="btn btn-sm" onClick={() => setNovo(novo ? null : { l: 'X', c: '#5fd38a' })} aria-expanded={!!novo}>+ Ficha</button>
            {selTok && <button type="button" className="btn btn-sm btn-danger" onClick={() => remover(selTok.id)}>Remover ficha</button>}
            <span className="mx-1 hidden h-6 w-px bg-line-2 sm:block" />
            <label className="flex items-center gap-1.5 font-display text-sm tracking-[.15em] text-ash">
              <input type="checkbox" className="accent-[var(--color-gold)]" checked={m.fogOn} onChange={e => patchMap(mp => ({ ...mp, fogOn: e.target.checked }))} /> Névoa de guerra
            </label>
            <label className="flex items-center gap-1.5 font-display text-sm tracking-[.15em] text-ash">
              <input type="checkbox" className="accent-[var(--color-gold)]" checked={gmView} onChange={e => setGmView(e.target.checked)} /> Visão do mestre
            </label>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => patchMap(mp => ({ ...mp, fogOn: true, fog: '1'.repeat(mp.cols * mp.rows) }))}>Cobrir tudo</button>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => patchMap(mp => ({ ...mp, fog: '0'.repeat(mp.cols * mp.rows) }))}>Revelar tudo</button>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => patchMap(mp => ({ ...mp, walls: [] }))} disabled={!m.walls.length}>Limpar paredes</button>
          </div>
          {novo && (
            <div className="mb-2 flex flex-wrap items-end gap-2 border border-line-2 bg-black/70 p-2">
              <label className="field">Rótulo (até 3 letras)
                <input className="input !w-24 !py-1 font-mono uppercase" maxLength={3} value={novo.l} onChange={e => setNovo({ ...novo, l: e.target.value })} onKeyDown={e => { if (e.key === 'Enter') colocar() }} />
              </label>
              <label className="field">Cor
                <input type="color" className="h-9 w-14 cursor-pointer border border-line-2 bg-black" value={novo.c} onChange={e => setNovo({ ...novo, c: e.target.value })} />
              </label>
              <button type="button" className="btn btn-sm btn-primary" onClick={colocar}>Colocar</button>
            </div>
          )}
          <div className="border border-line-2">
            <TacticalMap tool={tool} gmView={gmView} range={range} zoom={zoom} sel={sel} onSelect={setSel} info={info} />
          </div>
          <p className="mt-2 text-xs text-ash">
            Mover: arraste fichas (ou o mapa, fora delas); setas movem a ficha selecionada. Parede: arraste ligando cantos da grade.
            Cobrir e Revelar pintam a névoa. Desmarque Visão do mestre para mostrar o mapa aos jogadores.
          </p>
        </section>

        {/* Fichas no mapa */}
        <aside className="panel min-w-0 self-start">
          <h2 className="panel-title">Fichas</h2>
          <div className="mt-2 aspect-[3/2] overflow-hidden border border-line-2 bg-black">
            <AssetImg path={ASSET.map(m.scene)} alt={SCENES[m.scene]} className="h-full w-full object-cover"
              fallback={<div className="scanlines flex h-full items-center justify-center p-2 text-center font-display tracking-[.2em] text-gold-dim">{SCENES[m.scene] ?? m.scene}</div>} />
          </div>
          <p className="mt-1 font-mono text-xs text-ash">{m.cols}×{m.rows} q · {(m.cols * 1.5).toLocaleString('pt-BR')}×{(m.rows * 1.5).toLocaleString('pt-BR')} m · {m.walls.length} paredes</p>
          {m.tokens.length ? (
            <ul className="mt-3 max-h-[50vh] space-y-1 overflow-y-auto">
              {m.tokens.map(t => {
                const st = t.ref ? info[t.ref] : undefined
                return (
                  <li key={t.id} className={clsx('flex items-center gap-2 border px-2 py-1', t.id === sel ? 'border-gold bg-gold/10' : 'border-line')}>
                    <button type="button" onClick={() => { setSel(t.id); setTool('mover') }} className="flex min-w-0 flex-1 items-center gap-2 text-left" aria-pressed={t.id === sel}>
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-black font-mono text-[11px] font-bold" style={{ background: t.color, color: inkOn(t.color) }}>{t.label.slice(0, 3)}</span>
                      <span className={clsx('min-w-0 truncate text-sm', st?.down && 'line-through text-ash')}>{nameOf(t) || 'Ficha'}</span>
                      <span className="ml-auto shrink-0 font-mono text-[11px] text-ash">{t.x + 1},{t.y + 1}</span>
                    </button>
                    <button type="button" className="px-1 text-ash hover:text-ember" onClick={() => remover(t.id)} aria-label={`Remover ficha ${t.label}`}>×</button>
                  </li>
                )
              })}
            </ul>
          ) : <p className="mt-3 text-sm text-ash">Nenhuma ficha. Traga os combatentes da Mesa ou os heróis.</p>}
        </aside>
      </div>
    </div>
  )
}
