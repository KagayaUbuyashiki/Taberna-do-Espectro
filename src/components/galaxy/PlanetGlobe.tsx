import { useId, useMemo } from 'react'
import type { Planeta } from '../../data/galaxy'
import { rng } from './rng'

function shade(hex: string, f: number) {
  const n = parseInt(hex.slice(1), 16)
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => Math.max(0, Math.min(255, Math.round(f > 0 ? v + (255 - v) * f : v * (1 + f)))))
  return `rgb(${c.join(',')})`
}

type Estilo = 'faixas' | 'gelo' | 'oceano' | 'lava' | 'cidade' | 'continentes'

function estiloDe(p: Planeta): Estilo {
  if (p.tags.includes('gasoso')) return 'faixas'
  if (p.tags.includes('lava')) return 'lava'
  if (p.tags.includes('gelo') || p.tags.includes('kyber')) return 'gelo'
  if (p.tags.includes('urbano') && p.tags.includes('capital')) return 'cidade'
  if (p.tags.includes('oceano')) return 'oceano'
  return 'continentes'
}

/** Planeta desenhado em SVG, girando devagar. Superfície gerada a partir do id e das tags. */
export function PlanetGlobe({ planeta, size = 220, spin = true }: { planeta: Planeta; size?: number; spin?: boolean }) {
  const id = `pg-${useId().replace(/:/g, '')}`
  const estilo = estiloDe(planeta)
  const base = planeta.cor

  // Superfície numa faixa de 2 larguras que desliza para simular rotação.
  const shapes = useMemo(() => {
    const r = rng(planeta.id)
    const out: { x: number; y: number; rx: number; ry: number; fill: string; o: number }[] = []
    const add = (x: number, y: number, rx: number, ry: number, fill: string, o: number) => {
      out.push({ x, y, rx, ry, fill, o }, { x: x + 100, y, rx, ry, fill, o })
    }
    if (estilo === 'faixas') {
      for (let y = 0; y < 100; y += 4 + r() * 8) add(50, y, 80, 1.5 + r() * 4, shade(base, (r() - 0.5) * 0.6), 0.8)
      add(r() * 100, 55 + r() * 20, 7, 4, shade(base, -0.35), 0.9)
    } else if (estilo === 'cidade') {
      for (let i = 0; i < 260; i++) add(r() * 100, r() * 100, 0.5 + r(), 0.5 + r(), r() > 0.5 ? '#ffe6a0' : shade(base, -0.4), 0.9)
    } else if (estilo === 'lava') {
      for (let i = 0; i < 26; i++) add(r() * 100, r() * 100, 3 + r() * 14, 0.8 + r() * 2, r() > 0.4 ? '#ffb040' : '#ff5a20', 0.85)
    } else {
      const terra = estilo === 'oceano' ? shade(base, 0.35) : shade(base, -0.25)
      const n = estilo === 'oceano' ? 10 : 18
      for (let i = 0; i < n; i++) {
        const x = r() * 100, y = 15 + r() * 70, s = estilo === 'oceano' ? 3 + r() * 5 : 6 + r() * 14
        add(x, y, s, s * (0.5 + r() * 0.6), terra, 0.85)
        add(x + s * 0.4, y + s * 0.2, s * 0.6, s * 0.4, shade(base, (r() - 0.5) * 0.5), 0.7)
      }
      if (estilo === 'gelo' || planeta.tags.includes('montanhas')) {
        add(50, 2, 80, 10, '#f4f8ff', 0.9)
        add(50, 98, 80, 10, '#f4f8ff', 0.9)
      }
    }
    return out
  }, [planeta.id, estilo, base, planeta.tags])

  const glow = estilo === 'lava' ? '#ff6a30' : estilo === 'gelo' ? '#cfe8ff' : shade(base, 0.4)

  return (
    <svg viewBox="-60 -60 120 120" width={size} height={size} role="img" aria-label={`Planeta ${planeta.nome}`} className="overflow-visible">
      <defs>
        <clipPath id={`${id}-clip`}><circle r="50" /></clipPath>
        <radialGradient id={`${id}-shade`} cx="35%" cy="35%" r="75%">
          <stop offset="0" stopColor="#fff" stopOpacity=".18" />
          <stop offset=".55" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".85" />
        </radialGradient>
        <radialGradient id={`${id}-atm`}>
          <stop offset=".78" stopColor={glow} stopOpacity="0" />
          <stop offset=".86" stopColor={glow} stopOpacity=".45" />
          <stop offset="1" stopColor={glow} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle r="60" fill={`url(#${id}-atm)`} />
      <g clipPath={`url(#${id}-clip)`}>
        <circle r="50" fill={estilo === 'lava' ? '#2a1210' : estilo === 'cidade' ? shade(base, -0.55) : base} />
        <g transform="translate(-50 -50)">
          <g>
            {spin && <animateTransform attributeName="transform" type="translate" from="0 0" to="-100 0" dur="60s" repeatCount="indefinite" />}
            {shapes.map((s, i) => <ellipse key={i} cx={s.x} cy={s.y} rx={s.rx} ry={s.ry} fill={s.fill} opacity={s.o} />)}
          </g>
        </g>
        <circle r="50" fill={`url(#${id}-shade)`} />
      </g>
    </svg>
  )
}
