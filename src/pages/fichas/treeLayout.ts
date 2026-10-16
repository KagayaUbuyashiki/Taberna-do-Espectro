/* Montagem das árvores: ramos de talentos, nós por profundidade de pré-requisito e arestas. */
import { CLASSES, FORCE_TREES } from '../../data/saga'
import type { ClassId } from '../../rules/types'
import { FEAT_LIST, TREE_MAP, type FeatDef, type TalentDef } from './util'

export type Glyph = 'mira' | 'lamina' | 'escudo' | 'punho' | 'forca' | 'livro' | 'estrela' | 'armadura' | 'olho' | 'nave' | 'coroa' | 'dado' | 'chip' | 'folha' | 'garra'

/** Ramos de talentos (Tabela 5-1) agrupados por estilo de jogo. Os pré-requisitos ficam sempre dentro do ramo. */
export const FEAT_BRANCHES: { id: string; n: string; g: Glyph; feats: string[] }[] = [
  { id: 'tiro', n: 'Atirador', g: 'mira', feats: ['Tiro à Queima Roupa', 'Tiro Preciso', 'Tiro Longo', 'Tiro Cuidadoso', 'Atirador de Elite', 'Mira Fatal', 'Tiro Rápido', 'Tiro em Investida', 'Saque Rápido'] },
  { id: 'fisico', n: 'Combate físico', g: 'lamina', feats: ['Ataque Poderoso', 'Trespassar', 'Trespassar Maior', 'Golpe Impetuoso', 'Encontrão do Bantha', 'Investida Poderosa', 'Ataque Rápido', 'Acuidade com Arma', 'Ataque Acrobático'] },
  { id: 'multi', n: 'Ataques múltiplos', g: 'estrela', feats: ['Ataque Duplo', 'Ataque Triplo', 'Domínio de Armas Duplas I', 'Domínio de Armas Duplas II', 'Domínio de Armas Duplas III', 'Triplo Crítico'] },
  { id: 'defesa', n: 'Defesa e mobilidade', g: 'escudo', feats: ['Esquiva', 'Mobilidade', 'Investida Aprimorada', 'Ataque em Corrida', 'Defesa de Ataque Físico', 'Desarme Aprimorado', 'Ataque Turbilhão', 'Reflexos de Combate', 'Defesas Aprimoradas'] },
  { id: 'luta', n: 'Artes marciais', g: 'punho', feats: ['Artes Marciais I', 'Artes Marciais II', 'Artes Marciais III', 'Imobilizar', 'Esmagar', 'Banda', 'Lançar'] },
  { id: 'armas', n: 'Armas e armaduras', g: 'armadura', feats: ['Proficiência em Armadura (leve)', 'Proficiência em Armadura (média)', 'Proficiência em Armadura (pesada)', 'Proficiência em Arma', 'Proficiência em Arma Exótica', 'Foco em Arma', 'Rajada de Tiros', 'Ataque Coordenado'] },
  { id: 'forca', n: 'A Força', g: 'forca', feats: ['Sensitividade da Força', 'Treinamento da Força', 'Benção da Força', 'Forte na Força'] },
  { id: 'pericia', n: 'Perícias e vigor', g: 'livro', feats: ['Treinamento em Perícia', 'Foco em Perícia', 'Lingüística', 'Cirurgia Cibernética', 'Especialização Cirúrgica', 'Combate Veicular', 'Vitalidade', 'Limiar de Dano Aprimorado', 'Segunda Chance Extra', 'Se Livrar'] },
  { id: 'especie', n: 'Espécie', g: 'garra', feats: ['Fúria Extra', 'Fúria Terrível'] },
]

/** Símbolo de cada árvore de aptidões. */
export const TREE_GLYPH: Record<string, Glyph> = {
  'Cônsul Jedi': 'coroa', 'Guardião Jedi': 'escudo', 'Sentinela Jedi': 'olho', 'Combate com Sabre de Luz': 'lamina',
  'Influência': 'coroa', 'Inspiração': 'estrela', 'Liderança': 'coroa', 'Linhagem': 'livro',
  'Fortuna': 'dado', 'Azar': 'lamina', 'Invasor de Sistemas': 'chip', 'Viajante Espacial': 'nave',
  'Consciência': 'olho', 'Camuflagem': 'folha', 'Marginal': 'dado', 'Sobrevivente': 'folha',
  'Especialista em Armadura': 'armadura', 'Brigão': 'punho', 'Comando': 'estrela', 'Especialista em Arma': 'mira',
  'Alteração': 'forca', 'Controle': 'forca', 'Lado Sombrio': 'forca', 'Sentidos': 'olho',
}

