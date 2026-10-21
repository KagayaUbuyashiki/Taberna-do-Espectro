/* Desenha as camadas de um mapa em pixel art no canvas do mapa tático, sem suavizar os pixels. */
import { animada, opacidadeEm, quadroEm } from './formato'
import type { MapaCarregado } from './registro'

/** Desenha as camadas de baixo (`acima` falso) ou as de cima (`acima` verdadeiro). */
export function desenharCamadas(ctx: CanvasRenderingContext2D, m: MapaCarregado, W: number, H: number, t: number, acima: boolean) {
  ctx.save()
  ctx.imageSmoothingEnabled = false
  for (const c of m.camadas) {
    if (!!c.acima !== acima) continue
    const img = m.imagens[c.id]
    if (!img) continue
    const q = c.quadros ?? 1
    const fw = img.width / q
    ctx.globalAlpha = opacidadeEm(c, t)
    ctx.globalCompositeOperation = c.mistura ?? 'source-over'
    ctx.drawImage(img, quadroEm(c, t) * fw, 0, fw, img.height, 0, 0, W, H)
  }
  ctx.restore()
}

/** O mapa tem camada que se mexe (pede redesenho contínuo). */
export const mapaAnimado = (m: MapaCarregado) => m.camadas.some(animada)

/** Marcas do mestre: escudos nos quadrados de cobertura e pontilhado no terreno difícil. */
export function desenharMarcas(ctx: CanvasRenderingContext2D, m: MapaCarregado, cell: number) {
  ctx.save()
  const p = Math.max(1, Math.round(cell / 16))
  m.dificil.forEach(s => {
    const [x, y] = s.split(',').map(Number)
    ctx.fillStyle = 'rgba(255,210,74,.35)'
    for (let i = 2; i < 16; i += 4) for (let j = 2; j < 16; j += 4) ctx.fillRect(x * cell + i * p, y * cell + j * p, p, p)
  })
  m.cob.forEach((tipo, s) => {
    const [x, y] = s.split(',').map(Number)
    const ox = x * cell + cell - 7 * p, oy = y * cell + p
    ctx.fillStyle = tipo === 'melhorada' ? '#ffd24a' : '#efe6d2'
    // escudo de 5×6 px
    const ESC = ['11111', '11111', '11111', '01110', '00100']
    ESC.forEach((row, j) => [...row].forEach((b, i) => { if (b === '1') ctx.fillRect(ox + i * p, oy + j * p, p, p) }))
    if (tipo === 'melhorada') { ctx.fillStyle = '#05070d'; ctx.fillRect(ox + 2 * p, oy + p, p, 2 * p) }
  })
  ctx.restore()
}
