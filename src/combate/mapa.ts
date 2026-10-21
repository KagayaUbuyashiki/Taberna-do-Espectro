/* Liga a ficha e a Mesa ao mapa tático: onde cada um está, o que ele tem na frente e quem caiu. */
import { BESTIARY } from '../data/saga'
import { useStore } from '../store/campaign'
import type { Campaign, Character, Combatant, MapToken } from '../rules/types'
import { BONUS_COBERTURA, celulasDaArea, lerAlcance, type Arma, type Cobertura, type Leitura, type Ponto } from './armas'
import { CHANCE_GRITO, disparar, type Corpo } from './efeitos'
import { coberturaNoMapaPixel } from './coberturas'

export const CHAR = 'char:'

/** Quem é a ficha: um personagem (`charId`) ou um combatente da Mesa (`combId`). */
export interface Quem { charId?: string; combId?: string }

/** Ficha no mapa de alguém: pelo personagem ou pelo combatente (o herói pode estar das duas formas). */
export function fichaDe(q: Quem, campaign: Campaign = useStore.getState().campaign): MapToken | undefined {
  const toks = campaign.map.tokens
  const ids = new Set<string>()
  if (q.combId) ids.add(q.combId)
  if (q.charId) {
    ids.add(CHAR + q.charId)
    campaign.combat.list.forEach(x => { if (x.charId === q.charId) ids.add(x.id) })
  }
  if (q.combId) {
    const x = campaign.combat.list.find(y => y.id === q.combId)
    if (x?.charId) ids.add(CHAR + x.charId)
  }
  return toks.find(t => t.ref && ids.has(t.ref))
}

export interface Mira {
  de: Ponto | null
  para: Ponto | null
  leitura: Leitura | null
  area: Ponto[]
  cobertura: Cobertura | null
  /** Bônus de Reflexo do alvo pela cobertura (só contra ataques à distância). */
  bonusRef: number
}

/** Tudo o que o mapa diz sobre um ataque: distância, faixa, penalidade, área e cobertura do alvo. */
export function mirar(arma: Arma, atacante: Quem, alvo?: Quem): Mira {
  const { campaign } = useStore.getState()
  const a = fichaDe(atacante, campaign)
  const b = alvo ? fichaDe(alvo, campaign) : undefined
  const de = a ? { x: a.x, y: a.y } : null
  const para = b ? { x: b.x, y: b.y } : null
  if (!de || !para) return { de, para, leitura: null, area: [], cobertura: null, bonusRef: 0 }
  const leitura = lerAlcance(arma, de, para)
  const area = arma.area ? celulasDaArea(arma.area, de, para, campaign.map.cols, campaign.map.rows) : []
  const cobertura = arma.corpo && !leitura.arremessando ? null : coberturaNoMapaPixel(campaign.map.scene, para)
  return { de, para, leitura, area, cobertura, bonusRef: cobertura ? BONUS_COBERTURA[cobertura] : 0 }
}

/** Mostra o ataque no mapa (com o resultado, se já foi rolado). */
export function mostrarAtaque(arma: Arma, m: Mira, r: { acerto: boolean | null; critico: boolean; quem: string; alvo: string }) {
  if (!m.de) return null
  return disparar({ k: 'ataque', de: m.de, para: m.para, arma, leitura: m.leitura, area: m.area, ...r })
}

/** Acende o alcance da arma em volta de quem ataca. */
export function mostrarAlcance(arma: Arma, atacante: Quem) {
  const t = fichaDe(atacante)
  if (!t) return null
  return disparar({ k: 'alcance', de: { x: t.x, y: t.y }, arma, dur: 4200 })
}

export function mostrarDano(alvo: Quem, valor: number, critico: boolean) {
  const t = fichaDe(alvo)
  if (!t) return null
  return disparar({ k: 'dano', em: { x: t.x, y: t.y }, valor, critico })
}

/* ------------------------------------------------------------------ quedas */

const DROIDE = /dr[oó]ide|droideka/i
/** Corpo de quem caiu, para escolher o som e a animação. */
export function corpoDe(x: Combatant, chars: Record<string, Character>): Corpo {
  if (x.side === 'pc') return x.charId && chars[x.charId]?.species === 'droide' ? 'droide' : 'org'
  if (DROIDE.test(x.base ?? x.name)) return 'droide'
  return BESTIARY.find(b => b.n === x.base)?.side === 'beast' ? 'fera' : 'org'
}

const caido = (x: Combatant, chars: Record<string, Character>) => {
  if (x.side === 'pc') { const c = x.charId ? chars[x.charId] : undefined; return !!c && c.hp <= 0 && c.cond === 5 }
  return x.hp <= 0 && (x.cond || 0) === 5
}

/**
 * Vigia a Mesa: quando alguém chega a 0 PV e fica Incapaz, o mapa mostra a queda
 * e toca o som (1 em 10 mortes tem o grito raro). Devolve a função que para de vigiar.
 * A campanha não é sincronizada entre aparelhos: só quem aplicou o dano vê a queda mudar,
 * e é ele quem manda o efeito para os outros.
 */
export function vigiarQuedas(sorte: () => number = () => Math.random()) {
  let antes = new Set<string>()
  // combatentes da Mesa e heróis com ficha no mapa fora do combate
  const ler = () => {
    const { campaign, chars } = useStore.getState()
    const out = new Set(campaign.combat.list.filter(x => caido(x, chars)).map(x => x.id))
    const noCombate = new Set(campaign.combat.list.map(x => x.charId).filter(Boolean))
    campaign.map.tokens.forEach(t => {
      if (!t.ref?.startsWith(CHAR)) return
      const id = t.ref.slice(CHAR.length), c = chars[id]
      if (c && !noCombate.has(id) && c.hp <= 0 && c.cond === 5) out.add(t.ref)
    })
    return out
  }
  antes = ler()
  return useStore.subscribe(() => {
    const agora = ler()
    const { campaign, chars } = useStore.getState()
    agora.forEach(id => {
      if (antes.has(id)) return
      if (id.startsWith(CHAR)) {
        const c = chars[id.slice(CHAR.length)]
        const t = fichaDe({ charId: c?.id }, campaign)
        if (c) disparar({ k: 'queda', em: t ? { x: t.x, y: t.y } : null, quem: c.name || 'Herói', morte: true, grito: c.species !== 'droide' && sorte() < CHANCE_GRITO, corpo: c.species === 'droide' ? 'droide' : 'org' })
        return
      }
      const x = campaign.combat.list.find(y => y.id === id)
      if (!x) return
      const t = fichaDe({ combId: x.id, charId: x.charId }, campaign)
      const corpo = corpoDe(x, chars)
      const nome = x.side === 'pc' ? chars[x.charId ?? '']?.name || 'Herói' : x.name
      disparar({ k: 'queda', em: t ? { x: t.x, y: t.y } : null, quem: nome, morte: true, grito: corpo === 'org' && sorte() < CHANCE_GRITO, corpo })
    })
    antes = agora
  })
}
