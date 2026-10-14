import clsx from 'clsx'
import { ART } from '../../art/art'
import { ASSET } from '../../lib/assets'
import { Svg } from '../Svg'
import { AssetImg } from './AssetImg'

/** Retrato do personagem: imagem própria > retrato da espécie > arte SVG da espécie. */
export function Portrait({ species, src, className }: { species: string; src?: string | null; className?: string }) {
  const box = clsx('aspect-square overflow-hidden border border-line-2 bg-black', className)
  if (src) return <div className={box}><img src={src} alt="" className="h-full w-full object-cover" /></div>
  return (
    <div className={box}>
      <AssetImg path={ASSET.species(species)} className="h-full w-full object-cover" fallback={<Svg html={ART.avatar(species)} className="block h-full w-full [&>svg]:h-full [&>svg]:w-full" />} />
    </div>
  )
}
