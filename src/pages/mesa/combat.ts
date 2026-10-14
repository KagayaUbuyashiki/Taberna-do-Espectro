/* Lógica da mesa de combate (portada de table.js). Funções puras + ações na store. */
import { BESTIARY, COND } from '../../data/saga'
import { applyDamage, calc, uid, weaponStats } from '../../rules/engine'
import type { Campaign, Character, Combatant } from '../../rules/types'
import { useStore } from '../../store/campaign'
import { d20 } from '../../lib/rolls'

const rollInit = (v: CombView) => d20('Iniciativa', v.initMod, v.name).total

export type Attack = Combatant['atk'][number]
export type Beast = (typeof BESTIARY)[number]

/** Combatente com os números do momento (PC lidos da ficha; NPC com a penalidade da condição). */
export interface CombView {
  id: string
  side: 'pc' | 'npc'
  base?: string
  charId?: string
  name: string
  init: number | null
  initMod: number
  hp: number
  hpMax: number
  ref: number
  fort: number
  will: number
  thr: number
  cond: number
  atk: Attack[]
  notes: string
  species?: string
  portrait?: string | null
}

export function combView(x: Combatant, chars: Record<string, Character>): CombView | null {
  if (x.side === 'pc') {
    const c = x.charId ? chars[x.charId] : undefined
    if (!c) return null
    const K = calc(c)
    return {
      id: x.id, side: 'pc', charId: c.id, name: c.name || 'Sem nome', init: x.init, initMod: K.sk['Iniciativa']?.tot ?? 0,
      hp: c.hp, hpMax: K.hpMax, ref: K.ref, fort: K.fort, will: K.will, thr: K.thr, cond: c.cond || 0,
      atk: c.weapons.map(w => { const ws = weaponStats(c, w, K); return [w.n, ws.atk, ws.dmg, !ws.melee] as Attack }),
      notes: c.notes, species: c.species, portrait: c.portrait,
    }
  }
  const cp = COND[x.cond || 0].p
  return {
    ...x, side: 'npc', cond: x.cond || 0, ref: x.ref + cp, fort: x.fort + cp, will: x.will + cp,
    atk: x.atk.map(a => [a[0], a[1] + cp, a[2], a[3]] as Attack),
  }
}

export const DEF_LABEL = { ref: 'Reflexo', fort: 'Fortitude', will: 'Vontade' } as const
export type DefKey = keyof typeof DEF_LABEL

export const SIDE_LABEL: Record<string, string> = {
  imp: 'Império', rep: 'República', reb: 'Aliança Rebelde', crim: 'Submundo', cis: 'Separatistas', beast: 'Fera',
}

/* ===== Ações (cada uma grava em campaign.combat via patchCampaign) ===== */
const S = () => useStore.getState()
type Combat = Campaign['combat']
const patchCombat = (fn: (cb: Combat) => Combat) => S().patchCampaign(c => ({ ...c, combat: fn(c.combat) }))
const patchOne = (id: string, patch: Partial<Combatant>) =>
  patchCombat(cb => ({ ...cb, list: cb.list.map(x => (x.id === id ? { ...x, ...patch } : x)) }))

export function addPC(charId: string) {
  patchCombat(cb => cb.list.some(x => x.charId === charId) ? cb
    : { ...cb, list: [...cb.list, { id: uid(), side: 'pc', charId, name: '', init: null, initMod: 0, hp: 0, hpMax: 0, ref: 0, fort: 0, will: 0, thr: 0, cond: 0, atk: [], notes: '' }] })
}

export function addNPC(b: Beast, qty: number) {
  const q = Math.max(1, Math.min(12, Math.floor(qty) || 1))
  patchCombat(cb => {
    const n = cb.list.filter(x => x.base === b.n).length
    const novos: Combatant[] = Array.from({ length: q }, (_, i) => ({
      id: uid(), side: 'npc', base: b.n, name: `${b.n} ${n + i + 1}`, init: null, initMod: b.init,
      hp: b.hp, hpMax: b.hp, ref: b.ref, fort: b.fort, will: b.will, thr: b.thr, cond: 0,
      atk: (b.atk as Attack[]).map(a => [...a] as Attack), notes: b.notes,
    }))
    return { ...cb, list: [...cb.list, ...novos] }
  })
}

export function addCustomNPC(name: string, ref: number, hp: number, thr: number) {
  patchCombat(cb => ({
    ...cb, list: [...cb.list, {
      id: uid(), side: 'npc', name: name || 'Inimigo', init: null, initMod: 0, hp, hpMax: hp, ref, fort: thr, will: 10, thr, cond: 0,
      atk: [['Ataque', 2, '3d6', true]], notes: '',
    }],
  }))
}

const byInit = (a: Combatant, b: Combatant) => ((b.init ?? -99) - (a.init ?? -99)) || ((b.tie ?? b.initMod) - (a.tie ?? a.initMod))

/** Rola a iniciativa de todos, ordena e começa a rodada 1. */
export function rollInitAll() {
  const { campaign, chars } = S()
  const list = campaign.combat.list.map(x => {
    const v = combView(x, chars)
    if (!v) return x
    return { ...x, init: rollInit(v), tie: v.initMod }
  }).sort(byInit)
  patchCombat(() => ({ list, turn: 0, round: 1 }))
}

