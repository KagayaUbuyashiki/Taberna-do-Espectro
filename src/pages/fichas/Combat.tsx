import { useMemo, useState, type ReactNode } from 'react'
import clsx from 'clsx'
import { motion, useReducedMotion } from 'motion/react'
import { ABILS, ABIL_NAME, ARMORS, ARMOR_PEN, WEAPONS } from '../../data/saga'
import { applyDamage, uid, weaponStats, type Calc } from '../../rules/engine'
import { sgn } from '../../rules/dice'
import { d20 } from '../../lib/rolls'
import { useStore } from '../../store/campaign'
import { toast } from '../../store/ui'
import { SFX } from '../../lib/sfx'
import { ART } from '../../art/art'
import { Svg } from '../../components/Svg'
import type { AbilKey, Character, WeaponEntry } from '../../rules/types'
import { Dialog, PanelHead, Sub } from './Dialog'
import { armaDaFicha } from '../../combate/armas'
import { aplicarDano, atacar, causarDano, type Alvo } from '../../combate/acoes'
import { fichaDe, mirar, mostrarAlcance } from '../../combate/mapa'
import { participantes, participanteDoToken } from '../../combate/participantes'
import { TacticalMap } from '../mapas/TacticalMap'
import { useTokInfo } from '../mapas/tokInfo'
import { COND_SHORT, CONDS, rollSkill } from './util'

type Props = { c: Character; K: Calc }
const patch = (c: Character, p: Partial<Character>) => useStore.getState().patchChar(c.id, p)

/** Habilidades clicáveis e Defesas grandes. */
export function AbilitiesPanel({ c, K }: Props) {
  return (
    <section className="panel min-w-0">
      <PanelHead title="Habilidades"><span className="text-sm text-ash">Clique para um teste</span></PanelHead>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {ABILS.map(([k, , s]) => (
          <button key={k} className="stat transition-colors hover:border-gold" title={`Teste de ${ABIL_NAME[k]}`}
            onClick={() => d20(`Teste de ${ABIL_NAME[k]}`, K.M[k as AbilKey] + K.cp, c.name)}>
            <small>{s}</small>
            <b className="text-gold">{sgn(K.M[k as AbilKey])}</b>
            <span className="font-mono text-sm text-ash">{K.A[k as AbilKey]}</span>
          </button>
        ))}
      </div>

      <Sub className="mt-5">Defesas</Sub>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Def label="Reflexo" v={K.ref} sub={K.ar ? `armadura +${K.ar.ref}` : `nível ${K.lvl}`} />
        <Def label="Fortitude" v={K.fort} sub={`Con ${sgn(K.M.con)}`} />
        <Def label="Vontade" v={K.will} sub={`Sab ${sgn(K.M.sab)}`} />
        <Def label="Limiar" v={K.thr} sub="dano de um golpe" />
      </div>
      {K.cp !== 0 && <p className="mt-2 text-sm text-ember">Condição {CONDS[c.cond].l}: penalidade de {K.cp} já aplicada nas defesas, ataques e perícias.</p>}
    </section>
  )
}

function Def({ label, v, sub }: { label: string; v: number; sub: string }) {
  return (
    <div className="stat py-3">
      <small>{label}</small>
      <b className="my-1 text-5xl text-bone sm:text-6xl">{v}</b>
      <span className="block text-xs text-ash">{sub}</span>
    </div>
  )
}

