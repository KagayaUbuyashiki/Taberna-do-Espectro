/* Que tipo de ataque é, até onde ele alcança e o que ele atinge (Tabelas 8-3 a 8-5). Funções puras. */
import { RANGES, RANGE_LABEL, RANGE_PEN, WEAPON_BY } from '../data/saga'

/** Tipo visual e sonoro do ataque. */
export type Tipo =
  | 'blaster' | 'rajada' | 'ion' | 'pesada' | 'lesma' | 'flecha' | 'pedra' | 'bowcaster'
  | 'sabre' | 'vibro' | 'fisico' | 'garra' | 'arremesso' | 'granada' | 'termal' | 'missil' | 'chamas' | 'forca'

export type GrupoAlcance = keyof typeof RANGES
export type Area = { forma: 'raio'; r: number } | { forma: 'cone'; q: number }

export interface Arma {
  nome: string
  tipo: Tipo
  /** Corpo a corpo: só alcança quadrados adjacentes. */
  corpo: boolean
  /** Pode ser arremessada (faca, lança): longe do alvo, usa o alcance de arremesso. */
  arremessavel: boolean
  grupo: GrupoAlcance | null
  /** Limites de queima-roupa, curto, médio e longo, em quadrados. Corpo a corpo: [1]. */
  faixas: number[]
  area: Area | null
  /** Cor do disparo ou da lâmina. */
  cor: string
}

const COR: Partial<Record<Tipo, string>> = {
  blaster: '#ff3b2f', rajada: '#ff3b2f', pesada: '#ff5a1f', ion: '#6fd3ff', bowcaster: '#5fd38a', sabre: '#4fc3ff',
  forca: '#b8a1ff', chamas: '#ff9a1f', lesma: '#cfcfd6', flecha: '#c9a26b', pedra: '#9a9aa6', vibro: '#d8f6ff', fisico: '#efe6d2',
  garra: '#c4141c', granada: '#ffd24a', termal: '#ffffff', missil: '#ffd24a', arremesso: '#efe6d2',
}
/** Raio da explosão das granadas, do detonador e do míssil, e o cone do lança-chamas. */
export const EXPLOSAO = 2
export const CONE_CHAMAS = 6

type Base = (typeof WEAPON_BY)[string]

function deBase(b: Base, nome: string): Arma {
  const n = b.n
  const corpo = !!(b as { m?: boolean }).m
  const arremessavel = !!(b as { thrown?: boolean }).thrown
  const area = !!(b as { area?: boolean }).area
  let tipo: Tipo
  if (b.g === 'sabres de luz') tipo = 'sabre'
  else if (corpo) tipo = /vibro|eletro|haste/i.test(n) ? 'vibro' : 'fisico'
  else if (n === 'Detonador termal') tipo = 'termal'
  else if (area) tipo = 'granada'
  else if (n === 'Lança mísseis') tipo = 'missil'
  else if (n === 'Lança-chamas') tipo = 'chamas'
  else if (n === 'Bowcaster') tipo = 'bowcaster'
  else if (/íon/.test(b.type)) tipo = 'ion'
  else if (/lesma/i.test(n)) tipo = 'lesma'
  else if (n === 'Arco') tipo = 'flecha'
  else if (n === 'Funda') tipo = 'pedra'
  else if (/repetidora/i.test(n)) tipo = 'rajada'
  else if (b.g === 'armas pesadas') tipo = 'pesada'
  else tipo = 'blaster'

  let grupo: GrupoAlcance | null = null
  if (!corpo) {
    if (area || (arremessavel && b.g === 'armas simples')) grupo = 'arremesso'
    else if (tipo === 'bowcaster') grupo = 'rifles'
    else if (tipo === 'chamas') grupo = null
    else if (b.g in RANGES) grupo = b.g as GrupoAlcance
    else grupo = 'pistolas'
  }
  const faixas = corpo ? [1] : tipo === 'chamas' ? [CONE_CHAMAS] : RANGES[grupo ?? 'pistolas']
  const zona: Area | null = tipo === 'chamas' ? { forma: 'cone', q: CONE_CHAMAS }
    : tipo === 'granada' || tipo === 'termal' || tipo === 'missil' ? { forma: 'raio', r: EXPLOSAO } : null
  return { nome, tipo, corpo, arremessavel, grupo, faixas, area: zona, cor: COR[tipo] ?? '#ffd24a' }
}

/** Arma da ficha: modelo do livro + cor da lâmina escolhida. */
export function armaDaFicha(w: { n: string; base: string; color?: string }): Arma {
  const b = WEAPON_BY[w.base] ?? WEAPON_BY['Desarmado']
  const a = deBase(b, w.n || b.n)
  return a.tipo === 'sabre' && w.color ? { ...a, cor: w.color } : a
}

