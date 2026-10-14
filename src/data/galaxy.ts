/**
 * Dados da galáxia: planetas, regiões, tiers de perigo, minérios exclusivos,
 * funções especiais, tags de ambiente e a loja liberada por tier.
 *
 * Posições: cada planeta usa o quadrante do mapa canônico da galáxia
 * (colunas A–V, linhas 1–21, como no Essential Atlas). `sub` ajusta a posição
 * dentro do quadrante para planetas que dividem o mesmo quadrado.
 */
import { ARMORS, GEAR, WEAPONS } from './saga'

export type Tier = 1 | 2 | 3 | 4

export const TIERS: Record<Tier, { nome: string; cor: string; resumo: string }> = {
  1: { nome: 'Seguro', cor: '#7fb88a', resumo: 'Mundos policiados. Lojas com equipamento básico e armas leves legais.' },
  2: { nome: 'Instável', cor: '#d9b45a', resumo: 'Crime e fronteira. Blasters padrão, armaduras leves e serviços de cantina.' },
  3: { nome: 'Hostil', cor: '#e07a3a', resumo: 'Guerra, piratas ou natureza mortal. Armas pesadas, vibroarmas e armaduras médias.' },
  4: { nome: 'Letal', cor: '#d8333a', resumo: 'Só os loucos vão. Armamento militar, armaduras pesadas e explosivos.' },
}

export type RegiaoId =
  | 'nucleo-profundo' | 'mundos-do-nucleo' | 'colonias' | 'orla-interior' | 'regiao-de-expansao'
  | 'orla-media' | 'orla-exterior' | 'espaco-hutt' | 'espaco-selvagem' | 'regioes-desconhecidas'

export const REGIOES: Record<RegiaoId, { nome: string }> = {
  'nucleo-profundo': { nome: 'Núcleo Profundo' },
  'mundos-do-nucleo': { nome: 'Mundos do Núcleo' },
  colonias: { nome: 'Colônias' },
  'orla-interior': { nome: 'Orla Interior' },
  'regiao-de-expansao': { nome: 'Região de Expansão' },
  'orla-media': { nome: 'Orla Média' },
  'orla-exterior': { nome: 'Orla Exterior' },
  'espaco-hutt': { nome: 'Espaço Hutt' },
  'espaco-selvagem': { nome: 'Espaço Selvagem' },
  'regioes-desconhecidas': { nome: 'Regiões Desconhecidas' },
}

/** Tags de ambiente. Planetas e locais criados pelo mestre usam as mesmas. */
export const TAGS = {
  urbano: 'Urbano', capital: 'Capital', mercado: 'Mercado', 'mercado-negro': 'Mercado negro', cantina: 'Cantina',
  estaleiro: 'Estaleiro', imperial: 'Imperial', rebelde: 'Rebelde', hutt: 'Hutt', jedi: 'Jedi', sith: 'Sith',
  forca: 'Vergência da Força', kyber: 'Kyber', mineracao: 'Mineração', cacadores: 'Caçadores de recompensa',
  deserto: 'Deserto', gelo: 'Gelo', oceano: 'Oceano', floresta: 'Floresta', selva: 'Selva', pantano: 'Pântano',
  lava: 'Lava', gasoso: 'Gigante gasoso', montanhas: 'Montanhas', ruinas: 'Ruínas', 'ferro-velho': 'Ferro-velho',
  militar: 'Militar', fronteira: 'Fronteira', lua: 'Lua', segredo: 'Oculto',
} as const
export type Tag = keyof typeof TAGS

/** Minérios e recursos exclusivos. Só se compram/extraem no planeta de origem. */
export const MINERIOS = {
  beskar: { nome: 'Beskar', preco: 6000, origem: ['mandalore', 'concordia'], efeito: 'Aço mandaloriano. Armaduras de beskar resistem a sabres de luz e somam +2 à Fortitude; armas de beskar não são cortadas por sabres.' },
  kyber: { nome: 'Cristal kyber', preco: 0, origem: ['ilum', 'christophsis', 'jedha', 'dantooine'], efeito: 'Coração de um sabre de luz. Não se compra: só é obtido rastreando e coletando, com aprovação do mestre.' },
  coaxium: { nome: 'Coaxium', preco: 4000, origem: ['kessel'], efeito: 'Combustível de hiperespaço instável. Um frasco refinado reduz pela metade o tempo de uma viagem; mal armazenado, explode (8d6).' },
  especiaria: { nome: 'Especiaria glitterstim', preco: 800, origem: ['kessel'], efeito: 'Droga telepática ilegal. Vale muito no mercado negro.' },
  tibanna: { nome: 'Gás tibanna', preco: 1200, origem: ['bespin'], efeito: 'Gás que potencializa blasters. Uma recarga dá +1 dado de dano a uma arma blaster por uma cena.' },
  bacta: { nome: 'Bacta', preco: 500, origem: ['thyferra'], efeito: 'Fluido curativo. Uma dose recupera o dobro de um medpac e remove 1 passo de condição persistente.' },
  corusca: { nome: 'Gema corusca', preco: 5000, origem: ['yavin-4'], efeito: 'Gema raríssima dos núcleos de gigantes gasosos. Moeda de luxo e lente de sabre (+1 no ataque).' },
  cortosis: { nome: 'Cortosis', preco: 7000, origem: ['mustafar'], efeito: 'Minério que desliga lâminas de sabre de luz por um instante ao contato. Usado em escudos e armaduras.' },
} as const
export type MinerioId = keyof typeof MINERIOS

