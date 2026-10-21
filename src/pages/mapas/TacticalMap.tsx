import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { RANGES, RANGE_LABEL } from '../../data/saga'
import { ASSET, useAsset } from '../../lib/assets'
import type { Campaign } from '../../rules/types'
import { useStore } from '../../store/campaign'
import { useEfeitos } from '../../combate/efeitos'
import { desenharEfeitos, poseDaFicha, temEfeitoAtivo } from '../../combate/pixelfx'
import { desenharSprite, quandoCarregar, type SpriteId } from '../../combate/sprites'
import { ehMapaPx } from '../../mapas-px/formato'
import { carregarMapasPx, useMapasPx } from '../../mapas-px/registro'
import { desenharCamadas, desenharMarcas, mapaAnimado } from '../../mapas-px/desenho'
import { CELL, paintScene } from './scenes'
import { fogOf, gridDist, inkOn, parseWall, segDist, wallKey, type Wall } from './geometry'

export type MapState = Campaign['map']
export type Tool = 'mover' | 'medir' | 'parede' | 'apagar' | 'cobrir' | 'revelar' | 'mirar'
export type RangeKey = keyof typeof RANGES
/** Estado de cada ficha ligada ao combate: fração de PV, se caiu, a miniatura do inimigo ou a foto da figura do herói. */
export type TokInfo = Record<string, { pct: number; down: boolean; sprite?: SpriteId; figura?: string }>

const work = (m: MapState): MapState => ({ ...m, fog: fogOf(m), tokens: m.tokens.map(t => ({ ...t })), walls: [...m.walls] })

type Drag =
  | { tok: string }
  | { pan: { x: number; y: number; sl: number; st: number } }
  | { wall: Wall }
  | { fog: true }
  | { measure: true }

interface Props {
  tool: Tool
  gmView: boolean
  range: RangeKey
  zoom: 'ajustar' | number
  sel: string | null
  onSelect: (id: string | null) => void
  info: TokInfo
  /** Só mostra (o mapa da ficha e o da Mesa): sem arrastar nem editar. */
  readOnly?: boolean
  /** Clique numa ficha com `readOnly` ou com a ferramenta Mirar (para escolher o alvo). */
  onPick?: (tokenId: string) => void
  /** Altura máxima do quadro (CSS). */
  maxH?: string
}

const figuras = new Map<string, HTMLImageElement>()
/** Foto da figura 3D (data URL), carregada uma vez. */
function figuraImg(src: string, aoCarregar: () => void) {
  let i = figuras.get(src)
  if (!i) { i = new Image(); i.onload = aoCarregar; i.src = src; figuras.set(src, i) }
  return i.complete && i.naturalWidth ? i : null
}

