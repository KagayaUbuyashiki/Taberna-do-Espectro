export const rnd = (n: number) => 1 + Math.floor(Math.random() * n)
export const sgn = (n: number) => (n >= 0 ? '+' : '') + n
export const mod = (score: number) => Math.floor((score || 0) / 2) - 5

export interface ExprResult { total: number; detail: string; dice: { n: number; s: number; rs: number[] }[] }

/** Avalia expressões como "1d20+5", "3d8+2" ou "2d6×2". */
export function rollExpr(expr: string, rng: (n: number) => number = rnd): ExprResult {
  const clean = String(expr).toLowerCase().replace(/\s+/g, '').replace(/×/g, '*')
  let mult = 1
  let e = clean
  const mm = e.match(/\*(\d+)$/)
  if (mm && mm.index !== undefined) { mult = +mm[1]; e = e.slice(0, mm.index) }
  const parts = e.match(/[+-]?[^+-]+/g) || []
  let total = 0
  const detail: string[] = []
  const dice: ExprResult['dice'] = []
  for (const p of parts) {
    const sign = p[0] === '-' ? -1 : 1
    const body = p.replace(/^[+-]/, '')
    const d = body.match(/^(\d*)d(\d+)$/)
    if (d) {
      const n = +(d[1] || 1), s = +d[2]
      const rs: number[] = []
      for (let i = 0; i < Math.min(n, 100); i++) rs.push(rng(s))
      total += rs.reduce((a, b) => a + b, 0) * sign
      dice.push({ n, s, rs })
      detail.push(`${sign < 0 ? '-' : ''}${n}d${s}[${rs.join(',')}]`)
    } else if (/^\d+$/.test(body)) {
      total += sign * +body
      detail.push((sign < 0 ? '-' : '+') + body)
    }
  }
  total *= mult
  if (mult > 1) detail.push('×' + mult)
  return { total, detail: detail.join(' ').replace(/^\+/, ''), dice }
}