/** Funções especiais de planetas. Cada uma vira uma solicitação ao mestre na aba Ambiente. */
export const FUNCOES = {
  clonagem: { nome: 'Clonagem kaminoana', custo: 20000, desc: 'Encomende um clone de um personagem morto (volta com -1 nível) ou um esquadrão de soldados clones aliados.' },
  'tanque-bacta': { nome: 'Tanque de bacta', custo: 1000, desc: 'Cura total de PV e da condição, inclusive condição persistente, após um dia de imersão.' },
  'forja-beskar': { nome: 'Forja do Armeiro', custo: 0, desc: 'Armeiros mandalorianos forjam armaduras e armas personalizadas de beskar.' },
  estaleiro: { nome: 'Estaleiro', custo: 0, desc: 'Compra, conserto e modificação de naves. Também troca o hiperpropulsor.' },
  holonet: { nome: 'Arquivos da HoloNet', custo: 200, desc: 'Pesquisa em arquivos públicos e imperiais: +5 em Reunir Informação e compra de cartas de astrogação.' },
  'fundicao-droides': { nome: 'Fundição de dróides', custo: 0, desc: 'Encomenda de dróides de batalha, astromecânicos e peças.' },
  'guilda-cacadores': { nome: 'Guilda dos Caçadores', custo: 0, desc: 'Pegue contratos de recompensa ou contrate um caçador.' },
  'mercado-negro': { nome: 'Mercado negro', custo: 0, desc: 'Vende itens ilegais e compra mercadoria roubada sem perguntas.' },
  'castelo-maz': { nome: 'Castelo de Maz Kanata', custo: 0, desc: 'Ponto neutro de contrabandistas: cartas de astrogação raras, rumores e contatos.' },
  'ferro-velho': { nome: 'Ferro-velho', custo: 0, desc: 'Venda sucata recuperada e procure peças de nave baratas.' },
  'artesaos-wookiee': { nome: 'Artesãos wookiees', custo: 0, desc: 'Bowcasters e armas de madeira wroshyr feitas sob medida.' },
  'rede-bothan': { nome: 'Rede de espiões bothan', custo: 1000, desc: 'Compre segredos: localização de alvos, planos e senhas.' },
  'corrida-kessel': { nome: 'Rota de Kessel', custo: 0, desc: 'Contrabandeie coaxium e especiaria pelo Sorvedouro. Teste de Pilotar CD 25.' },
  'templo-jedi': { nome: 'Templo Jedi', custo: 0, desc: 'Medite para recuperar Pontos de Força e tentar rastrear um cristal kyber.' },
  'templo-sith': { nome: 'Tumbas Sith', custo: 0, desc: 'Conhecimento proibido: aprenda um poder do Lado Sombrio em troca de 1 ponto de Lado Sombrio.' },
  'refinaria-tibanna': { nome: 'Cidade das Nuvens', custo: 0, desc: 'Compra de gás tibanna e reabastecimento de naves.' },
  'camara-kyber': { nome: 'Caverna de cristais', custo: 0, desc: 'Teste da Força para coletar um cristal kyber que chama por você.' },
  'navegador-sith': { nome: 'Navegador Sith', custo: 0, desc: 'Único jeito de chegar a Exegol. Só o mestre entrega.' },
} as const
export type FuncaoId = keyof typeof FUNCOES

export type TipoPlaneta = 'comum' | 'kyber' | 'segredo'

export interface Planeta {
  id: string
  nome: string
  grade: string
  sub?: [number, number]
  regiao: RegiaoId
  tier: Tier
  /** comum: libera com carta de astrogação. kyber: só por rastreio de cristal. segredo: só o mestre libera. */
  tipo: TipoPlaneta
  cor: string
  terreno: string
  tags: Tag[]
  descricao: string
  minerios?: MinerioId[]
  funcoes?: FuncaoId[]
  /** Itens da loja (ids de ITENS) vendidos só aqui. */
  exclusivos?: string[]
}

