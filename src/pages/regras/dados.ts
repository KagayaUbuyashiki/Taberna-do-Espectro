import { ARMORS, CLASSES, DC_TABLE, FEATS, FORCE_TREES, POWERS, RANGES, SKILLS, SPECIES, TREES, WEAPONS, ABIL_SHORT } from '../../data/saga'
import { featReqText } from '../../rules/engine'
import type { ClassId } from '../../rules/types'
import { GEN } from '../narracao/geradores'

/* ---------- Busca ---------- */
export const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\*\*/g, '').toLowerCase()
/** Todas as palavras da busca precisam aparecer em algum dos textos. */
export function bate(q: string[], ...xs: unknown[]) {
  if (!q.length) return true
  const alvo = norm(xs.filter(x => x != null && x !== false).join(' '))
  return q.every(w => alvo.includes(w))
}

/* ---------- Textos de referência (protótipo, viewRules) ---------- */
export interface Texto { id: string; titulo: string; ref: string; ps: string[] }
export const TEXTOS: Texto[] = [
  { id: 'condicao', titulo: 'Curso da condição', ref: 'p. 148', ps: [
    'A penalidade vale em todas as Defesas, ataques, perícias e testes de habilidade. Em -10 o movimento cai pela metade. No fim do curso a criatura cai inconsciente (dróides e veículos ficam desativados).',
    '**Limiar de dano** = Defesa de Fortitude (+5 Grande, +10 Enorme, +20 Imenso, +50 Colossal). Um único ataque que iguala ou supera o limiar move o alvo -1 passo. Se esse ataque também zera os PV, o alvo morre (1 Ponto de Força evita a morte: fica inconsciente com -5 passos).',
    '**Recuperar:** três ações rápidas = +1 passo. Oito horas de descanso limpam o curso, salvo condições persistentes.',
  ] },
  { id: 'acoes', titulo: 'Ações por turno', ref: 'p. 144', ps: [
    'Uma **ação padrão**, uma **de movimento** e uma **rápida**. Troque a padrão por movimento ou rápida, e a de movimento por rápida. Ou gaste tudo numa **ação de rodada completa**.',
    '**Ataque físico:** 1d20 + BBA + Vig. **À distância:** 1d20 + BBA + Des + penalidade de alcance, contra Reflexo. 20 natural acerta e causa dano dobrado; 1 natural erra.',
    '**Dano:** dados da arma + ½ nível heróico (+ Vig no físico; dobro do Vig com arma de duas mãos).',
    '**Segunda Chance** (ação rápida, 1/dia, com metade dos PV ou menos): cura ¼ dos PV máximos ou o valor de Constituição, o maior.',
    '**Pontos de Força:** ação livre, +1d6 num ataque ou teste (2d6 no 8º, 3d6 no 15º; fica com o maior). Também evitam a morte, recuperam um poder ou reduzem o Lado Sombrio.',
  ] },
  { id: 'defesas', titulo: 'Defesas', ref: 'p. 145', ps: [
    '**Reflexo:** 10 + nível heróico ou bônus de armadura + Des + classe + armadura natural + tamanho.',
    '**Fortitude:** 10 + nível heróico + Con + classe + equipamento.',
    '**Vontade:** 10 + nível heróico + Sab + classe.',
    'Bônus de classe não se somam entre classes: vale o melhor de cada Defesa.',
    '**Perícias:** 1d20 + ½ nível + habilidade + 5 se treinado (+5 com Foco em Perícia).',
  ] },
]

