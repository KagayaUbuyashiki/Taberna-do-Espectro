import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Billboard, CameraControls, Html, Line, Stars } from '@react-three/drei'
import * as THREE from 'three'
import { CENTRO, GRID, PLANETAS, PLANETA_BY, ROTAS, TIERS, posicao, type Planeta } from '../../data/galaxy'
import { planetTexture } from './planetTexture'
import { rng } from './rng'

/** Largura da galáxia em unidades 3D. */
const S = 260
const PROF = (S * GRID.rows) / GRID.cols

/** Posição 3D: o mapa canônico vira o plano XZ, com uma leve altura por planeta. */
function pos3(p: Planeta): THREE.Vector3 {
  const { x, y } = posicao(p)
  const r = rng(`${p.id}-y`)
  return new THREE.Vector3((x - 0.5) * S, (r() - 0.5) * 8, (y - 0.5) * PROF)
}
const centro3 = new THREE.Vector3((CENTRO.x - 0.5) * S, 0, (CENTRO.y - 0.5) * PROF)

export interface GalaxyMap3DProps {
  selected: string | null
  onSelect: (id: string | null) => void
  naveEm: string
  /** Planetas mostrados como planeta de verdade (coordenadas conhecidas, ou tudo no modo mestre). */
  conhecidos: Set<string>
  /** Planetas sem coordenadas que aparecem como distúrbio na Força. */
  disturbios: Set<string>
  /** Espaço do painel lateral (px) para o foco não ficar atrás dele. */
  reservaDireita?: number
}

/* ------------------------------ Disco da galáxia ------------------------------ */

const pointVS = /* glsl */ `
  attribute float size; attribute vec3 color; varying vec3 vColor;
  void main() {
    vColor = color;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (300.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }`
const pointFS = /* glsl */ `
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vColor, a * a);
  }`

function Galaxia() {
  const geo = useMemo(() => {
    const r = rng('galaxia-3d')
    const n = 26000
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), size = new Float32Array(n)
    const ouro = new THREE.Color('#ffd9a0'), azul = new THREE.Color('#8fb4ff'), rosa = new THREE.Color('#ff7aa0'), c = new THREE.Color()
    for (let i = 0; i < n; i++) {
      let x: number, z: number, y: number
      if (i < n * 0.18) { // bojo do núcleo
        const a = r() * Math.PI * 2, d = Math.pow(r(), 2.2) * 34
        x = Math.cos(a) * d; z = Math.sin(a) * d; y = (r() - 0.5) * (14 - d * 0.3)
      } else { // braços em espiral
        const arm = i % 4
        const t = Math.pow(r(), 0.75) * 4 * Math.PI
        const rad = 8 * Math.exp(0.24 * t)
        const ang = t + (arm * Math.PI) / 2
        const sp = 2 + rad * 0.14
        x = Math.cos(ang) * rad + (r() - 0.5) * sp * 2
        z = Math.sin(ang) * rad + (r() - 0.5) * sp * 2
        y = (r() - 0.5) * 3.5
      }
      const d = Math.hypot(x, z)
      c.copy(ouro).lerp(azul, Math.min(1, d / 120))
      if (r() < 0.03) c.copy(rosa)
      pos.set([centro3.x + x, y, centro3.z + z], i * 3)
      col.set([c.r, c.g, c.b], i * 3)
      size[i] = r() < 0.02 ? 3.2 : 0.6 + r() * 1.3
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('color', new THREE.BufferAttribute(col, 3))
    g.setAttribute('size', new THREE.BufferAttribute(size, 1))
    return g
  }, [])
  const brilho = useMemo(() => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 256
    const g = cv.getContext('2d')!
    const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128)
    grad.addColorStop(0, 'rgba(255,240,210,1)'); grad.addColorStop(0.2, 'rgba(255,200,140,.5)'); grad.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = grad; g.fillRect(0, 0, 256, 256)
    return new THREE.CanvasTexture(cv)
  }, [])
  const ref = useRef<THREE.Points>(null)
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.004 })
  return (
    <group>
      <group position={centro3}>
        <points ref={ref} geometry={geo} position={[-centro3.x, 0, -centro3.z]}>
          <shaderMaterial vertexShader={pointVS} fragmentShader={pointFS} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
        </points>
      </group>
      <sprite position={centro3} scale={[90, 90, 1]}>
        <spriteMaterial map={brilho} transparent depthWrite={false} blending={THREE.AdditiveBlending} opacity={0.85} />
      </sprite>
    </group>
  )
}

