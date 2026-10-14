/* Medidas da grade (Edição Saga: diagonais contam 1 e 2 quadrados alternados). */
export function gridDist(a: number, b: number, c: number, d: number) {
  const dx = Math.abs(c - a), dy = Math.abs(d - b)
  return Math.max(dx, dy) + Math.floor(Math.min(dx, dy) / 2)
}

export type Wall = [number, number, number, number]
/** Paredes ficam salvas como "x1,y1,x2,y2" (cantos da grade). */
export const parseWall = (s: string): Wall => { const [a = 0, b = 0, c = 0, d = 0] = s.split(',').map(Number); return [a, b, c, d] }
export const wallKey = (w: Wall) => w.join(',')

/** Distância de um ponto a um segmento de parede, em quadrados. */
export function segDist(px: number, py: number, [x1, y1, x2, y2]: Wall) {
  const dx = x2 - x1, dy = y2 - y1
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy || 1)))
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy))
}

/** Cor do texto sobre a ficha (escuro em cor clara, claro em cor escura). */
export function inkOn(hex: string) {
  const n = parseInt(hex.replace('#', '').padEnd(6, '0').slice(0, 6), 16)
  const l = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255
  return l > 0.55 ? '#05070d' : '#efe6d2'
}

/** Névoa: uma letra por célula ('1' coberta); refeita se o tamanho do mapa mudou. */
export const fogOf = (m: { fog: string; cols: number; rows: number }) => (m.fog && m.fog.length === m.cols * m.rows ? m.fog : '0'.repeat(m.cols * m.rows))
