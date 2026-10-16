import { describe, expect, it } from 'vitest'
import { FEATS } from '../data/saga'
import { blankChar } from './engine'
import { dependents, featBudget, featSlotFor, freeGeneral, talentBudget, talentSlotFor } from './progression'
import { sampleChars } from './samples'
import { FEAT_BRANCHES, featTree, talentTree } from '../pages/fichas/treeLayout'
import type { Character, ClassId } from './types'

const byName = (n: string) => Object.values(sampleChars()).find(c => c.name === n)!
const mk = (p: Partial<Character>): Character => ({ ...blankChar(), ...p })

describe('pontos da árvore', () => {
  it('Humano Jedi 1 tem 2 talentos livres e 1 aptidão, já gastos na ficha de exemplo', () => {
    const c = byName('Sia-Lan Wynn')
    const B = featBudget(c)
    expect(B.free).toHaveLength(3)
    expect([B.general, B.usedGeneral, B.over]).toEqual([2, 2, 0])
    const T = talentBudget(c)
    expect([T.total.jedi, T.used.jedi]).toEqual([1, 1])
  })

  it('talento a cada 3 níveis, bônus nos níveis pares e aptidão nos ímpares', () => {
    const c = mk({ species: 'bothan', cls: ['soldado', 'soldado', 'soldado'] as ClassId[] })
    const B = featBudget(c)
    expect(B.general).toBe(2)
    expect(B.bonus.soldado).toBe(1)
    expect(talentBudget(c).total.soldado).toBe(2)
  })

  it('no nível 2 o ponto livre é o talento bônus de Jedi, não um talento qualquer', () => {
    const c = { ...byName('Sia-Lan Wynn'), cls: ['jedi', 'jedi'] as ClassId[] }
    const B = featBudget(c)
    expect([B.usedGeneral, B.general, B.usedBonus.jedi, B.bonus.jedi]).toEqual([2, 2, 0, 1])
    expect(featSlotFor(c, 'Vitalidade')).toBeNull()
    expect(featSlotFor(c, 'Forte na Força')).toBe('jedi')
  })

  it('vaga bônus só aceita a lista da classe', () => {
    const c = mk({ species: 'bothan', cls: ['soldado', 'soldado'] as ClassId[], feats: ['Proficiência em Armadura (leve)', 'Proficiência em Armadura (média)', 'Proficiência em Arma (pistolas)', 'Proficiência em Arma (rifles)', 'Proficiência em Arma (armas simples)', 'Defesas Aprimoradas'] })
    expect(freeGeneral(featBudget(c))).toBe(0)
    expect(featSlotFor(c, 'Proficiência em Armadura (pesada)')).toBe('soldado')
    expect(featSlotFor(c, 'Forte na Força')).toBeNull()
  })

  it('aptidão da Força exige Sensitividade e paga com ponto de qualquer classe', () => {
    const c = mk({ cls: ['soldado'], feats: [] })
    expect(talentSlotFor(c, 'Percepção da Força')).toBeNull()
    const f = { ...c, feats: ['Sensitividade da Força'] }
    expect(talentSlotFor(f, 'Percepção da Força')).toBe('soldado')
    expect(talentSlotFor(f, 'Bloquear')).toBeNull()
  })

  it('não deixa esquecer o que segura o caminho', () => {
    const c = mk({ feats: ['Tiro à Queima Roupa', 'Tiro Preciso'], talents: ['Sentidos Aguçados', 'Iniciativa Aprimorada'] })
    expect(dependents(c, 'Tiro à Queima Roupa', 'feat')).toEqual(['Tiro Preciso'])
    expect(dependents(c, 'Tiro Preciso', 'feat')).toEqual([])
    expect(dependents(c, 'Sentidos Aguçados', 'talent')).toEqual(['Iniciativa Aprimorada'])
  })
})

describe('desenho das árvores', () => {
  it('todo talento do livro está em exatamente um ramo', () => {
    const all = FEAT_BRANCHES.flatMap(b => b.feats)
    expect(new Set(all).size).toBe(all.length)
    expect(FEATS.map(f => f.n).filter(n => !all.includes(n))).toEqual([])
  })

  it('pré-requisitos ficam à esquerda e arestas redundantes somem', () => {
    const L = featTree('luta')
    const col = Object.fromEntries(L.nodes.map(n => [n.id, n.col]))
    expect(col['Artes Marciais III']).toBe(2)
    expect(L.edges).toContainEqual(['Artes Marciais II', 'Artes Marciais III'])
    expect(L.edges).not.toContainEqual(['Artes Marciais I', 'Artes Marciais III'])
    const A = featTree('armas')
    expect(A.edges).toContainEqual(['Proficiência em Armadura (média)', 'Proficiência em Armadura (pesada)'])
    const T = talentTree('Inspiração')
    expect(T.nodes.find(n => n.id === 'Inspirar Zelo')!.col).toBe(2)
  })

  it('nenhum nó ocupa o mesmo lugar', () => {
    const trees = [...FEAT_BRANCHES.map(b => featTree(b.id)), ...['Comando', 'Consciência', 'Liderança', 'Lado Sombrio'].map(talentTree)]
    for (const L of trees) {
      const pos = L.nodes.map(n => `${n.col},${n.row}`)
      expect(new Set(pos).size).toBe(pos.length)
    }
  })
})