/* ---------- Ideias (protótipo, viewIdeas) ---------- */
export const IDEIAS: [ 'Pronto' | 'Próximo', string, string][] = [
  ['Pronto', 'Criador guiado pelo livro', 'Espécies, classes, habilidades (rolagem, compra de pontos ou pacote), perícias, talentos com pré-requisitos, aptidões, poderes e compras.'],
  ['Pronto', 'Ficha viva', 'Defesas, limiar, perícias e ataques recalculados a cada mudança; curso da condição, Segunda Chance, Pontos de Força e Lado Sombrio clicáveis.'],
  ['Pronto', 'Subir de nível', 'Assistente que aplica dado de vida, talentos a cada 3 níveis, aptidões e talentos bônus por classe, aumentos de habilidade e multiclasse.'],
  ['Pronto', 'Mesa de combate', 'Iniciativa, rolagem de ataque contra Reflexo, dano contra limiar com o passo na condição feito automaticamente.'],
  ['Pronto', 'Mapa tático e galáxia', 'Grade de 1,5 m com cenários, fichas arrastáveis, paredes, névoa de guerra, régua com faixas de alcance e mapa galáctico.'],
  ['Pronto', 'Abertura da saga', 'Texto subindo em perspectiva com título e episódio editáveis, para abrir cada sessão.'],
  ['Próximo', 'Naves e combate veicular', 'Fichas de naves (Capítulo 10) com escudos, armas de nave, papéis de piloto e artilheiro e perseguições.'],
  ['Próximo', 'Construtor de dróides', 'Heróis dróides do Capítulo 11: categorias, locomoção, apêndices e acessórios com custo.'],
  ['Próximo', 'Classes de prestígio', 'Cavaleiro Jedi, Lorde Sith, Caçador de Recompensas, Ás Piloto e demais, com requisitos verificados.'],
  ['Próximo', 'Mesa compartilhada ao vivo', 'Jogadores entram pelo próprio celular, rolam dados que aparecem para todos e o mestre move as fichas no mapa em tempo real.'],
  ['Próximo', 'Narrador assistido por IA', 'Gerar descrições de cenas, falas de NPCs e consequências a partir do diário da sessão, no tom de Star Wars.'],
  ['Próximo', 'Encontros por Nível de Desafio', 'Montar encontros equilibrados pelo ND do grupo usando os personagens do Capítulo 16.'],
  ['Próximo', 'Pontos de Destino e Destinos', 'Rastrear o Destino de cada herói (Capítulo 7) com os bônus quando ele se cumpre.'],
  ['Próximo', 'Eras de campanha', 'Filtrar espécies e equipamentos pela era escolhida (Ascensão do Império, Rebelião, Nova Ordem Jedi).'],
  ['Próximo', 'Trilha sonora e efeitos', 'Sons de cantina, hangar e hiperespaço tocando em loop durante a cena, com volume por categoria.'],
  ['Próximo', 'Ficha para impressão', 'Exportar a ficha preenchida no layout da ficha oficial em PDF.'],
]

/* ---------- Derivados ---------- */
export const CLASS_IDS = Object.keys(CLASSES) as ClassId[]
const clsNome = (k: ClassId) => CLASSES[k].name

/** Classes que têm a perícia na lista de classe. */
export const classesDaPericia = (n: string) => CLASS_IDS.filter(k => CLASSES[k].skills.includes(n)).map(clsNome)

/** Classes que podem pegar o talento como talento bônus. */
export const classesDoTalento = (n: string) =>
  CLASS_IDS.filter(k => (CLASSES[k].bonus as string[]).some(b => b === n || b.startsWith(n + ' ('))).map(clsNome)

export const CHOICE_LABEL: Record<string, string> = {
  group: 'escolha um grupo de armas', prof: 'escolha um grupo de armas', trained: 'escolha uma perícia treinada', untrained: 'escolha uma perícia de classe não treinada',
}

export type FeatRow = (typeof FEATS)[number]
/** Pré-requisitos do talento em texto (motor de regras + "não ser dróide"). */
export function reqTalento(f: FeatRow) {
  const base = featReqText(f as Parameters<typeof featReqText>[0])
  const extra = f.req && 'notDroid' in f.req && f.req.notDroid ? 'não ser dróide' : ''
  return [base, extra].filter(Boolean).join(', ')
}

type Aptidao = { n: string; d: string; p?: string[]; pf?: string[]; bab?: number; abil?: Record<string, number>; multi?: number; dark?: boolean }
export const ARVORES = Object.entries(TREES as unknown as Record<string, Aptidao[]>)

/** Pré-requisitos de uma aptidão em texto. */
export function reqAptidao(t: Aptidao) {
  const out: string[] = []
  if (t.abil) Object.entries(t.abil).forEach(([k, v]) => out.push(`${ABIL_SHORT[k]} ${v}`))
  if (t.bab) out.push(`BBA +${t.bab}`)
  if (t.pf) out.push(...t.pf)
  if (t.p) out.push(...t.p)
  if (t.dark) out.push('Pontuação do Lado Sombrio 1+')
  return out.join(', ')
}