const ANEIS = [
  { r: 20, nome: 'Núcleo Profundo' }, { r: 36, nome: 'Mundos do Núcleo' }, { r: 54, nome: 'Colônias' }, { r: 74, nome: 'Orla Interior' },
  { r: 98, nome: 'Região de Expansão' }, { r: 138, nome: 'Orla Média' }, { r: 210, nome: 'Orla Exterior' },
]

function Regioes() {
  return (
    <group position={centro3}>
      {ANEIS.map(a => {
        const pts = Array.from({ length: 97 }, (_, i) => new THREE.Vector3(Math.cos((i / 96) * Math.PI * 2) * a.r, 0, Math.sin((i / 96) * Math.PI * 2) * a.r))
        return (
          <group key={a.nome}>
            <Line points={pts} color="#9a8f80" transparent opacity={0.18} dashed dashSize={2} gapSize={3} lineWidth={1} />
            <Html position={[0, 0, -a.r]} center className="pointer-events-none select-none whitespace-nowrap font-display text-[10px] uppercase tracking-[.3em] text-ash/70" zIndexRange={[1, 0]}>
              {a.nome}
            </Html>
          </group>
        )
      })}
      <Html position={[-centro3.x - S * 0.42, 0, -40]} center className="pointer-events-none select-none whitespace-nowrap font-display text-xs uppercase tracking-[.4em] text-ash/60" zIndexRange={[1, 0]}>
        Regiões Desconhecidas
      </Html>
    </group>
  )
}

function Rotas() {
  return (
    <>
      {ROTAS.map(r => (
        <Line key={r.nome} points={r.planetas.map(id => pos3(PLANETA_BY[id]))} color="#c4141c" transparent opacity={0.35} dashed dashSize={1.5} gapSize={2.5} lineWidth={1} />
      ))}
    </>
  )
}

/* --------------------------------- Planetas --------------------------------- */

const atmVS = /* glsl */ `varying vec3 vN; varying vec3 vV;
  void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`
const atmFS = /* glsl */ `uniform vec3 cor; varying vec3 vN; varying vec3 vV;
  void main(){ float f = pow(1.0 - abs(dot(vN, vV)), 2.5); gl_FragColor = vec4(cor, f); }`

