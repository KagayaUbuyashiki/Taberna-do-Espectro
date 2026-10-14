import { CLASSES, COND, FEATS, POWERS, TREES, WEAPON_GROUPS } from '../../data/saga'
import { blankChar, calc, classLevels, has, uid, type Calc } from '../../rules/engine'
import { d20 } from '../../lib/rolls'
import { rnd } from '../../rules/dice'
import { useStore } from '../../store/campaign'
import { useUI, toast } from '../../store/ui'
import { SFX } from '../../lib/sfx'
import type { Character, ClassId } from '../../rules/types'

/* Tipos locais para os dados do livro (saga.ts é inferido) */
export interface FeatDef {
  n: string
  d: string
  req?: { abil?: Record<string, number>; bab?: number; feats?: string[]; trained?: string; species?: string }
  multi?: boolean
  choice?: 'group' | 'prof' | 'trained' | 'untrained'
}
export interface TalentDef { n: string; d: string; p?: string[]; pf?: string[]; bab?: number; abil?: Record<string, number>; multi?: number; dark?: boolean }
export interface PowerDef { n: string; t: string; a: string; d: string; desc?: string; tiers?: [number, string][]; vs?: string; dmg?: string }

export const FEAT_LIST = FEATS as unknown as FeatDef[]
export const FEAT_MAP: Record<string, FeatDef> = Object.fromEntries(FEAT_LIST.map(f => [f.n, f]))
export const TREE_MAP = TREES as unknown as Record<string, TalentDef[]>
export const POWER_LIST = POWERS as unknown as PowerDef[]
export const POWER_MAP: Record<string, PowerDef> = Object.fromEntries(POWER_LIST.map(p => [p.n, p]))
export const CONDS = COND as { k: number; l: string; p: number }[]

/** Rótulos curtos da régua do curso da condição. */
export const COND_SHORT = ['Normal', '-1', '-2', '-5', '-10', 'Incapaz']

export const SKILL_FEAT = 'Treinamento em Perícia ('

/** "Jedi 2 / Soldado 1" */
export function classLine(c: Character) {
  return Object.entries(classLevels(c)).map(([k, n]) => `${CLASSES[k as ClassId].name} ${n}`).join(' / ')
}

/** Base de um talento com escolha: "Foco em Arma (rifles)" → definição de "Foco em Arma". */
export const featDef = (n: string) => FEAT_MAP[n] || FEAT_MAP[n.replace(/ \(.*\)$/, '')]

/** Perícias de classe de todas as classes do personagem (+ Usar a Força se sensitivo). */
export function classSkillList(c: Character) {
  const l = new Set<string>()
  c.cls.forEach(k => CLASSES[k].skills.forEach(s => l.add(s)))
  if (has(c, 'Sensitividade da Força')) l.add('Usar a Força')
  return [...l]
}

/** Opções de um talento com escolha (grupo de armas, perícia...). */
export function choiceOptions(c: Character, f: FeatDef, allowed: string[] | null) {
  if (!f.choice) return null
  let o: string[] = []
  if (f.choice === 'group') o = WEAPON_GROUPS.filter(g => !has(c, `Foco em Arma (${g})`))
  if (f.choice === 'prof') o = WEAPON_GROUPS.filter(g => !has(c, `Proficiência em Arma (${g})`))
  if (f.choice === 'trained') o = c.trained.filter(s => !has(c, `Foco em Perícia (${s})`))
  if (f.choice === 'untrained') o = classSkillList(c).filter(s => !c.trained.includes(s))
  // Lista de talentos bônus pode restringir a escolha, ex.: "Proficiência em Arma (rifles)".
  if (allowed) {
    const spec = allowed.filter(a => a.startsWith(f.n + ' (')).map(a => a.slice(f.n.length + 2, -1))
    if (spec.length) o = o.filter(x => spec.includes(x))
  }
  return o
}

