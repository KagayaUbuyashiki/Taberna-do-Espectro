/* Árvore de Habilidades: talentos e aptidões desenhados como árvore de jogo. O caminho segue o livro:
 * só acende o que tem pré-requisito cumprido e ponto do nível para gastar. */
import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import clsx from 'clsx'
import { ABIL_SHORT, CLASSES, FORCE_TREES, SPECIES_BY, TREE_OF } from '../../data/saga'
import { countT, has, hasT, treesFor, type Calc } from '../../rules/engine'
import {
  dependents, featBudget, featSlotFor, freeBonus, freeGeneral, freeTalents, talentBudget, talentSlotFor, treeOwner,
  type FeatBudget, type TalentBudget,
} from '../../rules/progression'
import { useStore } from '../../store/campaign'
import { toast } from '../../store/ui'
import { SFX } from '../../lib/sfx'
import { ClassEmblem } from '../../components/ui/ClassEmblem'
import type { AbilKey, Character, ClassId } from '../../rules/types'
import { Dialog, PanelHead, Sub } from './Dialog'
import { FEAT_BRANCHES, TREE_GLYPH, featTree, talentTree, type Glyph, type TLayout } from './treeLayout'
import { addFeats, choiceOptions, featDef, SKILL_FEAT, TREE_MAP, type FeatDef, type TalentDef } from './util'

type Props = { c: Character; K: Calc }
type State = 'owned' | 'open' | 'ready' | 'locked'
interface Req { l: string; ok: boolean }
interface Info { owned: number; max: number; state: State; more: boolean; reqs: Req[]; slot: string | null }
type Sel = { kind: 'talent'; tree: string; def: TalentDef } | { kind: 'feat'; branch: string; def: FeatDef }

const patch = (c: Character, p: Partial<Character>) => useStore.getState().patchChar(c.id, p)
const isFeat = (owned: string, n: string) => owned === n || owned.startsWith(n + ' (')
const slotName = (s: string | null) => (s === 'geral' ? 'ponto de talento' : s ? `talento bônus de ${CLASSES[s as ClassId].name}` : '')

/* ===== Regras de cada nó ===== */

function featReqs(c: Character, K: Calc, f: FeatDef): Req[] {
  const r = f.req || {}
  const out: Req[] = []
  Object.entries(r.abil || {}).forEach(([k, v]) => out.push({ l: `${ABIL_SHORT[k]} ${v}`, ok: K.A[k as AbilKey] >= v }))
  if (r.bab) out.push({ l: `Bônus base de ataque +${r.bab}`, ok: K.bab >= r.bab })
  ;(r.feats || []).forEach(n => out.push({ l: n, ok: n.includes('(') ? has(c, n) : c.feats.some(x => isFeat(x, n)) }))
  if (r.trained) out.push({ l: `Treinado em ${r.trained}`, ok: c.trained.includes(r.trained) })
  if (r.species) out.push({ l: `Espécie: ${SPECIES_BY[r.species]?.name}`, ok: c.species === r.species })
  return out
}

function featInfo(c: Character, K: Calc, B: FeatBudget, f: FeatDef): Info & { opts: string[] | null } {
  const owned = c.feats.filter(x => isFeat(x, f.n)).length
  const opts = choiceOptions(c, f, null)
  const max = opts ? owned + opts.length : f.multi ? 99 : 1
  const reqs = featReqs(c, K, f)
  const met = reqs.every(r => r.ok)
  const slot = opts ? opts.map(o => featSlotFor(c, `${f.n} (${o})`, B)).find(Boolean) ?? null : featSlotFor(c, f.n, B)
  const room = owned < max
  const s: State = met && room && slot ? 'open' : met && room ? 'ready' : 'locked'
  return { owned, max, state: owned ? 'owned' : s, more: !!owned && s === 'open', reqs, slot, opts }
}

