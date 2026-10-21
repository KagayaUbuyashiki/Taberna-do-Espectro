/* Visor 3D da forja: a figura numa vitrine escura, girando com o mouse ou o dedo. */
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useThree } from '@react-three/fiber'
import { ContactShadows, OrbitControls } from '@react-three/drei'

/** Tira a foto da figura (quadrada) para a ficha no mapa. */
export type Fotografar = (tam?: number) => string | null

function Fotografo({ alvo, aoPronto }: { alvo: THREE.Object3D; aoPronto: (f: Fotografar) => void }) {
  const { gl, scene } = useThree()
  useEffect(() => {
    aoPronto((tam = 256) => {
      alvo.updateMatrixWorld(true)
      const cam = new THREE.PerspectiveCamera(30, 1, 0.01, 100)
      // retrato do peito para cima: pela cabeça do boneco montado, ou pelo alto do modelo próprio
      const cab = alvo.getObjectByName('cabeca')
      let foco: THREE.Vector3, vista: number
      if (cab) {
        const r = (cab.userData.raio as number) * cab.getWorldScale(new THREE.Vector3()).y
        foco = cab.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, -r * 1.1, 0))
        vista = r * 7
      } else {
        const bb = new THREE.Box3().setFromObject(alvo.getObjectByName('corpo') ?? alvo)
        if (bb.isEmpty()) return null
        const alto = bb.max.y - bb.min.y
        foco = new THREE.Vector3((bb.min.x + bb.max.x) / 2, bb.max.y - alto * 0.22, (bb.min.z + bb.max.z) / 2)
        vista = alto * 0.5
      }
      const dist = vista / 2 / Math.tan((30 * Math.PI) / 360)
      cam.position.copy(foco).add(new THREE.Vector3(0.3, 0.12, 1).normalize().multiplyScalar(dist))
      cam.lookAt(foco)
      const rt = new THREE.WebGLRenderTarget(tam, tam, { samples: 4, colorSpace: THREE.SRGBColorSpace })
      const fundo = scene.background
      scene.background = new THREE.Color('#14141a')
      gl.setRenderTarget(rt)
      gl.render(scene, cam)
      const px = new Uint8Array(tam * tam * 4)
      gl.readRenderTargetPixels(rt, 0, 0, tam, tam, px)
      gl.setRenderTarget(null)
      scene.background = fundo
      rt.dispose()
      const cv = document.createElement('canvas')
      cv.width = cv.height = tam
      const ctx = cv.getContext('2d')
      if (!ctx) return null
      const img = ctx.createImageData(tam, tam)
      // a leitura vem de baixo para cima
      for (let y = 0; y < tam; y++) img.data.set(px.subarray((tam - 1 - y) * tam * 4, (tam - y) * tam * 4), y * tam * 4)
      ctx.putImageData(img, 0, 0)
      return cv.toDataURL('image/png')
    })
  }, [gl, scene, alvo, aoPronto])
  return null
}

/** Enquadra a figura inteira quando o tamanho dela muda bastante (outra espécie, sabre erguido). */
function Enquadrar({ alvo }: { alvo: THREE.Object3D }) {
  const { camera, controls } = useThree()
  const ultimo = useRef(0)
  useEffect(() => {
    const ctl = controls as unknown as { target: THREE.Vector3; update: () => void } | null
    if (!ctl) return
    alvo.updateMatrixWorld(true)
    const bb = new THREE.Box3().setFromObject(alvo)
    const tam = bb.getSize(new THREE.Vector3())
    const alto = Math.max(tam.y, tam.x * 0.8, tam.z * 0.8)
    if (ultimo.current && Math.abs(alto - ultimo.current) / ultimo.current < 0.12) return
    ultimo.current = alto
    const cam = camera as THREE.PerspectiveCamera
    const centro = bb.getCenter(new THREE.Vector3())
    const dist = (alto / 2 / Math.tan((cam.fov * Math.PI) / 360)) * 1.35
    const dir = cam.position.clone().sub(ctl.target).normalize()
    ctl.target.copy(centro)
    cam.position.copy(centro).add(dir.multiplyScalar(dist))
    ctl.update()
  }, [alvo, camera, controls])
  return null
}

export function Visor({ figura, aoPronto, girar }: { figura: THREE.Object3D; aoPronto: (f: Fotografar) => void; girar: boolean }) {
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [1.6, 1.6, 3.6], fov: 35 }} gl={{ preserveDrawingBuffer: true, antialias: true }}
      onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.05 }}
      aria-label="Figura 3D do herói: arraste para girar, role para aproximar">
      <color attach="background" args={['#0b0b0f']} />
      <hemisphereLight args={['#fff6e0', '#20202a', 0.75]} />
      <directionalLight position={[2.5, 4, 3]} intensity={2.2} castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0005} />
      <directionalLight position={[-3, 2, -2.5]} intensity={0.9} color="#6fd3ff" />
      <pointLight position={[0, 0.3, 2]} intensity={0.6} color="#ffd24a" />
      <primitive object={figura} />
      <ContactShadows position={[0, 0.001, 0]} opacity={0.55} scale={4} blur={2.2} far={1.5} />
      <OrbitControls makeDefault target={[0, 0.95, 0]} enablePan={false} minDistance={1.2} maxDistance={10} autoRotate={girar} autoRotateSpeed={1.2} />
      <Fotografo alvo={figura} aoPronto={aoPronto} />
      <Enquadrar alvo={figura} />
    </Canvas>
  )
}
