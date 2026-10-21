/* Cobertura do quadrado do alvo, lida do mapa em pixel art (os cenários desenhados por código não marcam cobertura). */
import { mapaPx } from '../mapas-px/registro'
import type { Cobertura, Ponto } from './armas'

export function coberturaNoMapaPixel(cena: string, p: Ponto): Cobertura | null {
  return mapaPx(cena)?.cob.get(`${p.x},${p.y}`) ?? null
}
