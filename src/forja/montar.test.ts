import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js'
import { ESPECIES_3D, POSES, comEspecie, figuraPadrao, normalizarFigura } from './tipos'
import { ALTURA_HUMANO, emMilimetros, mmPorUnidade, montarFigura, raioBase } from './montar'

const caixa = (o: THREE.Object3D) => { o.updateMatrixWorld(true); return new THREE.Box3().setFromObject(o) }

describe('forja', () => {
  it('monta todas as espécies em todas as poses, com o pé na base', () => {
    for (const e of ESPECIES_3D) for (const pose of POSES) {
      const f = { ...comEspecie(figuraPadrao(), e), pose }
      const g = montarFigura(f)
      const base = caixa(g.getObjectByName('base')!)
      const corpo = caixa(g.getObjectByName('corpo')!)
      expect(Math.abs(corpo.min.y - base.max.y), `${e} ${pose}`).toBeLessThan(0.02)
      expect(g.getObjectByName('cabeca'), `${e} ${pose}`).toBeTruthy()
    }
  })
  it('o humano em pé tem a altura padrão', () => {
    const g = montarFigura({ ...figuraPadrao(), pose: 'parado', maoDireita: 'vazia', capa: 'nenhuma' })
    const c = caixa(g.getObjectByName('corpo')!)
    expect(c.max.y - c.min.y).toBeGreaterThan(ALTURA_HUMANO * 0.95)
    expect(c.max.y - c.min.y).toBeLessThan(ALTURA_HUMANO * 1.05)
  })
  it('exporta STL em milímetros na escala escolhida', () => {
    const f = { ...figuraPadrao(), escalaMm: 32 as const, pose: 'parado' as const, maoDireita: 'vazia' as const, capa: 'nenhuma' as const }
    const g = emMilimetros(montarFigura(f), mmPorUnidade(f))
    const b = caixa(g)
    expect(b.max.y - b.min.y).toBeGreaterThan(30)
    expect(b.max.y - b.min.y).toBeLessThan(40)
    expect(b.max.x - b.min.x).toBeCloseTo(raioBase(f) * 2 * mmPorUnidade(f), 0)
    const dv = new STLExporter().parse(g, { binary: true }) as unknown as DataView
    const tri = dv.getUint32(80, true)
    expect(tri).toBeGreaterThan(1000)
    expect(dv.byteLength).toBe(84 + tri * 50)
  })
  it('conserta figura velha ou estragada', () => {
    expect(normalizarFigura(null)).toBeNull()
    const f = normalizarFigura({ especie: 'xenomorfo', pose: 'voando', cores: { pele: '#123456' }, escalaMm: 7 })!
    expect(f.especie).toBe('humano')
    expect(f.pose).toBe(figuraPadrao().pose)
    expect(f.cores.pele).toBe('#123456')
    expect(f.cores.lamina).toBe(figuraPadrao().cores.lamina)
    expect(f.escalaMm).toBe(32)
  })
})