/** Ataque de inimigo do bestiário ou improvisado: [nome, bônus, dano, à distância]. */
export function armaDoAtaque(nome: string, distancia: boolean): Arma {
  const limpo = nome.replace(/^\d+\s+/, '').replace(/\s*\(.*\)\s*$/, '').trim()
  const achada = WEAPON_BY[limpo]
    ?? Object.values(WEAPON_BY).sort((a, b) => b.n.length - a.n.length).find(b => limpo.toLowerCase().startsWith(b.n.toLowerCase()))
  if (achada) return deBase(achada, nome)
  if (/granada/i.test(nome)) return deBase(WEAPON_BY['Granada de fragmento'], nome)
  if (/garra|mordida|presa|chifre|cauda|pisão/i.test(nome)) return { ...deBase(WEAPON_BY['Desarmado'], nome), tipo: 'garra', cor: COR.garra! }
  if (/canh(ão|ões)|laser|tiro rápido/i.test(nome)) return { ...deBase(WEAPON_BY['Rifle blaster'], nome), tipo: 'rajada' }
  if (/sabre/i.test(nome)) return deBase(WEAPON_BY['Sabre de luz'], nome)
  return distancia ? deBase(WEAPON_BY['Pistola blaster'], nome) : deBase(WEAPON_BY['Desarmado'], nome)
}

/* ------------------------------------------------------------------ grade */

export interface Ponto { x: number; y: number }

/** Edição Saga: diagonais contam 1 e 2 quadrados alternados. */
export function distGrade(a: Ponto, b: Ponto) {
  const dx = Math.abs(b.x - a.x), dy = Math.abs(b.y - a.y)
  return Math.max(dx, dy) + Math.floor(Math.min(dx, dy) / 2)
}

/** Faixas que valem para essa distância: arma de arremesso longe do alvo usa o alcance de arremesso. */
export function faixasPara(a: Arma, dist: number) {
  if (a.corpo && a.arremessavel && dist > 1) return RANGES.arremesso
  return a.faixas
}

export interface Leitura {
  dist: number
  metros: number
  /** 0 a 3 (queima-roupa a longo); -1 fora de alcance. Corpo a corpo: 0 se adjacente. */
  faixa: number
  penalidade: number
  rotulo: string
  arremessando: boolean
}

/** Distância, faixa de alcance e penalidade do ataque de `de` em `para`. */
export function lerAlcance(a: Arma, de: Ponto, para: Ponto): Leitura {
  const dist = distGrade(de, para)
  const fx = faixasPara(a, dist)
  const arremessando = a.corpo && a.arremessavel && dist > 1
  const corpo = a.corpo && !arremessando
  const faixa = corpo ? (dist <= 1 ? 0 : -1) : fx.findIndex(r => dist <= r)
  const metros = dist * 1.5
  const m = metros.toLocaleString('pt-BR')
  let rotulo: string
  if (corpo) rotulo = faixa === 0 ? `${dist} q · corpo a corpo` : `${dist} q · ${m} m · longe demais para corpo a corpo`
  else if (a.area?.forma === 'cone') rotulo = faixa >= 0 ? `${dist} q · ${m} m · dentro do cone` : `${dist} q · ${m} m · fora do cone de ${a.area.q} q`
  else rotulo = `${dist} q · ${m} m · ${faixa < 0 ? 'fora de alcance' : RANGE_LABEL[faixa]}`
  return { dist, metros, faixa, penalidade: corpo || faixa < 0 || a.area?.forma === 'cone' ? 0 : RANGE_PEN[faixa], rotulo, arremessando }
}

/** Quadrados atingidos pela área: raio em volta do alvo, ou cone saindo do atacante na direção do alvo. */
export function celulasDaArea(area: Area, de: Ponto, alvo: Ponto, cols: number, rows: number): Ponto[] {
  const out: Ponto[] = []
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const p = { x, y }
    if (area.forma === 'raio') { if (distGrade(alvo, p) <= area.r) out.push(p) }
    else {
      const d = distGrade(de, p)
      if (d < 1 || d > area.q) continue
      // ângulo entre a direção do alvo e a do quadrado: cone de 90°
      const ax = alvo.x - de.x, ay = alvo.y - de.y, bx = x - de.x, by = y - de.y
      const cos = (ax * bx + ay * by) / ((Math.hypot(ax, ay) || 1) * Math.hypot(bx, by))
      if (cos >= Math.SQRT1_2 - 1e-9) out.push(p)
    }
  }
  return out
}

/** Defesa extra do alvo pela cobertura do quadrado em que ele está (+5 cobertura, +10 melhorada). */
export const BONUS_COBERTURA = { cobertura: 5, melhorada: 10 } as const
export type Cobertura = keyof typeof BONUS_COBERTURA
