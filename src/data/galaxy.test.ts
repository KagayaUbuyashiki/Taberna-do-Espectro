import { describe, expect, it } from 'vitest'
import { ITENS, PLANETAS, PLANETA_BY, ROTAS, lojaDoPlaneta, planetasDaCarta, posicao } from './galaxy'

describe('galáxia', () => {
  it('todo planeta tem posição dentro do mapa e id único', () => {
    expect(new Set(PLANETAS.map(p => p.id)).size).toBe(PLANETAS.length)
    for (const p of PLANETAS) {
      const { x, y } = posicao(p)
      expect(x).toBeGreaterThan(0); expect(x).toBeLessThan(1)
      expect(y).toBeGreaterThan(0); expect(y).toBeLessThan(1)
    }
  })

  it('rotas só usam planetas que existem', () => {
    for (const r of ROTAS) for (const id of r.planetas) expect(PLANETA_BY[id], id).toBeDefined()
  })

  it('a loja respeita o tier do planeta e o mercado negro', () => {
    const coruscant = lojaDoPlaneta(PLANETA_BY.coruscant)
    const naboo = lojaDoPlaneta(PLANETA_BY.naboo)
    expect(naboo.filter(i => i.categoria !== 'carta').every(i => i.tier <= 1)).toBe(true)
    expect(naboo.some(i => i.ilegal)).toBe(false)
    expect(coruscant.some(i => i.ilegal)).toBe(false) // tier 1: nada ilegal acima do tier
    expect(lojaDoPlaneta(PLANETA_BY.kessel).some(i => i.id === 'detonador-termal')).toBe(true)
  })

  it('exclusivos só aparecem na origem', () => {
    expect(lojaDoPlaneta(PLANETA_BY.mandalore).some(i => i.id === 'minerio-beskar')).toBe(true)
    expect(lojaDoPlaneta(PLANETA_BY.kessel).some(i => i.id === 'minerio-beskar')).toBe(false)
    expect(lojaDoPlaneta(PLANETA_BY.kashyyyk).some(i => i.id === 'bowcaster')).toBe(true)
    expect(lojaDoPlaneta(PLANETA_BY.tatooine).some(i => i.id === 'bowcaster')).toBe(false)
    for (const p of PLANETAS) for (const id of p.exclusivos ?? []) expect(ITENS.some(i => i.id === id), id).toBe(true)
  })

  it('cartas de astrogação nunca revelam planetas de kyber ou ocultos', () => {
    for (const i of ITENS.filter(i => i.categoria === 'carta'))
      for (const id of planetasDaCarta(i)) expect(PLANETA_BY[id].tipo).toBe('comum')
  })
})