export interface TNode<T> { id: string; def: T; col: number; row: number; parents: string[] }
export interface TLayout<T> { nodes: TNode<T>[]; cols: number; rows: number; edges: [string, string][] }

const base = (n: string) => n.replace(/ \(.*\)$/, '')

/** Coloca cada nó na coluna da sua profundidade de pré-requisito e corta arestas redundantes (I → III quando há I → II → III). */
function layout<T>(items: { id: string; def: T; prereq: string[] }[], fit = 3): TLayout<T> {
  const ids = new Set(items.map(i => i.id))
  const pre: Record<string, string[]> = {}
  items.forEach(i => { pre[i.id] = [...new Set(i.prereq.filter(p => ids.has(p) && p !== i.id))] })
  const anc = (id: string, seen = new Set<string>()): Set<string> => {
    for (const p of pre[id]) if (!seen.has(p)) { seen.add(p); anc(p, seen) }
    return seen
  }
  const parents: Record<string, string[]> = {}
  items.forEach(i => {
    const ps = pre[i.id]
    parents[i.id] = ps.filter(p => !ps.some(q => q !== p && anc(q).has(p)))
  })
  // Nós soltos (sem pré-requisito nem dependente) vão para uma grade embaixo, para a árvore não virar uma coluna comprida.
  const hasKid = new Set(items.flatMap(i => parents[i.id]))
  const loose = items.filter(i => !parents[i.id].length && !hasKid.has(i.id))
  const linked = items.filter(i => !loose.includes(i))
  const depth: Record<string, number> = {}
  const dep = (id: string): number => depth[id] ??= pre[id].length ? 1 + Math.max(...pre[id].map(dep)) : 0
  linked.forEach(i => dep(i.id))
  const deep = linked.length ? Math.max(...linked.map(i => depth[i.id])) + 1 : 0
  // `fit`: quantas colunas cabem na largura do cartão (celular cabe menos).
  const looseCols = Math.max(1, Math.min(loose.length, Math.max(deep, 3), fit))
  const cols = Math.max(deep, looseCols)
  const row: Record<string, number> = {}
  const byCol: string[][] = Array.from({ length: deep }, () => [])
  linked.forEach(i => byCol[depth[i.id]].push(i.id))
  // Nas colunas seguintes, cada nó fica perto dos pais.
  byCol.forEach((col, ci) => {
    if (ci > 0) {
      const avg = (id: string) => parents[id].reduce((s, p) => s + row[p], 0) / Math.max(1, parents[id].length)
      col.sort((a, b) => avg(a) - avg(b))
    }
    let next = 0
    col.forEach(id => {
      const want = ci === 0 ? next : Math.round(Math.min(...parents[id].map(p => row[p])))
      row[id] = Math.max(next, want)
      next = row[id] + 1
    })
  })
  const top = linked.length ? Math.max(...linked.map(i => row[i.id])) + 1 : 0
  loose.forEach((i, k) => { depth[i.id] = k % looseCols; row[i.id] = top + Math.floor(k / looseCols) })
  const rows = Math.max(0, ...Object.values(row)) + 1
  const nodes = items.map(i => ({ id: i.id, def: i.def, col: depth[i.id], row: row[i.id], parents: parents[i.id] }))
  const edges = nodes.flatMap(n => n.parents.map(p => [p, n.id] as [string, string]))
  return { nodes, cols, rows, edges }
}

export function talentTree(tree: string, fit?: number): TLayout<TalentDef> {
  return layout((TREE_MAP[tree] || []).map(t => ({ id: t.n, def: t, prereq: t.p || [] })), fit)
}

const FEAT_DEF: Record<string, FeatDef> = Object.fromEntries(FEAT_LIST.map(f => [f.n, f]))

export function featTree(branch: string, fit?: number): TLayout<FeatDef> {
  const b = FEAT_BRANCHES.find(x => x.id === branch)!
  return layout(b.feats.filter(n => FEAT_DEF[n]).map(n => ({ id: n, def: FEAT_DEF[n], prereq: (FEAT_DEF[n].req?.feats || []).map(p => (FEAT_DEF[p] ? p : base(p))) })), fit)
}

/** Árvores de aptidões de uma classe, e as da Força. */
export const classTrees = (k: ClassId) => CLASSES[k].trees as string[]
export const forceTrees = FORCE_TREES as string[]
