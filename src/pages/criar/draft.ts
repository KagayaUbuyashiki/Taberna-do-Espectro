/* Rascunho do assistente de criação: estado, regras do 1º nível e validação (porte de wizard.js). */
import {
  ARMOR_BY, CLASSES, FEATS, FEAT_BY, POINT_COST, SPECIES_BY, STANDARD_ARRAY, TREES, WEAPON_BY, WEAPON_GROUPS,
} from '../../data/saga'
import { ABIL_KEYS, blankChar, calc, featOk, finalAbil, has, talentOk, treesFor, uid } from '../../rules/engine'
import { mod } from '../../rules/dice'
import type { Character, ClassId, GearEntry, WeaponEntry } from '../../rules/types'

export const STEPS = ['Espécie', 'Classe', 'Habilidades', 'Perícias', 'Talentos', 'Aptidão', 'Equipamento', 'Detalhes', 'Revisão'] as const
export const S = { especie: 0, classe: 1, habil: 2, pericias: 3, talentos: 4, aptidao: 5, equip: 6, detalhes: 7, revisao: 8 } as const

export type Method = 'pacote' | 'pontos' | 'rolagem'
/** Itens de graça (espécie, sabre do Mestre) e o preço pago só existem no rascunho. */
export type DraftGear = GearEntry & { free?: boolean; cost?: number }
export type DraftWeapon = WeaponEntry & { free?: boolean }
export type DraftChar = Omit<Character, 'gear' | 'weapons'> & { gear: DraftGear[]; weapons: DraftWeapon[] }

export interface Draft {
  step: number
  /** Etapa mais avançada já visitada (as anteriores ficam clicáveis). */
  seen: number
  c: DraftChar
  method: Method
  pool: number[]
  arr: number[]
  picks: string[]
  talent: string | null
  credits: number | null
  powers: string[]
  rollDet: string
}

export interface Feat { n: string; d: string; req?: { abil?: Record<string, number>; bab?: number; feats?: string[]; trained?: string; species?: string }; multi?: boolean; choice?: string }
export interface Talent { n: string; d: string; p?: string[]; pf?: string[]; bab?: number; abil?: Record<string, number>; multi?: number; dark?: boolean }

export const FEAT_LIST = FEATS as Feat[]
export const FEAT_MAP = FEAT_BY as Record<string, Feat>
export const TREE_MAP = TREES as unknown as Record<string, Talent[]>
export const COST = POINT_COST as Record<number, number>
export const POINT_BUDGET = 25

/** Prefixo do talento que treina uma perícia. */
export const TP = 'Treinamento em Perícia ('

export const cr = (n: number) => n.toLocaleString('pt-BR')
export const sp = (c: DraftChar) => SPECIES_BY[c.species] ?? SPECIES_BY.humano
export const cl = (c: DraftChar) => CLASSES[c.cls[0]]
/** Defesas de classe com chaves opcionais (o formato varia por classe). */
export const clsDef = (id: ClassId) => CLASSES[id].def as Partial<Record<'ref' | 'fort' | 'will', number>>

export function newDraft(): Draft {
  const c = blankChar() as DraftChar
  c.abil = { vig: 15, des: 14, con: 13, int: 12, sab: 10, car: 8 }
  c.langs = sp(c).langs.join(', ')
  return sync({
    step: 0, seen: 0, c, method: 'pacote', pool: [...STANDARD_ARRAY], arr: [15, 14, 13, 12, 10, 8],
    picks: [], talent: null, credits: null, powers: [], rollDet: '',
  })
}

/** Talentos iniciais da classe que o personagem realmente recebe, mais os da espécie. */
export function autoFeats(c: DraftChar) {
  const s = sp(c)
  const A = finalAbil(c)
  const list = cl(c).start.filter(f => {
    if (f === 'Lingüística') return A.int >= 13
    if (f === 'Se Livrar') return A.con >= 13 && c.trained.includes('Tolerância')
    if (s.primitive && /Proficiência em Arma \((pistolas|rifles|armas pesadas)\)/.test(f)) return false
    return true
  })
  ;(s.bonusFeats || []).forEach(f => list.push(f))
  if (s.condFeat && c.trained.includes(s.condFeat[0])) list.push(s.condFeat[1])
  return list
}
export const freeFeatSlots = (c: DraftChar) => 1 + (sp(c).bonusFeat ? 1 : 0)
export function skillSlots(c: DraftChar) {
  const A = finalAbil(c)
  return Math.max(1, cl(c).skillsN + mod(A.int)) + (sp(c).extraSkill ? 1 : 0)
}
export function classSkillList(c: DraftChar) {
  const l = [...cl(c).skills]
  if (c.feats.includes('Sensitividade da Força') && !l.includes('Usar a Força')) l.push('Usar a Força')
  return l
}
/** Perícias treinadas pelo talento Treinamento em Perícia (não contam nas vagas da classe). */
export const featSkills = (d: Draft) => d.picks.filter(p => p.startsWith(TP)).map(p => p.slice(TP.length, -1))
export const baseTrained = (d: Draft) => { const fs = featSkills(d); return d.c.trained.filter(s => !fs.includes(s)) }

