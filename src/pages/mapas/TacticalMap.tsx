import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { RANGES, RANGE_LABEL } from '../../data/saga'
import { ASSET, useAsset } from '../../lib/assets'
import type { Campaign } from '../../rules/types'
import { useStore } from '../../store/campaign'
import { CELL, paintScene } from './scenes'
import { fogOf, gridDist, inkOn, parseWall, segDist, wallKey, type Wall } from './geometry'

export type MapState = Campaign['map']
export type Tool = 'mover' | 'medir' | 'parede' | 'apagar' | 'cobrir' | 'revelar'
export type RangeKey = keyof typeof RANGES
/** Estado de cada ficha ligada ao combate: fração de PV e se caiu. */
export type TokInfo = Record<string, { pct: number; down: boolean }>

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
}

/** Mapa tático em canvas: fichas arrastáveis (mouse e toque), paredes, névoa e régua. */
export function TacticalMap({ tool, gmView, range, zoom, sel, onSelect, info }: Props) {
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

  // A ferramenta mudou: a régua some.
  useEffect(() => { measureRef.current = null; setMeasure(null) }, [tool])

  function draw() {
    const cv = cvRef.current
    if (!cv) return
    const w = workRef.current
    const W = w.cols * CELL, H = w.rows * CELL
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H }
    const ctx = cv.getContext('2d')
    if (!ctx) return
    // fundo em cache
    const key = `${w.scene}${W}x${H}${image ? url : ''}`
    if (bgCache.current.key !== key) {
      const b = document.createElement('canvas'); b.width = W; b.height = H
      const bc = b.getContext('2d')
      if (bc) { if (image) bc.drawImage(image, 0, 0, W, H); else paintScene(bc, W, H, w.scene) }
      bgCache.current = { key, cv: b }
    }
    if (bgCache.current.cv) ctx.drawImage(bgCache.current.cv, 0, 0)
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
    // fichas
    w.tokens.forEach(t => {
      const cx = (t.x + 0.5) * CELL, cy = (t.y + 0.5) * CELL, r = CELL * 0.42
      const st = t.ref ? info[t.ref] : undefined
      ctx.globalAlpha = st?.down ? 0.45 : 1
      ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.beginPath(); ctx.arc(cx + 2, cy + 3, r, 0, 7); ctx.fill()
      ctx.fillStyle = t.color; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill()
      ctx.lineWidth = t.id === sel ? 4 : 2; ctx.strokeStyle = t.id === sel ? '#ffd24a' : '#05070d'; ctx.stroke()
      // arco fino de PV para fichas ligadas ao combate
      if (st) {
        ctx.lineWidth = 3; ctx.strokeStyle = st.pct <= 0.5 ? '#c4141c' : '#efe6d2'
        ctx.beginPath(); ctx.arc(cx, cy, r + 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, st.pct)); ctx.stroke()
      }
      ctx.fillStyle = inkOn(t.color); ctx.font = `bold ${CELL * 0.34}px "Share Tech Mono", monospace`
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(t.label.slice(0, 3), cx, cy + 1)
      if (st?.down) { ctx.strokeStyle = '#c4141c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - r * 0.7, cy - r * 0.7); ctx.lineTo(cx + r * 0.7, cy + r * 0.7); ctx.moveTo(cx + r * 0.7, cy - r * 0.7); ctx.lineTo(cx - r * 0.7, cy + r * 0.7); ctx.stroke() }
      ctx.globalAlpha = 1
    })
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
  }

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
    e.currentTarget.setPointerCapture(e.pointerId)
    const w = workRef.current
    const [x, y] = pos(e)
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
    <div ref={wrapRef} className="max-h-[78vh] overflow-auto bg-black">
      <canvas ref={cvRef} tabIndex={0} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onKeyDown={key}
        aria-label={`Mapa tático ${m.cols} por ${m.rows} quadrados${measure ? `, medindo ${gridDist(...measure)} quadrados` : ''}`}
        className="block touch-none select-none outline-none focus-visible:outline-2 focus-visible:outline-gold"
        style={{ width: zoom === 'ajustar' ? '100%' : W * zoom, maxWidth: zoom === 'ajustar' ? '100%' : 'none', cursor: tool === 'mover' ? 'grab' : 'crosshair' }} />
    </div>
  )
}