/** PV, PV temporários, dano e cura contra o limiar, curso da condição. */
export function VitalsPanel({ c, K }: Props) {
  const reduce = useReducedMotion()
  const [amt, setAmt] = useState(5)
  const [msg, setMsg] = useState('')
  const hpPct = Math.max(0, Math.min(100, (c.hp / K.hpMax) * 100))

  const damage = () => {
    const a = Math.max(0, amt || 0)
    if (!a) return
    // PV temporários absorvem primeiro; o limiar compara o dano inteiro do golpe.
    const absorbed = Math.min(c.tmpHp || 0, a)
    const r = applyDamage(c.hp + absorbed, c.cond, K.thr, a)
    const nm = c.name || 'Personagem'
    const m = r.result === 'morto' ? `${nm} sofreu ${a} (≥ limiar ${K.thr}) e chegou a 0 PV: morto, a menos que gaste 1 Ponto de Força.`
      : r.result === 'inconsciente' ? `${nm} chegou a 0 PV e caiu inconsciente.`
      : r.result === 'desce' ? `Dano ${a} ≥ limiar ${K.thr}: ${nm} desce para ${CONDS[r.cond].l}.`
      : `${nm}: ${c.hp} → ${r.hp} PV${absorbed ? ` (${absorbed} nos PV temporários)` : ''}.`
    patch(c, { hp: r.hp, cond: r.cond, tmpHp: (c.tmpHp || 0) - absorbed })
    useStore.getState().pushRoll({ label: 'Dano recebido', who: c.name, total: a, det: m })
    setMsg(m)
    toast(m)
    SFX.impacto()
  }
  const heal = () => {
    const a = Math.max(0, amt || 0)
    const wasOut = c.cond === 5 && c.hp === 0
    patch(c, { hp: Math.min(K.hpMax, c.hp + a), cond: wasOut && a > 0 ? 4 : c.cond })
    setMsg(`${c.name || 'Personagem'} recuperou ${a} PV.`)
  }
  const condUp = () => {
    if (c.persistent) { toast('Condição persistente: precisa de tratamento ou descanso.'); return }
    patch(c, { cond: Math.max(0, c.cond - 1) })
  }

  return (
    <section className="panel min-w-0">
      <PanelHead title="Pontos de vida">
        <span className="font-mono text-2xl text-bone">
          {c.hp}{c.tmpHp ? <span className="text-gold">+{c.tmpHp}</span> : null}<span className="text-ash"> / {K.hpMax}</span>
        </span>
      </PanelHead>
      <div className="h-3 w-full bg-black/70 ring-1 ring-line-2" role="meter" aria-label="Pontos de vida" aria-valuemin={0} aria-valuemax={K.hpMax} aria-valuenow={c.hp}>
        <motion.div className={clsx('h-full', hpPct <= 50 ? 'bg-ember' : 'bg-gold')} initial={false} animate={{ width: `${hpPct}%` }} transition={{ duration: reduce ? 0 : 0.4 }} />
      </div>
      <form className="mt-3 flex flex-wrap items-end gap-2" onSubmit={e => { e.preventDefault(); damage() }}>
        <label className="field w-24">Valor
          <input className="input py-1.5 font-mono" type="number" min={0} value={amt} onChange={e => setAmt(+e.target.value)} />
        </label>
        <button type="submit" className="btn btn-sm btn-danger">Dano</button>
        <button type="button" className="btn btn-sm border-rebel text-rebel hover:bg-rebel/10" onClick={heal}>Curar</button>
        <label className="field ml-auto w-28">PV temp.
          <input className="input py-1.5 font-mono" type="number" min={0} value={c.tmpHp || 0} onChange={e => patch(c, { tmpHp: Math.max(0, +e.target.value || 0) })} />
        </label>
      </form>
      {msg && <p className="mt-2 text-sm text-bone/80" aria-live="polite">{msg}</p>}

      <Sub className="mt-5">Curso da condição</Sub>
      <CondTrack value={c.cond} onChange={n => patch(c, { cond: n })} />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!c.persistent} onChange={e => patch(c, { persistent: e.target.checked })} /> Condição persistente
        </label>
        <button className="btn btn-sm btn-ghost" disabled={c.cond === 0} onClick={condUp}>Recuperar +1 passo</button>
        <span className="text-xs text-ash">3 ações rápidas</span>
      </div>
    </section>
  )
}

