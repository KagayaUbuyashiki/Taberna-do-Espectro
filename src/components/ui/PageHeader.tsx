import type { ReactNode } from 'react'
import { ASSET, useAsset } from '../../lib/assets'

/**
 * Cabeçalho de página: kicker espaçado + título em contorno dourado (proposta 14).
 * `bg` (ex.: 'mesa') mostra a imagem bg/<id>.jpg como faixa atrás do título, quando ela existir.
 */
export function PageHeader({ kicker, title, children, actions, bg }: { kicker: string; title: ReactNode; children?: ReactNode; actions?: ReactNode; bg?: string }) {
  const img = useAsset(bg ? ASSET.bg(bg) : undefined)
  return (
    <header className="relative mb-8 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
      {img && (
        <div aria-hidden className="pointer-events-none absolute -inset-y-6 -right-4 left-[18%] -z-10 overflow-hidden sm:-right-8 lg:-right-12 lg:-top-10">
          <img src={img} alt="" className="h-full w-full object-cover object-center opacity-55 [mask-image:linear-gradient(to_right,transparent,black_45%),linear-gradient(to_bottom,black_60%,transparent)] [mask-composite:intersect]" />
        </div>
      )}
      <div className="min-w-0">
        <div className="kicker">{kicker}</div>
        <h1 className="title-outline mt-2 text-balance text-[clamp(2.4rem,6vw,4.6rem)]">{title}</h1>
        {children && <p className="mt-3 max-w-[62ch] text-bone/80">{children}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </header>
  )
}
