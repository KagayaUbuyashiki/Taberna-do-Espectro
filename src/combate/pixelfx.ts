/*
 * Efeitos de combate em pixel art, desenhados por cima do mapa tático.
 * Unidade: 1 "pixel de efeito" = cell / 20 pixels de tela, a mesma escala das miniaturas.
 * Tudo é função do tempo (ms desde o início do efeito), então qualquer tela desenha o mesmo quadro.
 */
import { distGrade, faixasPara, type Arma, type Ponto } from './armas'
import { duracao, tempos, type Efeito } from './efeitos'
import type { PoseFicha } from './sprites'

const U = 20 // pixels de efeito por quadrado
const CORES_FAIXA = ['#ffd24a', '#e2a417', '#ff8a1f', '#c4141c']
const ROTULO_FAIXA = ['QUEIMA-ROUPA', 'CURTO -2', 'MEDIO -5', 'LONGO -10']

/* ------------------------------------------------------------------ fonte 5×7 */
const F: Record<string, string> = {
  '0': '.###.#...##..###.#.###..##...#.###.', '1': '..#...##....#....#....#....#...###.', '2': '.###.#...#....#...#...#...#...#####',
  '3': '####.....#....#.###.....#....#####.', '4': '...#...##..#.#.#..#.#####...#....#.', '5': '######....####.....#....##...#.###.',
  '6': '..##..#...#....####.#...##...#.###.', '7': '#####....#...#...#...#....#....#...', '8': '.###.#...##...#.###.#...##...#.###.',
  '9': '.###.#...##...#.####....#...#..##..', 'A': '.###.#...##...#######...##...##...#', 'B': '####.#...##...#####.#...##...#####.',
  'C': '.###.#...##....#....#....#...#.###.', 'D': '####.#...##...##...##...##...#####.', 'E': '######....#....####.#....#....#####',
  'F': '######....#....####.#....#....#....', 'G': '.###.#...##....#.####...##...#.####', 'H': '#...##...##...#######...##...##...#',
  'I': '.###...#....#....#....#....#...###.', 'J': '..###...#....#....#....#.#..#..##..', 'K': '#...##..#.#.#..##...#.#..#..#.#...#',
  'L': '#....#....#....#....#....#....#####', 'M': '#...###.###.#.##.#.##...##...##...#', 'N': '#...##...###..##.#.##..###...##...#',
  'O': '.###.#...##...##...##...##...#.###.', 'P': '####.#...##...#####.#....#....#....', 'Q': '.###.#...##...##...##.#.##..#..##.#',
  'R': '####.#...##...#####.#.#..#..#.#...#', 'S': '.#####....#.....###.....#....#####.', 'T': '#####..#....#....#....#....#....#..',
  'U': '#...##...##...##...##...##...#.###.', 'V': '#...##...##...##...##...#.#.#...#..', 'W': '#...##...##...##.#.##.#.##.#.#.#.#.',
  'X': '#...##...#.#.#...#...#.#.#...##...#', 'Y': '#...##...#.#.#...#....#....#....#..', 'Z': '#####....#...#...#...#...#....#####',
  '!': '..#....#....#....#....#.........#..', '-': '................###................', '+': '.......#....#..#####..#....#.......',
  '.': '................................#..', ' ': '...................................', '?': '.###.#...#....#...#...#.........#..',
}
const sem = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase()

