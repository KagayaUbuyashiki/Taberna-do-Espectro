/*
 * Atacar e causar dano com o mapa junto: a distância decide a penalidade de alcance (Tabela 8-5),
 * a cobertura do quadrado do alvo soma no Reflexo, e o tiro aparece no mapa com o resultado.
 * Usado pela ficha, pela página Mapas e pela Mesa.
 */
import { d20, rollDamage } from '../lib/rolls'
import { sgn } from '../rules/dice'
import { toast } from '../store/ui'
import { applyDmgChar, applyDmgComb } from '../pages/mesa/combat'
import { BONUS_COBERTURA, type Arma } from './armas'
import { mirar, mostrarAlcance, mostrarAtaque, mostrarDano, type Mira, type Quem } from './mapa'

export interface Alvo extends Quem { nome: string; /** Defesa contra a qual o ataque rola (sem a cobertura). */ defesa?: number; contraReflexo?: boolean }

export interface ResultadoAtaque { mira: Mira; acerto: boolean | null; critico: boolean; bonus: number; vs?: number }

/** Explica o que o mapa mudou no ataque: "curto -2 · cobertura +5". */
export function notaDoMapa(m: Mira) {
  const p: string[] = []
  if (m.leitura && m.leitura.penalidade) p.push(`alcance ${sgn(m.leitura.penalidade)}`)
  if (m.cobertura) p.push(`${m.cobertura === 'melhorada' ? 'cobertura melhorada' : 'cobertura'} +${BONUS_COBERTURA[m.cobertura]} Ref`)
  return p.join(' · ')
}

/**
 * Rola o ataque. Se as duas fichas estão no mapa: fora de alcance não rola (avisa e acende o alcance),
 * a penalidade de alcance entra no bônus e a cobertura entra na defesa (só contra Reflexo).
 */
export function atacar(o: { arma: Arma; bonus: number; quem: Quem & { nome: string }; alvo?: Alvo; rotulo?: string; extra?: number }): ResultadoAtaque | null {
  const { arma, quem, alvo } = o
  const mira = mirar(arma, quem, alvo)
  if (mira.leitura && mira.leitura.faixa < 0) {
    toast(`${alvo?.nome ?? 'O alvo'} está a ${mira.leitura.dist} quadrados: ${arma.corpo && !mira.leitura.arremessando ? 'é preciso estar adjacente' : 'fora do alcance de ' + arma.nome}.`)
    mostrarAlcance(arma, quem)
    return null
  }
  const pen = mira.leitura?.penalidade ?? 0
  const bonus = o.bonus + pen + (o.extra ?? 0)
  const cob = alvo?.contraReflexo !== false ? mira.bonusRef : 0
  const vs = alvo?.defesa != null ? alvo.defesa + cob : undefined
  const nota = notaDoMapa({ ...mira, bonusRef: cob, cobertura: cob ? mira.cobertura : null })
  const rot = (o.rotulo ?? `Ataque com ${arma.nome}`) + (nota ? ` (${nota})` : '')
  const r = d20(rot, bonus, quem.nome, vs != null ? { vs, target: alvo?.nome } : {})
  const critico = r.nat === 20
  const acerto = vs != null ? !!r.hit : null
  mostrarAtaque(arma, mira, { acerto, critico, quem: quem.nome, alvo: alvo?.nome ?? '' })
  return { mira, acerto, critico, bonus, vs }
}

/** Rola o dano (crítico dobra), mostra o número subindo no alvo e, se pedido, aplica no combatente. */
export function causarDano(o: { expr: string; critico: boolean; quem: string; arma: string; alvo?: Alvo; aplicar?: boolean }) {
  const valor = rollDamage(`Dano de ${o.arma}${o.critico ? ' (crítico)' : ''}`, o.expr, o.quem, o.critico)
  if (o.alvo) mostrarDano(o.alvo, valor, o.critico)
  const msg = o.aplicar && o.alvo ? aplicarDano(o.alvo, valor) : ''
  return { valor, msg }
}

/** Aplica dano já rolado: no combatente da Mesa ou, fora do combate, direto na ficha do herói. */
export function aplicarDano(alvo: Quem, valor: number) {
  const msg = alvo.combId ? applyDmgComb(alvo.combId, valor) : alvo.charId ? applyDmgChar(alvo.charId, valor) : ''
  if (msg) toast(msg)
  return msg
}
