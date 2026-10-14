import { useEffect, useMemo } from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'
import { useAsset } from '../lib/assets'

/** Gera um ladrilho de estrelas que repete na horizontal (usado até a imagem final chegar). */
function starTile(w = 1600, h = 1000) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d')!
  let s = 7
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647
  for (let i = 0; i < 900; i++) {
    const x = r() * w, y = r() * h
    const rad = r() < 0.05 ? 1.5 : r() * 0.9 + 0.2
    g.fillStyle = `rgba(255,${(240 + r() * 15) | 0},${(215 + r() * 40) | 0},${0.3 + r() * 0.7})`
    g.beginPath()
    g.arc(x, y, rad, 0, 7)
    g.fill()
  }
  return c.toDataURL('image/png')
}

/** Nave capital original em cunha (arte provisória do fundo). */
function ShipSvg() {
  const greebles = Array.from({ length: 18 }, (_, i) => (
    <rect key={i} x={300 + i * 22} y={150 + (i % 3) * 6} width={8 + ((i * 7) % 14)} height={4} fill="#3b3b40" />
  ))
  const lights = Array.from({ length: 20 }, (_, i) => (
    <circle key={i} cx={180 + i * 36} cy={170 + ((i * 13) % 9)} r={1.6} fill="#ffd24a" opacity={0.85} className={i % 4 === 0 ? 'animate-blink' : undefined} style={{ animationDelay: `${i * 0.3}s` }} />
  ))
  return (
    <svg viewBox="0 0 900 300" className="h-auto w-full drop-shadow-[0_30px_40px_rgba(0,0,0,.9)]">
      <defs>
        <linearGradient id="hull" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6b6b72" /><stop offset="1" stopColor="#1c1c20" /></linearGradient>
        <radialGradient id="engine"><stop offset="0" stopColor="#fff6d0" /><stop offset=".5" stopColor="#ffd24a" /><stop offset="1" stopColor="#ffd24a" stopOpacity="0" /></radialGradient>
      </defs>
      <path d="M60 160 L820 70 L860 150 L820 230 Z" fill="url(#hull)" />
      <path d="M60 160 L820 70 L840 110 L200 162 Z" fill="#8a8a92" opacity=".55" />
      <path d="M560 98 L640 60 L700 62 L720 92 Z" fill="#4a4a50" />
      <rect x="640" y="40" width="60" height="22" fill="#55555c" />
      <rect x="622" y="34" width="96" height="8" fill="#6a6a72" />
      {greebles}
      {lights}
      <g className="animate-blink"><ellipse cx="866" cy="132" rx="16" ry="18" fill="url(#engine)" /><ellipse cx="866" cy="168" rx="16" ry="18" fill="url(#engine)" /></g>
      <path d="M820 230 L60 160 L200 172 Z" fill="#0d0d10" />
    </svg>
  )
}

/**
 * Fundo animado da ponte de comando: estrelas deslizando, planeta e nave com paralaxe do mouse.
 * Usa as imagens bg/ponte-*.{jpg,png} quando existirem; até lá, desenha a versão provisória.
 */
export function BridgeBackground({ variant = 'page' }: { variant?: 'home' | 'page' }) {
  const reduce = useReducedMotion()
  const starsImg = useAsset('bg/ponte-estrelas.jpg')
  const planetImg = useAsset('bg/ponte-planeta.png')
  const shipImg = useAsset('bg/ponte-nave.png')
  const tile = useMemo(() => (typeof document === 'undefined' ? '' : starTile()), [])

  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 40, damping: 20 })
  const sy = useSpring(my, { stiffness: 40, damping: 20 })
  const planetX = useTransform(sx, v => v * -14)
  const planetY = useTransform(sy, v => v * -8)
  const shipX = useTransform(sx, v => v * 26)
  const shipY = useTransform(sy, v => v * 14)

  useEffect(() => {
    if (reduce) return
    const onMove = (e: PointerEvent) => {
      mx.set(e.clientX / window.innerWidth - 0.5)
      my.set(e.clientY / window.innerHeight - 0.5)
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [mx, my, reduce])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-black">
      <div
        className="absolute inset-0 opacity-90"
        style={{
          backgroundImage: `url(${starsImg ?? tile})`,
          backgroundSize: starsImg ? 'auto 100%' : '1600px 1000px',
          backgroundRepeat: 'repeat',
          animation: reduce ? undefined : 'stars-drift 260s linear infinite',
        }}
      />
      <motion.div
        className={planetImg ? 'absolute bottom-0 left-[-20%] right-[-20%] translate-y-[68%] opacity-70 [filter:brightness(.42)_saturate(.85)]' : 'absolute -bottom-[95vw] left-[-25%] right-[-25%] opacity-80 sm:-bottom-[118vw]'}
        style={{ x: planetX, y: planetY }}
      >
        {planetImg ? (
          <img src={planetImg} alt="" className="mx-auto w-full" />
        ) : (
          <div className="aspect-square w-full rounded-full bg-[radial-gradient(circle_at_50%_0%,#3a260c,#120b04_30%,#000_60%)] shadow-[0_-4px_60px_rgba(255,210,74,.28),inset_0_6px_24px_rgba(255,210,74,.3)]" />
        )}
      </motion.div>
      <motion.div className={shipImg ? 'absolute right-[2%] top-[3%] w-[58vw] max-w-[980px] opacity-80 [filter:brightness(.8)] lg:right-[-4%]' : 'absolute left-[18%] top-[4%] w-[70vw] max-w-[1100px]'} style={{ x: shipX, y: shipY }}>
        <motion.div
          animate={reduce ? undefined : { x: ['-4vw', '6vw'], y: [0, -10] }}
          transition={{ duration: 70, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
        >
          {shipImg ? <img src={shipImg} alt="" className="w-full" /> : <ShipSvg />}
        </motion.div>
      </motion.div>
      {variant === 'home' ? (
        <div className="absolute inset-0 hidden lg:block">
          <div className="absolute left-[46%] top-0 h-full w-[3.2%] skew-x-[22deg] bg-gradient-to-r from-[#121216] to-[#1c1c22] opacity-75" />
          <div className="absolute left-[70%] top-0 h-full w-[3.2%] -skew-x-[22deg] bg-gradient-to-r from-[#1c1c22] to-[#121216] opacity-75" />
          <div className="absolute inset-x-0 top-0 h-10 border-b-2 border-[#2a2a30] bg-gradient-to-b from-[#141418] to-[#0b0b0d]" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-black/70" />
      )}
      <style>{'@keyframes stars-drift{from{background-position:0 0}to{background-position:-1600px 0}}'}</style>
    </div>
  )
}