/* ------------------------------------------------------------------ pincel */
class Pincel {
  ctx: CanvasRenderingContext2D
  P: number
  constructor(ctx: CanvasRenderingContext2D, P: number) { this.ctx = ctx; this.P = P }
  px(x: number, y: number, c: string, w = 1, h = 1) {
    this.ctx.fillStyle = c
    this.ctx.fillRect(Math.round(x) * this.P, Math.round(y) * this.P, w * this.P, h * this.P)
  }
  /** Linha de pixels (Bresenham); `passo` > 1 faz tracejado, `fase` anda com o tempo. */
  linha(x0: number, y0: number, x1: number, y1: number, c: string, passo = 1, fase = 0, grossura = 1) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1)
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1
    let err = dx + dy, i = 0
    for (;;) {
      if (passo <= 1 || (i + fase) % passo < Math.ceil(passo / 2)) this.px(x0 - (grossura >> 1), y0 - (grossura >> 1), c, grossura, grossura)
      if (x0 === x1 && y0 === y1) break
      const e2 = 2 * err
      if (e2 >= dy) { err += dy; x0 += sx }
      if (e2 <= dx) { err += dx; y0 += sy }
      i++
    }
  }
  /** Círculo de pixels (contorno). */
  anel(cx: number, cy: number, r: number, c: string, filtro?: (a: number) => boolean) {
    const n = Math.max(12, Math.round(r * 7))
    const vistos = new Set<string>()
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      if (filtro && !filtro(a)) continue
      const x = Math.round(cx + Math.cos(a) * r), y = Math.round(cy + Math.sin(a) * r), k = `${x},${y}`
      if (!vistos.has(k)) { vistos.add(k); this.px(x, y, c) }
    }
  }
  disco(cx: number, cy: number, r: number, c: string) {
    for (let y = -Math.ceil(r); y <= r; y++) {
      const w = Math.floor(Math.sqrt(Math.max(0, r * r - y * y)))
      this.px(cx - w, cy + y, c, 2 * w + 1, 1)
    }
  }
  /** Texto na fonte 5×7, centrado em (cx, cy), com contorno escuro. `s` é o tamanho do pixel da letra. */
  texto(txt: string, cx: number, cy: number, c: string, s = 1, contorno = '#05070d') {
    const t = sem(txt), larg = t.length * 6 * s - s
    // a palavra não sai pela borda do mapa
    const W = this.ctx.canvas.width / this.P
    const x0 = Math.round(Math.max(2, Math.min(W - larg - 2, cx - larg / 2))), y0 = Math.round(Math.max(2, cy - (7 * s) / 2))
    for (const [cor, d] of [[contorno, 1], [c, 0]] as const) {
      ;[...t].forEach((ch, i) => {
        const g = F[ch] ?? F['?']
        for (let j = 0; j < 35; j++) {
          if (g[j] !== '#') continue
          const gx = x0 + i * 6 * s + (j % 5) * s, gy = y0 + Math.floor(j / 5) * s
          if (d) for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]]) this.px(gx + ox, gy + oy, cor, s, s)
          else this.px(gx, gy, cor, s, s)
        }
      })
    }
  }
}

/* ------------------------------------------------------------------ utilidades */
const centro = (p: Ponto) => ({ x: p.x * U + U / 2, y: p.y * U + U / 2 })
const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
/** Número pseudoaleatório estável para um efeito (o mesmo em toda tela). */
function semente(id: string, i: number) {
  let h = 2166136261
  for (let k = 0; k < id.length; k++) h = Math.imul(h ^ id.charCodeAt(k), 16777619)
  h = Math.imul(h ^ i, 2654435761)
  return ((h >>> 0) % 10000) / 10000
}
const mistura = (hex: string, alvo: string, t: number) => {
  const a = parseInt(hex.slice(1), 16), b = parseInt(alvo.slice(1), 16)
  const c = (s: number) => Math.round(lerp((a >> s) & 255, (b >> s) & 255, t))
  return `rgb(${c(16)},${c(8)},${c(0)})`
}

/* ------------------------------------------------------------------ padrões das faixas */
const padroes = new Map<string, CanvasPattern | null>()
function padrao(ctx: CanvasRenderingContext2D, cor: string, P: number) {
  const k = `${cor}${P}`
  if (padroes.has(k)) return padroes.get(k)!
  const cv = document.createElement('canvas'); cv.width = cv.height = 4 * P
  const x = cv.getContext('2d')
  if (!x) return null
  x.fillStyle = cor
  // pontilhado em diagonal (dither 1 em 4)
  for (let i = 0; i < 4; i++) x.fillRect(i * P, ((i * 2) % 4) * P, P, P)
  const pt = ctx.createPattern(cv, 'repeat')
  padroes.set(k, pt)
  return pt
}

