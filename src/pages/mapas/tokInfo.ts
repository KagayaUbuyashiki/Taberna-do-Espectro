/* O que cada ficha do mapa representa: PV, se caiu, a miniatura do inimigo ou a figura 3D do herói. */
import { useMemo } from 'react'
import { calc } from '../../rules/engine'
import { useStore } from '../../store/campaign'
import { spriteDoInimigo } from '../../combate/sprites'
import { CHAR } from '../../combate/mapa'
import { combView, type CombView } from '../mesa/combat'
import type { TokInfo } from './TacticalMap'

export function useTokInfo(): { info: TokInfo; views: CombView[]; byId: Record<string, CombView> } {
  const m = useStore(s => s.campaign.map)
  const combat = useStore(s => s.campaign.combat)
  const chars = useStore(s => s.chars)
  const views = useMemo(() => combat.list.map(x => combView(x, chars)).filter((v): v is CombView => !!v), [combat.list, chars])
  const byId = useMemo(() => Object.fromEntries(views.map(v => [v.id, v])), [views])
  const info = useMemo<TokInfo>(() => {
    const out: TokInfo = {}
    m.tokens.forEach(t => {
      if (!t.ref) return
      const v = byId[t.ref]
      if (v) {
        const c = v.charId ? chars[v.charId] : undefined
        out[t.ref] = { pct: v.hpMax ? v.hp / v.hpMax : 0, down: v.cond === 5, sprite: v.side === 'npc' ? spriteDoInimigo(v.base) : undefined, figura: c?.figura?.retrato ?? undefined }
        return
      }
      const c = t.ref.startsWith(CHAR) ? chars[t.ref.slice(CHAR.length)] : undefined
      if (c) { const max = calc(c).hpMax; out[t.ref] = { pct: max ? c.hp / max : 0, down: c.cond === 5, figura: c.figura?.retrato ?? undefined } }
    })
    return out
  }, [m.tokens, byId, chars])
  return { info, views, byId }
}
