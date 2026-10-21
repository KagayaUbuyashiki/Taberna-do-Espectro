/* Exportar a figura: STL em milímetros (para imprimir) e GLB colorido (para ver, pintar ou mandar a um serviço de impressão em cores). */
import type * as THREE from 'three'
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { emMilimetros, soldar } from './montar'

export function baixar(dados: BlobPart, nome: string, tipo: string) {
  const url = URL.createObjectURL(new Blob([dados], { type: tipo }))
  const a = document.createElement('a')
  a.href = url
  a.download = nome
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Nome de arquivo seguro a partir do nome do herói. */
export const nomeArquivo = (s: string) => (s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'figura')

/** STL binário, em mm, com a figura e a base numa peça só. */
export function stl(figura: THREE.Object3D, mm: number): DataView {
  const g = soldar(emMilimetros(figura, mm))
  return new STLExporter().parse(g, { binary: true }) as unknown as DataView
}

/** GLB com as cores, na mesma escala em mm. */
export async function glb(figura: THREE.Object3D, mm: number): Promise<ArrayBuffer> {
  const g = emMilimetros(figura, mm / 1000) // glTF é em metros
  return (await new GLTFExporter().parseAsync(g, { binary: true })) as ArrayBuffer
}