/** Acrescenta talentos à ficha, marcando a perícia de Treinamento em Perícia. */
export function addFeats(c: Character, names: string[]): Pick<Character, 'feats' | 'trained'> {
  const feats = [...c.feats]
  const trained = [...c.trained]
  for (const n of names) {
    feats.push(n)
    if (n.startsWith(SKILL_FEAT)) { const s = n.slice(SKILL_FEAT.length, -1); if (!trained.includes(s)) trained.push(s) }
  }
  return { feats, trained }
}

/** Retrato por upload: FileReader → dataURL, recortado em quadrado e reduzido. */
export function shrinkImage(file: File, size = 220): Promise<string | null> {
  return new Promise(res => {
    const fr = new FileReader()
    fr.onerror = () => res(null)
    fr.onload = () => {
      const img = new Image()
      img.onerror = () => res(null)
      img.onload = () => {
        const cv = document.createElement('canvas')
        cv.width = cv.height = size
        const x = cv.getContext('2d')
        if (!x) { res(null); return }
        const m = Math.min(img.width, img.height)
        x.drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, size, size)
        res(cv.toDataURL('image/jpeg', 0.82))
      }
      img.src = String(fr.result)
    }
    fr.readAsDataURL(file)
  })
}

/** Gasta 1 Ponto de Força e soma o maior dado à última rolagem de d20 (igual ao rolador). */
export function spendForcePoint(c: Character) {
  if (c.fp <= 0) { toast('Sem Pontos de Força.'); return }
  const K = calc(c)
  const rs = Array.from({ length: K.fDice }, () => rnd(K.fDie))
  const best = Math.max(...rs)
  const st = useStore.getState()
  st.patchChar(c.id, { fp: c.fp - 1 })
  const last = st.log.find(l => l.nat != null)
  if (last) {
    const total = last.total + best
    const hit = last.vs != null ? last.nat === 20 || (last.nat !== 1 && total >= last.vs) : last.hit
    st.patchRoll(last.t, { total, hit, det: `${last.det} +PF ${K.fDice}d${K.fDie}[${rs.join(',')}]→${best}` })
    useUI.getState().showPopup({ value: total, label: `Ponto de Força em "${last.label}"` })
  } else {
    st.pushRoll({ label: 'Ponto de Força', who: c.name, total: best, det: `${K.fDice}d${K.fDie}[${rs.join(',')}] fica com o maior` })
    useUI.getState().showPopup({ value: best, label: 'Ponto de Força' })
  }
  SFX.force()
}

/** Texto JSON exportado (mesmo formato do protótipo). */
export const exportJson = (c: Character) => JSON.stringify({ swsaga: 1, char: c }, null, 1)
export const exportName = (c: Character) => (c.name || 'personagem').replace(/[^\wÀ-ú-]+/g, '_') + '.json'

/** Lê uma ficha exportada; devolve uma ficha nova (id novo) ou null. */
export function parseImport(txt: string): Character | null {
  try {
    const o = JSON.parse(txt)
    const c = (o && o.char) || o
    if (!c || !Array.isArray(c.cls) || !c.abil) return null
    const n: Character = { ...blankChar(), ...c, id: uid(), updated: Date.now() }
    delete n.sample
    n.weapons = (n.weapons || []).map(w => ({ ...w, id: w.id || uid() }))
    return n
  } catch {
    return null
  }
}

/** Cópia independente de uma ficha. */
export function duplicate(c: Character): Character {
  const n: Character = JSON.parse(JSON.stringify(c))
  n.id = uid()
  n.name = `${c.name || 'Sem nome'} (cópia)`
  delete n.sample
  n.weapons = n.weapons.map(w => ({ ...w, id: uid() }))
  n.updated = Date.now()
  return n
}

/** Rola uma perícia da ficha (respeita "exige treinamento"). */
export function rollSkill(c: Character, K: Calc, n: string) {
  const s = K.sk[n]
  if (!s) return
  if (!s.usable) { toast('Essa perícia exige treinamento.'); return }
  return d20(s.n, s.tot, c.name)
}
