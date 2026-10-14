import { describe, expect, it } from 'vitest'
import { applyDamage, blankChar, calc, weaponStats } from './engine'
import { rollExpr } from './dice'
import { sampleChars } from './samples'

const byName = (n: string) => Object.values(sampleChars()).find(c => c.name === n)!

describe('ficha', () => {
  it('calcula as Defesas do Wookiee batedor de exemplo', () => {
    const K = calc(byName('Rorworr'))
    expect([K.ref, K.fort, K.will, K.thr]).toEqual([13, 14, 11, 14])
    expect(K.hpMax).toBe(24 + 2 + 1) // Batedor 24 + Con + Vitalidade
  })
  it('Jedi tem BBA cheio e Pontos de Força 5 + ½ nível', () => {
    const c = { ...blankChar(), cls: ['jedi', 'jedi', 'jedi', 'jedi'] as const }
    const K = calc({ ...c, cls: [...c.cls] })
    expect(K.bab).toBe(4)
    expect(K.fpMax).toBe(7)
  })
  it('classes de ¾ arredondam para baixo', () => {
    expect(calc({ ...blankChar(), cls: ['nobre', 'nobre', 'nobre'] }).bab).toBe(2)
  })
  it('perícia = ½ nível + mod + 5 se treinada', () => {
    const K = calc(byName('Rorworr'))
    expect(K.sk['Percepção'].tot).toBe(0 + 0 + 5)
  })
  it('Acuidade com Arma usa Des no sabre de luz', () => {
    const sia = byName('Sia-Lan Wynn')
    const ws = weaponStats(sia, sia.weapons[0])
    expect(ws.atk).toBe(1 + 2)
  })
})

describe('dano e dados', () => {
  it('dano igual ou acima do limiar desce um passo', () => {
    expect(applyDamage(20, 0, 12, 12)).toEqual({ hp: 8, cond: 1, result: 'desce' })
    expect(applyDamage(5, 0, 12, 12).result).toBe('morto')
    expect(applyDamage(5, 0, 12, 6).result).toBe('inconsciente')
  })
  it('avalia expressões com multiplicador de crítico', () => {
    const r = rollExpr('2d6+3*2', () => 4)
    expect(r.total).toBe(22)
  })
})