export const PLANETAS: Planeta[] = [
  // Núcleo
  { id: 'coruscant', nome: 'Coruscant', grade: 'L-9', regiao: 'mundos-do-nucleo', tier: 1, tipo: 'comum', cor: '#e8c070', terreno: 'Ecumenópole',
    tags: ['urbano', 'capital', 'mercado', 'imperial', 'cantina'], funcoes: ['holonet', 'mercado-negro'],
    descricao: 'Uma única cidade cobre o planeta inteiro. Sede do governo galáctico, com mil níveis de torres por cima e submundo sem sol por baixo.' },
  { id: 'chandrila', nome: 'Chandrila', grade: 'L-9', sub: [0.15, 0.85], regiao: 'mundos-do-nucleo', tier: 1, tipo: 'comum', cor: '#9cc98a', terreno: 'Pradarias e lagos',
    tags: ['mercado', 'rebelde'], descricao: 'Mundo agrícola de colinas e mares rasos, berço de diplomatas e da senadora Mon Mothma.' },
  { id: 'alderaan', nome: 'Alderaan', grade: 'M-10', sub: [0.25, 0.25], regiao: 'mundos-do-nucleo', tier: 1, tipo: 'comum', cor: '#7fb8e8', terreno: 'Montanhas e planícies',
    tags: ['mercado', 'rebelde', 'montanhas'], descricao: 'Mundo pacífico de picos nevados e cidades elegantes. Famoso por artistas, nobres e simpatia discreta à Rebelião.' },
  { id: 'kuat', nome: 'Kuat', grade: 'M-10', sub: [0.8, 0.7], regiao: 'mundos-do-nucleo', tier: 1, tipo: 'comum', cor: '#c9b48a', terreno: 'Jardins e anel orbital',
    tags: ['estaleiro', 'imperial', 'militar', 'mercado'], funcoes: ['estaleiro'],
    descricao: 'Um anel de estaleiros envolve o planeta. Aqui nascem os Destróieres Estelares.' },
  { id: 'corellia', nome: 'Corellia', grade: 'M-11', regiao: 'mundos-do-nucleo', tier: 2, tipo: 'comum', cor: '#8cc9a0', terreno: 'Cidades industriais e costa',
    tags: ['estaleiro', 'mercado', 'cantina', 'urbano'], funcoes: ['estaleiro', 'mercado-negro'], exclusivos: ['traje-de-forca-corelliano'],
    descricao: 'Estaleiros, pilotos lendários e contrabandistas. Em Coronet, gangues disputam cada doca.' },
  { id: 'tython', nome: 'Tython', grade: 'L-10', sub: [0.75, 0.7], regiao: 'nucleo-profundo', tier: 3, tipo: 'comum', cor: '#a8d0c0', terreno: 'Planaltos e ruínas',
    tags: ['jedi', 'forca', 'ruinas', 'montanhas'], funcoes: ['templo-jedi'],
    descricao: 'Escondido nas rotas instáveis do Núcleo Profundo. Ruínas de uma das primeiras ordens a estudar a Força.' },
  // Colônias e Orla Interior
  { id: 'thyferra', nome: 'Thyferra', grade: 'N-12', regiao: 'orla-interior', tier: 1, tipo: 'comum', cor: '#6fc0a0', terreno: 'Selva tropical',
    tags: ['mercado', 'selva'], minerios: ['bacta'], funcoes: ['tanque-bacta'],
    descricao: 'Selvas quentes onde os Vratix cultivam bacta. Quem controla Thyferra controla a cura da galáxia.' },
  { id: 'jakku', nome: 'Jakku', grade: 'K-15', regiao: 'orla-interior', tier: 2, tipo: 'comum', cor: '#d8b880', terreno: 'Deserto e cemitério de naves',
    tags: ['deserto', 'ferro-velho', 'fronteira', 'mercado'], funcoes: ['ferro-velho'],
    descricao: 'Deserto coberto de cascos de Destróieres caídos. Catadores trocam sucata por porções de comida.' },
  // Orla Média
  { id: 'ord-mantell', nome: 'Ord Mantell', grade: 'L-7', regiao: 'orla-media', tier: 2, tipo: 'comum', cor: '#b0a080', terreno: 'Cidades portuárias',
    tags: ['cantina', 'cacadores', 'mercado', 'ferro-velho'], funcoes: ['guilda-cacadores'],
    descricao: 'Cassinos, ferros-velhos e caçadores de recompensa. Todo mundo deve dinheiro a alguém em Ord Mantell.' },
  { id: 'takodana', nome: 'Takodana', grade: 'J-12', regiao: 'orla-media', tier: 1, tipo: 'comum', cor: '#6aa870', terreno: 'Lagos e florestas',
    tags: ['cantina', 'floresta', 'mercado'], funcoes: ['castelo-maz'],
    descricao: 'Mundo verde e tranquilo. O castelo de pedra de Maz Kanata recebe qualquer um que respeite a regra: sem brigas.' },
  { id: 'kashyyyk', nome: 'Kashyyyk', grade: 'P-9', regiao: 'orla-media', tier: 2, tipo: 'comum', cor: '#4f8f4a', terreno: 'Florestas de wroshyr',
    tags: ['floresta', 'mercado'], funcoes: ['artesaos-wookiee'], exclusivos: ['bowcaster'],
    descricao: 'Árvores do tamanho de torres e cidades nos galhos. Lar dos Wookiees, que não esquecem uma dívida de vida.' },
  { id: 'trandosha', nome: 'Trandosha', grade: 'P-9', sub: [0.8, 0.8], regiao: 'orla-media', tier: 3, tipo: 'comum', cor: '#9a8a4a', terreno: 'Pântanos e savanas',
    tags: ['cacadores', 'mercado-negro', 'pantano'], funcoes: ['guilda-cacadores', 'mercado-negro'],
    descricao: 'Vizinho de Kashyyyk. Os Trandoshanos contam pontos caçando presas inteligentes, de preferência Wookiees.' },
  { id: 'naboo', nome: 'Naboo', grade: 'O-17', regiao: 'orla-media', tier: 1, tipo: 'comum', cor: '#6fb07a', terreno: 'Lagos, campos e cidade submersa',
    tags: ['mercado', 'capital', 'oceano'], descricao: 'Palácios à beira de cachoeiras e a cidade-bolha dos Gungans. Paz que custa caro manter.' },
  { id: 'bothawui', nome: 'Bothawui', grade: 'R-14', regiao: 'orla-media', tier: 2, tipo: 'comum', cor: '#c9a46a', terreno: 'Planícies e cidades muradas',
    tags: ['urbano', 'mercado'], funcoes: ['rede-bothan'],
    descricao: 'Lar dos Bothans e da maior rede de informantes da galáxia. Todo segredo tem preço.' },
  // Orla Exterior
  { id: 'sullust', nome: 'Sullust', grade: 'M-17', regiao: 'orla-exterior', tier: 2, tipo: 'comum', cor: '#9a7a6a', terreno: 'Vulcânico, cidades em cavernas',
    tags: ['estaleiro', 'lava', 'mercado'], funcoes: ['estaleiro'],
    descricao: 'Superfície tóxica e cidades em cavernas. A SoroSuub fabrica naves e blasters aqui.' },
  { id: 'eriadu', nome: 'Eriadu', grade: 'M-18', regiao: 'orla-exterior', tier: 2, tipo: 'comum', cor: '#a09080', terreno: 'Industrial poluído',
    tags: ['imperial', 'urbano', 'mercado', 'militar'], descricao: 'Mundo fabril enevoado e berço de oficiais imperiais linha-dura.' },
  { id: 'tatooine', nome: 'Tatooine', grade: 'R-16', sub: [0.45, 0.5], regiao: 'orla-exterior', tier: 2, tipo: 'comum', cor: '#e8b86a', terreno: 'Deserto de dois sóis',
    tags: ['deserto', 'hutt', 'cantina', 'cacadores', 'mercado', 'fronteira'], funcoes: ['guilda-cacadores', 'mercado-negro'],
    descricao: 'Dois sóis, areia e Hutts. Mos Eisley é a mais miserável colmeia de escória e vilania que você vai encontrar.' },
  { id: 'geonosis', nome: 'Geonosis', grade: 'R-16', sub: [0.85, 0.2], regiao: 'orla-exterior', tier: 3, tipo: 'comum', cor: '#c76f4a', terreno: 'Deserto rochoso e colmeias',
    tags: ['deserto', 'militar', 'ruinas'], funcoes: ['fundicao-droides'],
    descricao: 'Colmeias de pedra, arenas de execução e fundições de dróides abandonadas que ainda funcionam.' },
  { id: 'rodia', nome: 'Rodia', grade: 'R-16', sub: [0.15, 0.85], regiao: 'orla-exterior', tier: 2, tipo: 'comum', cor: '#5fa86a', terreno: 'Selva úmida',
    tags: ['selva', 'cacadores', 'mercado'], descricao: 'Selvas quentes e pantanosas, lar dos Rodianos e de sua tradição de caça.' },
  { id: 'ryloth', nome: 'Ryloth', grade: 'R-17', regiao: 'orla-exterior', tier: 2, tipo: 'comum', cor: '#d0905a', terreno: 'Montanhas e desertos',
    tags: ['montanhas', 'deserto', 'mercado'], descricao: "Mundo dos Twi'leks, de face escaldante e face gelada. Guerrilheiros resistem nas cavernas." },
  { id: 'nal-hutta', nome: 'Nal Hutta', grade: 'S-12', sub: [0.3, 0.3], regiao: 'espaco-hutt', tier: 3, tipo: 'comum', cor: '#8a9a4a', terreno: 'Pântano poluído',
    tags: ['hutt', 'pantano', 'mercado-negro'], funcoes: ['mercado-negro'],
    descricao: 'O planeta-trono dos Hutts. Palácios cercados por pântanos podres e escravos.' },
  { id: 'nar-shaddaa', nome: 'Nar Shaddaa', grade: 'S-12', sub: [0.8, 0.8], regiao: 'espaco-hutt', tier: 3, tipo: 'comum', cor: '#c080d0', terreno: 'Lua-cidade vertical',
    tags: ['hutt', 'urbano', 'lua', 'mercado-negro', 'cantina', 'cacadores'], funcoes: ['mercado-negro', 'guilda-cacadores'], exclusivos: ['eletrocajado'],
    descricao: 'A Lua dos Contrabandistas: uma cidade sem fim, neon e crime. Se existe, está à venda aqui.' },
  { id: 'kessel', nome: 'Kessel', grade: 'T-10', regiao: 'orla-exterior', tier: 4, tipo: 'comum', cor: '#a0806a', terreno: 'Minas e atmosfera artificial',
    tags: ['mineracao', 'mercado-negro', 'hutt'], minerios: ['coaxium', 'especiaria'], funcoes: ['corrida-kessel', 'mercado-negro'],
    descricao: 'Minas de especiaria tocadas a escravos, cercadas pelo Sorvedouro. A Rota de Kessel separa pilotos de lendas.' },
  { id: 'mandalore', nome: 'Mandalore', grade: 'O-7', sub: [0.4, 0.5], regiao: 'orla-exterior', tier: 3, tipo: 'comum', cor: '#b8a8a0', terreno: 'Deserto vítreo e cidades-domo',
    tags: ['mineracao', 'militar', 'mercado', 'deserto'], minerios: ['beskar'], funcoes: ['forja-beskar'], exclusivos: ['armadura-de-batalha-pesada', 'lanca-chamas'],
    descricao: 'Mundo de guerreiros, cicatrizado por guerras antigas. Única fonte de beskar, o aço que resiste ao sabre de luz.' },
  { id: 'concordia', nome: 'Concordia', grade: 'O-7', sub: [0.85, 0.15], regiao: 'orla-exterior', tier: 2, tipo: 'comum', cor: '#8aa070', terreno: 'Lua de florestas e minas',
    tags: ['lua', 'mineracao', 'floresta'], minerios: ['beskar'],
    descricao: 'Lua de Mandalore. Minas de beskar quase esgotadas, cobiçadas por clãs rivais.' },
  { id: 'dathomir', nome: 'Dathomir', grade: 'O-6', regiao: 'orla-exterior', tier: 4, tipo: 'comum', cor: '#a04050', terreno: 'Florestas vermelhas e pântanos',
    tags: ['forca', 'sith', 'pantano', 'floresta'], funcoes: ['templo-sith'],
    descricao: 'Céu cor de sangue, névoa verde e as Irmãs da Noite, bruxas que dobram a Força com magia.' },
  { id: 'yavin-4', nome: 'Yavin 4', grade: 'P-6', regiao: 'orla-exterior', tier: 2, tipo: 'comum', cor: '#6f9a5a', terreno: 'Lua de selva',
    tags: ['lua', 'selva', 'ruinas', 'rebelde'], minerios: ['corusca'],
    descricao: 'Lua de selva coberta de templos Massassi, perto do gigante Yavin, cujo núcleo esconde gemas corusca.' },
  { id: 'felucia', nome: 'Felucia', grade: 'R-6', regiao: 'orla-exterior', tier: 3, tipo: 'comum', cor: '#d07ab0', terreno: 'Selva de fungos gigantes',
    tags: ['selva', 'forca'], descricao: 'Fungos do tamanho de árvores, cores berrantes e predadores que parecem plantas.' },
  { id: 'mon-cala', nome: 'Mon Cala', grade: 'U-6', regiao: 'orla-exterior', tier: 1, tipo: 'comum', cor: '#3f8fb0', terreno: 'Oceano',
    tags: ['oceano', 'estaleiro', 'rebelde', 'mercado'], funcoes: ['estaleiro'],
    descricao: 'Um planeta-oceano de cidades flutuantes. Os Mon Calamari constroem as naves de guerra mais elegantes da galáxia.' },
  { id: 'lothal', nome: 'Lothal', grade: 'S-6', regiao: 'orla-exterior', tier: 2, tipo: 'comum', cor: '#b8c080', terreno: 'Pradarias',
    tags: ['imperial', 'fronteira', 'mercado', 'jedi'], funcoes: ['templo-jedi'],
    descricao: 'Planícies de capim alto ocupadas por fábricas imperiais. Um templo Jedi dorme sob as rochas.' },
  { id: 'mygeeto', nome: 'Mygeeto', grade: 'K-4', regiao: 'orla-exterior', tier: 3, tipo: 'comum', cor: '#b0d0e8', terreno: 'Gelo e cristal',
    tags: ['gelo', 'urbano', 'militar'], descricao: 'Cidades de cristal sobre gelo eterno, cofres do Clã Bancário cobiçados por todo saqueador.' },
  { id: 'moraband', nome: 'Moraband', grade: 'R-5', regiao: 'orla-exterior', tier: 4, tipo: 'comum', cor: '#b05040', terreno: 'Vale de tumbas',
    tags: ['sith', 'ruinas', 'forca', 'deserto'], funcoes: ['templo-sith'],
    descricao: 'Antigo mundo natal dos Sith. Vales de estátuas e tumbas onde os mortos ainda sussurram.' },
  { id: 'kamino', nome: 'Kamino', grade: 'S-15', regiao: 'orla-exterior', tier: 2, tipo: 'comum', cor: '#7aa8c8', terreno: 'Oceano tempestuoso',
    tags: ['oceano', 'militar'], funcoes: ['clonagem'], exclusivos: ['armadura-de-stormtrooper'],
    descricao: 'Tempestade eterna sobre um oceano sem fim. Os Kaminoanos clonaram um exército inteiro em suas cidades sobre palafitas.' },
  { id: 'scarif', nome: 'Scarif', grade: 'U-14', regiao: 'orla-exterior', tier: 3, tipo: 'comum', cor: '#5ac0c0', terreno: 'Ilhas tropicais',
    tags: ['imperial', 'militar', 'oceano'], funcoes: ['holonet'],
    descricao: 'Praias paradisíacas, um escudo planetário e a Cidadela, cofre de dados militares imperiais.' },
  { id: 'utapau', nome: 'Utapau', grade: 'N-19', regiao: 'orla-exterior', tier: 2, tipo: 'comum', cor: '#c0a070', terreno: 'Sumidouros',
    tags: ['deserto', 'cantina', 'mercado'], descricao: 'Cidades escavadas em sumidouros gigantes, ligados por lagartos de montaria.' },
  { id: 'mustafar', nome: 'Mustafar', grade: 'L-19', regiao: 'orla-exterior', tier: 4, tipo: 'comum', cor: '#e0563a', terreno: 'Rios de lava',
    tags: ['lava', 'mineracao', 'sith'], minerios: ['cortosis'],
    descricao: 'Rios de lava e coletores de minério. Um castelo negro vigia o fogo.' },
  { id: 'bespin', nome: 'Bespin', grade: 'K-18', sub: [0.7, 0.3], regiao: 'orla-exterior', tier: 2, tipo: 'comum', cor: '#e8a87a', terreno: 'Gigante gasoso',
    tags: ['gasoso', 'cantina', 'mercado', 'mineracao'], minerios: ['tibanna'], funcoes: ['refinaria-tibanna'],
    descricao: 'A Cidade das Nuvens flutua nas camadas de gás tibanna. Cassinos em cima, refinarias embaixo.' },
  { id: 'hoth', nome: 'Hoth', grade: 'K-18', sub: [0.25, 0.75], regiao: 'orla-exterior', tier: 3, tipo: 'comum', cor: '#dcecf5', terreno: 'Gelo',
    tags: ['gelo', 'rebelde'], descricao: 'Gelo, nevascas que matam em horas e wampas. Bom lugar para quem não quer ser encontrado.' },
  { id: 'dagobah', nome: 'Dagobah', grade: 'M-19', regiao: 'orla-exterior', tier: 3, tipo: 'comum', cor: '#5f7f4f', terreno: 'Pântano',
    tags: ['pantano', 'forca'], funcoes: ['templo-jedi'],
    descricao: 'Pântanos em névoa, vida por toda parte e uma caverna onde o Lado Sombrio mostra o que você teme.' },
  { id: 'endor', nome: 'Endor', grade: 'H-16', regiao: 'orla-exterior', tier: 2, tipo: 'comum', cor: '#4f8a5a', terreno: 'Lua florestal',
    tags: ['lua', 'floresta'], descricao: 'Lua de sequoias gigantes, lar dos Ewoks. Pequenos, mas não subestime suas armadilhas.' },
  { id: 'crait', nome: 'Crait', grade: 'H-14', regiao: 'orla-exterior', tier: 2, tipo: 'comum', cor: '#e8e0e0', terreno: 'Planícies de sal sobre cristal vermelho',
    tags: ['mineracao', 'rebelde'], descricao: 'Sal branco por cima, minério vermelho por baixo. Uma antiga base rebelde abandonada na rocha.' },
  { id: 'batuu', nome: 'Batuu', grade: 'G-10', regiao: 'orla-exterior', tier: 2, tipo: 'comum', cor: '#a0b080', terreno: 'Florestas petrificadas',
    tags: ['fronteira', 'mercado-negro', 'cantina'], funcoes: ['mercado-negro', 'castelo-maz'],
    descricao: 'Último porto antes do Espaço Selvagem. No Posto Espira Negra se compram coordenadas para lugares que não existem nos mapas.' },
  // Planetas de rastreio de kyber: não aparecem em cartas de astrogação
  { id: 'ilum', nome: 'Ilum', grade: 'G-7', regiao: 'regioes-desconhecidas', tier: 3, tipo: 'kyber', cor: '#d0e8ff', terreno: 'Gelo e cavernas de cristal',
    tags: ['gelo', 'kyber', 'jedi', 'forca'], minerios: ['kyber'], funcoes: ['camara-kyber'],
    descricao: 'Mundo gelado onde jovens Jedi entravam nas cavernas para achar o cristal que os chamava.' },
  { id: 'christophsis', nome: 'Christophsis', grade: 'T-14', regiao: 'orla-exterior', tier: 3, tipo: 'kyber', cor: '#a0e0f0', terreno: 'Florestas de cristal',
    tags: ['kyber', 'ruinas'], minerios: ['kyber'], funcoes: ['camara-kyber'],
    descricao: 'Cidades e florestas de cristal. Algumas formações escondem kyber vivo.' },
  { id: 'jedha', nome: 'Jedha', grade: 'M-14', regiao: 'orla-media', tier: 3, tipo: 'kyber', cor: '#d8c8a0', terreno: 'Lua desértica gelada',
    tags: ['kyber', 'lua', 'deserto', 'jedi', 'forca'], minerios: ['kyber'], funcoes: ['camara-kyber'],
    descricao: 'Lua sagrada de peregrinos. O Templo dos Whills guardava kyber; o Império o saqueia.' },
  { id: 'dantooine', nome: 'Dantooine', grade: 'L-4', regiao: 'orla-exterior', tier: 2, tipo: 'kyber', cor: '#90b070', terreno: 'Pradarias',
    tags: ['kyber', 'jedi', 'ruinas'], minerios: ['kyber'], funcoes: ['camara-kyber'],
    descricao: 'Campos tranquilos e ruínas de um enclave Jedi. Cavernas antigas ainda guardam cristais.' },
  // Segredos: só o mestre libera
  { id: 'ahch-to', nome: 'Ahch-To', grade: 'E-6', regiao: 'regioes-desconhecidas', tier: 3, tipo: 'segredo', cor: '#5a90a0', terreno: 'Oceano e ilhas',
    tags: ['oceano', 'jedi', 'forca', 'segredo', 'ruinas'], funcoes: ['templo-jedi'],
    descricao: 'Ilhas de pedra num oceano cinza. O primeiro templo Jedi, apagado de todos os arquivos.' },
  { id: 'exegol', nome: 'Exegol', grade: 'C-11', regiao: 'regioes-desconhecidas', tier: 4, tipo: 'segredo', cor: '#6060a0', terreno: 'Tempestades e cidadela',
    tags: ['sith', 'forca', 'segredo', 'ruinas'], funcoes: ['templo-sith', 'navegador-sith'],
    descricao: 'Mundo oculto de relâmpagos eternos. O santuário dos Sith Eternos. Só se chega com um navegador Sith.' },
]

