import { describe, expect, it } from 'vitest'
import { opacidadeEm, quadroEm, validarMapa, type CamadaPx } from './formato'

const camadas: CamadaPx[] = [{ id: 'chao', img: 'chao.png' }, { id: 'agua', img: 'agua.png', quadros: 4, ms: 200 }, { id: 'luz', img: 'luz.png', mistura: 'screen', pulso: { ms: 2000, min: 0.5, max: 1 } }]
const ok = {
  versao: 1, nome: 'Teste', px: 16, colunas: 10, linhas: 8,
  camadas,
  paredes: ['0,0,10,0'], cobertura: { cobertura: ['3,4'], melhorada: ['5,5'] }, terrenoDificil: ['1,1'],
}

describe('mapa em pixel art', () => {
  it('aceita um mapa bem formado', () => expect(validarMapa(ok)).toEqual([]))
  it('aponta os problemas', () => {
    const r = validarMapa({ ...ok, px: 0, camadas: [{ id: 'a', img: 'a.jpg' }], cobertura: { cobertura: ['30,4'] }, paredes: ['0,0,99,0'] }, 'x')
    expect(r).toContain('x: px deve ser um inteiro positivo')
    expect(r).toContain('x: camada a: img deve ser .png ou .webp')
    expect(r).toContain('x: cobertura.cobertura: "30,4" está fora do mapa')
    expect(r).toContain('x: parede "0,0,99,0" sai do mapa')
  })
  it('anima quadros e pulsos pelo relógio', () => {
    expect(quadroEm(ok.camadas[1], 0)).toBe(0)
    expect(quadroEm(ok.camadas[1], 650)).toBe(3)
    expect(quadroEm(ok.camadas[1], 800)).toBe(0)
    expect(opacidadeEm(ok.camadas[2], 0)).toBeCloseTo(0.5)
    expect(opacidadeEm(ok.camadas[2], 1000)).toBeCloseTo(1)
  })
})
