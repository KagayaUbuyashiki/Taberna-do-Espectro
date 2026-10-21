/*
 * Formato dos mapas em pixel art (pasta public/assets/mapas-px/<id>/).
 *
 * Cada mapa é um mapa.json e as imagens das camadas. Toda camada tem o tamanho do mapa inteiro
 * (colunas × px por linhas × px); uma camada animada é uma tira com os quadros lado a lado.
 * O índice public/assets/mapas-px/indice.json lista os ids dos mapas prontos: [ "cantina", ... ].
 * Passo a passo para criar um mapa em docs/MAPAS-PIXEL.md.
 */
export interface CamadaPx {
  id: string
  img: string
  /** Quadros lado a lado na imagem (padrão 1). */
  quadros?: number
  /** Milissegundos por quadro (padrão 150). */
  ms?: number
  /** Desenhada por cima das fichas (telhados, copas de árvore, fumaça). */
  acima?: boolean
  /** Modo de mistura do canvas: luz usa "screen" ou "lighter"; sombra usa "multiply". */
  mistura?: GlobalCompositeOperation
  /** Opacidade fixa (0 a 1). */
  opacidade?: number
  /** Luz que pulsa: a opacidade vai de `min` a `max` e volta em `ms`. */
  pulso?: { ms: number; min: number; max: number }
}

export interface MapaPx {
  versao: 1
  id: string
  nome: string
  /** Pixels da arte por quadrado da grade (20 é o padrão: 1 pixel da arte = 2 pixels da tela, como as miniaturas). */
  px: number
  colunas: number
  linhas: number
  camadas: CamadaPx[]
  /** Paredes nos cantos da grade, no mesmo formato do mapa tático: "x1,y1,x2,y2". */
  paredes?: string[]
  /** Quadrados que dão cobertura ao alvo: "x,y" (base 0). */
  cobertura?: { cobertura?: string[]; melhorada?: string[] }
  /** Quadrados de terreno difícil (custam 2 de movimento): "x,y". */
  terrenoDificil?: string[]
  /** Onde as fichas começam: "x,y". */
  inicio?: { herois?: string[]; inimigos?: string[] }
  /** Créditos da arte, se ela veio de outro lugar. */
  creditos?: string
}

const celula = /^\d+,\d+$/
const parede = /^\d+,\d+,\d+,\d+$/

/** Confere um mapa.json; devolve a lista de problemas (vazia se está tudo certo). */
export function validarMapa(m: unknown, id = '?'): string[] {
  const erros: string[] = []
  const e = (s: string) => erros.push(`${id}: ${s}`)
  if (!m || typeof m !== 'object') return [`${id}: o arquivo não é um objeto JSON`]
  const x = m as Partial<MapaPx>
  if (x.versao !== 1) e('versao deve ser 1')
  if (!x.nome) e('falta o nome')
  for (const k of ['px', 'colunas', 'linhas'] as const) if (!Number.isInteger(x[k]) || (x[k] as number) < 1) e(`${k} deve ser um inteiro positivo`)
  if ((x.colunas ?? 0) > 60 || (x.linhas ?? 0) > 40) e('o mapa tático aceita até 60 colunas e 40 linhas')
  if (!Array.isArray(x.camadas) || !x.camadas.length) e('precisa de pelo menos uma camada')
  else {
    const ids = new Set<string>()
    x.camadas.forEach((c, i) => {
      if (!c.id) e(`camada ${i}: falta o id`)
      if (ids.has(c.id)) e(`camada ${c.id}: id repetido`)
      ids.add(c.id)
      if (!c.img || !/\.(png|webp)$/i.test(c.img)) e(`camada ${c.id}: img deve ser .png ou .webp`)
      if (c.quadros != null && (!Number.isInteger(c.quadros) || c.quadros < 1)) e(`camada ${c.id}: quadros deve ser inteiro ≥ 1`)
      if (c.pulso && !(c.pulso.ms > 0 && c.pulso.min >= 0 && c.pulso.max <= 1 && c.pulso.min <= c.pulso.max)) e(`camada ${c.id}: pulso inválido`)
    })
  }
  const dentro = (s: string) => { const [a, b] = s.split(',').map(Number); return a < (x.colunas ?? 0) && b < (x.linhas ?? 0) }
  const celulas = (lista: unknown, nome: string) => {
    if (lista == null) return
    if (!Array.isArray(lista)) { e(`${nome} deve ser uma lista`); return }
    lista.forEach(s => { if (typeof s !== 'string' || !celula.test(s)) e(`${nome}: "${s}" não é "x,y"`); else if (!dentro(s)) e(`${nome}: "${s}" está fora do mapa`) })
  }
  celulas(x.cobertura?.cobertura, 'cobertura.cobertura')
  celulas(x.cobertura?.melhorada, 'cobertura.melhorada')
  celulas(x.terrenoDificil, 'terrenoDificil')
  celulas(x.inicio?.herois, 'inicio.herois')
  celulas(x.inicio?.inimigos, 'inicio.inimigos')
  ;(x.paredes ?? []).forEach(s => {
    if (!parede.test(s)) { e(`parede "${s}" não é "x1,y1,x2,y2"`); return }
    const [a, b, c, d] = s.split(',').map(Number)
    if (Math.max(a, c) > (x.colunas ?? 0) || Math.max(b, d) > (x.linhas ?? 0)) e(`parede "${s}" sai do mapa`)
  })
  return erros
}

/** Quadro da camada animada no instante `t` (ms). */
export const quadroEm = (c: CamadaPx, t: number) => ((c.quadros ?? 1) > 1 ? Math.floor(t / (c.ms ?? 150)) % (c.quadros ?? 1) : 0)

/** Opacidade da camada no instante `t` (ms). */
export function opacidadeEm(c: CamadaPx, t: number) {
  const base = c.opacidade ?? 1
  if (!c.pulso) return base
  const f = (1 - Math.cos((2 * Math.PI * (t % c.pulso.ms)) / c.pulso.ms)) / 2
  return base * (c.pulso.min + (c.pulso.max - c.pulso.min) * f)
}

/** A camada (ou o mapa) muda com o tempo e pede redesenho contínuo. */
export const animada = (c: CamadaPx) => (c.quadros ?? 1) > 1 || !!c.pulso
export const PREFIXO = 'px:'
export const ehMapaPx = (cena: string) => cena.startsWith(PREFIXO)
