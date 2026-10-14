import { rnd, rollExpr, sgn } from '../rules/dice'
import { useStore } from '../store/campaign'
import { useUI } from '../store/ui'
import { SFX } from './sfx'

/** Rola d20 + bônus, registra no diário e mostra o resultado. Com `vs`, decide acerto (20 natural sempre acerta, 1 sempre erra). */
export function d20(label: string, bonus: number, who?: string, opts: { vs?: number; target?: string } = {}) {
  const nat = rnd(20)
  const total = nat + bonus
  const kind = nat === 20 ? 'crit' : nat === 1 ? 'fumble' : ''
  const hit = opts.vs != null ? nat === 20 || (nat !== 1 && total >= opts.vs) : undefined
  const entry = useStore.getState().pushRoll({ label, who, total, det: `d20[${nat}] ${sgn(bonus)}`, kind, nat, bonus, vs: opts.vs, hit, target: opts.target })
  useUI.getState().showPopup({ value: total, label: label + (opts.vs != null ? (hit ? ' · ACERTO' : ' · ERRO') : ''), kind })
  if (kind === 'crit') SFX.crit(); else SFX.dice()
  return entry
}

/** Rola uma expressão de dano; no crítico dobra o resultado (Edição Saga). */
export function rollDamage(label: string, expr: string, who?: string, crit = false) {
  const r = rollExpr(crit ? `${expr}*2` : expr)
  useStore.getState().pushRoll({ label, who, total: r.total, det: r.detail, kind: crit ? 'crit' : '' })
  useUI.getState().showPopup({ value: r.total, label, kind: crit ? 'crit' : '' })
  SFX.blaster()
  return r.total
}

/** Rolagem livre do rolador (ex.: "3d8+2"). */
export function rollFree(expr: string) {
  const r = rollExpr(expr)
  if (!r.detail) return null
  const nat20 = r.dice.length === 1 && r.dice[0].s === 20 && r.dice[0].n === 1 ? r.dice[0].rs[0] : undefined
  const kind = nat20 === 20 ? 'crit' : nat20 === 1 ? 'fumble' : ''
  useStore.getState().pushRoll({ label: expr, total: r.total, det: r.detail, kind, nat: nat20 })
  useUI.getState().showPopup({ value: r.total, label: expr, kind })
  SFX.dice()
  return r.total
}
