/*
 * Miniaturas animadas dos inimigos (pixel art de arte-pixel/inimigos.px.js, tiras em
 * public/assets/sprites/inimigos/). Os heróis não animam: usam a ficha redonda ou a figura 3D.
 */
import { asset } from '../lib/assets'

export const SPRITES = {
  'stormtrooper': { w: 22, h: 27, quadros: 4, ms: 250 },
  'stormtrooper-pesado': { w: 24, h: 27, quadros: 4, ms: 250 },
  'clone': { w: 22, h: 27, quadros: 4, ms: 250 },
  'oficial': { w: 22, h: 27, quadros: 4, ms: 250 },
  'rebelde': { w: 22, h: 27, quadros: 4, ms: 250 },
  'bandido': { w: 23, h: 28, quadros: 4, ms: 250 },
  'b1': { w: 20, h: 28, quadros: 4, ms: 250 },
  'droideka': { w: 24, h: 26, quadros: 4, ms: 250 },
  'wampa': { w: 24, h: 28, quadros: 4, ms: 333 },
  'rancor': { w: 26, h: 27, quadros: 4, ms: 333 },
  'generico': { w: 22, h: 26, quadros: 4, ms: 250 },
} as const
export type SpriteId = keyof typeof SPRITES

/** Miniatura de cada inimigo do bestiário; os improvisados usam a figura encapuzada. */
const DO_BESTIARIO: Record<string, SpriteId> = {
  'Stormtrooper': 'stormtrooper', 'Stormtrooper Pesado': 'stormtrooper-pesado', 'Oficial Imperial': 'oficial',
  'Soldado Clone': 'clone', 'Soldado Rebelde': 'rebelde', 'Bandido': 'bandido', 'Dróide de Batalha B1': 'b1',
  'Droideka': 'droideka', 'Wampa': 'wampa', 'Rancor': 'rancor',
}
export const spriteDoInimigo = (base?: string): SpriteId => (base && DO_BESTIARIO[base]) || 'generico'

interface Carregado { img: HTMLImageElement; branco: HTMLCanvasElement | null; ok: boolean }
const cache = new Map<SpriteId, Carregado>()
let aoCarregar: (() => void) | null = null
/** Chamado quando uma tira termina de carregar (o mapa redesenha). */
export const quandoCarregar = (f: (() => void) | null) => { aoCarregar = f }

function carregar(id: SpriteId): Carregado {
  let c = cache.get(id)
  if (c) return c
  const img = new Image()
  c = { img, branco: null, ok: false }
  const ref = c
  img.onload = () => {
    ref.ok = true
    // silhueta branca, para a piscada de quem leva o golpe
    const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height
    const x = cv.getContext('2d')
    if (x) { x.drawImage(img, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#fffbe8'; x.fillRect(0, 0, cv.width, cv.height); ref.branco = cv }
    aoCarregar?.()
  }
  img.src = asset(`sprites/inimigos/${id}.png`)
  cache.set(id, c)
  return c
}

export interface PoseFicha {
  /** Deslocamento em pixels de tela (avanço do ataque, tremor do golpe). */
  dx: number
  dy: number
  /** 0 de pé, 1 caído (gira 90° e escurece). */
  queda: number
  /** Piscada branca do golpe. */
  branco: boolean
  alpha: number
}

/**
 * Desenha a miniatura de pé sobre o quadrado (x, y): 1 pixel da arte = cell/20 pixels de tela.
 * Devolve false enquanto a imagem não carregou (o mapa desenha a ficha redonda no lugar).
 */
export function desenharSprite(ctx: CanvasRenderingContext2D, id: SpriteId, cx: number, chao: number, cell: number, t: number, pose: PoseFicha) {
  const s = SPRITES[id]
  const c = carregar(id)
  if (!c.ok) return false
  const p = cell / 20
  const q = Math.floor(t / s.ms) % s.quadros
  const w = s.w * p, h = s.h * p
  ctx.save()
  ctx.imageSmoothingEnabled = false
  ctx.globalAlpha *= pose.alpha
  ctx.translate(Math.round(cx + pose.dx), Math.round(chao + pose.dy))
  if (pose.queda > 0) {
    // tomba para o lado, girando no pé
    ctx.rotate((Math.PI / 2) * pose.queda)
    ctx.filter = `brightness(${1 - 0.45 * pose.queda})`
  }
  const src = pose.branco && c.branco ? c.branco : c.img
  ctx.drawImage(src, q * s.w, 0, s.w, s.h, -w / 2, -h, w, h)
  ctx.restore()
  return true
}
