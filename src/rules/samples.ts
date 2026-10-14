import { blankChar, calc, uid } from './engine'
import type { Character } from './types'

/** Personagens de exemplo tirados da cena da cantina do livro. */
export function sampleChars(): Record<string, Character> {
  const a: Character = {
    ...blankChar(), name: 'Sia-Lan Wynn', player: 'Exemplo', species: 'humano', cls: ['jedi'],
    abil: { vig: 12, des: 14, con: 13, int: 10, sab: 13, car: 15 }, trained: ['Usar a Força', 'Acrobacia', 'Percepção'],
    feats: ['Sensitividade da Força', 'Proficiência em Arma (sabres de luz)', 'Proficiência em Arma (armas simples)', 'Treinamento da Força', 'Acuidade com Arma'],
    talents: ['Defletir'], powers: [{ n: 'Ataque de Batalha', used: false }, { n: 'Mover Objeto', used: false }],
    weapons: [{ id: uid(), n: 'Sabre de luz de Sia-Lan', base: 'Sabre de luz', atkMisc: 0, dmgMisc: 0, notes: 'Lâmina azul, dado pelo seu Mestre', color: '#4fc3ff' }],
    gear: [{ n: 'Comlink de curta distância', q: 1, w: 0.1 }, { n: 'Medpac', q: 2, w: 1 }], credits: 640,
    langs: 'Básico, Alto Galáctico', age: '19', sex: 'Feminino', height: '1,68 m', weight: '58 kg', destiny: 'Proteger o Senador Treen',
    notes: 'Aprendiz Padawan do Conselho Jedi.', sample: true,
  }
  const b: Character = {
    ...blankChar(), name: 'Rorworr', player: 'Exemplo', species: 'wookiee', cls: ['batedor'],
    abil: { vig: 14, des: 13, con: 12, int: 12, sab: 13, car: 10 }, trained: ['Escalar', 'Iniciativa', 'Mecânica', 'Percepção', 'Pilotar', 'Furtividade'],
    feats: ['Proficiência em Arma (pistolas)', 'Proficiência em Arma (rifles)', 'Proficiência em Arma (armas simples)', 'Vitalidade'],
    talents: ['Sentidos Aguçados'],
    weapons: [{ id: uid(), n: 'Bowcaster', base: 'Bowcaster', atkMisc: 0, dmgMisc: 0, notes: 'Familiaridade Wookiee' }, { id: uid(), n: 'Desarmado', base: 'Desarmado', atkMisc: 0, dmgMisc: 0, notes: '' }],
    gear: [{ n: 'Kit de ferramentas', q: 1, w: 10 }, { n: 'Eletrobinóculos', q: 1, w: 1 }], credits: 310,
    langs: 'Shyriiwook', age: '86', sex: 'Masculino', height: '2,20 m', weight: '130 kg', destiny: 'Pagar sua dívida de vida',
    notes: 'Jovem Wookiee batedor, magro para os padrões do seu povo.', sample: true,
  }
  for (const c of [a, b]) { const K = calc(c); c.hp = K.hpMax; c.fp = K.fpMax }
  return { [a.id]: a, [b.id]: b }
}
