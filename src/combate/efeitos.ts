/*
 * Efeitos de combate no mapa: alcance, disparo, golpe, dano e queda.
 * Quem ataca chama `disparar`; o efeito toca o som aqui e é desenhado por todo mapa aberto
 * (página Mapas, o mapa da ficha e o da Mesa). Vai também pela sincronização, para a tela
 * do mestre e dos outros jogadores verem o mesmo tiro.
 */
import { create } from 'zustand'
import { SFX } from '../lib/sfx'
import { sync } from '../sync'
import type { Arma, Leitura, Ponto } from './armas'

interface Base { id: string; t: number }
export type Efeito = Base & (
  | { k: 'alcance'; de: Ponto; arma: Arma; dur: number }
  | {
      k: 'ataque'; de: Ponto; para: Ponto | null; arma: Arma; leitura: Leitura | null
      acerto: boolean | null; critico: boolean; area: Ponto[]; quem: string; alvo: string
    }
  | { k: 'dano'; em: Ponto; valor: number; critico: boolean }
  | { k: 'queda'; em: Ponto | null; quem: string; morte: boolean; grito: boolean; corpo: Corpo }
)
export type EfeitoNovo = Efeito extends infer E ? E extends Efeito ? Omit<E, 'id' | 't'> : never : never
export type Corpo = 'org' | 'droide' | 'fera'

/** Quantos quadrados por segundo cada projétil anda. */
const VELOCIDADE: Partial<Record<Arma['tipo'], number>> = {
  blaster: 34, rajada: 34, pesada: 28, ion: 30, bowcaster: 30, lesma: 48, flecha: 26, pedra: 24,
  arremesso: 12, granada: 11, termal: 10, missil: 16,
}
/** Momento (ms desde o início) em que o ataque sai e em que chega no alvo. */
export function tempos(e: Extract<Efeito, { k: 'ataque' }>) {
  const saida = 280
  if (e.arma.corpo && !e.leitura?.arremessando) return { saida, chegada: saida + 160, fim: saida + 1100 }
  if (e.arma.tipo === 'chamas') return { saida, chegada: saida + 300, fim: saida + 1500 }
  const dist = Math.max(1, e.leitura?.dist ?? 6)
  const v = VELOCIDADE[e.arma.tipo] ?? 30
  const voo = Math.max(140, (dist / v) * 1000)
  const area = !!e.arma.area
  return { saida, chegada: saida + voo, fim: saida + voo + (area ? 1300 : 800) }
}
/** Duração total de um efeito, em ms. */
export function duracao(e: Efeito) {
  if (e.k === 'alcance') return e.dur
  if (e.k === 'ataque') return tempos(e).fim + 400
  if (e.k === 'dano') return 1600
  return 2200
}

/** Probabilidade do grito raro numa morte (1 em 10). */
export const CHANCE_GRITO = 0.1

let seq = 0
const novoId = () => `${Date.now().toString(36)}-${(++seq).toString(36)}-${Math.random().toString(36).slice(2, 6)}`

interface Estado {
  lista: Efeito[]
  add: (e: Efeito) => void
  limpar: (agora: number) => void
}
export const useEfeitos = create<Estado>(set => ({
  lista: [],
  add: e => set(s => (s.lista.some(x => x.id === e.id) ? s : { lista: [...s.lista.filter(x => x.t + duracao(x) > Date.now()), e].slice(-24) })),
  limpar: agora => set(s => {
    const lista = s.lista.filter(x => x.t + duracao(x) > agora)
    return lista.length === s.lista.length ? s : { lista }
  }),
}))

/** Som de cada efeito, no tempo da animação. */
export function somDe(e: Efeito) {
  if (e.k === 'dano') return
  if (e.k === 'queda') {
    const a = 0.15
    if (e.corpo === 'droide') SFX.droideMorte(a)
    else if (e.corpo === 'fera') SFX.rugido(a)
    else if (e.morte && e.grito) SFX.grito(a)
    else SFX.morte(a)
    return
  }
  if (e.k !== 'ataque') return
  const { saida, chegada } = tempos(e)
  const s = saida / 1000, c = chegada / 1000
  const t = e.arma.tipo
  const acertou = e.acerto !== false
  if (t === 'sabre') { SFX.sabreGolpe(s); if (!acertou) SFX.sabreChoque(c) }
  else if (t === 'vibro') SFX.vibro(s)
  else if (t === 'fisico') SFX.soco(s)
  else if (t === 'garra') SFX.garra(s)
  else if (t === 'granada' || t === 'arremesso' || e.leitura?.arremessando) { SFX.arremesso(s); if (t === 'granada') SFX.explosao(c) }
  else if (t === 'termal') { SFX.arremesso(s); SFX.termal(c) }
  else if (t === 'missil') { SFX.missil(s); SFX.explosao(c) }
  else if (t === 'chamas') SFX.chamas(s)
  else if (t === 'ion') SFX.ion(s)
  else if (t === 'lesma') SFX.lesma(s)
  else if (t === 'flecha' || t === 'pedra') SFX.flecha(s)
  else if (t === 'bowcaster') SFX.bowcaster(s)
  else if (t === 'pesada') SFX.blasterPesado(s)
  else if (t === 'rajada') { SFX.blaster(s); SFX.blaster(s + 0.11); SFX.blaster(s + 0.22) }
  else if (t === 'forca') SFX.force(s)
  else SFX.blaster(s)
  if (acertou && e.para && !e.arma.area && !e.arma.corpo) SFX.impacto(c)
}

const CHAVE = 'efeitos/ultimo'

/** Mostra o efeito em todo mapa aberto, toca o som e manda para os outros aparelhos. */
export function disparar(novo: EfeitoNovo): Efeito {
  const e = { ...novo, id: novoId(), t: Date.now() } as Efeito
  useEfeitos.getState().add(e)
  somDe(e)
  void sync.publish(CHAVE, e).catch(() => { /* sem conexão: o efeito fica só nesta tela */ })
  return e
}

/** Ouve os efeitos de outros aparelhos (chame uma vez, no início do app). */
export function ouvirEfeitos() {
  const inicio = Date.now()
  return sync.subscribe(CHAVE, (_, v) => {
    const e = v as Efeito | null
    if (!e || typeof e !== 'object' || !('k' in e)) return
    // efeito antigo guardado na sincronização não toca de novo ao abrir o site
    if (e.t < inicio - 1500 || useEfeitos.getState().lista.some(x => x.id === e.id)) return
    useEfeitos.getState().add({ ...e, t: Math.min(Date.now(), Math.max(e.t, Date.now() - 300)) })
    if (typeof document === 'undefined' || document.visibilityState === 'visible') somDe(e)
  })
}
