import { describe, expect, it } from 'vitest'
import { blankChar } from '../rules/engine'
import { defaultCampaign } from '../store/campaign'
import type { Combatant } from '../rules/types'
import { participanteDoToken, participantes } from './participantes'

describe('participantes do combate', () => {
  const sia = { ...blankChar(), id: 'sia', name: 'Sia', hp: 20, weapons: [{ id: 'w', n: 'Sabre', base: 'Sabre de luz', atkMisc: 0, dmgMisc: 0, notes: '', color: '#5fd38a' }] }
  const ror = { ...blankChar(), id: 'ror', name: 'Rorworr', species: 'wookiee', hp: 20, weapons: [{ id: 'b', n: 'Bowcaster', base: 'Bowcaster', atkMisc: 0, dmgMisc: 0, notes: '' }] }
  const chars = { sia, ror }
  const st: Combatant = { id: 'st', side: 'npc', base: 'Stormtrooper', name: 'Stormtrooper 1', init: null, initMod: 2, hp: 10, hpMax: 10, ref: 16, fort: 12, will: 10, thr: 12, cond: 0, atk: [['Rifle blaster', 4, '3d8', true], ['Granada de fragmentação', 3, '4d6', true]], notes: '' }
  const pc: Combatant = { id: 'pc', side: 'pc', charId: 'sia', name: '', init: null, initMod: 0, hp: 0, hpMax: 0, ref: 0, fort: 0, will: 0, thr: 0, cond: 0, atk: [], notes: '' }
  const c = defaultCampaign()
  c.combat.list = [pc, st]
  c.map.tokens = [{ id: 't1', ref: 'pc', label: 'S', color: '#fff', x: 0, y: 0 }, { id: 't2', ref: 'char:ror', label: 'R', color: '#fff', x: 1, y: 0 }, { id: 't3', ref: 'char:sia', label: 'S', color: '#fff', x: 2, y: 0 }]
  const lista = participantes(c, chars)

  it('junta o combate e os heróis do mapa, sem repetir', () => {
    expect(lista.map(p => p.nome).sort()).toEqual(['Rorworr', 'Sia', 'Stormtrooper 1'])
  })
  it('as armas da ficha guardam o tipo e a cor da lâmina', () => {
    const p = lista.find(x => x.nome === 'Sia')!
    expect(p.ataques[0].arma.tipo).toBe('sabre')
    expect(p.ataques[0].arma.cor).toBe('#5fd38a')
    expect(lista.find(x => x.nome === 'Rorworr')!.ataques[0].arma.tipo).toBe('bowcaster')
  })
  it('os ataques do bestiário viram armas com área', () => {
    const p = lista.find(x => x.nome === 'Stormtrooper 1')!
    expect(p.ataques[1].arma.tipo).toBe('granada')
    expect(p.ataques[1].arma.area).toEqual({ forma: 'raio', r: 2 })
  })
  it('acha o participante pela ficha do mapa', () => {
    expect(participanteDoToken('char:sia', lista)?.chave).toBe('pc')
    expect(participanteDoToken('char:ror', lista)?.chave).toBe('char:ror')
    expect(participanteDoToken('st', lista)?.nome).toBe('Stormtrooper 1')
  })
})
