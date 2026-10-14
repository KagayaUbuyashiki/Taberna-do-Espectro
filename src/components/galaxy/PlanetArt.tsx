import { useState } from 'react'
import { motion } from 'motion/react'
import { artePlaneta, type Planeta } from '../../data/galaxy'
import { PlanetGlobe } from './PlanetGlobe'

/** Holograma do planeta (arte em public/assets/planetas); sem arte, o planeta desenhado. */
export function PlanetArt({ planeta, size = 220 }: { planeta: Planeta; size?: number }) {
  const src = artePlaneta(planeta.id)
  const [falhou, setFalhou] = useState<string | null>(null)
  if (!src || falhou === src) return <PlanetGlobe planeta={planeta} size={size} />
  return (
    <motion.img
      src={src}
      animate={{ y: [-4, 4, -4], opacity: [0.92, 1, 0.92] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      alt={`Planeta ${planeta.nome}`}
      width={size}
      height={size}
      onError={() => setFalhou(src)}
      className="object-contain mix-blend-screen drop-shadow-[0_0_18px_rgba(255,200,90,.35)]"
      style={{ width: size, height: size }}
    />
  )
}