/* ------------------------------------------------------------------ alcance */
function faixasDaArma(a: Arma) {
  if (a.corpo && !a.arremessavel) return [1]
  if (a.corpo && a.arremessavel) return [1, ...faixasPara(a, 99)]
  return a.faixas
}
function desenharAlcance(b: Pincel, de: Ponto, arma: Arma, dt: number, cols: number, rows: number, forca: number) {
  const { ctx, P } = b
  const fx = faixasDaArma(arma)
  const corpoArremesso = arma.corpo && arma.arremessavel
  const raio = (dt / 1000) * 45 // onda que acende os quadrados
  const desloc = Math.floor(dt / 140) % 4
  const faixa = (x: number, y: number) => {
    const d = distGrade(de, { x, y })
    if (d === 0) return -2
    if (corpoArremesso) return d <= 1 ? 0 : fx.slice(1).findIndex(r => d <= r) + 1 || -1
    const i = fx.findIndex(r => d <= r)
    return i
  }
  const cor = (i: number) => (arma.corpo && !arma.arremessavel) || (corpoArremesso && i === 0) ? '#c4141c' : CORES_FAIXA[Math.min(3, corpoArremesso ? i - 1 : i)]
  ctx.save()
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const i = faixa(x, y)
    if (i < 0 || distGrade(de, { x, y }) > raio) continue
    const pt = padrao(ctx, cor(i), P)
    if (!pt) continue
    pt.setTransform(new DOMMatrix().translate(desloc * P, 0))
    ctx.globalAlpha = 0.5 * forca
    ctx.fillStyle = pt
    ctx.fillRect(x * U * P, y * U * P, U * P, U * P)
  }
  // borda tracejada entre uma faixa e a seguinte (anda com o tempo)
  ctx.globalAlpha = 0.95 * forca
  const fase = Math.floor(dt / 90)
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const i = faixa(x, y)
    if (i < 0 || distGrade(de, { x, y }) > raio) continue
    const c = cor(i)
    if (x + 1 >= cols || faixa(x + 1, y) !== i) b.linha((x + 1) * U, y * U, (x + 1) * U, (y + 1) * U - 1, c, 4, fase)
    if (y + 1 >= rows || faixa(x, y + 1) !== i) b.linha(x * U, (y + 1) * U, (x + 1) * U - 1, (y + 1) * U, c, 4, fase)
    if (x === 0 || faixa(x - 1, y) !== i) b.linha(x * U, y * U, x * U, (y + 1) * U - 1, c, 4, fase)
    if (y === 0 || faixa(x, y - 1) !== i) b.linha(x * U, y * U, (x + 1) * U - 1, y * U, c, 4, fase)
  }
  // anel girando em volta de quem ataca
  const c0 = centro(de)
  const giro = dt / 500
  b.anel(c0.x, c0.y, 13, '#ffd24a', a => ((a / (Math.PI * 2) + giro) % 0.25) < 0.14)
  b.anel(c0.x, c0.y, 15, 'rgba(255,210,74,.45)', a => ((a / (Math.PI * 2) - giro * 0.6) % 0.33) < 0.1)
  // rótulo de cada faixa à direita (ou à esquerda, se não couber) de quem ataca
  if (!arma.corpo || arma.arremessavel) {
    const lista = corpoArremesso ? fx.slice(1) : fx
    lista.forEach((r, i) => {
      const lado = de.x + r < cols ? 1 : -1
      const lx = de.x + lado * r
      if (lx < 0 || lx >= cols || r > raio) return
      const p = centro({ x: lx, y: de.y })
      b.texto(ROTULO_FAIXA[i], p.x, p.y - 12, CORES_FAIXA[i])
    })
  } else {
    b.texto('CORPO A CORPO', c0.x, c0.y - 26, '#ff6a5f')
  }
  ctx.restore()
}