/** Opções de talentos com escolha (grupo de armas, perícia). */
export function choiceOptions(c: DraftChar, f: Feat): string[] | null {
  if (!f.choice) return null
  let o: string[] = []
  if (f.choice === 'group' || f.choice === 'prof') o = [...WEAPON_GROUPS]
  else if (f.choice === 'trained') o = c.trained.filter(s => !has(c, `Foco em Perícia (${s})`))
  else if (f.choice === 'untrained') o = classSkillList(c).filter(s => !c.trained.includes(s))
  if (f.choice === 'prof') o = o.filter(g => !has(c, `Proficiência em Arma (${g})`))
  if (f.choice === 'group') o = o.filter(g => !has(c, `Foco em Arma (${g})`))
  return o
}

export function spent(d: Draft) {
  const c = d.c
  const w = c.weapons.reduce((s, x) => s + (x.free ? 0 : WEAPON_BY[x.base]?.cost || 0), 0)
  const a = c.armor ? ARMOR_BY[c.armor]?.cost || 0 : 0
  const g = c.gear.reduce((s, x) => s + (x.free ? 0 : (x.cost || 0) * x.q), 0)
  return w + a + g
}
export const creditsLeft = (d: Draft) => (d.credits ?? 0) - spent(d)
export const pointsSpent = (c: DraftChar) => ABIL_KEYS.reduce((s, k) => s + COST[c.abil[k]], 0)

/** Equipamento grátis da espécie (ex.: máscara do Kel Dor). */
export const speciesGear = (c: DraftChar): DraftGear[] => (sp(c).gear || []).map(n => ({ n, q: 1, w: 0.5, free: true }))

/** Recalcula o que deriva das escolhas (como o syncDraft do protótipo). */
export function sync(d: Draft): Draft {
  const c = d.c
  if (d.method !== 'pontos') ABIL_KEYS.forEach((k, i) => { c.abil[k] = d.arr[i] })
  c.feats = [...autoFeats(c), ...d.picks]
  // Aptidão que saiu das árvores disponíveis (ex.: removeu Sensitividade da Força) é descartada.
  if (d.talent && !treesFor(c, c.cls[0]).some(t => TREE_MAP[t]?.some(x => x.n === d.talent))) d.talent = null
  c.talents = d.talent ? [d.talent] : []
  const K = calc(c)
  if (d.powers.length > K.powersAllowed) d.powers = d.powers.slice(0, K.powersAllowed)
  c.powers = d.powers.map(n => ({ n, used: false }))
  c.credits = creditsLeft(d)
  return d
}

/** Aplica uma alteração sobre uma cópia do rascunho e recalcula. */
export function produce(d: Draft, fn: (x: Draft) => void) {
  const n = structuredClone(d)
  fn(n)
  return sync(n)
}

/* ===== Ações que mexem em várias partes do rascunho ===== */
export function setSpecies(d: Draft, id: string) {
  const c = d.c
  if (!c.langs.trim() || c.langs === sp(c).langs.join(', ')) c.langs = SPECIES_BY[id].langs.join(', ')
  c.species = id
  if (d.credits != null) c.gear = [...speciesGear(c), ...c.gear.filter(g => !g.free)]
}
export function setClass(d: Draft, id: ClassId) {
  if (d.c.cls[0] === id) return
  d.c.cls = [id]
  d.c.trained = []
  d.talent = null
  d.picks = d.picks.filter(p => !p.startsWith(TP))
  // Os créditos iniciais dependem da classe: rola de novo.
  d.credits = null
  d.c.weapons = []
  d.c.armor = null
  d.c.gear = []
}
export function applyCredits(d: Draft, total: number) {
  const c = d.c
  d.credits = total
  c.weapons = []
  c.armor = null
  if (c.cls[0] === 'jedi') c.weapons.push({ id: uid(), n: 'Sabre de luz', base: 'Sabre de luz', atkMisc: 0, dmgMisc: 0, notes: 'Fornecido pelo Mestre', free: true })
  c.gear = speciesGear(c)
}
export function pickFeat(d: Draft, name: string) {
  if (d.picks.length >= freeFeatSlots(d.c)) return
  if (name.startsWith(TP)) d.c.trained.push(name.slice(TP.length, -1))
  d.picks.push(name)
}
export function unpickFeat(d: Draft, i: number) {
  const p = d.picks[i]
  if (!p) return
  if (p.startsWith(TP)) { const s = p.slice(TP.length, -1); d.c.trained = d.c.trained.filter(x => x !== s) }
  d.picks.splice(i, 1)
}

/** Talento-base de um nome escolhido ("Foco em Arma (pistolas)" → Foco em Arma). */
export function featOf(name: string): Feat | undefined {
  const i = name.indexOf(' (')
  return FEAT_MAP[name] ?? (i > 0 ? FEAT_MAP[name.slice(0, i)] : undefined)
}
export const talentByName = (n: string) => Object.values(TREE_MAP).flat().find(x => x.n === n)

/* ===== Validação ===== */
export interface Problem { step: number; msg: string; block: boolean }

