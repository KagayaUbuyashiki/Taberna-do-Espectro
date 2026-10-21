/* A figura 3D de um herói (a "forja"): tudo que monta o boneco, salvo na ficha. */
export const ESPECIES_3D = [
  'humano', 'twilek', 'togruta', 'zabrak', 'wookiee', 'rodiano', 'moncal', 'bothan', 'cereano', 'duros', 'ewok',
  'gamorreano', 'gungan', 'ithoriano', 'keldor', 'quarren', 'sullustano', 'trandoshano', 'droide',
] as const
export type Especie3D = (typeof ESPECIES_3D)[number]
export const NOME_ESPECIE: Record<Especie3D, string> = {
  humano: 'Humano', twilek: "Twi'lek", togruta: 'Togruta', zabrak: 'Zabrak', wookiee: 'Wookiee', rodiano: 'Rodiano', moncal: 'Mon Calamari',
  bothan: 'Bothan', cereano: 'Cereano', duros: 'Duros', ewok: 'Ewok', gamorreano: 'Gamorreano', gungan: 'Gungan', ithoriano: 'Ithoriano',
  keldor: 'Kel Dor', quarren: 'Quarren', sullustano: 'Sullustano', trandoshano: 'Trandoshano', droide: 'Dróide',
}

export const CABELOS = ['careca', 'curto', 'longo', 'coque', 'moicano', 'tranca'] as const
export const TRONCOS = ['tunica', 'jaqueta', 'colete', 'armadura', 'macacao'] as const
export const CAPAS = ['nenhuma', 'manto', 'capuz', 'capa'] as const
export const MAOS = ['vazia', 'sabre', 'sabre-duplo', 'blaster', 'rifle', 'vibrolamina', 'cajado'] as const
export const POSES = ['parado', 'guarda', 'mirando', 'heroico', 'meditando', 'avanco'] as const
export const BASES = ['redonda', 'hexagonal', 'quadrada'] as const
/** Altura do herói impresso (humano padrão), em milímetros. */
export const ESCALAS = [28, 32, 95, 150] as const

export const NOME: Record<string, string> = {
  careca: 'Careca', curto: 'Curto', longo: 'Longo', coque: 'Coque', moicano: 'Moicano', tranca: 'Trança',
  tunica: 'Túnica', jaqueta: 'Jaqueta', colete: 'Colete', armadura: 'Armadura', macacao: 'Macacão de piloto',
  nenhuma: 'Nenhuma', manto: 'Manto', capuz: 'Manto com capuz', capa: 'Capa curta',
  vazia: 'Vazia', sabre: 'Sabre de luz', 'sabre-duplo': 'Sabre duplo', blaster: 'Pistola blaster', rifle: 'Rifle blaster', vibrolamina: 'Vibrolâmina', cajado: 'Cajado',
  parado: 'Parado', guarda: 'Em guarda', mirando: 'Mirando', heroico: 'Heroico', meditando: 'Meditando', avanco: 'Avançando',
  redonda: 'Redonda', hexagonal: 'Hexagonal', quadrada: 'Quadrada',
  28: '28 mm (miniatura de mesa)', 32: '32 mm (escala heroica)', 95: '95 mm (action figure 3¾")', 150: '150 mm (action figure 6")',
}

export interface Corpo { altura: number; massa: number; ombros: number; cabeca: number; pernas: number }

export interface Figura {
  versao: 1
  especie: Especie3D
  /** Proporções: 1 é o padrão humano. */
  corpo: Corpo
  cores: { pele: string; cabelo: string; olhos: string; roupa: string; roupa2: string; couro: string; metal: string; lamina: string; base: string }
  cabelo: (typeof CABELOS)[number]
  tronco: (typeof TRONCOS)[number]
  capa: (typeof CAPAS)[number]
  maoDireita: (typeof MAOS)[number]
  maoEsquerda: (typeof MAOS)[number]
  pose: (typeof POSES)[number]
  base: { forma: (typeof BASES)[number]; texto: string }
  /** Altura do humano padrão impresso, em mm (as outras espécies seguem a proporção). */
  escalaMm: (typeof ESCALAS)[number]
  /** Modelo enviado pelo jogador (.glb, .gltf, .stl, .obj), no lugar do boneco montado. Guardado neste navegador. */
  importado: { id: string; nome: string; altura: number; giro: number } | null
  /** Foto da figura para a ficha no mapa (PNG em data URL). */
  retrato: string | null
}

