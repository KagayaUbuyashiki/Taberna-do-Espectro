import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { PLANETA_BY, acoesPadrao, type AcaoId, type Tag } from '../data/galaxy'
import { minhaCampanha, sync, type Campanha } from '../sync'

/** Local criado pelo mestre dentro de um planeta (cantina, mapa, base...). */
export interface Local {
  id: string
  planeta: string
  nome: string
  tags: Tag[]
  acoes: AcaoId[]
  nota: string
  /** Escondido até o mestre revelar: os jogadores precisam explorar. */
  visivel?: boolean
}

export type TipoPedido = 'compra' | 'armadura-personalizada' | 'arma-personalizada' | 'minerar' | 'rastrear-kyber' | 'funcao' | 'contratar' | 'descansar' | 'venda' | 'contrato'
export type StatusPedido = 'pendente' | 'aprovado' | 'recusado' | 'entregue'

export interface Pedido {
  id: string
  tipo: TipoPedido
  charId: string | null
  charNome: string
  planeta: string
  local: string | null
  titulo: string
  detalhes: string
  custo: number
  /** Para compras: item comprado. Para contratos: id da recompensa. */
  itemId?: string
  status: StatusPedido
  resposta: string
  t: number
}

/** Cartaz do mural de recompensas, criado pelo mestre. */
export interface Recompensa {
  id: string
  alvo: string
  crime: string
  imagem: string
  recompensa: number
  condicao: 'Vivo' | 'Morto' | 'Vivo ou morto'
  /** Planeta onde o cartaz aparece, ou "galaxia" para todos. */
  planeta: string
  nivel: number
  notas: string
  status: 'aberto' | 'capturado' | 'encerrado'
  visivel: boolean
}

/** Armadura ou arma criada pelo mestre (a partir de um pedido ou do zero). */
export interface ItemPersonalizado {
  id: string
  tipo: 'armadura' | 'arma'
  nome: string
  /** Item do livro usado como base para as regras (Tabela 8-3/8-4/8-7). */
  base: string
  material: string
  custo: number
  especial: string
  // armadura
  cat?: 'leve' | 'média' | 'pesada'
  ref?: number
  fort?: number
  maxDex?: number
  // arma
  dano?: string
  atkMisc?: number
  dmgMisc?: number
  dono?: string | null
  pedidoId?: string
  t: number
}

interface Mesa { naveEm: string; nomeNave: string; rastreados: string[]; kyber: string[]; viagens: { de: string; para: string; t: number }[] }
interface Mestre { locais: Record<string, Local>; bloqueadas: Record<string, AcaoId[]>; mural: Record<string, Recompensa>; arsenal: Record<string, ItemPersonalizado> }

interface GalaxyState extends Mesa, Mestre {
  pedidos: Pedido[]
  /** Local atual dentro do planeta (null = o planeta em geral). Cada jogador explora o seu. */
  localAtual: string | null
  mestre: boolean
  /** Mesa online (Supabase). null = só neste navegador. */
  campanha: Campanha | null

  viajar: (para: string) => boolean
  rastrear: (ids: string[]) => void
  esquecer: (id: string) => void
  rastrearKyber: (id: string) => void
  setMestre: (v: boolean) => void
  setNomeNave: (n: string) => void
  setLocalAtual: (id: string | null) => void
  salvarLocal: (l: Local) => void
  apagarLocal: (id: string) => void
  alternarAcao: (ambiente: string, acao: AcaoId) => void
  pedir: (p: Omit<Pedido, 'id' | 'status' | 'resposta' | 't'>) => Pedido
  responder: (id: string, status: StatusPedido, resposta: string) => void
  apagarPedido: (id: string) => void
  salvarRecompensa: (r: Recompensa) => void
  apagarRecompensa: (id: string) => void
  salvarItem: (i: ItemPersonalizado) => void
  apagarItem: (id: string) => void
}

const uid = () => Math.random().toString(36).slice(2, 10)