/** Arte do planeta em public/assets/planetas (ASSETS.md). Nem todo planeta tem imagem. */
const ARTE: Record<string, string> = { 'mon-cala': 'moncalamari', 'nal-hutta': 'nalhutta', 'yavin-4': 'yavin4' }
const COM_ARTE = new Set(['alderaan', 'bespin', 'bothawui', 'corellia', 'coruscant', 'dagobah', 'endor', 'geonosis', 'hoth', 'kamino', 'kashyyyk', 'kessel', 'mon-cala', 'mustafar', 'naboo', 'nal-hutta', 'rodia', 'ryloth', 'sullust', 'tatooine', 'trandosha', 'yavin-4'])
export function artePlaneta(id: string): string | null {
  return COM_ARTE.has(id) ? `./assets/planetas/${ARTE[id] ?? id}.png` : null
}
export const iconeItem = (i: { icone?: string }) => (i.icone ? `./assets/equipamento/${i.icone}.png` : null)

export const PLANETA_BY: Record<string, Planeta> = Object.fromEntries(PLANETAS.map(p => [p.id, p]))

const COLS = 'ABCDEFGHIJKLMNOPQRSTUV'
export const GRID = { cols: COLS.length, rows: 21 }

/** Posição normalizada (0–1) do planeta no mapa, a partir do quadrante canônico. */
export function posicao(p: Planeta): { x: number; y: number } {
  const [c, r] = p.grade.split('-')
  const [sx, sy] = p.sub ?? [0.5, 0.5]
  return { x: (COLS.indexOf(c) + sx) / GRID.cols, y: (Number(r) - 1 + sy) / GRID.rows }
}