/** Régua horizontal: passo atual aceso em dourado, vermelho a partir de -5. */
function CondTrack({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="mt-2" role="radiogroup" aria-label="Curso da condição">
      <div className="relative grid grid-cols-6">
        <div className="absolute inset-x-0 top-[11px] h-px bg-line-2" aria-hidden />
        {COND_SHORT.map((l, i) => {
          const on = value === i
          const hot = i >= 3
          return (
            <button key={l} role="radio" aria-checked={on} title={CONDS[i].l} onClick={() => onChange(i)}
              className="group relative flex min-w-0 flex-col items-center gap-1.5 pt-0.5">
              <span className={clsx('relative z-10 h-5 w-[3px] transition-colors', on ? (hot ? 'bg-ember' : 'bg-gold') : 'bg-line-2 group-hover:bg-ash')} />
              <span className={clsx('w-full truncate border-t-2 px-0.5 pt-1 text-center font-display text-sm tracking-[.04em] transition-colors sm:text-base sm:tracking-[.12em]',
                on ? (hot ? 'border-ember bg-ember/15 text-ember' : 'border-gold bg-gold/15 text-gold') : 'border-transparent text-ash group-hover:text-bone')}>
                {l}
              </span>
            </button>
          )
        })}
      </div>
      {value === 4 && <p className="mt-1 text-xs text-ember">Em -10 o movimento cai pela metade.</p>}
    </div>
  )
}

/** Números de combate e armadura (inclui a armadura personalizada do mestre). */
export function CombatPanel({ c, K }: Props) {
  const [confirm, setConfirm] = useState(false)
  const ap = c.armaduraPersonalizada
  return (
    <section className="panel min-w-0">
      <PanelHead title="Combate" />
      <Row k="Ataque base">{sgn(K.bab)}</Row>
      <Row k="Iniciativa"><button className="btn btn-sm font-mono" onClick={() => rollSkill(c, K, 'Iniciativa')}>{sgn(K.sk['Iniciativa'].tot)}</button></Row>
      <Row k="Percepção"><button className="btn btn-sm font-mono" onClick={() => rollSkill(c, K, 'Percepção')}>{sgn(K.sk['Percepção'].tot)}</button></Row>
      <Row k="Velocidade">{K.speed} quadrados</Row>
      <Row k="Agarrar">{sgn(K.grapple + K.cp)}</Row>
      <Row k="Bônus de dano">+{K.half} <span className="text-sm text-ash">(½ nível)</span></Row>

      <Sub className="mt-4">Armadura</Sub>
      {ap ? (
        <div className="mt-2 border border-gold-dim bg-black/40 p-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <b className="font-display text-xl tracking-[.1em] text-gold">{ap.nome}</b>
            <span className="chip">{ap.cat}</span>
          </div>
          <p className="text-xs text-ash">Feita pelo mestre{ap.base ? ` sobre ${ap.base}` : ''}</p>
          <p className="mt-1 font-mono text-sm">Ref +{ap.ref} · Fort {ap.fort ? `+${ap.fort}` : '–'} · Des máx +{ap.maxDex}</p>
          {ap.especial && <p className="mt-1 text-sm text-bone/85"><span className="font-display tracking-[.15em] text-gold-dim">Especial:</span> {ap.especial}</p>}
          {confirm ? (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <span>Tirar a armadura personalizada da ficha?</span>
              <button className="btn btn-sm btn-ghost" onClick={() => setConfirm(false)}>Cancelar</button>
              <button className="btn btn-sm btn-danger" onClick={() => { patch(c, { armaduraPersonalizada: null }); setConfirm(false) }}>Tirar</button>
            </div>
          ) : <button className="btn btn-sm btn-ghost mt-2" onClick={() => setConfirm(true)}>Tirar armadura</button>}
        </div>
      ) : (
        <select className="input mt-2" aria-label="Armadura" value={c.armor ?? ''} onChange={e => patch(c, { armor: e.target.value || null })}>
          <option value="">Nenhuma</option>
          {ARMORS.map(a => <option key={a.n} value={a.n}>{a.n} ({a.cat}, Ref +{a.ref})</option>)}
        </select>
      )}
      {K.ar && !K.arProf && (
        <p className="mt-2 text-sm text-ember">Sem proficiência em armadura {K.ar.cat}: {ARMOR_PEN[K.ar.cat as keyof typeof ARMOR_PEN]} em ataques e perícias físicas, e sem o bônus de Fortitude.</p>
      )}
    </section>
  )
}

