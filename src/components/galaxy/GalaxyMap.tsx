import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CENTRO, GRID, PLANETAS, PLANETA_BY, ROTAS, TIERS, posicao, type Planeta } from '../../data/galaxy'
import { rng } from './rng'

const W = 1000
const H = (W * GRID.rows) / GRID.cols
const COLS = 'ABCDEFGHIJKLMNOPQRSTUV'

interface Cam { x: number; y: number; k: number }

export interface GalaxyMapProps {
  selected: string | null
  onSelect: (id: string | null) => void
  naveEm: string
  /** Planetas que a nave pode alcançar (coordenadas conhecidas). */
  alcancaveis: Set<string>
  /** Planetas desenhados no mapa. */
  visiveis: Set<string>
  /** Espaço reservado à direita (painel de detalhes), em px, para centralizar o foco. */
  reservaDireita?: number
}

/** Pontos de estrelas da galáxia em espiral, gerados uma vez. */
function useGalaxia() {
  return useMemo(() => {
    const r = rng('galaxia-taberna')
    const cx = CENTRO.x * W, cy = CENTRO.y * H
    const grupos: string[][] = [[], [], [], []]
    const nebulosas: { x: number; y: number; r: number; cor: string }[] = []
    const ponto = (g: number, x: number, y: number) => {
      if (x > 0 && x < W && y > 0 && y < H) grupos[g].push(`M${x.toFixed(1)} ${y.toFixed(1)}h0`)
    }
    const arms = 4
    for (let i = 0; i < 7000; i++) {
      const arm = i % arms
      const t = Math.pow(r(), 0.8) * 4 * Math.PI
      const rad = 12 * Math.exp(0.27 * t)
      const ang = t + (arm * 2 * Math.PI) / arms
      const spread = 3 + rad * 0.11
      const x = cx + Math.cos(ang) * rad + (r() - 0.5) * spread * 2
      const y = cy + Math.sin(ang) * rad * 0.95 + (r() - 0.5) * spread * 2
      // braços externos azulados, internos dourados
      ponto(rad > 150 ? (r() < 0.85 ? 3 : 2) : r() < 0.7 ? 0 : r() < 0.85 ? 1 : 2, x, y)
      if (i % 260 === 0 && rad > 60) nebulosas.push({ x, y, r: 10 + r() * 22, cor: r() < 0.5 ? '#c04a6a' : '#4a7ac0' })
    }
    for (let i = 0; i < 1200; i++) { // halo do núcleo
      const a = r() * Math.PI * 2, d = Math.pow(r(), 2) * 80
      ponto(r() < 0.6 ? 1 : 2, cx + Math.cos(a) * d, cy + Math.sin(a) * d)
    }
    for (let i = 0; i < 1500; i++) ponto(0, r() * W, r() * H) // estrelas de campo
    return { pontos: grupos.map(g => g.join('')), nebulosas }
  }, [])
}

const REGIOES_ANEIS = [
  { r: 38, nome: 'Núcleo Profundo' }, { r: 70, nome: 'Mundos do Núcleo' }, { r: 105, nome: 'Colônias' },
  { r: 145, nome: 'Orla Interior' }, { r: 195, nome: 'Região de Expansão' }, { r: 275, nome: 'Orla Média' }, { r: 430, nome: 'Orla Exterior' },
]

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