/** Centro do Núcleo Profundo no mapa (quadrantes L/M-10). */
export const CENTRO = { x: 12 / 22, y: 9.5 / 21 }

/** Rotas hiperespaciais principais (aproximadas pelos planetas que cruzam). */
export const ROTAS: { nome: string; planetas: string[] }[] = [
  { nome: 'Rota Corelliana', planetas: ['coruscant', 'corellia', 'thyferra', 'bothawui', 'ryloth', 'tatooine'] },
  { nome: 'Rota Comercial Perlemiana', planetas: ['coruscant', 'chandrila', 'ord-mantell', 'mandalore', 'yavin-4', 'mon-cala'] },
  { nome: 'Via Hidiana', planetas: ['dantooine', 'ord-mantell', 'alderaan', 'corellia', 'sullust', 'eriadu', 'mustafar'] },
  { nome: 'Rota Comercial Rimma', planetas: ['kuat', 'jedha', 'naboo', 'utapau'] },
  { nome: 'Rota Kessel', planetas: ['kessel', 'nal-hutta', 'nar-shaddaa'] },
]

/* ----------------------------- Loja por tier ----------------------------- */

export type CategoriaItem = 'arma' | 'armadura' | 'equipamento' | 'minerio' | 'carta'

export interface Item {
  id: string
  nome: string
  categoria: CategoriaItem
  tier: Tier
  preco: number
  peso?: number
  /** Ilegal: só aparece em locais com mercado negro. */
  ilegal?: boolean
  /** Vendido só nos planetas que o listam em `exclusivos`, ou de onde o minério vem. */
  exclusivo?: boolean
  detalhe?: string
  /** Ícone em public/assets/equipamento (ASSETS.md). */
  icone?: string
  /** Para cartas: o que libera. */
  libera?: { planeta?: string; regiao?: RegiaoId }
}

