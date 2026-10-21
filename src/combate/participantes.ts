/*
 * Quem pode atacar e ser atacado: os combatentes da Mesa e os heróis que estão no mapa fora do combate.
 * Cada um traz os ataques (com o tipo de arma, para o efeito e o som) e as defesas.
 */
import { calc, weaponStats } from '../rules/engine'
import type { Campaign, Character } from '../rules/types'
import { combView, type CombView } from '../pages/mesa/combat'
import { armaDaFicha, armaDoAtaque, type Arma } from './armas'
import { CHAR, type Quem } from './mapa'

export interface OpcaoAtaque { nome: string; bonus: number; dano: string; arma: Arma }

export interface Participante {
  /** Chave estável: o id do combatente ou `char:<id>`. */
  chave: string
  nome: string
  lado: 'pc' | 'npc'
  quem: Quem
  ataques: OpcaoAtaque[]
  defesas: { ref: number; fort: number; will: number }
}

const doPersonagem = (c: Character): OpcaoAtaque[] => {
  const K = calc(c)
  return c.weapons.map(w => { const ws = weaponStats(c, w, K); return { nome: w.n, bonus: ws.atk, dano: ws.dmg, arma: armaDaFicha(w) } })
}

export function deCombatente(v: CombView, chars: Record<string, Character>): Participante {
  const c = v.charId ? chars[v.charId] : undefined
  return {
    chave: v.id, nome: v.name, lado: v.side, quem: { combId: v.id, charId: v.charId },
    ataques: c ? doPersonagem(c) : v.atk.map(a => ({ nome: a[0], bonus: a[1], dano: a[2], arma: armaDoAtaque(a[0], !!a[3]) })),
    defesas: { ref: v.ref, fort: v.fort, will: v.will },
  }
}

export function dePersonagem(c: Character, campaign: Campaign): Participante {
  const K = calc(c)
  const comb = campaign.combat.list.find(x => x.charId === c.id)
  return {
    chave: comb?.id ?? CHAR + c.id, nome: c.name || 'Sem nome', lado: 'pc', quem: { charId: c.id, combId: comb?.id },
    ataques: doPersonagem(c), defesas: { ref: K.ref, fort: K.fort, will: K.will },
  }
}

/** Todos os participantes: o combate inteiro e os heróis com ficha no mapa, sem repetir ninguém. */
export function participantes(campaign: Campaign, chars: Record<string, Character>): Participante[] {
  const out = campaign.combat.list.map(x => combView(x, chars)).filter((v): v is CombView => !!v).map(v => deCombatente(v, chars))
  const ja = new Set(out.map(p => p.quem.charId).filter(Boolean))
  campaign.map.tokens.forEach(t => {
    if (!t.ref?.startsWith(CHAR)) return
    const c = chars[t.ref.slice(CHAR.length)]
    if (c && !ja.has(c.id)) { out.push(dePersonagem(c, campaign)); ja.add(c.id) }
  })
  return out
}

/** Participante de uma ficha do mapa (pelo `ref` da ficha). */
export function participanteDoToken(ref: string | undefined, lista: Participante[]) {
  if (!ref) return undefined
  if (ref.startsWith(CHAR)) { const id = ref.slice(CHAR.length); return lista.find(p => p.quem.charId === id) }
  return lista.find(p => p.quem.combId === ref)
}
