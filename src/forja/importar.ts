/*
 * Modelo 3D próprio (.glb, .gltf, .stl, .obj), por exemplo o exportado de outro criador de miniaturas.
 * O arquivo fica no IndexedDB deste navegador (é grande demais para a ficha); a ficha guarda só o id.
 */
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { uid } from '../rules/engine'

export const FORMATOS = ['.glb', '.gltf', '.stl', '.obj'] as const
export const LIMITE_MB = 40

interface Guardado { id: string; nome: string; dados: ArrayBuffer }

const BANCO = 'taberna-forja', LOJA = 'modelos'
function abrir() {
  return new Promise<IDBDatabase>((ok, falha) => {
    const r = indexedDB.open(BANCO, 1)
    r.onupgradeneeded = () => r.result.createObjectStore(LOJA, { keyPath: 'id' })
    r.onsuccess = () => ok(r.result)
    r.onerror = () => falha(r.error)
  })
}
async function pedir<T>(modo: IDBTransactionMode, f: (s: IDBObjectStore) => IDBRequest<T>) {
  const db = await abrir()
  return new Promise<T>((ok, falha) => {
    const t = db.transaction(LOJA, modo)
    const r = f(t.objectStore(LOJA))
    r.onsuccess = () => ok(r.result)
    r.onerror = () => falha(r.error)
    t.oncomplete = () => db.close()
  })
}

const extensao = (nome: string) => nome.slice(nome.lastIndexOf('.')).toLowerCase()

/** Guarda o arquivo enviado; devolve o id e o nome (ou o motivo de recusa). */
export async function guardarModelo(arquivo: File): Promise<{ id: string; nome: string } | { erro: string }> {
  const ext = extensao(arquivo.name)
  if (!(FORMATOS as readonly string[]).includes(ext)) return { erro: `Formato ${ext} não aceito. Use ${FORMATOS.join(', ')}.` }
  if (arquivo.size > LIMITE_MB * 1024 * 1024) return { erro: `O arquivo passa de ${LIMITE_MB} MB.` }
  const dados = await arquivo.arrayBuffer()
  // confere antes de guardar: se o three.js não lê, não adianta guardar
  try { await lerModelo(arquivo.name, dados) } catch (e) { return { erro: `Não consegui abrir o modelo: ${(e as Error).message}` } }
  const g: Guardado = { id: uid(), nome: arquivo.name, dados }
  await pedir('readwrite', s => s.put(g))
  return { id: g.id, nome: g.nome }
}

export async function apagarModelo(id: string) { await pedir('readwrite', s => s.delete(id)) }

const cache = new Map<string, Promise<THREE.Object3D | null>>()
/** Abre o modelo guardado (uma vez por id); null se ele não está neste navegador. */
export function abrirModelo(id: string): Promise<THREE.Object3D | null> {
  let p = cache.get(id)
  if (!p) {
    p = pedir<Guardado | undefined>('readonly', s => s.get(id)).then(g => (g ? lerModelo(g.nome, g.dados) : null)).catch(() => null)
    cache.set(id, p)
  }
  return p.then(o => (o ? o.clone(true) : null))
}

async function lerModelo(nome: string, dados: ArrayBuffer): Promise<THREE.Object3D> {
  const ext = extensao(nome)
  const cinza = new THREE.MeshStandardMaterial({ color: '#b8b0a0', roughness: 0.7 })
  if (ext === '.stl') {
    const geo = new STLLoader().parse(dados)
    geo.computeVertexNormals()
    // STL costuma vir com o z para cima (impressão 3D): deita no y do three.js
    const m = new THREE.Mesh(geo, cinza)
    m.rotation.x = -Math.PI / 2
    return new THREE.Group().add(m)
  }
  if (ext === '.obj') {
    const o = new OBJLoader().parse(new TextDecoder().decode(dados))
    o.traverse(x => { const m = x as THREE.Mesh; if (m.isMesh && !(m.material as THREE.Material)?.name) m.material = cinza })
    return o
  }
  const gltf = await new GLTFLoader().parseAsync(dados, '')
  return gltf.scene
}

/** Encaixa o modelo: centraliza, põe o pé no zero e ajusta a altura pedida. */
export function encaixarModelo(o: THREE.Object3D, altura: number, giro: number) {
  const g = new THREE.Group()
  g.name = 'corpo'
  o = o.clone(true)
  g.add(o)
  o.updateMatrixWorld(true)
  const bb = new THREE.Box3().setFromObject(o)
  const tam = bb.getSize(new THREE.Vector3())
  const s = tam.y > 0 ? altura / tam.y : 1
  o.position.sub(new THREE.Vector3((bb.min.x + bb.max.x) / 2, bb.min.y, (bb.min.z + bb.max.z) / 2))
  g.scale.setScalar(s)
  g.rotation.y = giro
  g.traverse(x => { const m = x as THREE.Mesh; if (m.isMesh) { m.castShadow = true; m.receiveShadow = true } })
  return g
}
