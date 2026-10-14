import clsx from 'clsx'
import { ART } from '../../art/art'
import { ASSET } from '../../lib/assets'
import { Svg } from '../Svg'
import { AssetImg } from './AssetImg'

/** Emblema holográfico da classe (classes/emblema-<id>.png), com o emblema SVG como reserva. */
export function ClassEmblem({ cls, className }: { cls: string; className?: string }) {
  return (
    <AssetImg
      path={ASSET.emblem(cls)}
      holo
      className={clsx('object-contain', className)}
      fallback={<Svg html={ART.emblem(cls)} className={clsx('block text-gold [&>svg]:h-full [&>svg]:w-full', className)} />}
    />
  )
}