const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/** Tier pelo preço: até 500 = 1, até 1.500 = 2, até 5.000 = 3, acima = 4. */
export function tierPorPreco(preco: number): Tier {
  return preco <= 500 ? 1 : preco <= 1500 ? 2 : preco <= 5000 ? 3 : 4
}

const EXCLUSIVOS = new Set(PLANETAS.flatMap(p => p.exclusivos ?? []))
const ILEGAIS = new Set(['armas pesadas'])
const TIER_FIXO: Record<string, Tier> = { 'detonador-termal': 4, 'lanca-misseis': 4, 'granada-de-fragmento': 3 }

function iconeDaArma(grupo: string, nome: string) {
  if (/granada|detonador/i.test(nome)) return 'granadas'
  return ({ 'armas simples': 'armas-simples', pistolas: 'pistolas', rifles: 'rifles', 'armas pesadas': 'armas-pesadas', 'sabres de luz': 'sabres-de-luz', 'armas de ataque físico avançadas': 'ataque-fisico-avancado' } as Record<string, string>)[grupo] ?? 'armas-simples'
}
const ICONE_EQUIP: [RegExp, string][] = [[/medpac|médico|cirúrgico|bacta/i, 'medpac'], [/datapad|cartões|holoprojetor|codificador/i, 'datapad'], [/ferramentas|segurança|campo/i, 'kit-ferramentas'], [/binóculo|mira/i, 'macrobinoculos'], [/crédito/i, 'creditos']]