/** Rola a iniciativa de um só (quem chega no meio da luta). */
export function rollInitOne(id: string) {
  const { campaign, chars } = S()
  const x = campaign.combat.list.find(y => y.id === id)
  const v = x && combView(x, chars)
  if (!v) return
  patchOne(id, { init: rollInit(v), tie: v.initMod })
}

/** Ordena pela iniciativa mantendo o turno de quem está agindo. */
export function sortByInit() {
  patchCombat(cb => {
    const atual = cb.list[cb.turn]?.id
    const list = [...cb.list].sort(byInit)
    return { ...cb, list, turn: Math.max(0, list.findIndex(x => x.id === atual)) }
  })
}

/** Avança o turno; volta ao topo e soma uma rodada no fim da lista. Devolve a rodada nova se virou. */
export function nextTurn(): number | null {
  const cb = S().campaign.combat
  if (!cb.list.length) return null
  let turn = cb.turn + 1
  let round = cb.round
  if (turn >= cb.list.length) { turn = 0; round++ }
  patchCombat(c => ({ ...c, turn, round }))
  return round !== cb.round ? round : null
}

export const setTurn = (id: string) => patchCombat(cb => ({ ...cb, turn: Math.max(0, cb.list.findIndex(x => x.id === id)) }))

export function removeComb(id: string) {
  patchCombat(cb => {
    const list = cb.list.filter(x => x.id !== id)
    return { ...cb, list, turn: Math.min(cb.turn, Math.max(0, list.length - 1)) }
  })
}

/** Encerra: inimigos saem, heróis ficam com a iniciativa zerada. */
export function endCombat() {
  patchCombat(cb => ({ round: 1, turn: 0, list: cb.list.filter(x => x.side === 'pc').map(x => ({ ...x, init: null })) }))
}

/** Aplica dano contra o limiar (PC usa PV temporários primeiro) e devolve a mensagem. */
export function applyDmgComb(id: string, amt: number): string {
  const { campaign, chars, patchChar } = S()
  const x = campaign.combat.list.find(y => y.id === id)
  if (!x) return ''
  if (x.side === 'pc') {
    const c = x.charId ? chars[x.charId] : undefined
    if (!c) return ''
    const K = calc(c)
    const used = Math.min(c.tmpHp || 0, amt)
    const r = applyDamage(c.hp, c.cond || 0, K.thr, amt - used)
    // O limiar compara o dano total do golpe, antes dos PV temporários.
    const cond = r.hp === 0 ? 5 : amt >= K.thr ? Math.min(5, (c.cond || 0) + 1) : r.cond
    patchChar(c.id, { hp: r.hp, cond, tmpHp: (c.tmpHp || 0) - used })
    const nome = c.name || 'Sem nome'
    if (r.hp === 0) return amt >= K.thr
      ? `${nome} sofreu ${amt} (≥ limiar ${K.thr}) e chegou a 0 PV: morto, a menos que gaste 1 Ponto de Força.`
      : `${nome} chegou a 0 PV e caiu inconsciente.`
    if (amt >= K.thr) return `Dano ${amt} ≥ limiar ${K.thr}: ${nome} desce para ${COND[cond].l}.`
    return `${nome}: ${c.hp} → ${r.hp} PV.`
  }
  const r = applyDamage(x.hp, x.cond || 0, x.thr, amt)
  patchOne(id, { hp: r.hp, cond: r.cond })
  if (r.result === 'morto') return `${x.name} foi destruído/morto (dano ${amt} ≥ limiar ${x.thr}).`
  if (r.result === 'inconsciente') return `${x.name} caiu inconsciente.`
  if (r.result === 'desce') return `Dano ${amt} ≥ limiar ${x.thr}: ${x.name} vai para ${COND[r.cond].l}.`
  return `${x.name}: ${x.hp} → ${r.hp} PV.`
}

/** Cura: limita ao máximo; quem estava Incapaz volta para -10. */
export function healComb(id: string, amt: number) {
  const { campaign, chars, patchChar } = S()
  const x = campaign.combat.list.find(y => y.id === id)
  if (!x || !amt) return
  if (x.side === 'pc') {
    const c = x.charId ? chars[x.charId] : undefined
    if (!c) return
    patchChar(c.id, { hp: Math.min(calc(c).hpMax, c.hp + amt), cond: c.cond === 5 && amt > 0 ? 4 : c.cond })
  } else patchOne(id, { hp: Math.min(x.hpMax, x.hp + amt), cond: x.cond === 5 && amt > 0 ? 4 : x.cond })
}

/** Clicar no passo atual do curso da condição sobe um passo (desfaz). */
export function setCondComb(id: string, n: number) {
  const { campaign, chars, patchChar } = S()
  const x = campaign.combat.list.find(y => y.id === id)
  if (!x) return
  if (x.side === 'pc') {
    const c = x.charId ? chars[x.charId] : undefined
    if (!c) return
    patchChar(c.id, { cond: n === (c.cond || 0) ? Math.max(0, n - 1) : n })
  } else patchOne(id, { cond: n === (x.cond || 0) ? Math.max(0, n - 1) : n })
}
