import type { ReactNode } from 'react'

/** Cabeçalho de página: kicker espaçado + título em contorno dourado (proposta 14). */
export function PageHeader({ kicker, title, children, actions }: { kicker: string; title: ReactNode; children?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
      <div className="min-w-0">
        <div className="kicker">{kicker}</div>
        <h1 className="title-outline mt-2 text-balance text-[clamp(2.4rem,6vw,4.6rem)]">{title}</h1>
        {children && <p className="mt-3 max-w-[62ch] text-bone/80">{children}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </header>
  )
}