/* ------------------------------------------------------------------ projéteis */
function raio(b: Pincel, x: number, y: number, dx: number, dy: number, cor: string, comp: number, grossura = 1) {
  const n = Math.hypot(dx, dy) || 1
  const ux = dx / n, uy = dy / n
  // brilho em volta, depois o miolo branco
  b.linha(x - ux * comp, y - uy * comp, x, y, cor, 1, 0, grossura + 2)
  b.linha(x - ux * (comp - 2), y - uy * (comp - 2), x - ux, y - uy, '#fffbe8', 1, 0, grossura)
}
function faiscas(b: Pincel, x: number, y: number, prog: number, cor: string, id: string, n = 8, alcance = 10) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + semente(id, i) * 0.6
    const r0 = 2 + prog * alcance * (0.6 + semente(id, i + 9) * 0.6), r1 = r0 + 3 * (1 - prog)
    b.linha(x + Math.cos(a) * r0, y + Math.sin(a) * r0, x + Math.cos(a) * r1, y + Math.sin(a) * r1, i % 2 ? '#fffbe8' : cor)
  }
}
function explosao(b: Pincel, x: number, y: number, prog: number, r: number, id: string, forte: boolean) {
  const rr = r * Math.min(1, prog * 2.2)
  if (forte && prog < 0.18) b.disco(x, y, rr * 1.15, 'rgba(255,251,232,.9)')
  const tons = ['#fffbe8', '#fff3a8', '#ffd24a', '#e2a417', '#c4141c', '#3a2414', '#2e2e36']
  for (let yy = -Math.ceil(rr); yy <= rr; yy++) for (let xx = -Math.ceil(rr); xx <= rr; xx++) {
    const d = Math.hypot(xx, yy)
    if (d > rr) continue
    const ruido = semente(id, (xx + 64) * 131 + yy + 64 + Math.floor(prog * 10) * 7)
    if (ruido < 0.25 + prog * 0.55) continue // a nuvem vai abrindo buracos
    const k = Math.min(tons.length - 1, Math.floor((d / Math.max(1, rr)) * 2 + prog * 5 + ruido * 1.5))
    b.px(x + xx, y + yy, tons[k])
  }
  b.anel(x, y, rr + 1, prog < 0.5 ? '#fff3a8' : '#3e3e48')
}