/** Quem tem acesso à árvore de aptidões. */
export const donosDaArvore = (arvore: string) =>
  FORCE_TREES.includes(arvore) ? ['Sensitividade da Força'] : CLASS_IDS.filter(k => CLASSES[k].trees.includes(arvore)).map(clsNome)

const fmtMods = (m: Record<string, number>) => Object.entries(m).map(([k, v]) => `${ABIL_SHORT[k]} ${v >= 0 ? '+' : ''}${v}`).join(', ')
export const modsDaEspecie = (m: Record<string, number>) => fmtMods(m) || 'Nenhum'

/* ---------- Filtro geral ---------- */
export type Aba = 'combate' | 'cds' | 'pericias' | 'talentos' | 'aptidoes' | 'forca' | 'armas' | 'armaduras' | 'especies' | 'classes' | 'ideias'
export const ABAS: { id: Aba; nome: string }[] = [
  { id: 'combate', nome: 'Combate' }, { id: 'cds', nome: 'CDs e alcance' }, { id: 'pericias', nome: 'Perícias' },
  { id: 'talentos', nome: 'Talentos' }, { id: 'aptidoes', nome: 'Aptidões' }, { id: 'forca', nome: 'Força' },
  { id: 'armas', nome: 'Armas' }, { id: 'armaduras', nome: 'Armaduras' }, { id: 'especies', nome: 'Espécies' },
  { id: 'classes', nome: 'Classes' }, { id: 'ideias', nome: 'Ideias' },
]

/** Filtra todas as tabelas de uma vez; devolve as linhas e quantas sobraram por aba. */
export function filtrar(busca: string) {
  const q = norm(busca).split(/\s+/).filter(Boolean)
  const textos = TEXTOS.map(t => ({ ...t, ps: bate(q, t.titulo) ? t.ps : t.ps.filter(p => bate(q, p)) })).filter(t => t.ps.length)
  const cds = DC_TABLE.filter(r => bate(q, 'cd dificuldade', ...r))
  const alcance = Object.entries(RANGES).filter(([k]) => bate(q, 'alcance', k))
  const pericias = SKILLS.filter(s => bate(q, s.n, ABIL_SHORT[s.a], classesDaPericia(s.n), s.trainedOnly && 'só treinado', s.force && 'força'))
  const talentos = FEATS.filter(f => bate(q, f.n, f.d, reqTalento(f), classesDoTalento(f.n)))
  const aptidoes = ARVORES.map(([arv, ts]) => [arv, bate(q, arv, donosDaArvore(arv)) ? ts : ts.filter(t => bate(q, t.n, t.d, reqAptidao(t)))] as const).filter(([, ts]) => ts.length)
  const poderes = POWERS.filter(p => bate(q, p.n, p.d, p.t, p.a, p.desc, p.vs, p.dmg, p.tiers?.flat()))
  const armas = WEAPONS.filter(w => w.n !== 'Desarmado' && bate(q, w.n, w.g, w.dmg, w.stun, w.type))
  const armaduras = ARMORS.filter(a => bate(q, a.n, a.cat, 'armadura'))
  const especies = SPECIES.filter(s => bate(q, s.name, s.world, s.size, s.langs, s.traits, modsDaEspecie(s.mods as Record<string, number>)))
  const classes = CLASS_IDS.filter(k => { const c = CLASSES[k]; return bate(q, c.name, c.blurb, c.key, c.examples, c.trees, c.start) })
  const ideias = IDEIAS.filter(i => bate(q, ...i))
  const ganchos = GEN.gancho.filter(g => bate(q, 'gancho aventura', g))
  const complicacoes = GEN.complica.filter(g => bate(q, 'complicação', g))
  const n: Record<Aba, number> = {
    combate: textos.reduce((s, t) => s + t.ps.length, 0), cds: cds.length + alcance.length, pericias: pericias.length,
    talentos: talentos.length, aptidoes: aptidoes.reduce((s, [, ts]) => s + ts.length, 0), forca: poderes.length, armas: armas.length,
    armaduras: armaduras.length, especies: especies.length, classes: classes.length, ideias: ideias.length + ganchos.length + complicacoes.length,
  }
  return { ativo: q.length > 0, n, textos, cds, alcance, pericias, talentos, aptidoes, poderes, armas, armaduras, especies, classes, ideias, ganchos, complicacoes }
}
export type Filtro = ReturnType<typeof filtrar>