function PlanetaMesh({ p, ativo, aqui, onClick, onHover }: { p: Planeta; ativo: boolean; aqui: boolean; onClick: (e: ThreeEvent<MouseEvent>) => void; onHover: (h: boolean) => void }) {
  const tex = useMemo(() => planetTexture(p), [p])
  const ref = useRef<THREE.Mesh>(null)
  const pos = useMemo(() => pos3(p), [p])
  const raio = p.tags.includes('gasoso') ? 2.4 : 1.5
  const grupo = useRef<THREE.Group>(null)
  useFrame(({ camera }, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.15
    // De longe o planeta cresce um pouco para continuar clicável.
    if (grupo.current) grupo.current.scale.setScalar(Math.max(1, camera.position.distanceTo(pos) / 70))
  })
  const atm = p.tags.includes('lava') ? '#ff6a30' : p.cor
  return (
    <group position={pos} ref={grupo}>
      <mesh ref={ref} onClick={onClick} onPointerOver={e => { e.stopPropagation(); onHover(true) }} onPointerOut={() => onHover(false)}>
        <sphereGeometry args={[raio, 48, 32]} />
        <meshStandardMaterial map={tex} roughness={0.9} emissive={p.tags.includes('lava') ? '#ff4010' : '#000'} emissiveIntensity={0.25} emissiveMap={p.tags.includes('lava') ? tex : null} />
      </mesh>
      <mesh scale={1.18}>
        <sphereGeometry args={[raio, 32, 16]} />
        <shaderMaterial vertexShader={atmVS} fragmentShader={atmFS} uniforms={{ cor: { value: new THREE.Color(atm) } }} transparent depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.BackSide} />
      </mesh>
      {(ativo || aqui) && (
        <Billboard>
          <mesh>
            <ringGeometry args={[raio * 1.45, raio * 1.5, 64]} />
            <meshBasicMaterial color={TIERS[p.tier].cor} transparent opacity={0.9} />
          </mesh>
        </Billboard>
      )}
      <Html position={[0, -raio - 1.2, 0]} center className="pointer-events-none select-none" zIndexRange={[10, 0]}>
        <span className={`whitespace-nowrap font-display uppercase tracking-[.15em] [text-shadow:0_0_4px_#000,0_0_8px_#000] ${ativo ? 'text-sm text-bone' : 'text-[11px] text-bone/80'}`}>{p.nome}</span>
      </Html>
    </group>
  )
}

/* -------------------------- Distúrbio na Força -------------------------- */