const armas: Item[] = WEAPONS
  .filter(w => w.cost > 0 && w.g !== 'sabres de luz') // sabres só via kyber + pedido ao mestre
  .map(w => {
    const id = slug(w.n)
    return {
      id, nome: w.n, categoria: 'arma' as const, tier: TIER_FIXO[id] ?? tierPorPreco(w.cost), preco: w.cost,
      ilegal: ILEGAIS.has(w.g) || id === 'detonador-termal', exclusivo: EXCLUSIVOS.has(id),
      detalhe: `${w.dmg} · ${w.type}`, icone: iconeDaArma(w.g, w.n),
    }
  })

const armaduras: Item[] = ARMORS.map(a => {
  const id = slug(a.n)
  return {
    id, nome: a.n, categoria: 'armadura' as const, tier: tierPorPreco(a.cost), preco: a.cost, exclusivo: EXCLUSIVOS.has(id),
    detalhe: `${a.cat} · Ref +${a.ref} · Fort +${a.fort} · Des máx +${a.maxDex}`,
    icone: a.cat === 'leve' ? 'armadura-leve' : a.cat === 'média' ? 'armadura-media' : 'armadura-pesada',
  }
})

const equipamentos: Item[] = (GEAR as [string, number, number][]).map(([n, cost, w]) => ({
  id: slug(n), nome: n, categoria: 'equipamento' as const, tier: tierPorPreco(cost), preco: cost, peso: w,
  icone: ICONE_EQUIP.find(([re]) => re.test(n))?.[1],
}))

const minerios: Item[] = (Object.entries(MINERIOS) as [MinerioId, (typeof MINERIOS)[MinerioId]][])
  .filter(([, m]) => m.preco > 0)
  .map(([id, m]) => ({
    id: `minerio-${id}`, nome: m.nome, categoria: 'minerio' as const, tier: tierPorPreco(m.preco), preco: m.preco,
    exclusivo: true, ilegal: id === 'especiaria', detalhe: m.efeito,
  }))

