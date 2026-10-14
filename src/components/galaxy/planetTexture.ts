import * as THREE from 'three'
import type { Planeta } from '../../data/galaxy'
import { rng } from './rng'

function shade(hex: string, f: number) {
  const c = new THREE.Color(hex)
  return f > 0 ? c.lerp(new THREE.Color('#ffffff'), f) : c.multiplyScalar(1 + f)
}

const cache = new Map<string, THREE.CanvasTexture>()

/** Textura equiretangular gerada para cada planeta (mesma semente, mesma superfície). */
export function planetTexture(p: Planeta): THREE.CanvasTexture {
  const hit = cache.get(p.id)
  if (hit) return hit
  const W = 512, H = 256
  const cv = document.createElement('canvas')
  cv.width = W; cv.height = H
  const g = cv.getContext('2d')!
  const r = rng(p.id)
  const t = new Set(p.tags)
  const base = new THREE.Color(p.cor)
  const css = (c: THREE.Color, a = 1) => `rgba(${(c.r * 255) | 0},${(c.g * 255) | 0},${(c.b * 255) | 0},${a})`
  // desenha com repetição horizontal para não ter emenda
  const blob = (x: number, y: number, rx: number, ry: number, fill: string) => {
    for (const dx of [-W, 0, W]) {
      g.beginPath(); g.ellipse(x + dx, y, rx, ry, 0, 0, Math.PI * 2); g.fillStyle = fill; g.fill()
    }
  }

  if (t.has('gasoso')) {
    for (let y = 0; y < H; y += 3 + r() * 10) { g.fillStyle = css(shade(p.cor, (r() - 0.5) * 0.5)); g.fillRect(0, y, W, 4 + r() * 12) }
    g.filter = 'blur(2px)'; g.drawImage(cv, 0, 0); g.filter = 'none'
    blob(r() * W, H * 0.6, 30, 14, css(shade(p.cor, -0.35)))
  } else if (t.has('lava')) {
    g.fillStyle = '#2a1210'; g.fillRect(0, 0, W, H)
    for (let i = 0; i < 90; i++) blob(r() * W, r() * H, 10 + r() * 50, 2 + r() * 5, r() > 0.4 ? 'rgba(255,170,60,.85)' : 'rgba(255,80,30,.8)')
  } else if (t.has('urbano') && t.has('capital')) {
    g.fillStyle = css(shade(p.cor, -0.6)); g.fillRect(0, 0, W, H)
    for (let i = 0; i < 3000; i++) { g.fillStyle = r() > 0.4 ? 'rgba(255,225,150,.9)' : css(shade(p.cor, -0.2)); g.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2) }
  } else {
    g.fillStyle = css(base); g.fillRect(0, 0, W, H)
    const oceano = t.has('oceano')
    const terra = shade(p.cor, oceano ? 0.35 : -0.25)
    for (let i = 0; i < (oceano ? 30 : 60); i++) {
      const x = r() * W, y = H * (0.12 + r() * 0.76), s = oceano ? 6 + r() * 16 : 14 + r() * 40
      blob(x, y, s, s * (0.4 + r() * 0.5), css(terra, 0.85))
      blob(x + s * 0.3, y + s * 0.1, s * 0.5, s * 0.3, css(shade(p.cor, (r() - 0.5) * 0.5), 0.7))
    }
    g.filter = 'blur(1.5px)'; g.drawImage(cv, 0, 0); g.filter = 'none'
    if (t.has('gelo') || t.has('kyber') || t.has('montanhas')) {
      g.fillStyle = 'rgba(244,248,255,.9)'; g.fillRect(0, 0, W, H * 0.1); g.fillRect(0, H * 0.9, W, H * 0.1)
    }
  }
  // nuvens leves
  if (!t.has('lava') && !t.has('gasoso')) for (let i = 0; i < 40; i++) blob(r() * W, r() * H, 10 + r() * 40, 2 + r() * 5, 'rgba(255,255,255,.18)')

  const tex = new THREE.CanvasTexture(cv)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = THREE.RepeatWrapping
  cache.set(p.id, tex)
  return tex
}
