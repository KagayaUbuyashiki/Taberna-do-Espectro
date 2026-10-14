import { useMemo } from 'react'

const SEGS = [[0, 0, 10, 0], [0, 7, 10, 7], [0, 14, 10, 14], [0, 0, 0, 14], [10, 0, 10, 14], [5, 0, 5, 14], [0, 0, 10, 14], [10, 0, 0, 14], [0, 7, 5, 0], [5, 14, 10, 7]]

function glyph(ch: string) {
  let h = 0
  for (const c of ch) h = (h * 31 + c.charCodeAt(0)) >>> 0
  let d = ''
  let k = 0
  for (let i = 0; i < SEGS.length; i++) {
    if ((h >> i) & 1 && k < 4) {
      const [a, b, c, e] = SEGS[i]
      d += `M${a} ${b}L${c} ${e}`
      k++
    }
  }
  return k < 2 ? d + 'M0 0L10 0M5 0L5 14' : d
}

/** Escrita alienígena original (decorativa). Cada letra vira um glifo de traços. */
export function AlienText({ text, size = 12, className }: { text: string; size?: number; className?: string }) {
  const { paths, width } = useMemo(() => {
    let x = 0
    const out: { x: number; d: string }[] = []
    for (const ch of text.toLowerCase()) {
      if (ch === ' ') { x += 8; continue }
      out.push({ x, d: glyph(ch) })
      x += 15
    }
    return { paths: out, width: Math.max(x, 1) }
  }, [text])
  return (
    <svg aria-hidden className={className} width={(width * size) / 14} height={size * 1.15} viewBox={`0 0 ${width} 16`} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="square">
      {paths.map((p, i) => <path key={i} transform={`translate(${p.x} 1)`} d={p.d} />)}
    </svg>
  )
}