const distVS = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`
const distFS = /* glsl */ `
  uniform float t; uniform float seed; uniform float hover; varying vec2 vUv;
  float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)) + seed) * 43758.5453); }
  float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
    return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
  float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int k = 0; k < 5; k++){ v += a*n(p); p *= 2.03; a *= 0.5; } return v; }
  void main(){
    vec2 p = vUv - 0.5; float r = length(p); float a = atan(p.y, p.x);
    vec2 q = vec2(a * 1.2 + t * 0.35, r * 5.0 - t * 0.6);
    float w = fbm(q + fbm(q * 1.7 - t * 0.2));
    float fall = smoothstep(0.5, 0.05, r);
    float onda = 0.5 + 0.5 * sin(r * 40.0 - t * 3.0 + w * 4.0);
    float alpha = fall * (0.2 + 0.8 * w) * (0.6 + 0.4 * onda);
    vec3 c = mix(vec3(0.6, 0.68, 1.0), vec3(1.0, 0.98, 0.94), w * w);
    gl_FragColor = vec4(c, alpha * (0.5 + 0.45 * hover));
  }`

function Disturbio({ p, ativo, onClick, onHover }: { p: Planeta; ativo: boolean; onClick: (e: ThreeEvent<MouseEvent>) => void; onHover: (h: boolean) => void }) {
  const pos = useMemo(() => pos3(p), [p])
  const uniforms = useMemo(() => ({ t: { value: 0 }, seed: { value: rng(p.id)() * 100 }, hover: { value: 0 } }), [p.id])
  const ref = useRef<THREE.Group>(null)
  useFrame(({ camera }, dt) => {
    if (ref.current) ref.current.scale.setScalar(Math.min(2, Math.max(1, camera.position.distanceTo(pos) / 120)))
    uniforms.t.value += dt
    uniforms.hover.value += ((ativo ? 1 : 0) - uniforms.hover.value) * Math.min(1, dt * 6)
  })
  return (
    <Billboard position={pos} ref={ref}>
      <mesh onClick={onClick} onPointerOver={e => { e.stopPropagation(); onHover(true) }} onPointerOut={() => onHover(false)}>
        <planeGeometry args={[5.5, 5.5]} />
        <shaderMaterial vertexShader={distVS} fragmentShader={distFS} uniforms={uniforms} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </Billboard>
  )
}

/* ---------------------------------- Nave ---------------------------------- */

function Nave({ em }: { em: string }) {
  const pos = useMemo(() => pos3(PLANETA_BY[em]).add(new THREE.Vector3(0, 4.2, 0)), [em])
  const ref = useRef<THREE.Group>(null)
  const anel = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (ref.current) { ref.current.rotation.y = clock.elapsedTime * 0.8; ref.current.position.y = pos.y + Math.sin(clock.elapsedTime * 2) * 0.3 }
    if (anel.current) { const k = 1 + (clock.elapsedTime % 2) * 1.2; anel.current.scale.set(k, k, k); (anel.current.material as THREE.MeshBasicMaterial).opacity = 1 - (clock.elapsedTime % 2) / 2 }
  })
  return (
    <group>
      <group ref={ref} position={pos}>
        <mesh rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.7, 1.8, 3]} />
          <meshBasicMaterial color="#c4141c" />
        </mesh>
      </group>
      <Billboard position={pos3(PLANETA_BY[em])}>
        <mesh ref={anel}>
          <ringGeometry args={[2.6, 2.8, 48]} />
          <meshBasicMaterial color="#c4141c" transparent />
        </mesh>
      </Billboard>
    </group>
  )
}

/* ------------------------- Câmera e voo pelo teclado ------------------------- */

const VISTA_INICIAL: [number, number, number, number, number, number] = [centro3.x, 190, centro3.z + 200, centro3.x, 0, centro3.z]

function Piloto({ controls, mover }: { controls: React.RefObject<CameraControls | null>; mover: React.RefObject<Set<string>> }) {
  const teclas = useRef(new Set<string>())
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return
      teclas.current.add(e.key.toLowerCase())
    }
    const up = (e: KeyboardEvent) => teclas.current.delete(e.key.toLowerCase())
    const blur = () => teclas.current.clear()
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', blur)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur) }
  }, [])
  useFrame((_, dt) => {
    const c = controls.current
    if (!c) return
    const k = new Set([...teclas.current, ...mover.current])
    if (k.size === 0) return
    const v = Math.max(20, c.distance * 0.9) * dt
    const tem = (...ks: string[]) => ks.some(x => k.has(x))
    if (tem('w', 'arrowup')) c.forward(v, false)
    if (tem('s', 'arrowdown')) c.forward(-v, false)
    if (tem('a', 'arrowleft')) c.truck(-v, 0, false)
    if (tem('d', 'arrowright')) c.truck(v, 0, false)
    if (tem('q', ' ')) c.elevate(v, false)
    if (tem('e', 'shift')) c.elevate(-v, false)
  })
  return null
}

function Foco({ selected, controls, reservaDireita }: { selected: string | null; controls: React.RefObject<CameraControls | null>; reservaDireita: number }) {
  const { size } = useThree()
  useEffect(() => {
    const c = controls.current
    if (!c || !selected) return
    const alvo = pos3(PLANETA_BY[selected])
    c.setLookAt(alvo.x, alvo.y + 7, alvo.z + 15, alvo.x, alvo.y, alvo.z, true)
    // desloca o enquadramento para o planeta não ficar atrás do painel
    const largo = size.width >= 768
    c.setFocalOffset(largo ? (reservaDireita / size.width) * 9 : 0, largo ? 0 : -4.5, 0, true)
  }, [selected]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

/* --------------------------------- Mapa --------------------------------- */

export default function GalaxyMap3D({ selected, onSelect, naveEm, conhecidos, disturbios, reservaDireita = 0 }: GalaxyMap3DProps) {
  const controls = useRef<CameraControls | null>(null)
  const mover = useRef(new Set<string>())
  const [hover, setHover] = useState<string | null>(null)
  const clicar = (id: string) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (e.delta < 6) onSelect(id)
  }
  const hov = (id: string) => (h: boolean) => setHover(x => (h ? id : x === id ? null : x))

  const resetar = () => {
    onSelect(null)
    controls.current?.setFocalOffset(0, 0, 0, true)
    controls.current?.setLookAt(...VISTA_INICIAL, true)
  }
  const botao = (k: string, label: string, title: string) => (
    <button type="button" title={title} aria-label={title}
      onPointerDown={() => mover.current.add(k)} onPointerUp={() => mover.current.delete(k)} onPointerLeave={() => mover.current.delete(k)}
      className="h-10 w-10 touch-none border border-line bg-panel/90 font-display text-lg text-bone active:border-gold active:bg-gold/30">{label}</button>
  )

  return (
    <div className={`relative h-full w-full bg-void ${hover ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'}`}>
      <Canvas camera={{ position: VISTA_INICIAL.slice(0, 3) as [number, number, number], fov: 50, near: 0.1, far: 3000 }} dpr={[1, 2]}
        onPointerMissed={e => { if (e.type === 'click') onSelect(null) }}>
        <color attach="background" args={['#050304']} />
        <ambientLight intensity={0.35} />
        <pointLight position={centro3} intensity={3} distance={0} decay={0} color="#fff1d6" />
        <directionalLight position={[80, 60, 40]} intensity={1.2} />
        <Stars radius={700} depth={300} count={7000} factor={7} saturation={0.2} fade speed={0.4} />
        <Galaxia />
        <Regioes />
        <Rotas />
        {PLANETAS.filter(p => conhecidos.has(p.id) || p.id === naveEm).map(p => (
          <PlanetaMesh key={p.id} p={p} ativo={p.id === selected || p.id === hover} aqui={p.id === naveEm} onClick={clicar(p.id)} onHover={hov(p.id)} />
        ))}
        {PLANETAS.filter(p => disturbios.has(p.id) && !conhecidos.has(p.id) && p.id !== naveEm).map(p => (
          <Disturbio key={p.id} p={p} ativo={p.id === selected || p.id === hover} onClick={clicar(p.id)} onHover={hov(p.id)} />
        ))}
        {selected && selected !== naveEm && (
          <Line points={[pos3(PLANETA_BY[naveEm]), pos3(PLANETA_BY[selected])]} color={conhecidos.has(selected) ? '#efe6d2' : '#9a8f80'} dashed dashSize={1} gapSize={1} lineWidth={1.5} transparent opacity={0.8} />
        )}
        <Nave em={naveEm} />
        <CameraControls ref={controls} makeDefault minDistance={4} maxDistance={700} dollyToCursor smoothTime={0.6} />
        <Piloto controls={controls} mover={mover} />
        <Foco selected={selected} controls={controls} reservaDireita={reservaDireita} />
      </Canvas>

      {/* Controles de voo (toque e mouse) */}
      <div className="absolute bottom-3 left-3 grid grid-cols-3 gap-1">
        <span />{botao('w', '▲', 'Avançar (W)')}{botao('q', '⤒', 'Subir (Q)')}
        {botao('a', '◀', 'Esquerda (A)')}
        <button type="button" onClick={resetar} title="Ver a galáxia inteira" aria-label="Ver a galáxia inteira" className="h-10 w-10 border border-line bg-panel/90 text-bone hover:border-gold">⌂</button>
        {botao('d', '▶', 'Direita (D)')}
        <span />{botao('s', '▼', 'Recuar (S)')}{botao('e', '⤓', 'Descer (E)')}
      </div>
      <div className="pointer-events-none absolute bottom-3 right-3 hidden border border-line bg-panel/80 p-2 font-mono text-[11px] text-ash sm:block">
        {([1, 2, 3, 4] as const).map(t => (
          <div key={t} className="flex items-center gap-2"><span className="inline-block h-2.5 w-2.5 rounded-full border-2" style={{ borderColor: TIERS[t].cor }} />Tier {t} · {TIERS[t].nome}</div>
        ))}
        <div className="mt-1 flex items-center gap-2"><span className="text-gold">▼</span>Sua nave</div>
        <div className="flex items-center gap-2"><span className="inline-block h-2.5 w-2.5 rounded-full bg-bone/40 blur-[2px]" />Distúrbio na Força (sem coordenadas)</div>
      </div>
    </div>
  )
}