function desenharAtaque(b: Pincel, e: Extract<Efeito, { k: 'ataque' }>, dt: number, cols: number, rows: number) {
  const { saida, chegada, fim } = tempos(e)
  const A = centro(e.de)
  const B = e.para ? centro(e.para) : null
  const a = e.arma
  const acertou = e.acerto !== false
  const corpo = a.corpo && !e.leitura?.arremessando
  // 1) mira: as faixas acendem rápido, a linha de tiro e o alvo cercado
  if (dt < saida + 900) desenharAlcance(b, e.de, a, dt + 400, cols, rows, 0.6 * clamp01(1 - (dt - saida) / 900))
  if (B && dt < chegada + 300) {
    const al = clamp01(1 - (dt - chegada) / 300)
    b.ctx.globalAlpha = al
    if (!corpo) b.linha(A.x, A.y, B.x, B.y, 'rgba(239,230,210,.7)', 3, -Math.floor(dt / 60))
    const k = lerp(1.7, 1, clamp01(dt / saida)) * 10
    const cc = '#ff6a5f'
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      b.linha(B.x + sx * k, B.y + sy * k, B.x + sx * (k - 4), B.y + sy * k, cc)
      b.linha(B.x + sx * k, B.y + sy * k, B.x + sx * k, B.y + sy * (k - 4), cc)
    }
    b.ctx.globalAlpha = 1
  }
  // área: quadrados que a explosão ou o cone pegam
  if (e.area.length && dt < fim) {
    const pisca = Math.floor(dt / 160) % 2 ? 0.5 : 0.3
    b.ctx.globalAlpha = dt > chegada ? 0.55 * clamp01(1 - (dt - chegada) / (fim - chegada)) : pisca
    const pt = padrao(b.ctx, '#c4141c', b.P)
    if (pt) { b.ctx.fillStyle = pt; e.area.forEach(p => b.ctx.fillRect(p.x * U * b.P, p.y * U * b.P, U * b.P, U * b.P)) }
    b.ctx.globalAlpha = 1
  }
  if (!B) return
  const dx = B.x - A.x, dy = B.y - A.y
  // ponto final do tiro que erra: passa raspando o alvo e segue
  const n = Math.hypot(dx, dy) || 1
  const desvio = (semente(e.id, 1) < 0.5 ? -1 : 1) * 9
  const fimX = acertou ? B.x : B.x + (-dy / n) * desvio + (dx / n) * 22
  const fimY = acertou ? B.y : B.y + (dx / n) * desvio + (dy / n) * 22
  const voo = clamp01((dt - saida) / (chegada - saida))
  const depois = dt - chegada

  // 2) o ataque em si
  if (a.tipo === 'sabre' || a.tipo === 'vibro' || ((a.tipo === 'fisico' || a.tipo === 'garra') && corpo)) {
    const ang = Math.atan2(dy, dx)
    if (a.tipo === 'sabre' && dt >= saida - 60 && dt < saida + 420) {
      // arco da lâmina girando com rastro
      const p = clamp01((dt - saida + 60) / 220)
      for (let k = 5; k >= 0; k--) {
        const pk = Math.max(0, p - k * 0.07)
        const ang2 = ang - 1.9 + pk * 3.0
        const cor = k === 0 ? '#fffbe8' : mistura(a.cor.length === 7 ? a.cor : '#4fc3ff', '#000000', k * 0.14)
        if (k === 0 || pk > 0) for (let r = 6; r <= 24; r++) b.px(A.x + Math.cos(ang2) * r, A.y + Math.sin(ang2) * r, r > 22 && k ? a.cor : cor, k === 0 ? 2 : 1, k === 0 ? 2 : 1)
      }
    }
    if (dt >= chegada && depois < 450) {
      const p = clamp01(depois / 450)
      if (!acertou) {
        // aparou: choque de energia entre os dois
        const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2
        faiscas(b, mx, my, p, '#ffd24a', e.id, 10, 12)
      } else if (a.tipo === 'garra') {
        for (let i = -1; i <= 1; i++) b.linha(B.x - 7 + i * 4, B.y - 8 + p * 2, B.x + 5 + i * 4, B.y + 8 * Math.min(1, p * 3) - 2, '#c4141c', 1, 0, 2)
      } else {
        const cor = a.tipo === 'sabre' ? a.cor : a.tipo === 'vibro' ? '#d8f6ff' : '#efe6d2'
        for (let i = -1; i <= 1; i++) {
          const L = 10 * Math.min(1, p * 4)
          b.linha(B.x - L + i * 3, B.y - L * 0.6 + i * 3, B.x + L + i * 3, B.y + L * 0.6 + i * 3, i ? cor : '#fffbe8')
        }
        faiscas(b, B.x, B.y, p, cor, e.id, 6, 8)
      }
    }
  } else if (a.tipo === 'chamas') {
    if (dt >= saida) {
      const p = clamp01((dt - saida) / 500), some = clamp01((fim - dt) / 400)
      const tons = ['#fff3a8', '#ffd24a', '#ff9a1f', '#c4141c', '#3a2414']
      e.area.forEach(c => {
        const d = distGrade(e.de, c)
        if (d > p * 6 + 0.5) return
        for (let k = 0; k < 14; k++) {
          const s = semente(e.id, c.x * 977 + c.y * 31 + k + Math.floor(dt / 70) * 101)
          if (s > some) continue
          b.px(c.x * U + Math.floor(semente(e.id, k * 7 + c.x) * U), c.y * U + Math.floor(s * U), tons[Math.floor(s * 4.99)], 2, 2)
        }
      })
    }
  } else if (dt >= saida && dt < chegada + (acertou ? 0 : 260)) {
    // projétil voando
    const extra = acertou ? 0 : clamp01((dt - chegada) / 260)
    const px = voo < 1 ? lerp(A.x, B.x, voo) : lerp(B.x, fimX, extra)
    const py = voo < 1 ? lerp(A.y, B.y, voo) : lerp(B.y, fimY, extra)
    const arco = a.area || a.tipo === 'arremesso' || e.leitura?.arremessando
    if (arco && a.tipo !== 'missil') {
      const h = Math.min(40, n * 0.35) * 4 * voo * (1 - voo)
      b.disco(px, py + 2, 2, 'rgba(0,0,0,.45)')
      if (a.tipo === 'termal') { b.disco(px, py - h, 2, '#cfcfd6'); b.px(px, py - h - 1, Math.floor(dt / 90) % 2 ? '#ff6a5f' : '#7a0a0f') }
      else if (a.tipo === 'granada') { b.disco(px, py - h, 2, '#4a4a54'); b.px(px + 1, py - h - 1, Math.floor(dt / 90) % 2 ? '#ff6a5f' : '#2e2e36') }
      else {
        const g = dt / 40
        b.linha(px - Math.cos(g) * 4, py - h - Math.sin(g) * 4, px + Math.cos(g) * 4, py - h + Math.sin(g) * 4, '#cfcfd6')
      }
    } else if (a.tipo === 'missil') {
      for (let k = 1; k < 8; k++) {
        const q = Math.max(0, voo - k * 0.05)
        b.disco(lerp(A.x, B.x, q), lerp(A.y, B.y, q), 1 + k * 0.4, `rgba(154,154,166,${0.5 - k * 0.06})`)
      }
      raio(b, px, py, dx, dy, '#ffd24a', 6, 1)
    } else if (a.tipo === 'lesma' || a.tipo === 'pedra') {
      b.px(px - 1, py - 1, a.tipo === 'lesma' ? '#cfcfd6' : '#9a9aa6', 2, 2)
      b.linha(px - (dx / n) * 6, py - (dy / n) * 6, px, py, 'rgba(207,207,214,.35)')
    } else if (a.tipo === 'flecha') {
      b.linha(px - (dx / n) * 7, py - (dy / n) * 7, px, py, '#c9a26b')
      b.px(px, py, '#efe6d2')
    } else {
      const grosso = a.tipo === 'pesada' || a.tipo === 'bowcaster' ? 2 : 1
      const comp = a.tipo === 'pesada' ? 11 : 8
      const tiros = a.tipo === 'rajada' ? 3 : 1
      for (let k = 0; k < tiros; k++) {
        const q = voo - k * 0.16
        if (q < 0 || q > 1) continue
        raio(b, lerp(A.x, B.x, q) + (k ? (semente(e.id, k) - 0.5) * 4 : 0), lerp(A.y, B.y, q), dx, dy, a.cor, comp, grosso)
      }
      if (voo >= 1) raio(b, px, py, fimX - B.x, fimY - B.y, a.cor, comp, grosso)
      if (dt - saida < 90) b.disco(A.x + (dx / n) * 8, A.y + (dy / n) * 8, 3, '#fff3a8') // clarão do cano
    }
  }

  // 3) chegada
  if (dt >= chegada && depois < 1300 && !corpo && a.tipo !== 'chamas') {
    if (a.area) explosao(b, B.x, B.y, clamp01(depois / (a.tipo === 'termal' ? 1100 : 900)), (a.area.forma === 'raio' ? a.area.r : 2) * U + 6, e.id, a.tipo === 'termal')
    else if (acertou && depois < 500) faiscas(b, B.x, B.y, depois / 500, a.cor, e.id, e.critico ? 12 : 8, e.critico ? 16 : 10)
    else if (!acertou && depois < 500) faiscas(b, fimX, fimY, depois / 500, '#8a8578', e.id, 5, 5)
  }
  // 4) resultado escrito
  if (dt >= chegada && depois < 1200 && e.acerto !== null) {
    const sobe = clamp01(depois / 1200) * 10
    b.ctx.globalAlpha = clamp01((1200 - depois) / 300)
    if (e.critico && acertou) b.texto('CRITICO!', B.x, B.y - 22 - sobe, '#ffd24a', 2)
    else if (!acertou) b.texto(a.tipo === 'sabre' ? 'APARADO' : 'ERROU', B.x, B.y - 20 - sobe, '#cfcfd6')
    b.ctx.globalAlpha = 1
  }
}