export const useGalaxy = create<GalaxyState>()(
  persist(
    (set, get) => ({
      naveEm: 'corellia',
      nomeNave: 'Espectro',
      rastreados: ['corellia', 'coruscant', 'tatooine', 'takodana'],
      kyber: [],
      viagens: [],
      locais: {},
      bloqueadas: {},
      mural: {},
      arsenal: {},
      pedidos: [],
      localAtual: null,
      mestre: false,
      campanha: null,

      viajar: para => {
        const s = get()
        if (!PLANETA_BY[para] || para === s.naveEm) return false
        if (!s.mestre && !s.rastreados.includes(para) && !s.kyber.includes(para)) return false
        set({ naveEm: para, localAtual: null, viagens: [{ de: s.naveEm, para, t: Date.now() }, ...s.viagens].slice(0, 50) })
        return true
      },
      rastrear: ids => set(s => ({ rastreados: [...new Set([...s.rastreados, ...ids])] })),
      esquecer: id => set(s => ({ rastreados: s.rastreados.filter(x => x !== id), kyber: s.kyber.filter(x => x !== id) })),
      rastrearKyber: id => set(s => ({ kyber: [...new Set([...s.kyber, id])] })),
      setMestre: v => set(s => ({ mestre: s.campanha && s.campanha.papel !== 'gm' ? false : v })),
      setNomeNave: n => set({ nomeNave: n }),
      setLocalAtual: id => set({ localAtual: id }),
      salvarLocal: l => set(s => ({ locais: { ...s.locais, [l.id]: l } })),
      apagarLocal: id => set(s => {
        const locais = { ...s.locais }
        delete locais[id]
        return { locais, localAtual: s.localAtual === id ? null : s.localAtual }
      }),
      alternarAcao: (amb, acao) => set(s => {
        const atual = s.bloqueadas[amb] ?? []
        const prox = atual.includes(acao) ? atual.filter(a => a !== acao) : [...atual, acao]
        return { bloqueadas: { ...s.bloqueadas, [amb]: prox } }
      }),
      pedir: p => {
        const pedido: Pedido = { ...p, id: uid(), status: 'pendente', resposta: '', t: Date.now() }
        set(s => ({ pedidos: [pedido, ...s.pedidos].slice(0, 300) }))
        return pedido
      },
      responder: (id, status, resposta) => set(s => ({ pedidos: s.pedidos.map(p => p.id === id ? { ...p, status, resposta } : p) })),
      apagarPedido: id => set(s => ({ pedidos: s.pedidos.filter(p => p.id !== id) })),
      salvarRecompensa: r => set(s => ({ mural: { ...s.mural, [r.id]: r } })),
      apagarRecompensa: id => set(s => { const mural = { ...s.mural }; delete mural[id]; return { mural } }),
      salvarItem: i => set(s => ({ arsenal: { ...s.arsenal, [i.id]: i } })),
      apagarItem: id => set(s => { const arsenal = { ...s.arsenal }; delete arsenal[id]; return { arsenal } }),
    }),
    { name: 'taberna.galaxia.v1', version: 2, partialize: s => ({ ...s, campanha: null }) },
  ),
)

/** Ações liberadas num ambiente: padrão pelas tags, menos as que o mestre desligou. */
export function acoesDoAmbiente(planetaId: string, local: Local | null, bloqueadas: Record<string, AcaoId[]>): AcaoId[] {
  const p = PLANETA_BY[planetaId]
  const base = local ? local.acoes : acoesPadrao(p.tags, p)
  const off = bloqueadas[local ? local.id : planetaId] ?? []
  return base.filter(a => !off.includes(a))
}

export const novoId = uid

/* --------------------------- Sincronização ao vivo --------------------------- */

const MESA = ['naveEm', 'nomeNave', 'rastreados', 'kyber', 'viagens'] as const
const MESTRE = ['locais', 'bloqueadas', 'mural', 'arsenal'] as const
const pick = <K extends keyof GalaxyState>(s: GalaxyState, ks: readonly K[]) => Object.fromEntries(ks.map(k => [k, s[k]])) as Pick<GalaxyState, K>
const mudou = (a: GalaxyState, b: GalaxyState, ks: readonly (keyof GalaxyState)[]) => ks.some(k => a[k] !== b[k])

let iniciado = false

/**
 * Liga o estado da galáxia à mesa: o que o mestre muda aparece na hora para os jogadores
 * (e vice-versa). Sem Supabase, sincroniza as abas abertas no mesmo navegador.
 */
export function iniciarSync() {
  if (iniciado) return
  iniciado = true
  let remoto = false
  const aplicar = (patch: Partial<GalaxyState> | ((s: GalaxyState) => Partial<GalaxyState>)) => {
    remoto = true
    useGalaxy.setState(patch)
    remoto = false
  }
  // Quem chega primeiro numa mesa vazia semeia o estado.
  const semear = (key: string, ks: readonly (keyof GalaxyState)[]) => (achou: boolean) => {
    const s = useGalaxy.getState()
    if (!achou && (key !== 'mestre' || s.mestre || s.campanha?.papel === 'gm')) sync.publish(key, pick(s, ks))
  }
  sync.subscribe('mesa', (_, v) => v && aplicar(v as Mesa), semear('mesa', MESA))
  sync.subscribe('mestre', (_, v) => v && aplicar(v as Mestre), semear('mestre', MESTRE))
  sync.subscribe('pedidos/', (k, v) => aplicar(s => {
    const id = k.slice('pedidos/'.length)
    const resto = s.pedidos.filter(p => p.id !== id)
    return { pedidos: v ? [v as Pedido, ...resto].sort((a, b) => b.t - a.t) : resto }
  }))

  useGalaxy.subscribe((s, antes) => {
    if (remoto) return
    if (mudou(s, antes, MESA)) sync.publish('mesa', pick(s, MESA))
    if (mudou(s, antes, MESTRE)) sync.publish('mestre', pick(s, MESTRE))
    if (s.pedidos !== antes.pedidos) {
      const velhos = new Map(antes.pedidos.map(p => [p.id, p]))
      for (const p of s.pedidos) if (velhos.get(p.id) !== p) sync.publish(`pedidos/${p.id}`, p)
      const ids = new Set(s.pedidos.map(p => p.id))
      for (const id of velhos.keys()) if (!ids.has(id)) sync.publish(`pedidos/${id}`, null)
    }
  })

  minhaCampanha().then(c => {
    if (c) useGalaxy.setState(s => ({ campanha: c, mestre: c.papel === 'gm' ? s.mestre : false }))
  }).catch(e => console.error('[mesa]', e))
}