function Row({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line py-1.5 last:border-0">
      <span className="font-display tracking-[.15em] text-ash">{k}</span>
      <span className="text-right font-mono text-lg text-bone">{children}</span>
    </div>
  )
}

/** Armas: ataque contra o alvo e dano (crítico dobra). */
export function WeaponsPanel({ c, K }: Props) {
  const campaign = useStore(s => s.campaign)
  const chars = useStore(s => s.chars)
  const todos = useMemo(() => participantes(campaign, chars), [campaign, chars])
  const eu = todos.find(p => p.quem.charId === c.id)
  const quem = { ...(eu?.quem ?? { charId: c.id }), nome: c.name }
  const [target, setTarget] = useState('')
  const [last, setLast] = useState<{ w: string; crit: boolean; alvo: string } | null>(null)
  const [dano, setDano] = useState<{ valor: number; alvo: string; aplicado: boolean } | null>(null)
  const [edit, setEdit] = useState<WeaponEntry | null>(null)
  const [verMapa, setVerMapa] = useState(true)
  const [sel, setSel] = useState<string | null>(null)
  const { info } = useTokInfo()
  const noMapa = !!fichaDe({ charId: c.id }, campaign)

  const fixos = [{ v: 'r15', ref: 15, label: 'Reflexo 15' }, { v: 'r20', ref: 20, label: 'Reflexo 20' }]
  const alvos = todos.filter(p => p.chave !== eu?.chave && p.quem.charId !== c.id)
  const alvoP = alvos.find(p => p.chave === target)
  const fixo = fixos.find(t => t.v === target)
  const alvoDe = (chave: string): Alvo | undefined => {
    const p = alvos.find(x => x.chave === chave)
    if (p) return { ...p.quem, nome: p.nome, defesa: p.defesas.ref }
    const f = fixos.find(t => t.v === chave)
    return f ? { nome: f.label, defesa: f.ref } : undefined
  }

  const attack = (w: WeaponEntry) => {
    const ws = weaponStats(c, w, K)
    const r = atacar({ arma: armaDaFicha(w), bonus: ws.atk, quem, alvo: alvoDe(target), rotulo: `Ataque com ${w.n}` })
    setDano(null)
    setLast(r ? { w: w.id, crit: r.critico, alvo: target } : null)
  }
  const damage = (w: WeaponEntry) => {
    const ws = weaponStats(c, w, K)
    const crit = !!last && last.w === w.id && last.crit
    const chave = last?.w === w.id ? last.alvo : target
    const { valor } = causarDano({ expr: ws.dmg, critico: crit, quem: c.name, arma: w.n, alvo: alvoDe(chave) })
    setDano(alvos.some(p => p.chave === chave) ? { valor, alvo: chave, aplicado: false } : null)
    setLast(null)
  }
  const aplicar = () => {
    const p = dano && alvos.find(x => x.chave === dano.alvo)
    if (!dano || !p) return
    aplicarDano(p.quem, dano.valor)
    setDano({ ...dano, aplicado: true })
  }
  const save = (w: WeaponEntry) => {
    const exists = c.weapons.some(x => x.id === w.id)
    patch(c, { weapons: exists ? c.weapons.map(x => (x.id === w.id ? w : x)) : [...c.weapons, w] })
    setEdit(null)
  }
  const remove = (id: string) => { patch(c, { weapons: c.weapons.filter(x => x.id !== id) }); setEdit(null) }
  const danoAlvo = dano ? alvos.find(p => p.chave === dano.alvo) : undefined

  return (
    <section className="panel min-w-0">
      <PanelHead title="Armas">
        <button className="btn btn-sm" onClick={() => setEdit({ id: uid(), n: '', base: 'Pistola blaster', atkMisc: 0, dmgMisc: 0, notes: '' })}>+ Arma</button>
      </PanelHead>
      <label className="mb-3 flex flex-wrap items-center gap-2 text-sm text-ash">Alvo
        <select className="input w-auto min-w-0 max-w-full py-1" value={target} onChange={e => { setTarget(e.target.value); setLast(null) }} aria-label="Alvo do ataque">
          <option value="">sem alvo</option>
          {alvos.map(p => <option key={p.chave} value={p.chave}>{p.nome} (Ref {p.defesas.ref})</option>)}
          {fixos.map(t => <option key={t.v} value={t.v}>{t.label}</option>)}
        </select>
        {fixo && <span className="text-xs">defesa fixa, sem mapa</span>}
      </label>
      <ul className="flex flex-col gap-2">
        {c.weapons.map(w => {
          const ws = weaponStats(c, w, K)
          const crit = last?.w === w.id && last.crit
          const arma = armaDaFicha(w)
          const mira = alvoP ? mirar(arma, quem, alvoP.quem) : null
          const lt = mira?.leitura
          return (
            <li key={w.id} className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 border border-line-2 bg-black/40 p-2 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
              <Svg html={ws.saber ? ART.saber(w.color || '#4fc3ff') : ART.blaster()} className="block w-14 [&>svg]:h-auto [&>svg]:w-full" />
              <div className="min-w-0">
                <b className="block truncate font-display text-xl tracking-[.08em] text-bone">{w.n}</b>
                <p className="text-xs text-ash">
                  {w.n !== ws.base.n && <>{ws.base.n} · </>}{ws.base.g} · {ws.base.type} · crítico ×2
                  {!ws.prof && <span className="text-ember"> · sem proficiência (-5)</span>}
                  {w.notes && <> · {w.notes}</>}
                </p>
                {lt && (
                  <span className={clsx('mt-1 block border-l-2 pl-2 font-mono text-xs', lt.faixa < 0 ? 'border-ember text-ember' : 'border-gold text-gold')}>
                    {lt.rotulo}{mira && mira.bonusRef > 0 ? ` · alvo com cobertura +${mira.bonusRef} Ref` : ''}
                  </span>
                )}
                {crit && <span className="chip chip-gold mt-1">20 natural: próximo dano ×2</span>}
              </div>
              <div className="col-span-2 flex flex-wrap gap-2 sm:col-span-1 sm:justify-end">
                <button className="btn btn-sm btn-primary font-mono" onClick={() => attack(w)}>Ataque {sgn(ws.atk + (lt && lt.faixa >= 0 ? lt.penalidade : 0))}</button>
                <button className="btn btn-sm btn-danger font-mono" onClick={() => damage(w)}>Dano {ws.dmg}</button>
                {noMapa && <button className="btn btn-sm btn-ghost" onClick={() => mostrarAlcance(arma, quem)} title="Acende no mapa até onde a arma alcança">Alcance</button>}
                <button className="btn btn-sm btn-ghost" onClick={() => setEdit(w)} aria-label={`Editar ${w.n}`}>Editar</button>
              </div>
            </li>
          )
        })}
        {!c.weapons.length && <li className="text-ash">Sem armas.</li>}
      </ul>
      {dano && danoAlvo && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-l-2 border-ember bg-black/60 px-3 py-2 text-sm">
          <span className="font-mono">Dano {dano.valor} em {danoAlvo.nome}</span>
          <button className="btn btn-sm" onClick={aplicar} disabled={dano.aplicado}>{dano.aplicado ? 'Aplicado' : 'Aplicar no alvo'}</button>
        </div>
      )}

      {/* Mapa da cena: onde está cada um, o tiro e o golpe */}
      <div className="mt-4">
        {noMapa ? (
          <>
            <button type="button" className="btn btn-sm btn-ghost" aria-expanded={verMapa} onClick={() => setVerMapa(v => !v)}>{verMapa ? 'Esconder o mapa' : 'Ver o mapa'}</button>
            {verMapa && (
              <div className="mt-2 border border-line-2">
                <TacticalMap tool="mover" gmView={false} range="pistolas" zoom="ajustar" sel={sel} onSelect={setSel} info={info} readOnly maxH="44vh"
                  onPick={id => {
                    const p = participanteDoToken(campaign.map.tokens.find(t => t.id === id)?.ref, alvos)
                    if (p) { setTarget(p.chave); setLast(null) }
                  }} />
                <p className="px-2 pb-1 pt-1 text-xs text-ash">Clique numa ficha para mirar nela. Quem move as fichas é o mestre, na página Mapas.</p>
              </div>
            )}
          </>
        ) : <p className="text-xs text-ash">{c.name || 'Este personagem'} ainda não tem ficha no mapa. Com a ficha lá, a distância e a cobertura entram sozinhas no ataque, e o tiro aparece no mapa.</p>}
      </div>
      {edit && <WeaponEditor w={edit} isNew={!c.weapons.some(x => x.id === edit.id)} onSave={save} onRemove={remove} onClose={() => setEdit(null)} />}
    </section>
  )
}

