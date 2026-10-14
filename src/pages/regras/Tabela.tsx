import clsx from 'clsx'
import type { ReactNode } from 'react'

export interface Coluna<T> { h: string; c: (r: T) => ReactNode; num?: boolean; className?: string }

/** Tabela de referência: rola na horizontal no celular, cabeçalho dourado, números em mono. */
export function Tabela<T>({ cols, rows, k, legenda }: { cols: Coluna<T>[]; rows: readonly T[]; k: (r: T, i: number) => string; legenda?: string }) {
  if (!rows.length) return <p className="text-sm text-ash">Nada encontrado.</p>
  return (
    <div className="overflow-x-auto border border-line-2">
      <table className="w-full border-collapse text-sm">
        {legenda && <caption className="sr-only">{legenda}</caption>}
        <thead>
          <tr>
            {cols.map(c => (
              <th key={c.h} scope="col" className={clsx('whitespace-nowrap border-b border-line-2 bg-black/50 px-3 py-2 font-display text-base font-normal tracking-[.2em] text-gold', c.num ? 'text-right' : 'text-left')}>{c.h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={k(r, i)} className="border-b border-line last:border-b-0 odd:bg-black/25 hover:bg-gold/5">
              {cols.map(c => (
                <td key={c.h} className={clsx('px-3 py-2 align-top', c.num && 'whitespace-nowrap text-right font-mono tabular-nums text-bone', c.className)}>{c.c(r)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Texto com trechos em **negrito**. */
export function Rico({ t }: { t: string }) {
  return <>{t.split(/\*\*(.+?)\*\*/g).map((s, i) => (i % 2 ? <b key={i} className="font-semibold text-bone">{s}</b> : s))}</>
}

/** Cabeçalho de painel com o código do livro à direita. */
export function Titulo({ t, code }: { t: string; code?: string }) {
  return (
    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
      <h3 className="panel-title">{t}</h3>
      {code && <span className="font-mono text-xs tracking-[.2em] text-ash">{code}</span>}
    </div>
  )
}
