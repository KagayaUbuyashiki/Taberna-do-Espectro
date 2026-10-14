import {
  ABILS, ABIL_SHORT, ARMOR_BY, ARMOR_PEN, CLASSES, COND, FORCE_TREES, SKILLS, SPECIES, SPECIES_BY, WEAPON_BY, XP_TABLE,
} from '../data/saga'
import { mod } from './dice'
import type { AbilKey, Abilities, Character, ClassId, WeaponEntry } from './types'

type Feat = { n: string; req?: { abil?: Record<string, number>; bab?: number; feats?: string[]; trained?: string; species?: string }; multi?: boolean; choice?: string }
type Talent = { n: string; p?: string[]; pf?: string[]; bab?: number; abil?: Record<string, number>; multi?: number; dark?: boolean }

export const ABIL_KEYS = ABILS.map(a => a[0]) as AbilKey[]
export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4)

export const has = (c: Character, n: string) => c.feats.includes(n)
export const hasT = (c: Character, n: string) => c.talents.includes(n)
export const countT = (c: Character, n: string) => c.talents.filter(t => t === n).length
export const countF = (c: Character, n: string) => c.feats.filter(t => t === n).length

export function classLevels(c: Character) {
  const o: Partial<Record<ClassId, number>> = {}
  c.cls.forEach(k => { o[k] = (o[k] || 0) + 1 })
  return o
}

export function finalAbil(c: Character): Abilities {
  const sp = SPECIES_BY[c.species] || { mods: {} }
  const mods = sp.mods as Partial<Abilities>
  const o = {} as Abilities
  ABIL_KEYS.forEach(k => { o[k] = (c.abil[k] || 10) + (mods[k] || 0) + (c.inc?.[k] || 0) })
  return o
}

export function babOf(c: Character) {
  let b = 0
  Object.entries(classLevels(c)).forEach(([k, n]) => {
    b += CLASSES[k as ClassId].bab === 'full' ? n! : Math.floor((n! * 3) / 4)
  })
  return b
}

export function isProfGroup(c: Character, g: string, wName: string) {
  if (g === 'exótica') {
    if (c.species === 'wookiee' && wName === 'Bowcaster') return true
    return has(c, 'Proficiência em Arma Exótica')
  }
  if (wName === 'Desarmado') return true
  return has(c, `Proficiência em Arma (${g})`)
}