/** Cartas de astrogação: o item que dá aos jogadores as coordenadas de planetas. */
const cartasRegionais: Item[] = (['mundos-do-nucleo', 'orla-interior', 'orla-media', 'orla-exterior', 'espaco-hutt'] as RegiaoId[])
  .map((r, i) => ({
    id: `carta-${r}`, nome: `Carta de astrogação: ${REGIOES[r].nome}`, categoria: 'carta' as const,
    tier: (Math.min(4, i + 1)) as Tier, preco: [500, 1000, 2500, 5000, 4000][i],
    detalhe: `Coordenadas de todos os planetas comuns de ${REGIOES[r].nome}.`, libera: { regiao: r },
  }))
const cartasPlaneta: Item[] = PLANETAS.filter(p => p.tipo === 'comum').map(p => ({
  id: `carta-${p.id}`, nome: `Coordenadas: ${p.nome}`, categoria: 'carta' as const, tier: p.tier,
  preco: [0, 100, 250, 600, 1200][p.tier], detalhe: `Rota hiperespacial para ${p.nome} (tier ${p.tier}).`, libera: { planeta: p.id },
}))

export const ITENS: Item[] = [...armas, ...armaduras, ...equipamentos, ...minerios, ...cartasRegionais, ...cartasPlaneta]
export const ITEM_BY: Record<string, Item> = Object.fromEntries(ITENS.map(i => [i.id, i]))

/** Itens à venda num planeta: tier até o do planeta, ilegais só com mercado negro, exclusivos só na origem. */
export function lojaDoPlaneta(p: Planeta, extraTags: Tag[] = []): Item[] {
  const tags = new Set([...p.tags, ...extraTags])
  const negro = tags.has('mercado-negro') || (p.funcoes ?? []).includes('mercado-negro')
  const daqui = new Set(p.exclusivos ?? [])
  const minDaqui = new Set((p.minerios ?? []).map(m => `minerio-${m}`))
  const vendeCartas = tags.has('mercado') || tags.has('mercado-negro') || (p.funcoes ?? []).some(f => f === 'holonet' || f === 'castelo-maz')
  // Coordenadas avulsas: da própria região em qualquer mercado; de toda a galáxia só na HoloNet, com Maz ou em Batuu.
  const todasCoordenadas = (p.funcoes ?? []).some(f => f === 'holonet' || f === 'castelo-maz')
  return ITENS.filter(i => {
    if (i.categoria === 'minerio') return minDaqui.has(i.id) && (!i.ilegal || negro)
    if (i.categoria === 'carta') {
      if (!vendeCartas) return false
      if (i.libera?.regiao) return i.tier <= p.tier
      const alvo = PLANETA_BY[i.libera!.planeta!]
      return alvo.id !== p.id && (todasCoordenadas || alvo.regiao === p.regiao)
    }
    if (i.exclusivo) return daqui.has(i.id)
    if (i.ilegal && !negro) return false
    return i.tier <= p.tier
  })
}

/** Planetas que uma carta libera. */
export function planetasDaCarta(item: Item): string[] {
  if (item.libera?.planeta) return [item.libera.planeta]
  if (item.libera?.regiao) return PLANETAS.filter(p => p.tipo === 'comum' && p.regiao === item.libera!.regiao).map(p => p.id)
  return []
}

/* ------------------------- Ações de ambiente ------------------------- */

export const ACOES = {
  comprar: 'Comprar itens',
  vender: 'Vender itens',
  'armadura-personalizada': 'Solicitar armadura personalizada',
  'arma-personalizada': 'Solicitar arma personalizada',
  minerar: 'Extrair minério',
  'rastrear-kyber': 'Rastrear cristal kyber',
  descansar: 'Descansar e se curar',
  contratar: 'Contratar ajuda',
  mural: 'Mural de recompensas',
  funcoes: 'Serviços especiais do planeta',
} as const
export type AcaoId = keyof typeof ACOES

/** Ações que um ambiente libera por padrão, a partir das tags. O mestre pode ligar e desligar cada uma. */
export function acoesPadrao(tags: Tag[], p?: Planeta): AcaoId[] {
  const t = new Set(tags)
  const a = new Set<AcaoId>(['descansar'])
  if (t.has('mercado') || t.has('mercado-negro') || t.has('urbano')) a.add('comprar').add('vender')
  if (t.has('cantina') || t.has('cacadores')) a.add('contratar').add('mural')
  if (t.has('urbano') || p?.funcoes?.includes('guilda-cacadores')) a.add('mural')
  if (t.has('mineracao') || (p?.minerios?.length ?? 0) > 0) a.add('minerar')
  if (t.has('forca') || t.has('jedi') || t.has('kyber')) a.add('rastrear-kyber')
  if ((p?.funcoes?.length ?? 0) > 0) a.add('funcoes')
  if (t.has('estaleiro') || t.has('militar') || p?.funcoes?.includes('forja-beskar')) a.add('armadura-personalizada').add('arma-personalizada')
  return [...a]
}

/** Materiais para pedidos de armadura e arma personalizada. */
export const MATERIAIS = [
  { id: 'durasteel', nome: 'Duraço', custo: 0, desc: 'Padrão da galáxia.' },
  { id: 'beskar', nome: 'Beskar', custo: 6000, desc: MINERIOS.beskar.efeito, minerio: 'beskar' as MinerioId },
  { id: 'cortosis', nome: 'Cortosis', custo: 7000, desc: MINERIOS.cortosis.efeito, minerio: 'cortosis' as MinerioId },
  { id: 'corusca', nome: 'Gema corusca', custo: 5000, desc: MINERIOS.corusca.efeito, minerio: 'corusca' as MinerioId },
  { id: 'kyber', nome: 'Cristal kyber', custo: 0, desc: MINERIOS.kyber.efeito, minerio: 'kyber' as MinerioId },
] as const