/** Mapa tático em canvas: fichas arrastáveis (mouse e toque), paredes, névoa, régua, miniaturas animadas e efeitos de combate. */
export function TacticalMap({ tool, gmView, range, zoom, sel, onSelect, info, readOnly = false, onPick, maxH = '78vh' }: Props) {
  const m = useStore(s => s.campaign.map)
  const patchCampaign = useStore(s => s.patchCampaign)
  const cvRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const workRef = useRef<MapState>(work(m))
  const dragRef = useRef<Drag | null>(null)
  const [measure, setMeasure] = useState<Wall | null>(null)
  const measureRef = useRef<Wall | null>(null)
  const bgCache = useRef<{ key: string; cv: HTMLCanvasElement | null }>({ key: '', cv: null })

  // Imagem do cenário quando existir (mapas/<cena>.jpg); senão o desenho procedural.
  const url = useAsset(ASSET.map(m.scene))
  const [bgImg, setBgImg] = useState<{ url: string; img: HTMLImageElement } | null>(null)
  useEffect(() => {
    if (!url) return
    const img = new Image()
    img.onload = () => setBgImg({ url, img })
    img.src = url
  }, [url])
  const image = url && bgImg?.url === url ? bgImg.img : null

  // Mapas em pixel art (public/assets/mapas-px): carregados uma vez.
  useEffect(() => { void carregarMapasPx() }, [])
  const mapasPx = useMapasPx(s => s.mapas)
  const px = ehMapaPx(m.scene) ? mapasPx[m.scene] : undefined

  // A ferramenta mudou: a régua some.
  useEffect(() => { measureRef.current = null; setMeasure(null) }, [tool])

  function draw(agora = Date.now()) {
    const cv = cvRef.current
    if (!cv) return
    const w = workRef.current
    const W = w.cols * CELL, H = w.rows * CELL
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H }
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const efeitos = useEfeitos.getState().lista
    if (px) desenharCamadas(ctx, px, W, H, agora, false)
    else {
      // fundo em cache
      const key = `${w.scene}${W}x${H}${image ? url : ''}`
      if (bgCache.current.key !== key) {
        const b = document.createElement('canvas'); b.width = W; b.height = H
        const bc = b.getContext('2d')
        if (bc) { if (image) bc.drawImage(image, 0, 0, W, H); else paintScene(bc, W, H, ehMapaPx(w.scene) ? 'vazio' : w.scene) }
        bgCache.current = { key, cv: b }
      }
      if (bgCache.current.cv) ctx.drawImage(bgCache.current.cv, 0, 0)
    }
    // grade
    ctx.strokeStyle = 'rgba(255,210,74,.16)'; ctx.lineWidth = 1
    for (let x = 0; x <= w.cols; x++) { ctx.beginPath(); ctx.moveTo(x * CELL + 0.5, 0); ctx.lineTo(x * CELL + 0.5, H); ctx.stroke() }
    for (let y = 0; y <= w.rows; y++) { ctx.beginPath(); ctx.moveTo(0, y * CELL + 0.5); ctx.lineTo(W, y * CELL + 0.5); ctx.stroke() }
    // paredes
    ctx.strokeStyle = '#ffd24a'; ctx.lineWidth = 5; ctx.lineCap = 'round'
    w.walls.forEach(s => { const [a, b, c, d] = parseWall(s); ctx.beginPath(); ctx.moveTo(a * CELL, b * CELL); ctx.lineTo(c * CELL, d * CELL); ctx.stroke() })
    const dr = dragRef.current
    if (dr && 'wall' in dr) {
      const [a, b, c, d] = dr.wall
      ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.moveTo(a * CELL, b * CELL); ctx.lineTo(c * CELL, d * CELL); ctx.stroke(); ctx.globalAlpha = 1
    }
    // fichas: inimigos são miniaturas animadas em pixel art; heróis, a ficha redonda ou a foto da figura 3D
    const redesenhar = () => draw()
    const ordem = [...w.tokens].sort((a, b) => a.y - b.y)
    ordem.forEach(t => {
      const cx = (t.x + 0.5) * CELL, cy = (t.y + 0.5) * CELL, r = CELL * 0.42
      const st = t.ref ? info[t.ref] : undefined
      const escolhido = t.id === sel
      if (st?.sprite) {
        const pose = poseDaFicha({ x: t.x, y: t.y }, efeitos, agora, CELL, !!st.down)
        // base da miniatura: sombra, anel na cor da ficha e a barra de PV em arco
        const by = cy + CELL * 0.3
        ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.beginPath(); ctx.ellipse(cx, by, CELL * 0.4, CELL * 0.17, 0, 0, 7); ctx.fill()
        ctx.lineWidth = escolhido ? 3 : 2; ctx.strokeStyle = escolhido ? '#ffd24a' : t.color
        ctx.beginPath(); ctx.ellipse(cx, by, CELL * 0.4, CELL * 0.17, 0, 0, 7); ctx.stroke()
        ctx.lineWidth = 2; ctx.strokeStyle = st.pct <= 0.5 ? '#c4141c' : '#efe6d2'
        ctx.beginPath(); ctx.ellipse(cx, by, CELL * 0.46, CELL * 0.22, 0, Math.PI * 0.15, Math.PI * 0.15 + Math.PI * 0.7 * Math.max(0, st.pct)); ctx.stroke()
        if (!desenharSprite(ctx, st.sprite, cx, by + 2, CELL, agora, pose)) {
          ctx.fillStyle = t.color; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill()
        }
        // rótulo pequeno (S1, S2...) no canto do quadrado
        ctx.font = `bold ${Math.round(CELL * 0.26)}px "Share Tech Mono", monospace`
        const lw = ctx.measureText(t.label).width + 6
        ctx.globalAlpha = st.down ? 0.6 : 1
        ctx.fillStyle = 'rgba(5,7,13,.85)'; ctx.fillRect(cx + CELL * 0.5 - lw - 1, cy + CELL * 0.5 - CELL * 0.3 - 1, lw, CELL * 0.3)
        ctx.fillStyle = escolhido ? '#ffd24a' : t.color; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
        ctx.fillText(t.label.slice(0, 3), cx + CELL * 0.5 - lw + 2, cy + CELL * 0.5 - CELL * 0.15)
        ctx.globalAlpha = 1
        return
      }
      ctx.globalAlpha = st?.down ? 0.45 : 1
      ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.beginPath(); ctx.arc(cx + 2, cy + 3, r, 0, 7); ctx.fill()
      const foto = st?.figura ? figuraImg(st.figura, redesenhar) : null
      if (foto) {
        ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.clip()
        ctx.fillStyle = '#05070d'; ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
        ctx.drawImage(foto, cx - r, cy - r, r * 2, r * 2); ctx.restore()
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7)
      } else { ctx.fillStyle = t.color; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill() }
      ctx.lineWidth = escolhido ? 4 : 2; ctx.strokeStyle = escolhido ? '#ffd24a' : foto ? t.color : '#05070d'; ctx.stroke()
      // arco fino de PV para fichas ligadas ao combate
      if (st) {
        ctx.lineWidth = 3; ctx.strokeStyle = st.pct <= 0.5 ? '#c4141c' : '#efe6d2'
        ctx.beginPath(); ctx.arc(cx, cy, r + 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, st.pct)); ctx.stroke()
      }
      if (!foto) {
        ctx.fillStyle = inkOn(t.color); ctx.font = `bold ${CELL * 0.34}px "Share Tech Mono", monospace`
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(t.label.slice(0, 3), cx, cy + 1)
      }
      if (st?.down) { ctx.strokeStyle = '#c4141c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - r * 0.7, cy - r * 0.7); ctx.lineTo(cx + r * 0.7, cy + r * 0.7); ctx.moveTo(cx + r * 0.7, cy - r * 0.7); ctx.lineTo(cx - r * 0.7, cy + r * 0.7); ctx.stroke() }
      ctx.globalAlpha = 1
    })
    // camadas de cima do mapa em pixel art (telhados, copas) e as marcas de cobertura
    if (px) { desenharCamadas(ctx, px, W, H, agora, true); desenharMarcas(ctx, px, CELL) }
    // névoa: translúcida na visão do mestre, opaca para os jogadores
    if (w.fogOn && w.fog) {
      ctx.fillStyle = gmView ? 'rgba(0,0,0,.55)' : '#000'
      for (let i = 0; i < w.fog.length; i++) if (w.fog[i] === '1') ctx.fillRect((i % w.cols) * CELL, Math.floor(i / w.cols) * CELL, CELL, CELL)
    }
    // régua
    const ms = measureRef.current
    if (ms) {
      const [a, b, c, d] = ms
      ctx.strokeStyle = '#4fc3ff'; ctx.lineWidth = 3; ctx.setLineDash([8, 6])
      ctx.beginPath(); ctx.moveTo((a + 0.5) * CELL, (b + 0.5) * CELL); ctx.lineTo((c + 0.5) * CELL, (d + 0.5) * CELL); ctx.stroke(); ctx.setLineDash([])
      const dist = gridDist(a, b, c, d)
      const band = RANGES[range].findIndex(r => dist <= r)
      const txt = `${dist} q · ${(dist * 1.5).toLocaleString('pt-BR')} m · ${band < 0 ? 'fora de alcance' : RANGE_LABEL[band]}`
      ctx.font = '15px "Share Tech Mono", monospace'
      const tw = ctx.measureText(txt).width + 16
      const tx = Math.max(4, Math.min(W - tw - 4, (c + 0.5) * CELL + 12)), ty = Math.max(4, (d + 0.5) * CELL - 34)
      ctx.fillStyle = 'rgba(5,7,13,.9)'; ctx.fillRect(tx, ty, tw, 26)
      ctx.fillStyle = '#4fc3ff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(txt, tx + 8, ty + 13)
    }
    // efeitos de combate (alcance, tiros, golpes, dano, quedas); para os jogadores, só onde a névoa não cobre
    if (efeitos.length) {
      const fog = w.fogOn && !gmView ? w.fog : ''
      desenharEfeitos(ctx, efeitos, agora, CELL, w.cols, w.rows, fog ? (x, y) => fog[y * w.cols + x] !== '1' : undefined)
    }
  }
  const drawRef = useRef(draw)
  drawRef.current = draw

  // Relógio da animação: miniaturas (a cada quadro de sprite), camadas animadas do mapa e efeitos (60 por segundo).
  const animado = !!px && mapaAnimado(px)
  const temSprite = Object.values(info).some(v => v.sprite)
  useEffect(() => {
    quandoCarregar(() => drawRef.current())
    let raf = 0, ultimo = -1
    const tick = () => {
      const agora = Date.now()
      const ef = temEfeitoAtivo(useEfeitos.getState().lista, agora)
      if (ef || animado) drawRef.current(agora)
      else if (temSprite) { const q = Math.floor(agora / 83); if (q !== ultimo) { ultimo = q; drawRef.current(agora) } }
      if (!ef) useEfeitos.getState().limpar(agora)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); quandoCarregar(null) }
  }, [animado, temSprite])

  // Store mudou (e ninguém está arrastando): recarrega a cópia de trabalho.
  useEffect(() => { if (!dragRef.current) workRef.current = work(m) }, [m])
  // Redesenha a cada render (props, store ou imagem mudaram).
  useEffect(() => { draw() })

  const commit = () => { const w = workRef.current; patchCampaign(c => ({ ...c, map: { ...w, tokens: w.tokens.map(t => ({ ...t })), walls: [...w.walls] } })) }

  const pos = (e: PointerEvent, exact = false) => {
    const cv = cvRef.current!
    const r = cv.getBoundingClientRect()
    const x = ((e.clientX - r.left) * cv.width) / r.width / CELL, y = ((e.clientY - r.top) * cv.height) / r.height / CELL
    return exact ? [x, y] : [Math.floor(x), Math.floor(y)]
  }
  const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < workRef.current.cols && y < workRef.current.rows
  const paint = (e: PointerEvent) => {
    const w = workRef.current
    const [x, y] = pos(e)
    if (!inside(x, y)) return
    const i = y * w.cols + x, v = tool === 'cobrir' ? '1' : '0'
    if (w.fog[i] !== v) { w.fog = w.fog.slice(0, i) + v + w.fog.slice(i + 1); draw() }
  }

  const down = (e: PointerEvent<HTMLCanvasElement>) => {
    const w = workRef.current
    const [x, y] = pos(e)
    if (readOnly || tool === 'mirar') {
      // Mirar: clicar numa ficha a faz alvo sem tirar a seleção de quem ataca
      const t = [...w.tokens].reverse().find(k => k.x === x && k.y === y)
      if (t) { if (readOnly) onSelect(t.id); onPick?.(t.id) }
      return
    }
    e.currentTarget.setPointerCapture(e.pointerId)
    if (tool === 'mover') {
      const t = [...w.tokens].reverse().find(k => k.x === x && k.y === y)
      onSelect(t ? t.id : null)
      const wr = wrapRef.current
      dragRef.current = t ? { tok: t.id } : wr ? { pan: { x: e.clientX, y: e.clientY, sl: wr.scrollLeft, st: wr.scrollTop } } : null
    } else if (tool === 'medir') {
      measureRef.current = [x, y, x, y]; dragRef.current = { measure: true }; draw()
    } else if (tool === 'parede') {
      const [px, py] = pos(e, true); const cx = Math.round(px), cy = Math.round(py)
      dragRef.current = { wall: [cx, cy, cx, cy] }
    } else if (tool === 'apagar') {
      const [px, py] = pos(e, true)
      const i = w.walls.findIndex(s => segDist(px, py, parseWall(s)) < 0.35)
      if (i >= 0) { w.walls.splice(i, 1); draw(); commit() }
    } else {
      w.fogOn = true; dragRef.current = { fog: true }; paint(e)
    }
  }

  const move = (e: PointerEvent<HTMLCanvasElement>) => {
    const dr = dragRef.current
    if (!dr) return
    if ('tok' in dr) {
      const [x, y] = pos(e)
      const t = workRef.current.tokens.find(k => k.id === dr.tok)
      if (t && inside(x, y) && (t.x !== x || t.y !== y)) { t.x = x; t.y = y; draw() }
    } else if ('pan' in dr) {
      const wr = wrapRef.current
      if (wr) { wr.scrollLeft = dr.pan.sl - (e.clientX - dr.pan.x); wr.scrollTop = dr.pan.st - (e.clientY - dr.pan.y) }
    } else if ('wall' in dr) {
      const [px, py] = pos(e, true); dr.wall[2] = Math.round(px); dr.wall[3] = Math.round(py); draw()
    } else if ('fog' in dr) paint(e)
    else if ('measure' in dr && measureRef.current) {
      const [x, y] = pos(e); measureRef.current = [measureRef.current[0], measureRef.current[1], x, y]; draw()
    }
  }

  const up = () => {
    const dr = dragRef.current
    dragRef.current = null
    if (!dr) return
    if ('wall' in dr) { const [a, b, c, d] = dr.wall; if (a !== c || b !== d) workRef.current.walls.push(wallKey(dr.wall)) }
    if ('measure' in dr) { setMeasure(measureRef.current); draw(); return }
    if ('pan' in dr) return
    draw(); commit()
  }

  // Teclado: setas movem a ficha selecionada, Delete a remove.
  const key = (e: KeyboardEvent) => {
    if (readOnly) return
    const w = workRef.current
    const t = w.tokens.find(k => k.id === sel)
    if (!t) return
    const d: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
    if (d[e.key]) {
      e.preventDefault()
      const x = t.x + d[e.key][0], y = t.y + d[e.key][1]
      if (inside(x, y)) { t.x = x; t.y = y; commit() }
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault(); w.tokens = w.tokens.filter(k => k.id !== sel); onSelect(null); commit()
    }
  }

  const W = m.cols * CELL
  return (
    <div ref={wrapRef} className="overflow-auto bg-black" style={{ maxHeight: maxH }}>
      <canvas ref={cvRef} tabIndex={0} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onKeyDown={key}
        aria-label={`Mapa tático ${m.cols} por ${m.rows} quadrados${measure ? `, medindo ${gridDist(...measure)} quadrados` : ''}`}
        className="block touch-none select-none outline-none focus-visible:outline-2 focus-visible:outline-gold"
        style={{ width: zoom === 'ajustar' ? '100%' : W * zoom, maxWidth: zoom === 'ajustar' ? '100%' : 'none', cursor: readOnly ? (onPick ? 'pointer' : 'default') : tool === 'mover' ? 'grab' : 'crosshair', imageRendering: 'pixelated' }} />
    </div>
  )
}