/** Calcula todos os valores derivados da ficha conforme o livro. */
export function calc(c: Character) {
  const sp = SPECIES_BY[c.species] || SPECIES[0]
  const lvl = Math.max(1, c.cls.length)
  const half = Math.floor(lvl / 2)
  const A = finalAbil(c)
  const M = {} as Abilities
  ABIL_KEYS.forEach(k => { M[k] = mod(A[k]) })
  const bab = babOf(c)
  const CL = classLevels(c)
  const cdef = { ref: 0, fort: 0, will: 0 }
  Object.keys(CL).forEach(k => {
    const d = CLASSES[k as ClassId].def as Partial<typeof cdef>
    ;(['ref', 'fort', 'will'] as const).forEach(x => { cdef[x] = Math.max(cdef[x], d[x] || 0) })
  })
  const sdef = (sp.def || {}) as Partial<typeof cdef>
  const cond = COND[c.cond || 0]
  const cp = cond.p
  const da = has(c, 'Defesas Aprimoradas') ? 1 : 0
  // Armadura personalizada (feita pelo mestre) substitui os números do modelo base.
  const ap = c.armaduraPersonalizada
  const ar = ap ? { n: ap.nome, cat: ap.cat, ref: ap.ref, fort: ap.fort, maxDex: ap.maxDex, cost: 0 } : c.armor ? ARMOR_BY[c.armor] : null
  const arProf = ar ? has(c, `Proficiência em Armadura (${ar.cat})`) : true
  const skinBonus = ar && arProf && hasT(c, 'Segunda Pele') ? 1 : 0
  let refBase = lvl
  let dexCap = 99
  if (ar) {
    const ab = ar.ref + skinBonus
    refBase = hasT(c, 'Defesa Blindada Aprimorada') && arProf
      ? Math.max(lvl + Math.floor(ab / 2), ab)
      : hasT(c, 'Defesa Blindada') && arProf ? Math.max(lvl, ab) : ab
    dexCap = ar.maxDex + (hasT(c, 'Domínio de Armadura') && arProf ? 1 : 0)
  }
  const sizeRef = sp.size === 'Pequeno' ? 1 : 0
  const ref = 10 + refBase + Math.min(M.des, dexCap) + cdef.ref + (sp.natArmor || 0) + sizeRef + (sdef.ref || 0) + da + cp
  const fort = 10 + lvl + M.con + cdef.fort + (ar && arProf ? ar.fort + skinBonus : 0) + (sdef.fort || 0) + da + cp
  const will = 10 + lvl + M.sab + cdef.will + (sdef.will || 0) + da + cp
  const thr = fort + 5 * countF(c, 'Limiar de Dano Aprimorado')
  const first = c.cls[0] || 'soldado'
  let hpMax = CLASSES[first].hp0 + M.con
  c.hpRolls.forEach(r => { hpMax += Math.max(1, r + M.con) })
  if (has(c, 'Vitalidade')) hpMax += lvl
  let speed = sp.speed
  if (ar && ar.cat !== 'leve' && !hasT(c, 'Juggernauta')) speed = speed >= 6 ? 4 : 3
  if (hasT(c, 'Passo Largo') && (!ar || ar.cat === 'leve')) speed += 2
  const armPen = ar && !arProf ? ARMOR_PEN[ar.cat as keyof typeof ARMOR_PEN] : 0
  const forceSens = has(c, 'Sensitividade da Força')
  const reroll = (sp.reroll || []) as string[]
  const skills = SKILLS.map(s => {
    const tr = c.trained.includes(s.n)
    const focus = has(c, `Foco em Perícia (${s.n})`)
    let tot = half + M[s.a as AbilKey] + (tr ? 5 : 0) + (focus ? 5 : 0) + (s.arm ? armPen : 0) + cp
    if (s.n === 'Furtividade' && sp.size === 'Pequeno') tot += 5
    let usable = true
    if (s.trainedOnly && !tr) usable = false
    if (s.force && (!forceSens || !tr)) usable = false
    return { ...s, tr, focus, tot, usable, reroll: reroll.includes(s.n) }
  })
  const sk = Object.fromEntries(skills.map(s => [s.n, s]))
  const fpMax = 5 + Math.floor(lvl / 2) + (has(c, 'Benção da Força') ? 3 : 0)
  const fDice = lvl >= 15 ? 3 : lvl >= 8 ? 2 : 1
  const fDie = has(c, 'Forte na Força') ? 8 : 6
  const powersAllowed = countF(c, 'Treinamento da Força') * Math.max(1, 1 + M.sab)
  const xpNext = XP_TABLE[Math.min(20, lvl + 1)]
  return {
    sp, lvl, half, A, M, bab, CL, cdef, ref, fort, will, thr, hpMax, speed, armPen, ar, arProf, skills, sk,
    fpMax, fDice, fDie, forceSens, powersAllowed, cond, cp, dexCap, xpNext, grapple: bab + Math.max(M.vig, M.des),
  }
}
export type Calc = ReturnType<typeof calc>

