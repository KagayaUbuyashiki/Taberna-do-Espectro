export type AbilKey = 'vig' | 'des' | 'con' | 'int' | 'sab' | 'car'
export type Abilities = Record<AbilKey, number>
export type ClassId = 'jedi' | 'nobre' | 'vigarista' | 'batedor' | 'soldado'

export interface WeaponEntry {
  id: string
  n: string
  base: string
  atkMisc: number
  dmgMisc: number
  notes: string
  color?: string
}

/** Armadura feita pelo mestre (aba Mestre > Pedidos). `armor` guarda o nome do modelo base do livro. */
export interface ArmaduraPersonalizada { nome: string; base: string; cat: 'leve' | 'média' | 'pesada'; ref: number; fort: number; maxDex: number; especial: string }

import type { Figura } from '../forja/tipos'

export interface GearEntry { n: string; q: number; w: number }
export interface PowerEntry { n: string; used: boolean }

export interface Character {
  id: string
  name: string
  player: string
  species: string
  cls: ClassId[]
  abil: Abilities
  inc: Partial<Abilities>
  trained: string[]
  feats: string[]
  talents: string[]
  powers: PowerEntry[]
  hpRolls: number[]
  hp: number
  tmpHp: number
  cond: number
  persistent: boolean
  fp: number
  dp: number
  ds: number
  credits: number
  weapons: WeaponEntry[]
  armor: string | null
  gear: GearEntry[]
  langs: string
  age: string
  sex: string
  height: string
  weight: string
  destiny: string
  notes: string
  portrait: string | null
  xp: number
  secondWind: number
  sample?: boolean
  /** Opcional: armadura personalizada vestida (substitui os números do modelo base em `armor`). */
  armaduraPersonalizada?: ArmaduraPersonalizada | null
  /** Opcional: figura 3D montada na Forja (a ficha do herói no mapa usa a foto dela). */
  figura?: Figura | null
  updated: number
}

export interface Combatant {
  id: string
  side: 'pc' | 'npc'
  charId?: string
  base?: string
  name: string
  init: number | null
  initMod: number
  hp: number
  hpMax: number
  ref: number
  fort: number
  will: number
  thr: number
  cond: number
  atk: [string, number, string, boolean][]
  notes: string
  tie?: number
}

export interface MapToken { id: string; x: number; y: number; label: string; color: string; ref?: string }

export interface Campaign {
  crawl: { ep: string; title: string; body: string }
  log: { t: number; txt: string }[]
  combat: { round: number; turn: number; list: Combatant[] }
  map: { scene: string; cols: number; rows: number; tokens: MapToken[]; walls: string[]; fog: string; fogOn: boolean }
  location: string
  updated: number
}

export interface RollEntry {
  label: string
  who?: string
  total: number
  det: string
  kind?: 'crit' | 'fumble' | ''
  nat?: number
  bonus?: number
  vs?: number
  hit?: boolean
  target?: string
  t: number
}
