/* Pontos de talento e de aptidão pelo livro (Capítulo 3 e 5), para a Árvore de Habilidades.
 * - Talento: 1 no 1º nível (+1 Humano) e mais 1 a cada 3 níveis de personagem.
 * - Talento bônus de classe: nos níveis pares da classe, só da lista daquela classe.
 * - Aptidão: nos níveis ímpares da classe, só das árvores daquela classe (ou da Força, se sensitivo).
 * - Talentos iniciais da 1ª classe, um da lista de cada classe nova e os da espécie são grátis. */
import { CLASSES, FEATS, FORCE_TREES, SPECIES_BY, TREES } from '../data/saga'
import { classLevels, treesFor } from './engine'
import type { Character, ClassId } from './types'

type Lv = Partial<Record<ClassId, number>>

const isFeat = (owned: string, listItem: string) => owned === listItem || owned.startsWith(listItem + ' (')
const inList = (owned: string, list: string[]) => list.some(x => isFeat(owned, x))

/** Talentos que vieram de graça (classe inicial, classes novas, espécie). */
export function freeFeats(c: Character): string[] {
  const left = [...c.feats]
  const out: string[] = []
  const take = (n: string) => {
    const i = left.indexOf(n)
    if (i < 0) return false
    left.splice(i, 1)
    out.push(n)
    return true
  }
  const seen: ClassId[] = []
  c.cls.forEach((k, i) => {
    if (seen.includes(k)) return
    seen.push(k)
    const start = CLASSES[k].start as string[]
    if (i === 0) start.forEach(take)
    else start.some(take)
  })
  const sp = SPECIES_BY[c.species] as { bonusFeats?: string[]; condFeat?: string[] } | undefined
  sp?.bonusFeats?.forEach(take)
  if (sp?.condFeat && c.trained.includes(sp.condFeat[0])) take(sp.condFeat[1])
  return out
}

export interface FeatBudget {
  general: number
  usedGeneral: number
  bonus: Lv
  usedBonus: Lv
  free: string[]
  /** Talentos além do que o nível permite (fichas antigas ou editadas à mão). */
  over: number
}

export function featBudget(c: Character): FeatBudget {
  const lvl = Math.max(1, c.cls.length)
  const CL = classLevels(c)
  const general = 1 + Math.floor(lvl / 3) + ((SPECIES_BY[c.species] as { bonusFeat?: boolean })?.bonusFeat ? 1 : 0)
  const bonus: Lv = {}
  const usedBonus: Lv = {}
  ;(Object.keys(CL) as ClassId[]).forEach(k => { bonus[k] = Math.floor(CL[k]! / 2); usedBonus[k] = 0 })
  const free = freeFeats(c)
  const rest = [...c.feats]
  free.forEach(f => rest.splice(rest.indexOf(f), 1))
  // Quem não está em nenhuma lista bônus só cabe na vaga geral. Os da lista ocupam a geral primeiro e,
  // cheia, a bônus: assim o ponto que sobra é o mais restrito (o talento bônus fica preso à lista da classe).
  const ks = Object.keys(bonus) as ClassId[]
  const listed = rest.filter(f => ks.some(x => inList(f, CLASSES[x].bonus)))
  let usedGeneral = rest.length - listed.length
  for (const f of listed) {
    if (usedGeneral < general) { usedGeneral++; continue }
    const k = ks.find(x => usedBonus[x]! < bonus[x]! && inList(f, CLASSES[x].bonus))
    if (k) usedBonus[k]!++
    else usedGeneral++
  }
  return { general, usedGeneral, bonus, usedBonus, free, over: Math.max(0, usedGeneral - general) }
}

/** Onde um talento novo entraria: 'geral', a classe da vaga bônus, ou null se não há ponto. */
export function featSlotFor(c: Character, name: string, B: FeatBudget = featBudget(c)): 'geral' | ClassId | null {
  if (B.usedGeneral < B.general) return 'geral'
  const k = (Object.keys(B.bonus) as ClassId[]).find(x => B.usedBonus[x]! < B.bonus[x]! && inList(name, CLASSES[x].bonus))
  return k ?? null
}