function talentReqs(c: Character, K: Calc, t: TalentDef, tree: string): Req[] {
  const out: Req[] = []
  const o = treeOwner[tree]
  out.push(o === 'forca'
    ? { l: 'Sensitividade da Força', ok: has(c, 'Sensitividade da Força') }
    : { l: `Nível de ${CLASSES[o as ClassId].name}`, ok: c.cls.includes(o as ClassId) })
  ;(t.p || []).forEach(n => out.push({ l: n, ok: hasT(c, n) }))
  ;(t.pf || []).forEach(n => out.push({ l: `Talento ${n}`, ok: has(c, n) }))
  if (t.bab) out.push({ l: `Bônus base de ataque +${t.bab}`, ok: K.bab >= t.bab })
  Object.entries(t.abil || {}).forEach(([k, v]) => out.push({ l: `${ABIL_SHORT[k]} ${v}`, ok: K.A[k as AbilKey] >= v }))
  if (t.dark) out.push({ l: 'Pontuação do Lado Sombrio 1+', ok: c.ds > 0 })
  return out
}

function talentInfo(c: Character, K: Calc, B: TalentBudget, t: TalentDef, tree: string): Info {
  const owned = countT(c, t.n)
  const max = t.multi || 1
  const reqs = talentReqs(c, K, t, tree)
  const met = reqs.every(r => r.ok) && c.cls.some(k => treesFor(c, k).includes(tree))
  const slot = talentSlotFor(c, t.n, B)
  const room = owned < max
  const s: State = met && room && slot ? 'open' : met && room ? 'ready' : 'locked'
  return { owned, max, state: owned ? 'owned' : s, more: !!owned && s === 'open', reqs, slot: slot ? `aptidão de ${CLASSES[slot].name}` : null }
}

/* ===== Painel ===== */