export function problems(d: Draft): Problem[] {
  const c = d.c
  const out: Problem[] = []
  const n = skillSlots(c), bt = baseTrained(d).length
  if (bt < n) out.push({ step: S.pericias, msg: `Faltam ${n - bt} perícia(s) treinada(s).`, block: true })
  if (bt > n) out.push({ step: S.pericias, msg: `Perícias a mais: desmarque ${bt - n}.`, block: true })
  const fs = freeFeatSlots(c)
  if (d.picks.length < fs) out.push({ step: S.talentos, msg: `Falta escolher ${fs - d.picks.length} talento(s).`, block: true })
  if (d.picks.length > fs) out.push({ step: S.talentos, msg: `Talentos a mais: remova ${d.picks.length - fs}.`, block: true })
  // Pré-requisito perdido depois de mudar habilidades, espécie ou outro talento.
  d.picks.forEach(p => {
    const f = featOf(p)
    if (!f) return
    const feats = [...c.feats]
    feats.splice(feats.lastIndexOf(p), 1)
    const c2 = { ...c, feats }
    if (!featOk(c2, f, calc(c2))) out.push({ step: S.talentos, msg: `${p}: pré-requisito não atendido.`, block: true })
  })
  // Foco em Perícia exige a perícia treinada.
  d.picks.filter(p => p.startsWith('Foco em Perícia (')).forEach(p => {
    if (!c.trained.includes(p.slice(17, -1))) out.push({ step: S.talentos, msg: `${p}: a perícia não está mais treinada.`, block: true })
  })
  const K = calc(c)
  if (d.powers.length < K.powersAllowed) out.push({ step: S.talentos, msg: `Ainda pode escolher ${K.powersAllowed - d.powers.length} poder(es) da Força.`, block: false })
  if (!d.talent) out.push({ step: S.aptidao, msg: 'Escolha uma aptidão.', block: true })
  else {
    const t = talentByName(d.talent)
    const c2 = { ...c, talents: [] }
    if (t && !talentOk(c2, t, calc(c2))) out.push({ step: S.aptidao, msg: `${d.talent}: pré-requisito não atendido.`, block: true })
  }
  if (d.credits == null) out.push({ step: S.equip, msg: 'Créditos iniciais ainda não rolados.', block: false })
  else if (creditsLeft(d) < 0) out.push({ step: S.equip, msg: 'Gastou mais créditos do que tem.', block: true })
  if (!c.name.trim()) out.push({ step: S.detalhes, msg: 'Dê um nome ao personagem.', block: true })
  return out
}

/** Ficha final pronta para salvar. */
export function finalize(d: Draft): Character {
  const s = sync(structuredClone(d))
  const c = s.c
  const K = calc(c)
  const weapons: WeaponEntry[] = c.weapons.map(w => ({ id: w.id, n: w.n, base: w.base, atkMisc: w.atkMisc, dmgMisc: w.dmgMisc, notes: w.notes, ...(w.color ? { color: w.color } : {}) }))
  if (!weapons.some(w => w.base === 'Desarmado')) weapons.push({ id: uid(), n: 'Desarmado', base: 'Desarmado', atkMisc: 0, dmgMisc: 0, notes: '' })
  const gear: GearEntry[] = c.gear.map(g => ({ n: g.n, q: g.q, w: g.w }))
  return { ...c, name: c.name.trim(), weapons, gear, hp: K.hpMax, fp: K.fpMax, credits: Math.max(0, creditsLeft(s)), updated: Date.now() }
}

/* ===== Rascunho na sessão (sobrevive a recarregar a página) ===== */
const KEY = 'taberna.criar.rascunho'
export function loadDraft(): Draft {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (raw) {
      const d = JSON.parse(raw) as Draft
      if (d?.c && Array.isArray(d.arr) && SPECIES_BY[d.c.species] && CLASSES[d.c.cls?.[0]]) return sync(d)
    }
  } catch { /* sem armazenamento: começa do zero */ }
  return newDraft()
}
export function saveDraft(d: Draft) {
  try { sessionStorage.setItem(KEY, JSON.stringify(d)) } catch { /* ignora */ }
}
export function clearDraft() {
  try { sessionStorage.removeItem(KEY) } catch { /* ignora */ }
}

/** Reduz a imagem enviada a um quadrado de 220 px em JPEG. */
export function shrinkImage(file: File): Promise<string | null> {
  return new Promise(res => {
    const img = new Image()
    const u = URL.createObjectURL(file)
    img.onload = () => {
      const s = 220
      const cv = document.createElement('canvas')
      cv.width = cv.height = s
      const x = cv.getContext('2d')
      const m = Math.min(img.width, img.height)
      x?.drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, s, s)
      URL.revokeObjectURL(u)
      res(cv.toDataURL('image/jpeg', 0.82))
    }
    img.onerror = () => { URL.revokeObjectURL(u); res(null) }
    img.src = u
  })
}

/** Props comuns das etapas: o rascunho e uma função que aplica mudanças nele. */
export interface StepProps { d: Draft; up: (fn: (x: Draft) => void) => void }