function desenharDano(b: Pincel, e: Extract<Efeito, { k: 'dano' }>, dt: number) {
  const C = centro(e.em)
  const p = clamp01(dt / 1600)
  b.ctx.globalAlpha = clamp01((1600 - dt) / 400)
  // sobe rápido e desacelera, com um pulinho no começo
  const y = C.y - 16 - 14 * (1 - (1 - p) * (1 - p)) - (dt < 120 ? (120 - dt) / 30 : 0)
  b.texto(`-${e.valor}`, C.x, y, e.critico ? '#ffd24a' : '#ff6a5f', 2)
  b.ctx.globalAlpha = 1
}

function desenharQueda(b: Pincel, e: Extract<Efeito, { k: 'queda' }>, dt: number) {
  if (!e.em) return
  const C = centro(e.em)
  const p = clamp01(dt / 900)
  // poeira no chão
  if (dt < 700) b.anel(C.x, C.y + 6, 4 + (dt / 700) * 12, dt < 350 ? '#bdb29a' : '#8a7f68', a => Math.sin(a) > -0.3)
  // pedaços que pulam e caem
  const cores = e.corpo === 'droide' ? ['#ffd24a', '#fffbe8', '#9a9aa6'] : e.corpo === 'fera' ? ['#8b6a3e', '#efe6d2', '#7a0a0f'] : ['#efe6d2', '#c4141c', '#bdb29a']
  if (dt < 1000) for (let i = 0; i < 12; i++) {
    const vx = (semente(e.id, i) - 0.5) * 28, vy = -14 - semente(e.id, i + 20) * 14
    const tt = p * 1.4
    b.px(C.x + vx * tt, C.y + vy * tt + 26 * tt * tt, cores[i % 3], 1, 1)
  }
  if (e.corpo === 'droide' && dt < 1600) {
    // fumaça subindo
    for (let i = 0; i < 4; i++) {
      const q = ((dt / 1600) + i * 0.25) % 1
      b.disco(C.x + Math.sin(q * 6 + i) * 3, C.y - q * 22, 1 + q * 2, `rgba(74,74,84,${0.6 * (1 - q)})`)
    }
  }
  // o grito raro ganha um balão de fala; os outros, a palavra ABATIDO
  if (dt > 180 && dt < 2000) {
    b.ctx.globalAlpha = clamp01((2000 - dt) / 400)
    if (e.grito) {
      const txt = 'AAAAAHHH!'
      const W = b.ctx.canvas.width / b.P
      const w = txt.length * 6 + 6, x0 = Math.max(3, Math.min(W - w - 3, C.x - w / 2)), y0 = Math.max(2, C.y - 40)
      b.px(x0, y0, '#fffbe8', w, 11); b.px(x0 - 1, y0 + 1, '#fffbe8', 1, 9); b.px(x0 + w, y0 + 1, '#fffbe8', 1, 9)
      b.px(C.x - 2, y0 + 11, '#fffbe8', 4, 1); b.px(C.x - 1, y0 + 12, '#fffbe8', 2, 1)
      b.texto(txt, x0 + w / 2 + Math.sin(dt / 30), y0 + 5.5, '#c4141c', 1, '#fffbe8')
    } else b.texto(e.corpo === 'droide' ? 'DESLIGADO' : 'ABATIDO', C.x, C.y - 26 - p * 6, '#bdb29a')
    b.ctx.globalAlpha = 1
  }
}

