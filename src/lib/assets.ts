import { useEffect, useState } from 'react'

/** Caminho de um asset em public/assets (funciona com base relativa no GitHub Pages). */
export const asset = (path: string) => `./assets/${path}`

const cache = new Map<string, boolean>()

/**
 * Retorna a URL se a imagem existir, ou null enquanto ela não foi enviada.
 * Assim cada lugar mostra uma arte provisória até a imagem final chegar.
 */
export function useAsset(path: string | undefined) {
  const url = path ? asset(path) : undefined
  const [ok, setOk] = useState<boolean | undefined>(url ? cache.get(url) : false)
  useEffect(() => {
    if (!url) return
    if (cache.has(url)) { setOk(cache.get(url)); return }
    const img = new Image()
    img.onload = () => { cache.set(url, true); setOk(true) }
    img.onerror = () => { cache.set(url, false); setOk(false) }
    img.src = url
  }, [url])
  return ok && url ? url : null
}

/** "Aperto da Força" → "aperto-da-forca" (nomes de arquivo da lista de imagens). */
export const slug = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const BEAST_FILE: Record<string, string> = { 'Dróide de Batalha B1': 'droide-b1' }

/** Caminhos de cada tipo de imagem, como estão em ASSETS.md. */
export const ASSET = {
  species: (id: string) => `especies/${id}.jpg`,
  cls: (id: string) => `classes/${id}.jpg`,
  beast: (name: string) => `bestiario/${BEAST_FILE[name] ?? slug(name)}.jpg`,
  power: (name: string) => `poderes/${slug(name)}.jpg`,
  map: (scene: string) => `mapas/${scene}.jpg`,
  scene: (id: string) => `narracao/${id}.jpg`,
  bg: (id: string) => `bg/${id}.jpg`,
  gear: (id: string) => `equipamento/${id}.png`,
  emblem: (cls: string) => `classes/emblema-${cls}.png`,
  step: (nome: string) => `criar/etapas/${slug(nome)}.png`,
  abil: (k: string) => `criar/atributos/${k}.png`,
  blankPortrait: 'criar/retrato-vazio.jpg',
}
