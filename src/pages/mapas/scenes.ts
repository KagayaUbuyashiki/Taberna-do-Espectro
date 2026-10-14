/* Cenários procedurais do mapa tático (portados de map.js). Usados enquanto não há imagem em mapas/<cena>.jpg. */
export const CELL = 40

export const SCENES: Record<string, string> = {
  cantina: 'Cantina do espaçoporto', deserto: 'Dunas de Tatooine', hangar: 'Hangar de atracação', floresta: 'Floresta de Endor',
  gelo: 'Planícies de Hoth', nave: 'Corredores de uma nave', vazio: 'Grade limpa',
}

/** Gerador pseudoaleatório com semente (o mesmo cenário sempre sai igual). */
function seeded(seed: number) {
  let s = seed >>> 0 || 1
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 10000) / 10000 }
}

export function paintScene(ctx: CanvasRenderingContext2D, W: number, H: number, scene: string) {
  const R = seeded(scene.length * 997 + W + H)
  const fill = (c: string) => { ctx.fillStyle = c; ctx.fillRect(0, 0, W, H) }
  const TAU = Math.PI * 2
  if (scene === 'cantina') {
    fill('#3a2a1e')
    for (let x = 0; x < W; x += CELL * 2) for (let y = 0; y < H; y += CELL * 2) {
      ctx.fillStyle = ((x + y) / (CELL * 2)) % 2 ? '#43301f' : '#3d2b1c'; ctx.fillRect(x, y, CELL * 2, CELL * 2)
    }
    // balcão curvo
    ctx.beginPath(); ctx.arc(W * 0.5, H * 0.18, Math.min(W, H) * 0.22, Math.PI * 0.15, Math.PI * 0.85, false)
    ctx.lineWidth = CELL * 0.9; ctx.strokeStyle = '#6b4a2a'; ctx.stroke(); ctx.lineWidth = 2; ctx.strokeStyle = '#d9a860'; ctx.stroke()
    // mesas com bancos
    for (let i = 0; i < 9; i++) {
      const x = CELL * (2 + Math.floor(R() * (W / CELL - 4))), y = CELL * (4 + Math.floor(R() * (H / CELL - 6)))
      ctx.fillStyle = '#6e5034'; ctx.beginPath(); ctx.arc(x, y, CELL * 0.7, 0, TAU); ctx.fill(); ctx.strokeStyle = '#a5783f'; ctx.stroke()
      for (let k = 0; k < 3; k++) {
        const a = k * 2.1 + R(); ctx.fillStyle = '#2a1d12'; ctx.beginPath(); ctx.arc(x + Math.cos(a) * CELL * 1.05, y + Math.sin(a) * CELL * 1.05, CELL * 0.25, 0, TAU); ctx.fill()
      }
    }
    ctx.fillStyle = '#24180f'; ctx.fillRect(0, H - CELL * 1.2, W, CELL * 1.2); ctx.fillStyle = '#e8b86a'; ctx.fillRect(W / 2 - CELL, H - CELL * 1.2, CELL * 2, 6)
  } else if (scene === 'deserto') {
    const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#d9a85a'); g.addColorStop(1, '#b9823e'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
    ctx.strokeStyle = 'rgba(120,70,20,.35)'; ctx.lineWidth = 2
    for (let i = 0; i < 40; i++) { const y = R() * H, x = R() * W; ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(x + 60, y - 20, x + 120, y + 20, x + 200, y); ctx.stroke() }
    for (let i = 0; i < 14; i++) {
      const x = R() * W, y = R() * H, r = CELL * (0.4 + R() * 1.2)
      ctx.fillStyle = '#8a6a48'; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.7, R() * 3, 0, TAU); ctx.fill()
      ctx.fillStyle = 'rgba(255,230,180,.25)'; ctx.beginPath(); ctx.ellipse(x - r * 0.2, y - r * 0.2, r * 0.5, r * 0.3, 0, 0, TAU); ctx.fill()
    }
  } else if (scene === 'hangar') {
    fill('#2a3038')
    ctx.strokeStyle = '#1c2128'; ctx.lineWidth = 2
    for (let x = 0; x < W; x += CELL * 3) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
    for (let y = 0; y < H; y += CELL * 3) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }
    for (let x = 0; x < W; x += 24) { ctx.fillStyle = (x / 24) % 2 ? '#e8b830' : '#1a1a1a'; ctx.fillRect(x, CELL * 0.3, 24, 10); ctx.fillRect(x, H - CELL * 0.3 - 10, 24, 10) }
    // nave atracada
    ctx.save(); ctx.translate(W * 0.55, H * 0.5)
    ctx.fillStyle = '#8f9aa8'; ctx.beginPath(); ctx.ellipse(0, 0, CELL * 4, CELL * 2.6, 0, 0, TAU); ctx.fill()
    ctx.fillStyle = '#6a7584'; ctx.fillRect(-CELL * 5, -CELL * 0.7, CELL * 2, CELL * 1.4)
    ctx.fillStyle = '#5a6574'; ctx.beginPath(); ctx.arc(CELL * 1.2, 0, CELL * 1.1, 0, TAU); ctx.fill()
    ctx.fillStyle = '#4fc3ff'; ctx.globalAlpha = 0.6; ctx.fillRect(-CELL * 5.4, -CELL * 0.5, CELL * 0.4, CELL); ctx.restore(); ctx.globalAlpha = 1
    // caixotes
    for (let i = 0; i < 8; i++) { ctx.fillStyle = '#5a4a30'; ctx.fillRect(CELL * (1 + (i % 3)) + (i > 2 ? CELL * 0.2 : 0), CELL * (2 + Math.floor(i / 3) * 1.2), CELL * 0.9, CELL * 0.9) }
  } else if (scene === 'floresta') {
    fill('#1f3320')
    for (let i = 0; i < 500; i++) { ctx.fillStyle = `rgba(${40 + R() * 30},${70 + R() * 40},${30 + R() * 20},.5)`; ctx.beginPath(); ctx.arc(R() * W, R() * H, R() * 8 + 2, 0, TAU); ctx.fill() }
    for (let i = 0; i < 22; i++) {
      const x = R() * W, y = R() * H, r = CELL * (0.6 + R() * 0.9)
      ctx.fillStyle = '#4a3420'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill()
      ctx.strokeStyle = '#2a1c10'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, r * 0.6, 0, TAU); ctx.stroke()
    }
  } else if (scene === 'gelo') {
    fill('#dfeaf2')
    for (let i = 0; i < 300; i++) { ctx.fillStyle = `rgba(160,190,215,${R() * 0.3})`; ctx.beginPath(); ctx.arc(R() * W, R() * H, R() * 14, 0, TAU); ctx.fill() }
    ctx.strokeStyle = '#7fa6c4'; ctx.lineWidth = 3
    for (let i = 0; i < 5; i++) {
      let x = R() * W, y = R() * H; ctx.beginPath(); ctx.moveTo(x, y)
      for (let k = 0; k < 8; k++) { x += (R() - 0.3) * 60; y += (R() - 0.5) * 60; ctx.lineTo(x, y) }
      ctx.stroke()
    }
    for (let i = 0; i < 8; i++) { ctx.fillStyle = '#b8cfe0'; const x = R() * W, y = R() * H; ctx.beginPath(); ctx.moveTo(x, y - CELL); ctx.lineTo(x + CELL, y + CELL * 0.6); ctx.lineTo(x - CELL, y + CELL * 0.6); ctx.fill() }
  } else if (scene === 'nave') {
    fill('#0b0f16')
    ctx.fillStyle = '#3a4250'
    const rooms = [[1, 1, 8, 5], [11, 1, 7, 5], [1, 9, 6, 6], [9, 8, 9, 7], [19, 3, 4, 10]]
    const corr = [[4, 6, 1, 3], [8, 3, 3, 1], [7, 11, 2, 1], [18, 6, 1, 1], [13, 6, 1, 2]]
    ;[...rooms, ...corr].forEach(([x, y, w, h]) => { if ((x + w) * CELL <= W + CELL && (y + h) * CELL <= H + CELL) ctx.fillRect(x * CELL, y * CELL, w * CELL, h * CELL) })
    ctx.strokeStyle = '#9fb0c8'; ctx.lineWidth = 3
    rooms.forEach(([x, y, w, h]) => ctx.strokeRect(x * CELL, y * CELL, w * CELL, h * CELL))
    ctx.fillStyle = '#4fc3ff'
    for (let i = 0; i < 12; i++) { ctx.globalAlpha = 0.5; ctx.fillRect(R() * W, R() * H, 6, 2) }
    ctx.globalAlpha = 1
  } else fill('#0d0d10')
}
