import { describe, expect, it } from 'vitest'
import { armaDaFicha, armaDoAtaque, celulasDaArea, distGrade, lerAlcance } from './armas'

describe('tipo de arma', () => {
  it('reconhece as armas da ficha pelo modelo do livro', () => {
    expect(armaDaFicha({ n: 'Sabre do Mestre', base: 'Sabre de luz', color: '#5fd38a' })).toMatchObject({ tipo: 'sabre', corpo: true, cor: '#5fd38a' })
    expect(armaDaFicha({ n: 'DL-44', base: 'Pistola blaster pesada' })).toMatchObject({ tipo: 'blaster', grupo: 'pistolas', faixas: [20, 40, 60, 80] })
    expect(armaDaFicha({ n: 'E-11', base: 'Rifle blaster' })).toMatchObject({ tipo: 'blaster', grupo: 'rifles' })
    expect(armaDaFicha({ n: 'x', base: 'Detonador termal' })).toMatchObject({ tipo: 'termal', grupo: 'arremesso', area: { forma: 'raio', r: 2 } })
    expect(armaDaFicha({ n: 'x', base: 'Lança-chamas' })).toMatchObject({ tipo: 'chamas', area: { forma: 'cone', q: 6 } })
    expect(armaDaFicha({ n: 'x', base: 'Pistola de íon' }).tipo).toBe('ion')
    expect(armaDaFicha({ n: 'x', base: 'Vibrolâmina' }).tipo).toBe('vibro')
    expect(armaDaFicha({ n: 'x', base: 'Blaster repetidora pesada' })).toMatchObject({ tipo: 'rajada', grupo: 'armas pesadas' })
  })
  it('reconhece os ataques do bestiário', () => {
    expect(armaDoAtaque('Blaster repetidora leve (firmada)', true).tipo).toBe('rajada')
    expect(armaDoAtaque('Granada de fragmentação', true)).toMatchObject({ tipo: 'granada', area: { forma: 'raio', r: 2 } })
    expect(armaDoAtaque('2 garras', false)).toMatchObject({ tipo: 'garra', corpo: true })
    expect(armaDoAtaque('Mordida', false).tipo).toBe('garra')
    expect(armaDoAtaque('2 canhões laser', true)).toMatchObject({ tipo: 'rajada', corpo: false })
    expect(armaDoAtaque('Vibromachado', false).tipo).toBe('vibro')
    expect(armaDoAtaque('Pistola blaster', true).tipo).toBe('blaster')
    expect(armaDoAtaque('Ataque', true)).toMatchObject({ tipo: 'blaster', corpo: false })
  })
})

describe('alcance na grade', () => {
  it('conta as diagonais 1 e 2 alternadas', () => {
    expect(distGrade({ x: 0, y: 0 }, { x: 3, y: 3 })).toBe(4)
    expect(distGrade({ x: 0, y: 0 }, { x: 1, y: 1 })).toBe(1)
  })
  it('pistola: faixa e penalidade da Tabela 8-5', () => {
    const p = armaDaFicha({ n: 'x', base: 'Pistola blaster' })
    expect(lerAlcance(p, { x: 0, y: 0 }, { x: 20, y: 0 })).toMatchObject({ faixa: 0, penalidade: 0 })
    expect(lerAlcance(p, { x: 0, y: 0 }, { x: 21, y: 0 })).toMatchObject({ faixa: 1, penalidade: -2 })
    expect(lerAlcance(p, { x: 0, y: 0 }, { x: 59, y: 0 })).toMatchObject({ faixa: 2, penalidade: -5 })
    expect(lerAlcance(p, { x: 0, y: 0 }, { x: 81, y: 0 })).toMatchObject({ faixa: -1 })
    expect(lerAlcance(p, { x: 0, y: 0 }, { x: 4, y: 0 }).rotulo).toBe('4 q · 6 m · Queima-roupa (sem penalidade)')
  })
  it('corpo a corpo só alcança o adjacente; faca longe vira arremesso', () => {
    const s = armaDaFicha({ n: 'x', base: 'Sabre de luz' })
    expect(lerAlcance(s, { x: 5, y: 5 }, { x: 6, y: 6 }).faixa).toBe(0)
    expect(lerAlcance(s, { x: 5, y: 5 }, { x: 7, y: 5 }).faixa).toBe(-1)
    const f = armaDaFicha({ n: 'x', base: 'Faca' })
    expect(lerAlcance(f, { x: 0, y: 0 }, { x: 7, y: 0 })).toMatchObject({ arremessando: true, faixa: 1, penalidade: -2 })
  })
  it('explosão pega um raio de 2 quadrados; o cone sai na direção do alvo', () => {
    const r = celulasDaArea({ forma: 'raio', r: 2 }, { x: 0, y: 0 }, { x: 5, y: 5 }, 12, 12)
    expect(r).toHaveLength(21)
    expect(r.every(p => distGrade(p, { x: 5, y: 5 }) <= 2)).toBe(true)
    const c = celulasDaArea({ forma: 'cone', q: 6 }, { x: 0, y: 5 }, { x: 4, y: 5 }, 12, 12)
    expect(c.some(p => p.x === 6 && p.y === 5)).toBe(true)
    expect(c.some(p => p.x < 0 + 1 && p.y === 5)).toBe(false)
    expect(c.every(p => p.x >= 1)).toBe(true)
  })
})