export const treeOwner: Record<string, ClassId | 'forca'> = {}
;(Object.keys(CLASSES) as ClassId[]).forEach(k => CLASSES[k].trees.forEach(t => { treeOwner[t] = k }))
FORCE_TREES.forEach(t => { treeOwner[t] = 'forca' })
const TALENT_TREE: Record<string, string> = {}
Object.entries(TREES).forEach(([t, arr]) => arr.forEach(x => { TALENT_TREE[x.n] = t }))

export interface TalentBudget { total: Lv; used: Lv; over: number }

export function talentBudget(c: Character): TalentBudget {
  const CL = classLevels(c)
  const total: Lv = {}
  const used: Lv = {}
  const ks = Object.keys(CL) as ClassId[]
  ks.forEach(k => { total[k] = Math.ceil(CL[k]! / 2); used[k] = 0 })
  let over = 0
  const force: string[] = []
  for (const t of c.talents) {
    const o = treeOwner[TALENT_TREE[t]]
    if (o === 'forca') { force.push(t); continue }
    if (o && total[o] != null && used[o]! < total[o]!) used[o]!++
    else over++
  }
  force.forEach(() => {
    const k = ks.find(x => used[x]! < total[x]!)
    if (k) used[k]!++
    else over++
  })
  return { total, used, over }
}

/** Classe cuja aptidão pagaria este talento, ou null. */
export function talentSlotFor(c: Character, name: string, B: TalentBudget = talentBudget(c)): ClassId | null {
  const tree = TALENT_TREE[name]
  const ks = (Object.keys(B.total) as ClassId[]).filter(k => B.used[k]! < B.total[k]! && treesFor(c, k).includes(tree))
  return ks[0] ?? null
}

export const freeTalents = (B: TalentBudget) => (Object.keys(B.total) as ClassId[]).reduce((s, k) => s + B.total[k]! - B.used[k]!, 0)
export const freeGeneral = (B: FeatBudget) => Math.max(0, B.general - B.usedGeneral)
export const freeBonus = (B: FeatBudget) => (Object.keys(B.bonus) as ClassId[]).reduce((s, k) => s + B.bonus[k]! - B.usedBonus[k]!, 0)

/** Habilidades que ficariam sem pré-requisito se esta saísse (não deixa quebrar o caminho). */
export function dependents(c: Character, name: string, kind: 'feat' | 'talent'): string[] {
  const out: string[] = []
  if (kind === 'talent') {
    // Só a última cópia de um talento repetível segura os dependentes.
    if (c.talents.filter(x => x === name).length > 1) return out
    Object.values(TREES).flat().forEach(t => { if (c.talents.includes(t.n) && (t as { p?: string[] }).p?.includes(name)) out.push(t.n) })
    return out
  }
  const base = name.replace(/ \(.*\)$/, '')
  const still = c.feats.filter(f => f !== name).length < c.feats.length - 1
  if (still) return out
  for (const f of FEATS as { n: string; req?: { feats?: string[] } }[]) {
    const owned = c.feats.filter(x => isFeat(x, f.n))
    if (!owned.length) continue
    const needs = f.req?.feats?.some(r => r === name || (r === base && !c.feats.some(x => x !== name && isFeat(x, base))))
    if (needs) out.push(...new Set(owned))
  }
  Object.values(TREES).flat().forEach(t => {
    if (c.talents.includes(t.n) && (t as { pf?: string[] }).pf?.includes(name)) out.push(t.n)
  })
  // Sem Sensitividade da Força somem as aptidões da Força.
  if (name === 'Sensitividade da Força') c.talents.forEach(t => { if (treeOwner[TALENT_TREE[t]] === 'forca') out.push(t) })
  return [...new Set(out)]
}