/** Proporções e cores típicas de cada espécie, aplicadas quando a espécie é escolhida. */
export const PADRAO_ESPECIE: Record<Especie3D, { corpo?: Partial<Corpo>; pele: string; cabelo?: string; olhos?: string; semCabelo?: boolean }> = {
  humano: { pele: '#c68a5a' },
  twilek: { pele: '#4f9a8a', semCabelo: true },
  togruta: { pele: '#c4502e', olhos: '#2a3a2a', semCabelo: true },
  zabrak: { pele: '#c9a27a', olhos: '#c99a2a', semCabelo: true },
  wookiee: { corpo: { altura: 1.22, massa: 1.25, ombros: 1.15 }, pele: '#6a4a2a', cabelo: '#6a4a2a', olhos: '#2a1d12' },
  rodiano: { corpo: { cabeca: 1.05 }, pele: '#4f8a3a', olhos: '#141418', semCabelo: true },
  moncal: { corpo: { cabeca: 1.15 }, pele: '#c45a3a', olhos: '#ffd24a', semCabelo: true },
  bothan: { corpo: { altura: 0.88 }, pele: '#b8946a', cabelo: '#b8946a' },
  cereano: { corpo: { cabeca: 1.05 }, pele: '#d8b48a', cabelo: '#efe6d2' },
  duros: { pele: '#4a7a9a', olhos: '#c4141c', semCabelo: true },
  ewok: { corpo: { altura: 0.56, massa: 1.35, cabeca: 1.5, pernas: 0.8 }, pele: '#6a4a2a', cabelo: '#6a4a2a', olhos: '#141418' },
  gamorreano: { corpo: { altura: 1.02, massa: 1.6, ombros: 1.2, cabeca: 1.1 }, pele: '#5f7a3a', olhos: '#141418', semCabelo: true },
  gungan: { corpo: { altura: 1.08, massa: 0.85, pernas: 1.12 }, pele: '#d89a5a', olhos: '#ffd24a', semCabelo: true },
  ithoriano: { corpo: { altura: 1.1 }, pele: '#8a6a4a', olhos: '#141418', semCabelo: true },
  keldor: { pele: '#d86a3a', olhos: '#141418', semCabelo: true },
  quarren: { pele: '#c9a27a', olhos: '#4f8a3a', semCabelo: true },
  sullustano: { corpo: { altura: 0.82, cabeca: 1.1 }, pele: '#b8a89a', olhos: '#141418', semCabelo: true },
  trandoshano: { corpo: { altura: 1.08, massa: 1.2 }, pele: '#5f7a3a', olhos: '#c99a2a', semCabelo: true },
  droide: { corpo: { massa: 0.8 }, pele: '#d8b44a', olhos: '#141418', semCabelo: true },
}

/** Espécie 3D a partir da espécie da ficha (as que não existem no criador viram humano). */
export const especieDaFicha = (id?: string): Especie3D => (ESPECIES_3D as readonly string[]).includes(id ?? '') ? id as Especie3D : 'humano'

export function figuraPadrao(especie: Especie3D = 'humano'): Figura {
  const f: Figura = {
    versao: 1, especie: 'humano',
    corpo: { altura: 1, massa: 1, ombros: 1, cabeca: 1, pernas: 1 },
    cores: { pele: '#c68a5a', cabelo: '#2a1d12', olhos: '#3a5a7a', roupa: '#efe6d2', roupa2: '#8b6a3e', couro: '#4a2e18', metal: '#9a9aa6', lamina: '#4fc3ff', base: '#2a2a30' },
    cabelo: 'curto', tronco: 'tunica', capa: 'manto', maoDireita: 'sabre', maoEsquerda: 'vazia', pose: 'guarda',
    base: { forma: 'redonda', texto: '' }, escalaMm: 32, importado: null, retrato: null,
  }
  return comEspecie(f, especie)
}

/** Troca a espécie levando as proporções e as cores típicas dela. */
export function comEspecie(f: Figura, especie: Especie3D): Figura {
  const p = PADRAO_ESPECIE[especie]
  return {
    ...f, especie,
    corpo: { altura: 1, massa: 1, ombros: 1, cabeca: 1, pernas: 1, ...p.corpo },
    cores: { ...f.cores, pele: p.pele, cabelo: p.cabelo ?? f.cores.cabelo, olhos: p.olhos ?? f.cores.olhos },
    cabelo: p.semCabelo ? 'careca' : f.cabelo === 'careca' ? 'curto' : f.cabelo,
  }
}

/** Confere (e conserta) uma figura lida da ficha: campos que faltam voltam ao padrão. */
export function normalizarFigura(x: unknown): Figura | null {
  if (!x || typeof x !== 'object') return null
  const f = x as Partial<Figura>
  const p = figuraPadrao()
  const um = <T extends string>(v: unknown, lista: readonly T[], d: T) => (lista as readonly unknown[]).includes(v) ? v as T : d
  return {
    ...p, ...f, versao: 1,
    especie: um(f.especie, ESPECIES_3D, p.especie),
    corpo: { ...p.corpo, ...(f.corpo ?? {}) },
    cores: { ...p.cores, ...(f.cores ?? {}) },
    cabelo: um(f.cabelo, CABELOS, p.cabelo), tronco: um(f.tronco, TRONCOS, p.tronco), capa: um(f.capa, CAPAS, p.capa),
    maoDireita: um(f.maoDireita, MAOS, p.maoDireita), maoEsquerda: um(f.maoEsquerda, MAOS, p.maoEsquerda), pose: um(f.pose, POSES, p.pose),
    base: { forma: um(f.base?.forma, BASES, p.base.forma), texto: typeof f.base?.texto === 'string' ? f.base.texto : '' },
    escalaMm: (ESCALAS as readonly number[]).includes(f.escalaMm as number) ? f.escalaMm as Figura['escalaMm'] : p.escalaMm,
    importado: f.importado ?? null, retrato: typeof f.retrato === 'string' ? f.retrato : null,
  }
}