function WeaponEditor({ w, isNew, onSave, onRemove, onClose }: { w: WeaponEntry; isNew: boolean; onSave: (w: WeaponEntry) => void; onRemove: (id: string) => void; onClose: () => void }) {
  const [d, setD] = useState<WeaponEntry>(w)
  const [del, setDel] = useState(false)
  const base = WEAPONS.find(x => x.n === d.base)
  const set = (p: Partial<WeaponEntry>) => setD(x => ({ ...x, ...p }))
  return (
    <Dialog
      title={isNew ? 'Nova arma' : 'Arma'}
      onClose={onClose}
      footer={<>
        {!isNew && (del
          ? <span className="mr-auto flex flex-wrap items-center gap-2 text-sm">Remover {w.n}? <button className="btn btn-sm btn-ghost" onClick={() => setDel(false)}>Não</button><button className="btn btn-sm btn-danger" onClick={() => onRemove(w.id)}>Remover</button></span>
          : <button className="btn btn-danger mr-auto" onClick={() => setDel(true)}>Remover arma</button>)}
        <button className="btn btn-primary" onClick={() => onSave({ ...d, n: d.n.trim() || d.base })}>Salvar</button>
      </>}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="field">Nome<input className="input" value={d.n} placeholder={d.base} onChange={e => set({ n: e.target.value })} /></label>
        <label className="field">Modelo do livro
          <select className="input" value={d.base} onChange={e => set({ base: e.target.value })}>
            {WEAPONS.map(x => <option key={x.n}>{x.n}</option>)}
          </select>
        </label>
        <label className="field">Bônus extra no ataque<input className="input font-mono" type="number" value={d.atkMisc || 0} onChange={e => set({ atkMisc: +e.target.value || 0 })} /></label>
        <label className="field">Bônus extra no dano<input className="input font-mono" type="number" value={d.dmgMisc || 0} onChange={e => set({ dmgMisc: +e.target.value || 0 })} /></label>
        {base?.g === 'sabres de luz' && (
          <label className="field">Cor da lâmina<input className="input h-10 p-1" type="color" value={d.color || '#4fc3ff'} onChange={e => set({ color: e.target.value })} /></label>
        )}
        <label className="field sm:col-span-2">Notas<input className="input" value={d.notes || ''} onChange={e => set({ notes: e.target.value })} /></label>
      </div>
      {base && <p className="mt-3 font-mono text-sm text-ash">{base.g} · dano {base.dmg}{base.stun ? ` · atordoar ${base.stun}` : ''} · {base.type}</p>}
    </Dialog>
  )
}