export function weaponStats(c: Character, w: WeaponEntry, K: Calc = calc(c)) {
  const base = WEAPON_BY[w.base] || WEAPON_BY['Desarmado']
  const melee = !!base.m
  const saber = base.g === 'sabres de luz'
  const prof = isProfGroup(c, base.g, base.n)
  let am = melee ? K.M.vig : K.M.des
  if (melee && has(c, 'Acuidade com Arma') && (base.light || saber)) am = Math.max(K.M.vig, K.M.des)
  if (base.thrown && !melee) am = K.M.des
  const focus = has(c, `Foco em Arma (${base.g})`) ? 1 : 0
  const atk = K.bab + am + focus + (prof ? 0 : -5) + K.armPen + K.cp + (+w.atkMisc || 0)
  let dmgB = K.half + (+w.dmgMisc || 0)
  if (melee) dmgB += K.M.vig + (hasT(c, 'Colisão Física') ? 1 : 0)
  if (saber && hasT(c, 'Especialização em Arma (sabres de luz)')) dmgB += 2
  if (hasT(c, 'Especialização em Arma') && focus) dmgB += 2
  const dice = base.dmg.split('/')[0]
  const dmg = dice + (dmgB ? (dmgB > 0 ? '+' : '') + dmgB : '')
  return { base, melee, prof, atk, dmg, dmgB, dice, focus, saber }
}

export function featReqText(f: Feat) {
  const r = f.req || {}
  const out: string[] = []
  if (r.abil) Object.entries(r.abil).forEach(([k, v]) => out.push(`${ABIL_SHORT[k]} ${v}`))
  if (r.bab) out.push(`BBA +${r.bab}`)
  if (r.feats) out.push(...r.feats)
  if (r.trained) out.push(`treinado em ${r.trained}`)
  if (r.species) out.push(SPECIES_BY[r.species].name)
  return out.join(', ')
}

export function featOk(c: Character, f: Feat, K: Calc = calc(c)) {
  const r = f.req || {}
  if (r.abil) for (const [k, v] of Object.entries(r.abil)) if (K.A[k as AbilKey] < v) return false
  if (r.bab && K.bab < r.bab) return false
  if (r.feats) for (const n of r.feats) {
    if (n.startsWith('Proficiência em Arma (')) { if (!has(c, n)) return false }
    else if (!c.feats.some(x => x === n || x.startsWith(n + ' ('))) return false
  }
  if (r.trained && !c.trained.includes(r.trained)) return false
  if (r.species && c.species !== r.species) return false
  if (!f.multi && !f.choice && has(c, f.n)) return false
  return true
}

export function talentOk(c: Character, t: Talent, K: Calc = calc(c)) {
  if (countT(c, t.n) >= (t.multi || 1)) return false
  if (t.p) for (const n of t.p) if (!hasT(c, n)) return false
  if (t.pf) for (const n of t.pf) if (!has(c, n)) return false
  if (t.bab && K.bab < t.bab) return false
  if (t.abil) for (const [k, v] of Object.entries(t.abil)) if (K.A[k as AbilKey] < v) return false
  if (t.dark && !(c.ds > 0)) return false
  return true
}

export function treesFor(c: Character, cls: ClassId) {
  const t = [...CLASSES[cls].trees]
  if (has(c, 'Sensitividade da Força')) t.push(...FORCE_TREES)
  return t
}

export function blankChar(): Character {
  return {
    id: uid(), name: '', player: '', species: 'humano', cls: ['jedi'],
    abil: { vig: 10, des: 10, con: 10, int: 10, sab: 10, car: 10 }, inc: {},
    trained: [], feats: [], talents: [], powers: [], hpRolls: [], hp: 0, tmpHp: 0, cond: 0, persistent: false,
    fp: 5, dp: 1, ds: 0, credits: 0, weapons: [], armor: null, gear: [], langs: '', age: '', sex: '', height: '',
    weight: '', destiny: '', notes: '', portrait: null, xp: 0, secondWind: 0, updated: Date.now(),
  }
}

/** Dano contra o limiar: desce no curso da condição e trata 0 PV. */
export function applyDamage(hp: number, cond: number, thr: number, amt: number) {
  const nhp = Math.max(0, hp - amt)
  let ncond = cond
  let msg: string
  if (nhp === 0) {
    ncond = 5
    msg = amt >= thr ? 'morto' : 'inconsciente'
  } else if (amt >= thr) {
    ncond = Math.min(5, cond + 1)
    msg = 'desce'
  } else msg = 'ok'
  return { hp: nhp, cond: ncond, result: msg as 'morto' | 'inconsciente' | 'desce' | 'ok' }
}