/** Desenha todos os efeitos ativos. `visivel` esconde o que cai sob a névoa na visão dos jogadores. */
export function desenharEfeitos(ctx: CanvasRenderingContext2D, lista: Efeito[], agora: number, cell: number, cols: number, rows: number, visivel?: (x: number, y: number) => boolean) {
  const b = new Pincel(ctx, cell / U)
  ctx.save()
  ctx.imageSmoothingEnabled = false
  if (visivel) {
    ctx.beginPath()
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) if (visivel(x, y)) ctx.rect(x * cell, y * cell, cell, cell)
    ctx.clip()
  }
  for (const e of lista) {
    const dt = agora - e.t
    if (dt < 0 || dt > duracao(e)) continue
    ctx.globalAlpha = 1
    if (e.k === 'alcance') desenharAlcance(b, e.de, e.arma, dt, cols, rows, clamp01((e.dur - dt) / 500))
    else if (e.k === 'ataque') desenharAtaque(b, e, dt, cols, rows)
    else if (e.k === 'dano') desenharDano(b, e, dt)
    else desenharQueda(b, e, dt)
  }
  ctx.restore()
}

/** Como a miniatura de quem está no quadrado `p` se mexe agora: avança no ataque, treme no golpe, tomba na queda. */
export function poseDaFicha(p: Ponto, lista: Efeito[], agora: number, cell: number, caido: boolean): PoseFicha {
  const pose: PoseFicha = { dx: 0, dy: 0, queda: caido ? 1 : 0, branco: false, alpha: 1 }
  const P = cell / U
  for (const e of lista) {
    const dt = agora - e.t
    if (dt < 0 || dt > duracao(e)) continue
    if (e.k === 'ataque') {
      const { saida, chegada } = tempos(e)
      if (e.de.x === p.x && e.de.y === p.y && e.para) {
        // avança na direção do alvo e volta
        const k = Math.sin(Math.PI * clamp01((dt - saida + 120) / 320))
        const dx = e.para.x - p.x, dy = e.para.y - p.y, n = Math.hypot(dx, dy) || 1
        const quanto = (e.arma.corpo ? 6 : 2) * P * k
        pose.dx += (dx / n) * quanto; pose.dy += (dy / n) * quanto
      }
      if (e.para && e.para.x === p.x && e.para.y === p.y && e.acerto !== false) {
        const dd = dt - chegada
        if (dd >= 0 && dd < 260) { pose.branco = Math.floor(dd / 65) % 2 === 0; pose.dx += Math.sin(dd / 18) * 2 * P }
      }
      if (e.area.some(c => c.x === p.x && c.y === p.y) && dt >= chegada && dt - chegada < 260 && !(e.para && e.para.x === p.x && e.para.y === p.y)) {
        pose.dx += Math.sin((dt - chegada) / 16) * 1.5 * P
      }
    } else if (e.k === 'queda' && e.em && e.em.x === p.x && e.em.y === p.y) {
      // tomba em 420 ms com um quique no fim
      const q = clamp01((dt - 120) / 420)
      pose.queda = Math.min(1, q * q * 1.15) - (q >= 1 ? 0 : 0)
      if (q > 0.85 && q < 1) pose.dy -= (1 - q) * 6 * P
    }
  }
  return pose
}

/** Tem algum efeito em andamento (o mapa precisa seguir redesenhando). */
export const temEfeitoAtivo = (lista: Efeito[], agora: number) => lista.some(e => agora - e.t <= duracao(e))