export function GalaxyMap({ selected, onSelect, naveEm, alcancaveis, visiveis, reservaDireita = 0 }: GalaxyMapProps) {
  const box = useRef<HTMLDivElement>(null)
  const svg = useRef<SVGSVGElement>(null)
  const [size, setSize] = useState({ w: 800, h: 600 })
  const [cam, setCam] = useState<Cam>({ x: 0, y: 0, k: 0.8 })
  const [hover, setHover] = useState<string | null>(null)
  const camRef = useRef(cam)
  camRef.current = cam
  const anim = useRef<number | null>(null)
  const fitK = Math.min(size.w / W, size.h / H) * 0.96
  const { pontos: stars, nebulosas } = useGalaxia()

  const fit = useCallback((w: number, h: number) => {
    const k = Math.min(w / W, h / H) * 0.96
    setCam({ k, x: (w - W * k) / 2, y: (h - H * k) / 2 })
  }, [])

  useEffect(() => {
    const el = box.current!
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect
      setSize(prev => {
        if (prev.w === 800 && prev.h === 600) fit(width, height)
        return { w: width, h: height }
      })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [fit])

  const animarPara = useCallback((alvo: Cam, ms = 750) => {
    if (anim.current) cancelAnimationFrame(anim.current)
    const de = { ...camRef.current }
    const t0 = performance.now()
    const passo = (t: number) => {
      const p = ease(Math.min(1, (t - t0) / ms))
      // zoom em escala logarítmica, como uma câmera
      const k = Math.exp(Math.log(de.k) + (Math.log(alvo.k) - Math.log(de.k)) * p)
      setCam({ k, x: de.x + (alvo.x - de.x) * p, y: de.y + (alvo.y - de.y) * p })
      if (p < 1) anim.current = requestAnimationFrame(passo)
    }
    anim.current = requestAnimationFrame(passo)
  }, [])

  // Clicou num planeta: a câmera voa até ele.
  useEffect(() => {
    if (!selected) return
    const p = PLANETA_BY[selected]
    const { x, y } = posicao(p)
    const k = Math.max(fitK * 5, camRef.current.k)
    // No celular o painel cobre a parte de baixo: o planeta fica no topo visível.
    const largo = size.w >= 768
    const cx = (size.w - (largo ? reservaDireita : 0)) / 2
    const cy = largo ? size.h / 2 : size.h * 0.22
    animarPara({ k, x: cx - x * W * k, y: cy - y * H * k })
  }, [selected]) // eslint-disable-line react-hooks/exhaustive-deps

  // Zoom pela roda do mouse, centrado no cursor.
  useEffect(() => {
    const el = svg.current!
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (anim.current) cancelAnimationFrame(anim.current)
      const rect = el.getBoundingClientRect()
      zoomEm(e.clientX - rect.left, e.clientY - rect.top, Math.exp(-e.deltaY * 0.0015))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  })

  const zoomEm = (sx: number, sy: number, f: number) => {
    setCam(c => {
      const k = Math.min(fitK * 14, Math.max(fitK * 0.8, c.k * f))
      const r = k / c.k
      return { k, x: sx - (sx - c.x) * r, y: sy - (sy - c.y) * r }
    })
  }

  // Arrastar (mouse ou dedo) e pinça com dois dedos.
  const ptrs = useRef(new Map<number, { x: number; y: number }>())
  const moved = useRef(0)
  const pinch = useRef<number | null>(null)
  const onDown = (e: React.PointerEvent) => {
    if (anim.current) cancelAnimationFrame(anim.current)
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    moved.current = 0
    pinch.current = null
  }
  const onMove = (e: React.PointerEvent) => {
    const prev = ptrs.current.get(e.pointerId)
    if (!prev) return
    const now = { x: e.clientX, y: e.clientY }
    ptrs.current.set(e.pointerId, now)
    if (ptrs.current.size === 2) {
      const [a, b] = [...ptrs.current.values()]
      const d = Math.hypot(a.x - b.x, a.y - b.y)
      if (pinch.current) {
        const rect = svg.current!.getBoundingClientRect()
        zoomEm((a.x + b.x) / 2 - rect.left, (a.y + b.y) / 2 - rect.top, d / pinch.current)
      }
      pinch.current = d
      moved.current += 10
      return
    }
    const dx = now.x - prev.x, dy = now.y - prev.y
    moved.current += Math.abs(dx) + Math.abs(dy)
    // só captura o ponteiro quando vira arrasto, para o clique no planeta continuar funcionando
    if (moved.current > 6 && !svg.current!.hasPointerCapture(e.pointerId)) svg.current!.setPointerCapture(e.pointerId)
    setCam(c => ({ ...c, x: c.x + dx, y: c.y + dy }))
  }
  const onUp = (e: React.PointerEvent) => {
    ptrs.current.delete(e.pointerId)
    if (ptrs.current.size < 2) pinch.current = null
  }

  const z = cam.k / fitK // nível de zoom relativo (1 = galáxia inteira)
  const px = (n: number) => n / cam.k // tamanho em pixels de tela → unidades do mundo
  const raio = (p: Planeta) => px((p.id === selected ? 9 : 6.5) * Math.min(4, Math.pow(z, 0.45)))
  const nave = posicao(PLANETA_BY[naveEm])
  const sel = selected ? PLANETA_BY[selected] : null
  const selPos = sel ? posicao(sel) : null

  const resetar = () => { onSelect(null); animarPara({ k: fitK, x: (size.w - W * fitK) / 2, y: (size.h - H * fitK) / 2 }) }

  return (
    <div ref={box} className="relative h-full w-full select-none overflow-hidden bg-void"
      style={{ backgroundImage: 'radial-gradient(1px 1px at 20px 30px,#fff8,transparent),radial-gradient(1px 1px at 90px 120px,#fff6,transparent),radial-gradient(1.5px 1.5px at 160px 60px,#ffe6c0aa,transparent),radial-gradient(1px 1px at 220px 190px,#cfd8ff88,transparent)', backgroundSize: '260px 240px', backgroundPosition: `${cam.x * 0.15}px ${cam.y * 0.15}px` }}>
      <svg
        ref={svg}
        width={size.w}
        height={size.h}
        className="block cursor-grab touch-none active:cursor-grabbing"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onClick={() => { if (moved.current < 6) onSelect(null) }}
      >
        <defs>
          <radialGradient id="gx-nucleo">
            <stop offset="0" stopColor="#fff4d8" stopOpacity=".9" />
            <stop offset=".12" stopColor="#ffd9a0" stopOpacity=".55" />
            <stop offset=".45" stopColor="#c07a50" stopOpacity=".16" />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="gx-desconhecidas" cx="0" cy=".5" r="1">
            <stop offset="0" stopColor="#000" stopOpacity=".75" />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </radialGradient>
          <filter id="gx-neb" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="8" /></filter>
          <filter id="gx-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2" />
          </filter>
        </defs>
        <g transform={`translate(${cam.x} ${cam.y}) scale(${cam.k})`}>
          <rect x={-W} y={-H} width={W * 3} height={H * 3} fill="transparent" />
          {/* Disco da galáxia */}
          <ellipse cx={CENTRO.x * W} cy={CENTRO.y * H} rx={W * 0.48} ry={H * 0.47} fill="url(#gx-nucleo)" opacity=".7" />
          {nebulosas.map((n, i) => <circle key={i} cx={n.x} cy={n.y} r={n.r} fill={n.cor} opacity=".14" filter="url(#gx-neb)" />)}
          <path d={stars[3]} stroke="#9ec0ff" strokeOpacity=".55" strokeWidth={1.2} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          <path d={stars[0]} stroke="#cfd8ff" strokeOpacity=".45" strokeWidth={1} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          <path d={stars[1]} stroke="#ffe2b8" strokeOpacity=".7" strokeWidth={1.6} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          <path d={stars[2]} stroke="#fff" strokeOpacity=".9" strokeWidth={2.2} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          {/* Regiões Desconhecidas: o oeste escuro */}
          <path d={`M0 0 H${W * 0.3} C${W * 0.36} ${H * 0.3} ${W * 0.24} ${H * 0.55} ${W * 0.33} ${H} H0Z`} fill="url(#gx-desconhecidas)" />
          <text x={W * 0.03} y={H * 0.3} fill="currentColor" className="fill-ash font-display uppercase" fontSize={px(13)} letterSpacing={px(4)} opacity=".7">Regiões Desconhecidas</text>
          {/* Anéis de região */}
          {REGIOES_ANEIS.map(a => (
            <g key={a.nome} opacity={z > 6 ? 0.25 : 0.55}>
              <ellipse cx={CENTRO.x * W} cy={CENTRO.y * H} rx={a.r} ry={a.r * 0.96} fill="none" stroke="#9a8f80" strokeOpacity=".35" strokeDasharray="4 6" strokeWidth={1} vectorEffect="non-scaling-stroke" />
              {a.r * cam.k > 70 && <text x={CENTRO.x * W} y={CENTRO.y * H - a.r * 0.96 - px(4)} textAnchor="middle" className="fill-ash font-display uppercase" fontSize={px(10)} letterSpacing={px(3)}>{a.nome}</text>}
            </g>
          ))}
          {/* Grade canônica A–V × 1–21 */}
          <g opacity={z > 2 ? 0.5 : 0.25}>
            {Array.from({ length: GRID.cols + 1 }, (_, i) => (
              <line key={`c${i}`} x1={(i * W) / GRID.cols} x2={(i * W) / GRID.cols} y1={0} y2={H} stroke="#9a8f80" strokeOpacity=".25" strokeWidth={1} vectorEffect="non-scaling-stroke" />
            ))}
            {Array.from({ length: GRID.rows + 1 }, (_, i) => (
              <line key={`r${i}`} y1={(i * H) / GRID.rows} y2={(i * H) / GRID.rows} x1={0} x2={W} stroke="#9a8f80" strokeOpacity=".25" strokeWidth={1} vectorEffect="non-scaling-stroke" />
            ))}
            {[...COLS].map((c, i) => <text key={c} x={((i + 0.5) * W) / GRID.cols} y={px(12)} textAnchor="middle" className="fill-ash font-mono" fontSize={px(10)}>{c}</text>)}
            {Array.from({ length: GRID.rows }, (_, i) => <text key={i} x={px(4)} y={((i + 0.5) * H) / GRID.rows} dominantBaseline="middle" className="fill-ash font-mono" fontSize={px(10)}>{i + 1}</text>)}
          </g>
          {/* Rotas hiperespaciais */}
          {ROTAS.map(r => {
            const pts = r.planetas.map(id => posicao(PLANETA_BY[id])).map(p => `${p.x * W},${p.y * H}`).join(' ')
            return (
              <polyline key={r.nome} points={pts} fill="none" stroke="#c4141c" strokeOpacity=".35" strokeWidth={1.4} strokeDasharray="2 5" vectorEffect="non-scaling-stroke">
                <title>{r.nome}</title>
              </polyline>
            )
          })}
          {/* Rota da nave até o planeta escolhido */}
          {selPos && sel && sel.id !== naveEm && (
            <line x1={nave.x * W} y1={nave.y * H} x2={selPos.x * W} y2={selPos.y * H}
              stroke={alcancaveis.has(sel.id) ? '#efe6d2' : '#9a8f80'} strokeOpacity=".8" strokeWidth={1.5}
              strokeDasharray={alcancaveis.has(sel.id) ? '8 4' : '2 6'} vectorEffect="non-scaling-stroke">
              <animate attributeName="stroke-dashoffset" from="24" to="0" dur="1s" repeatCount="indefinite" />
            </line>
          )}
          {/* Planetas */}
          {PLANETAS.filter(p => visiveis.has(p.id)).map(p => {
            const { x, y } = posicao(p)
            const ok = alcancaveis.has(p.id) || p.id === naveEm
            const r = raio(p)
            const ativo = p.id === selected || p.id === hover
            const mostrarNome = ativo || z > 1.8 || (ok && z > 1.1)
            return (
              <g
                key={p.id}
                transform={`translate(${x * W} ${y * H})`}
                className="cursor-pointer"
                opacity={ok ? 1 : 0.5}
                onPointerEnter={() => setHover(p.id)}
                onPointerLeave={() => setHover(h => (h === p.id ? null : h))}
                onClick={e => { e.stopPropagation(); if (moved.current < 6) onSelect(p.id) }}
              >
                <circle r={r * 3} fill="transparent" />
                <circle r={r * 1.9} fill={p.cor} opacity={ativo ? 0.45 : 0.22} filter="url(#gx-glow)" />
                <circle r={r} fill={p.cor} stroke={ok ? '#efe6d2' : '#9a8f80'} strokeWidth={ativo ? 2 : 1} vectorEffect="non-scaling-stroke" strokeDasharray={ok ? undefined : '2 2'} />
                {/* sombra para parecer esfera */}
                <circle r={r} fill="#000" opacity=".35" transform={`translate(${r * 0.35} ${r * 0.35}) scale(.85)`} />
                {/* tier */}
                <circle r={r + px(3)} fill="none" stroke={TIERS[p.tier].cor} strokeWidth={1.5} strokeOpacity={ativo || z > 1.5 ? 0.9 : 0} vectorEffect="non-scaling-stroke" />
                {p.tipo === 'kyber' && (
                  <path d={`M0 ${-r - px(10)} l${px(4)} ${px(6)} l${-px(4)} ${px(6)} l${-px(4)} ${-px(6)}z`} fill="#a0e0ff" />
                )}
                {mostrarNome && (
                  <text y={r + px(14)} textAnchor="middle" className="pointer-events-none fill-bone font-display uppercase" fontSize={px(ativo ? 13 : 11)} letterSpacing={px(1.5)} paintOrder="stroke" stroke="#0a0708" strokeWidth={px(3)}>
                    {p.nome}{ok ? '' : ' 🔒'}
                  </text>
                )}
              </g>
            )
          })}
          {/* A nave */}
          <g transform={`translate(${nave.x * W} ${nave.y * H})`} className="pointer-events-none">
            <circle r={px(16)} fill="none" stroke="#c4141c" strokeWidth={1.5} vectorEffect="non-scaling-stroke">
              <animate attributeName="r" values={`${px(10)};${px(20)};${px(10)}`} dur="2.4s" repeatCount="indefinite" />
              <animate attributeName="stroke-opacity" values="1;0;1" dur="2.4s" repeatCount="indefinite" />
            </circle>
            <path d={`M0 ${-px(14)} L${px(6)} ${-px(4)} L0 ${-px(7)} L${-px(6)} ${-px(4)}Z`} fill="#c4141c" stroke="#efe6d2" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          </g>
        </g>
      </svg>

      {/* Controles */}
      <div className="absolute bottom-3 left-3 flex flex-col gap-1">
        {[['+', 1.5], ['−', 1 / 1.5]].map(([l, f]) => (
          <button key={l} type="button" onClick={() => zoomEm(size.w / 2, size.h / 2, f as number)}
            className="h-9 w-9 border border-line bg-panel/90 font-display text-xl text-bone hover:border-ember">{l}</button>
        ))}
        <button type="button" onClick={resetar} title="Ver a galáxia inteira"
          className="h-9 w-9 border border-line bg-panel/90 font-mono text-xs text-bone hover:border-ember">⌂</button>
      </div>
      <div className="pointer-events-none absolute bottom-3 right-3 hidden border border-line bg-panel/80 p-2 font-mono text-[11px] text-ash sm:block">
        {([1, 2, 3, 4] as const).map(t => (
          <div key={t} className="flex items-center gap-2"><span className="inline-block h-2.5 w-2.5 rounded-full border-2" style={{ borderColor: TIERS[t].cor }} />Tier {t} · {TIERS[t].nome}</div>
        ))}
        <div className="mt-1 flex items-center gap-2"><span className="text-ember">▲</span>Sua nave</div>
        <div className="flex items-center gap-2"><span>🔒</span>Sem coordenadas</div>
      </div>
    </div>
  )
}