export function SkillTreePanel({ c, K }: Props) {
  const [tab, setTab] = useState<'apt' | 'tal' | 'lista'>('apt')
  const [others, setOthers] = useState(false)
  const [sel, setSel] = useState<Sel | null>(null)
  const FB = featBudget(c)
  const TB = talentBudget(c)
  const fs = has(c, 'Sensitividade da Força')
  const myCls = [...new Set(c.cls)]
  const restCls = (Object.keys(CLASSES) as ClassId[]).filter(k => !myCls.includes(k))
  const tPts = freeTalents(TB)
  const fPts = freeGeneral(FB) + freeBonus(FB)
  const branches = FEAT_BRANCHES.filter(b => b.id !== 'especie' || b.feats.some(n => featDef(n)?.req?.species === c.species))

  return (
    <section className="panel min-w-0" aria-label="Árvore de habilidades">
      <PanelHead title="Árvore de habilidades">
        <div role="tablist" className="flex flex-wrap gap-2">
          <Tab on={tab === 'apt'} onClick={() => setTab('apt')} pts={tPts}>Aptidões</Tab>
          <Tab on={tab === 'tal'} onClick={() => setTab('tal')} pts={fPts}>Talentos</Tab>
          <Tab on={tab === 'lista'} onClick={() => setTab('lista')}>Resumo</Tab>
        </div>
      </PanelHead>

      <Points c={c} FB={FB} TB={TB} />

      {tab === 'apt' && (
        <div className="mt-4 space-y-6">
          {myCls.map(k => (
            <Group key={k} cls={k} title={CLASSES[k].name} note={ptsNote(TB, k)}>
              {CLASSES[k].trees.map(t => <TalentCard key={t} c={c} K={K} B={TB} tree={t} onSel={setSel} />)}
            </Group>
          ))}
          <Group title="A Força" glyph="forca" note={fs ? 'Aptidões da Força usam o ponto de aptidão de qualquer classe.' : 'Exige o talento Sensitividade da Força (ramo A Força, na aba Talentos).'}>
            {FORCE_TREES.map(t => <TalentCard key={t} c={c} K={K} B={TB} tree={t} onSel={setSel} />)}
          </Group>
          {restCls.length > 0 && (
            <div className="border-t border-line pt-4">
              <button className="btn btn-sm btn-ghost whitespace-normal text-left" aria-expanded={others} onClick={() => setOthers(o => !o)}>
                {others ? 'Esconder' : 'Ver'} árvores de outras classes
              </button>
              {!others && <p className="mt-1 text-sm text-ash">Para planejar uma multiclasse.</p>}
              {others && (
                <div className="mt-4 space-y-6">
                  {restCls.map(k => (
                    <Group key={k} cls={k} title={CLASSES[k].name} note={`Abre quando você pegar um nível de ${CLASSES[k].name}.`} dim>
                      {CLASSES[k].trees.map(t => <TalentCard key={t} c={c} K={K} B={TB} tree={t} onSel={setSel} />)}
                    </Group>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'tal' && (
        <div className="mt-4 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {branches.map(b => <FeatCard key={b.id} c={c} K={K} B={FB} branch={b.id} onSel={setSel} />)}
        </div>
      )}

      {tab === 'lista' && <Summary c={c} K={K} onSel={setSel} />}

      <Legend />

      {sel && <NodeDialog c={c} K={K} sel={sel} onClose={() => setSel(null)} />}
    </section>
  )
}

function ptsNote(B: TalentBudget, k: ClassId) {
  const free = (B.total[k] || 0) - (B.used[k] || 0)
  return free > 0 ? `${free} ${free > 1 ? 'aptidões' : 'aptidão'} para escolher` : `${B.used[k]} de ${B.total[k]} aptidões (nova a cada nível ímpar de ${CLASSES[k].name})`
}

function Tab({ on, onClick, pts, children }: { on: boolean; onClick: () => void; pts?: number; children: ReactNode }) {
  return (
    <button role="tab" aria-selected={on} onClick={onClick} className={clsx('btn btn-sm relative', on ? 'btn-primary' : 'btn-ghost')}>
      {children}
      {!!pts && <span className="grid size-5 place-items-center rounded-full bg-holo font-mono text-xs text-black" aria-label={`${pts} para gastar`}>{pts}</span>}
    </button>
  )
}

/** Pontos ganhos pelo nível e quantos ainda faltam gastar. */
function Points({ c, FB, TB }: { c: Character; FB: FeatBudget; TB: TalentBudget }) {
  const ks = Object.keys(TB.total) as ClassId[]
  const items: { l: string; used: number; tot: number }[] = [
    { l: 'Talentos', used: Math.min(FB.usedGeneral, FB.general), tot: FB.general },
    ...ks.filter(k => FB.bonus[k]).map(k => ({ l: `Bônus de ${CLASSES[k].name}`, used: FB.usedBonus[k]!, tot: FB.bonus[k]! })),
    ...ks.map(k => ({ l: `Aptidões de ${CLASSES[k].name}`, used: TB.used[k]!, tot: TB.total[k]! })),
  ]
  const over = FB.over + TB.over
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(i => {
        const free = i.tot - i.used
        return (
          <div key={i.l} className={clsx('flex items-center gap-2 border px-2.5 py-1', free > 0 ? 'border-holo bg-holo/10' : 'border-line-2 bg-black/50')}>
            <span className="font-display text-sm tracking-[.15em] text-ash">{i.l}</span>
            <span className={clsx('font-mono', free > 0 ? 'text-holo' : 'text-bone')}>{i.used}/{i.tot}</span>
            {free > 0 && <span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-holo opacity-75" /><span className="relative inline-flex size-2 rounded-full bg-holo" /></span>}
          </div>
        )
      })}
      {FB.free.length > 0 && (
        <div className="flex items-center gap-2 border border-line-2 bg-black/50 px-2.5 py-1" title={FB.free.join(', ')}>
          <span className="font-display text-sm tracking-[.15em] text-ash">Grátis da classe/espécie</span>
          <span className="font-mono text-bone">{FB.free.length}</span>
        </div>
      )}
      {over > 0 && (
        <p className="w-full text-sm text-ember">
          Esta ficha tem {over} {over > 1 ? 'escolhas' : 'escolha'} além do que o nível {Math.max(1, c.cls.length)} permite. Nada novo acende até sobrar ponto.
        </p>
      )}
    </div>
  )
}

function Group({ title, note, cls, glyph, dim, children }: { title: string; note: string; cls?: ClassId; glyph?: Glyph; dim?: boolean; children: ReactNode }) {
  return (
    <div className={clsx('min-w-0', dim && 'opacity-80')}>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        {cls ? <ClassEmblem cls={cls} className="size-9" /> : glyph && <span className="size-9 text-holo"><Icon g={glyph} /></span>}
        <Sub>{title}</Sub>
        <span className="text-sm text-ash">{note}</span>
      </div>
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">{children}</div>
    </div>
  )
}

/** Largura útil do cartão e quantas colunas de nós cabem nela. */
function useFit() {
  const [box, setBox] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setBox(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const fit = box ? Math.max(2, Math.floor((box + GX) / (CW0 + GX))) : 3
  return { ref, box, fit }
}

function TalentCard({ c, K, B, tree, onSel }: { c: Character; K: Calc; B: TalentBudget; tree: string; onSel: (s: Sel) => void }) {
  const { ref, box, fit } = useFit()
  const L = useMemo(() => talentTree(tree, fit), [tree, fit])
  const info = (t: TalentDef) => talentInfo(c, K, B, t, tree)
  const dark = tree === 'Lado Sombrio'
  return (
    <TreeCard boxRef={ref} box={box} title={tree} g={TREE_GLYPH[tree] || 'estrela'} force={FORCE_TREES.includes(tree)} dark={dark} L={L}
      info={n => info(n.def)} onPick={n => onSel({ kind: 'talent', tree, def: n.def })} isDark={n => !!n.def.dark} />
  )
}

function FeatCard({ c, K, B, branch, onSel }: { c: Character; K: Calc; B: FeatBudget; branch: string; onSel: (s: Sel) => void }) {
  const { ref, box, fit } = useFit()
  const L = useMemo(() => featTree(branch, fit), [branch, fit])
  const b = FEAT_BRANCHES.find(x => x.id === branch)!
  return (
    <TreeCard boxRef={ref} box={box} title={b.n} g={b.g} force={branch === 'forca'} L={L}
      info={n => featInfo(c, K, B, n.def)} onPick={n => onSel({ kind: 'feat', branch, def: n.def })} />
  )
}

/* ===== Desenho da árvore ===== */

const CW0 = 112 // largura mínima da coluna
const GX = 30 // espaço entre colunas
const RH = 92 // altura da linha
const MD = 48 // diâmetro do medalhão

function TreeCard<T extends { n: string }>({ boxRef, box, title, g, force, dark, L, info, onPick, isDark }: {
  boxRef: RefObject<HTMLDivElement | null>; box: number; title: string; g: Glyph; force?: boolean; dark?: boolean; L: TLayout<T>
  info: (n: TLayout<T>['nodes'][number]) => Info; onPick: (n: TLayout<T>['nodes'][number]) => void; isDark?: (n: TLayout<T>['nodes'][number]) => boolean
}) {
  const reduce = useReducedMotion()
  const [hover, setHover] = useState<string | null>(null)
  // A largura da coluna cresce para ocupar o cartão.
  const CW = Math.max(CW0, Math.min(170, (box - GX * (L.cols - 1)) / Math.max(1, L.cols)))
  const infos = Object.fromEntries(L.nodes.map(n => [n.id, info(n)]))
  const byId = Object.fromEntries(L.nodes.map(n => [n.id, n]))
  // Caminho até o nó em foco: todos os pré-requisitos acima dele.
  const path = new Set<string>()
  const walk = (id: string) => { path.add(id); byId[id]?.parents.forEach(walk) }
  if (hover) walk(hover)
  const W = L.cols * CW + (L.cols - 1) * GX
  const H = L.rows * RH
  const cx = (col: number) => col * (CW + GX) + CW / 2
  const cy = (row: number) => row * RH + MD / 2 + 4
  const owned = L.nodes.filter(n => infos[n.id].owned).length
  const open = L.nodes.filter(n => infos[n.id].state === 'open' || infos[n.id].more).length
  const accent = dark ? 'text-ember' : force ? 'text-holo' : 'text-gold'

  return (
    <div className="min-w-0 border border-line-2 bg-black/50">
      <div className="flex items-center gap-2 border-b border-line px-3 py-2">
        <span className={clsx('size-6 shrink-0', accent)}><Icon g={g} /></span>
        <h3 className={clsx('min-w-0 flex-1 truncate font-display text-xl tracking-[.12em]', accent)}>{title}</h3>
        {open > 0 && <span className="chip border-holo px-1.5 py-0 text-xs text-holo">{open} disponível{open > 1 ? 'is' : ''}</span>}
        <span className="font-mono text-sm text-ash">{owned}/{L.nodes.length}</span>
      </div>
      <div ref={boxRef} className="overflow-x-auto p-3">
        <div className="relative mx-auto" style={{ width: W, height: H }}>
          <svg className="pointer-events-none absolute inset-0" width={W} height={H} aria-hidden>
            {L.edges.map(([a, b]) => {
              const A = byId[a], Bn = byId[b]
              const x1 = cx(A.col) + MD / 2, y1 = cy(A.row), x2 = cx(Bn.col) - MD / 2, y2 = cy(Bn.row)
              const mx = (x1 + x2) / 2
              const d = `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`
              const lit = infos[a].owned > 0 && infos[b].owned > 0
              const next = infos[a].owned > 0 && !infos[b].owned && infos[b].state !== 'locked'
              const onPath = path.has(a) && path.has(b)
              const col = dark ? 'var(--color-ember)' : 'var(--color-gold)'
              return (
                <g key={a + b}>
                  <path d={d} fill="none" stroke="var(--color-line-2)" strokeWidth={2} />
                  {next && !onPath && <path d={d} fill="none" stroke={col} strokeWidth={2} strokeDasharray="5 5" opacity={0.8} />}
                  {(lit || onPath) && (
                    <motion.path d={d} fill="none" strokeLinecap="round"
                      stroke={onPath && !lit ? 'var(--color-holo)' : col}
                      strokeWidth={lit ? 3 : 2}
                      style={lit ? { filter: `drop-shadow(0 0 4px ${col})` } : undefined}
                      initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5 }} />
                  )}
                </g>
              )
            })}
          </svg>
          {L.nodes.map(n => (
            <Node key={n.id} name={n.def.n} w={CW} x={n.col * (CW + GX)} y={n.row * RH} g={g} i={infos[n.id]}
              dark={isDark?.(n)} force={force} onPath={!!hover && path.has(n.id)}
              onHover={v => setHover(v ? n.id : null)} onClick={() => onPick(n)} />
          ))}
        </div>
      </div>
    </div>
  )
}

function Node({ name, w, x, y, g, i, dark, force, onPath, onHover, onClick }: {
  name: string; w: number; x: number; y: number; g: Glyph; i: Info; dark?: boolean; force?: boolean; onPath: boolean
  onHover: (v: boolean) => void; onClick: () => void
}) {
  const own = i.state === 'owned'
  const tone = dark ? 'border-ember text-ember' : force ? 'border-holo text-holo' : 'border-gold text-gold'
  const ring = {
    owned: dark ? 'border-ember bg-ember text-black shadow-[0_0_16px_var(--color-ember)]' : force ? 'border-holo bg-holo text-black shadow-[0_0_16px_var(--color-holo)]' : 'border-gold bg-gold text-black shadow-[0_0_16px_var(--color-gold)]',
    open: 'border-holo bg-black text-holo shadow-[0_0_12px_var(--color-holo)]',
    ready: 'border-bone/60 bg-black text-bone/80',
    locked: 'border-line-2 bg-black/80 text-ash/60',
  }[i.state]
  const label = `${name}: ${own ? (i.max > 1 && i.max < 99 ? `${i.owned} de ${i.max}` : i.owned > 1 ? `${i.owned}×` : 'aprendida') : i.state === 'open' ? 'disponível' : i.state === 'ready' ? 'pré-requisitos ok, sem ponto livre' : 'bloqueada'}`
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => onHover(true)} onMouseLeave={() => onHover(false)} onFocus={() => onHover(true)} onBlur={() => onHover(false)}
      aria-label={label}
      title={label}
      className="group absolute flex flex-col items-center gap-1 text-center outline-none"
      style={{ left: x, top: y, width: w }}
    >
      <span className={clsx('relative grid place-items-center rounded-full border-2 transition-transform group-hover:scale-110 group-focus-visible:scale-110 group-focus-visible:ring-2 group-focus-visible:ring-bone', ring, onPath && !own && 'border-holo')}
        style={{ width: MD, height: MD }}>
        {(i.state === 'open' || i.more) && <span className="absolute inset-[-6px] animate-ping rounded-full border border-holo/60" />}
        <span className="size-6"><Icon g={i.state === 'locked' ? 'cadeado' : g} /></span>
        {i.owned > 1 && <span className={clsx('absolute -right-1.5 -top-1.5 grid min-w-5 place-items-center rounded-full border bg-black px-1 font-mono text-xs', tone)}>{i.owned}</span>}
        {i.more && <span className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full bg-holo font-mono text-xs text-black">+</span>}
      </span>
      <span className={clsx('line-clamp-2 font-display text-[0.95rem] leading-tight tracking-[.06em]',
        own ? (dark ? 'text-ember' : force ? 'text-holo' : 'text-gold') : i.state === 'open' ? 'text-bone' : i.state === 'ready' ? 'text-bone/70' : 'text-ash/70')}>
        {name}
      </span>
    </button>
  )
}

function Legend() {
  const Dot = ({ cls, children }: { cls: string; children: ReactNode }) => (
    <span className="flex items-center gap-2"><span className={clsx('size-3.5 rounded-full border-2', cls)} />{children}</span>
  )
  return (
    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 border-t border-line pt-3 text-sm text-ash">
      <Dot cls="border-gold bg-gold">Aprendida</Dot>
      <Dot cls="border-holo bg-black shadow-[0_0_8px_var(--color-holo)]">Disponível agora</Dot>
      <Dot cls="border-bone/60 bg-black">Pré-requisitos ok, falta ponto (próximo nível)</Dot>
      <Dot cls="border-line-2 bg-black">Bloqueada</Dot>
      <span>Passe o mouse num nó para ver o caminho até ele.</span>
    </div>
  )
}

/* ===== Detalhe do nó: pré-requisitos, aprender e esquecer ===== */

function NodeDialog({ c, K, sel, onClose }: { c: Character; K: Calc; sel: Sel; onClose: () => void }) {
  const FB = featBudget(c)
  const TB = talentBudget(c)
  const isT = sel.kind === 'talent'
  const i = isT ? talentInfo(c, K, TB, sel.def, sel.tree) : featInfo(c, K, FB, sel.def)
  const opts = !isT ? (i as ReturnType<typeof featInfo>).opts : null
  const okOpts = opts?.filter(o => featSlotFor(c, `${sel.def.n} (${o})`, FB)) ?? null
  const [opt, setOpt] = useState<string>(okOpts?.[0] ?? '')
  const pick = okOpts?.includes(opt) ? opt : okOpts?.[0] ?? ''
  const fullName = opts ? `${sel.def.n} (${pick})` : sel.def.n
  const slot = isT ? i.slot : opts ? (pick ? slotName(featSlotFor(c, fullName, FB)) : null) : slotName(i.slot)
  const canLearn = (i.state === 'open' || i.more) && !!slot && (!opts || !!pick)
  const owned = isT ? c.talents.filter(t => t === sel.def.n) : c.feats.filter(f => isFeat(f, sel.def.n))
  const where = isT ? sel.tree : FEAT_BRANCHES.find(b => b.id === sel.branch)?.n

  const learn = () => {
    if (isT) patch(c, { talents: [...c.talents, sel.def.n] })
    else patch(c, addFeats(c, [fullName]))
    SFX.force()
    toast(`${c.name || 'Personagem'} aprendeu ${fullName}.`)
    onClose()
  }
  const forget = (n: string) => {
    if (isT) {
      const idx = c.talents.lastIndexOf(n)
      patch(c, { talents: c.talents.filter((_, j) => j !== idx) })
    } else {
      const idx = c.feats.lastIndexOf(n)
      patch(c, {
        feats: c.feats.filter((_, j) => j !== idx),
        trained: n.startsWith(SKILL_FEAT) ? c.trained.filter(s => s !== n.slice(SKILL_FEAT.length, -1)) : c.trained,
      })
    }
    toast(`${n} removida da ficha.`)
    onClose()
  }

  return (
    <Dialog title={<span className="flex flex-wrap items-baseline gap-x-3">{sel.def.n}<span className="font-display text-base tracking-[.15em] text-ash">{isT ? 'Aptidão' : 'Talento'} · {where}</span></span>} onClose={onClose}
      footer={<>
        {!canLearn && i.state !== 'owned' && <span className="mr-auto text-sm text-ash">{whyNot(i)}</span>}
        <button className="btn btn-ghost" onClick={onClose}>Fechar</button>
        {(i.state !== 'owned' || i.more) && <button className="btn btn-primary" disabled={!canLearn} onClick={learn}>{i.owned ? 'Aprender de novo' : 'Aprender'}</button>}
      </>}>
      <p className="text-bone/90">{sel.def.d}</p>
      {isT && (sel.def as TalentDef).multi && <p className="mt-1 text-sm text-ash">Pode ser escolhida até {(sel.def as TalentDef).multi} vezes.</p>}
      {!isT && (sel.def as FeatDef).multi && !opts && <p className="mt-1 text-sm text-ash">Pode ser escolhido mais de uma vez.</p>}

      <Sub className="mt-4">Pré-requisitos</Sub>
      <ul className="mt-2 space-y-1">
        {i.reqs.length ? i.reqs.map(r => (
          <li key={r.l} className="flex items-center gap-2">
            <span className={clsx('grid size-5 place-items-center rounded-full border font-mono text-xs', r.ok ? 'border-rebel text-rebel' : 'border-ember text-ember')}>{r.ok ? '✓' : '✕'}</span>
            <span className={r.ok ? 'text-bone' : 'text-bone/70'}>{r.l}</span>
          </li>
        )) : <li className="text-sm text-ash">Nenhum.</li>}
      </ul>

      {opts && (i.state === 'open' || i.more) && (
        <label className="field mt-4">Escolha
          <select className="input" value={pick} onChange={e => setOpt(e.target.value)}>
            {opts.map(o => <option key={o} value={o} disabled={!okOpts!.includes(o)}>{o}{okOpts!.includes(o) ? '' : ' (sem vaga)'}</option>)}
          </select>
        </label>
      )}
      {canLearn && <p className="mt-3 text-sm text-holo">Gasta 1 {slot}.</p>}

      {owned.length > 0 && (
        <>
          <Sub className="mt-5">Na ficha</Sub>
          <ul className="mt-2 space-y-2">
            {[...new Set(owned)].map(n => {
              const dep = dependents(c, n, isT ? 'talent' : 'feat')
              const free = !isT && FB.free.includes(n)
              return (
                <li key={n} className="flex flex-wrap items-center gap-2 border-l-2 border-gold-dim pl-3">
                  <b className="font-display text-lg tracking-[.08em] text-gold">{n}</b>
                  {owned.filter(x => x === n).length > 1 && <span className="font-mono text-sm text-ash">×{owned.filter(x => x === n).length}</span>}
                  {free && <span className="chip px-1.5 py-0 text-xs">grátis</span>}
                  <button className="btn btn-sm btn-ghost ml-auto" disabled={dep.length > 0} onClick={() => forget(n)}>Esquecer</button>
                  {dep.length > 0 && <span className="w-full text-sm text-ash">Antes, esqueça o que depende dela: {dep.join(', ')}.</span>}
                </li>
              )
            })}
          </ul>
        </>
      )}
    </Dialog>
  )
}

function whyNot(i: Info) {
  if (i.state === 'locked') return 'Faltam pré-requisitos.'
  if (i.state === 'ready') return 'Sem ponto livre: suba de nível para ganhar.'
  return ''
}

/* ===== Resumo em lista (o que está na ficha) ===== */

function Summary({ c, K, onSel }: Props & { onSel: (s: Sel) => void }) {
  const FB = featBudget(c)
  const featSel = (f: string): Sel | null => {
    const def = featDef(f)
    const b = FEAT_BRANCHES.find(x => x.feats.includes(def?.n || ''))
    return def && b ? { kind: 'feat', branch: b.id, def } : null
  }
  return (
    <div className="mt-4 grid gap-5 lg:grid-cols-3">
      <div className="min-w-0">
        <Sub>Talentos</Sub>
        <ul className="mt-2 flex flex-wrap gap-2">
          {c.feats.map((f, i) => {
            const s = featSel(f)
            return (
              <li key={i}>
                <button className="chip max-w-full border-gold-dim text-bone hover:border-gold hover:text-gold" title={featDef(f)?.d || ''} onClick={() => s && onSel(s)}>
                  <span className="truncate">{f}</span>{FB.free.includes(f) && <span className="text-xs text-ash">· grátis</span>}
                </button>
              </li>
            )
          })}
          {!c.feats.length && <li className="text-sm text-ash">Nenhum.</li>}
        </ul>
      </div>
      <div className="min-w-0">
        <Sub>Aptidões</Sub>
        <ul className="mt-2 flex flex-col gap-2">
          {c.talents.map((t, i) => {
            const tree = TREE_OF[t]
            const T = (TREE_MAP[tree] || []).find(x => x.n === t)
            return (
              <li key={i}>
                <button className="w-full border-l-2 border-gold-dim pl-3 text-left hover:border-gold" onClick={() => T && onSel({ kind: 'talent', tree, def: T })}>
                  <b className={clsx('font-display text-lg tracking-[.08em]', T?.dark ? 'text-ember' : 'text-gold')}>{t}</b>
                  {tree && <span className={clsx('chip ml-2', FORCE_TREES.includes(tree) && 'border-holo text-holo')}>{tree}</span>}
                  {T?.d && <span className="block text-sm text-bone/75">{T.d}</span>}
                </button>
              </li>
            )
          })}
          {!c.talents.length && <li className="text-sm text-ash">Nenhuma.</li>}
        </ul>
      </div>
      <div className="min-w-0">
        <Sub>Traços da espécie</Sub>
        <ul className="mt-2 list-inside list-disc text-sm text-bone/75">
          {(K.sp.traits as string[]).map(t => <li key={t}>{t}</li>)}
        </ul>
      </div>
    </div>
  )
}

/* ===== Símbolos (arte original em SVG) ===== */

const GLYPHS: Record<Glyph | 'cadeado', ReactNode> = {
  mira: <><circle cx="12" cy="12" r="7" /><path d="M12 2v5M12 17v5M2 12h5M17 12h5" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /></>,
  lamina: <><path d="M5 19 18 6" strokeWidth="3" /><path d="M3 21l3-3M4 16l4 4" /></>,
  escudo: <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" />,
  punho: <><rect x="5" y="7" width="13" height="10" rx="3" /><path d="M9 7v4M12.5 7v4M16 7v4M5 13h4" /></>,
  forca: <><circle cx="12" cy="12" r="2.5" /><path d="M12 4a8 8 0 0 1 8 8M12 20a8 8 0 0 1-8-8M17 7a7 7 0 0 0-10 0M7 17a7 7 0 0 0 10 0" /></>,
  livro: <><path d="M3 5c3-1 6-1 9 1v14c-3-2-6-2-9-1z" /><path d="M21 5c-3-1-6-1-9 1v14c3-2 6-2 9-1z" /></>,
  estrela: <path d="M12 2l2.5 7H22l-6 4.5 2.3 7.5L12 16.5 5.7 21 8 13.5 2 9h7.5z" />,
  armadura: <><path d="M5 10a7 7 0 0 1 14 0v4l-3 5H8l-3-5z" /><path d="M8 12h3l1 2 1-2h3" /></>,
  olho: <><path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
  nave: <><path d="M12 2 4 20l8-4 8 4z" /><path d="M12 9v7" /></>,
  coroa: <><path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z" /></>,
  dado: <><rect x="4" y="4" width="16" height="16" rx="3" /><circle cx="9" cy="9" r="1.3" fill="currentColor" /><circle cx="15" cy="15" r="1.3" fill="currentColor" /><circle cx="12" cy="12" r="1.3" fill="currentColor" /></>,
  chip: <><rect x="7" y="7" width="10" height="10" /><path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4" /></>,
  folha: <><path d="M5 19C5 9 11 4 20 4c0 9-5 15-15 15z" /><path d="M5 19 14 10" /></>,
  garra: <path d="M6 4c2 5 2 11-1 16M11 3c2 6 2 12-1 18M16 4c2 5 2 11-1 16" />,
  cadeado: <><rect x="6" y="11" width="12" height="9" rx="1.5" /><path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3" /></>,
}

function Icon({ g }: { g: Glyph | 'cadeado' }) {
  return (
    <svg viewBox="0 0 24 24" className="size-full" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {GLYPHS[g]}
    </svg>
  )
}
