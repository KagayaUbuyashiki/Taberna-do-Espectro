import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { PLANETA_BY, acoesPadrao, type AcaoId, type Tag } from '../data/galaxy'

/** Local criado pelo mestre dentro de um planeta (cantina, mapa, base...). */
export interface Local {
  id: string
  planeta: string
  nome: string
  tags: Tag[]
  acoes: AcaoId[]
  nota: string
}

export type TipoPedido = 'compra' | 'armadura-personalizada' | 'arma-personalizada' | 'minerar' | 'rastrear-kyber' | 'funcao' | 'contratar' | 'descansar' | 'venda'
export type StatusPedido = 'pendente' | 'aprovado' | 'recusado'

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
  /** Para compras: item comprado. */
  itemId?: string
  status: StatusPedido
  resposta: string
  t: number
}

interface GalaxyState {
  /** Onde a nave está. */
  naveEm: string
  nomeNave: string
  /** Planetas com coordenadas conhecidas (cartas de astrogação ou liberados pelo mestre). */
  rastreados: string[]
  /** Planetas de kyber já rastreados. */
  kyber: string[]
  locais: Record<string, Local>
  /** Local atual dentro do planeta (null = o planeta em geral). */
  localAtual: string | null
  /** Ações desligadas pelo mestre, por ambiente (id do planeta ou do local). */
  bloqueadas: Record<string, AcaoId[]>
  pedidos: Pedido[]
  mestre: boolean
  viagens: { de: string; para: string; t: number }[]

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
}

const uid = () => Math.random().toString(36).slice(2, 10)

export const useGalaxy = create<GalaxyState>()(
  persist(
    (set, get) => ({
      naveEm: 'corellia',
      nomeNave: 'Espectro',
      rastreados: ['corellia', 'coruscant', 'tatooine', 'takodana'],
      kyber: [],
      locais: {},
      localAtual: null,
      bloqueadas: {},
      pedidos: [],
      mestre: false,
      viagens: [],

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
      setMestre: v => set({ mestre: v }),
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
        set(s => ({ pedidos: [pedido, ...s.pedidos].slice(0, 200) }))
        return pedido
      },
      responder: (id, status, resposta) => set(s => ({ pedidos: s.pedidos.map(p => p.id === id ? { ...p, status, resposta } : p) })),
      apagarPedido: id => set(s => ({ pedidos: s.pedidos.filter(p => p.id !== id) })),
    }),
    { name: 'taberna.galaxia.v1' },
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
