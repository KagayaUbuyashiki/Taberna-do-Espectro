/* Carrega os mapas em pixel art listados em public/assets/mapas-px/indice.json. */
import { create } from 'zustand'
import { asset } from '../lib/assets'
import { PREFIXO, validarMapa, type CamadaPx, type MapaPx } from './formato'

export interface MapaCarregado extends MapaPx {
  imagens: Record<string, HTMLImageElement>
  /** Cobertura por quadrado ("x,y" → tipo). */
  cob: Map<string, 'cobertura' | 'melhorada'>
  dificil: Set<string>
}

interface Estado {
  pronto: boolean
  mapas: Record<string, MapaCarregado>
  erros: string[]
}
export const useMapasPx = create<Estado>(() => ({ pronto: false, mapas: {}, erros: [] }))

const json = async (url: string) => {
  const r = await fetch(url)
  // o servidor de desenvolvimento devolve o index.html para arquivo que não existe
  if (!r.ok || !(r.headers.get('content-type') ?? '').includes('json')) return null
  return r.json()
}
const imagem = (url: string) => new Promise<HTMLImageElement>((ok, falha) => {
  const i = new Image()
  i.onload = () => ok(i)
  i.onerror = () => falha(new Error(`não abriu ${url}`))
  i.src = url
})

let iniciado = false
/** Lê o índice e cada mapa uma vez. Sem índice, não há mapas em pixel art (o site segue com os cenários de sempre). */
export async function carregarMapasPx(base = 'mapas-px') {
  if (iniciado) return
  iniciado = true
  const erros: string[] = []
  const mapas: Record<string, MapaCarregado> = {}
  let ids: unknown = null
  try { ids = await json(asset(`${base}/indice.json`)) } catch { ids = null }
  if (Array.isArray(ids)) {
    await Promise.all(ids.filter((x): x is string => typeof x === 'string').map(async id => {
      try {
        const m = await json(asset(`${base}/${id}/mapa.json`))
        const ps = validarMapa(m, id)
        if (ps.length) { erros.push(...ps); return }
        const mp = { ...(m as MapaPx), id }
        const imagens: Record<string, HTMLImageElement> = {}
        await Promise.all(mp.camadas.map(async (c: CamadaPx) => { imagens[c.id] = await imagem(asset(`${base}/${id}/${c.img}`)) }))
        // camada do tamanho errado sai esticada: avisa (o mapa carrega assim mesmo)
        mp.camadas.forEach(c => {
          const i = imagens[c.id], w = mp.colunas * mp.px * (c.quadros ?? 1), h = mp.linhas * mp.px
          if (i.width !== w || i.height !== h) erros.push(`${id}: camada ${c.id} tem ${i.width}×${i.height}, esperado ${w}×${h}`)
        })
        const cob = new Map<string, 'cobertura' | 'melhorada'>()
        mp.cobertura?.cobertura?.forEach(s => cob.set(s, 'cobertura'))
        mp.cobertura?.melhorada?.forEach(s => cob.set(s, 'melhorada'))
        mapas[PREFIXO + id] = { ...mp, imagens, cob, dificil: new Set(mp.terrenoDificil ?? []) }
      } catch (err) { erros.push(`${id}: ${(err as Error).message}`) }
    }))
  }
  if (erros.length) console.warn('Mapas em pixel art com problema:', erros)
  useMapasPx.setState({ pronto: true, mapas, erros })
}

export const mapaPx = (cena: string): MapaCarregado | undefined => useMapasPx.getState().mapas[cena]
