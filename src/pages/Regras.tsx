import { useDeferredValue, useMemo, useState, type ComponentType } from 'react'
import { useSearchParams } from 'react-router-dom'
import clsx from 'clsx'
import { PageHeader } from '../components/ui/PageHeader'
import { ABAS, filtrar, type Aba, type Filtro } from './regras/dados'
import {
  SecaoArmaduras, SecaoArmas, SecaoAptidoes, SecaoCDs, SecaoClasses, SecaoCombate, SecaoEspecies, SecaoForca, SecaoIdeias, SecaoPericias, SecaoTalentos,
} from './regras/Secoes'

const SECOES: Record<Aba, ComponentType<{ f: Filtro }>> = {
  combate: SecaoCombate, cds: SecaoCDs, pericias: SecaoPericias, talentos: SecaoTalentos, aptidoes: SecaoAptidoes, forca: SecaoForca,
  armas: SecaoArmas, armaduras: SecaoArmaduras, especies: SecaoEspecies, classes: SecaoClasses, ideias: SecaoIdeias,
}
const ancora = (id: Aba) => `regras-${id}`

export default function Regras() {
  const [sp, setSp] = useSearchParams()
  const pedida = sp.get('aba') as Aba | null
  const aba: Aba = pedida && pedida in SECOES ? pedida : 'combate'
  const [busca, setBusca] = useState('')
  const q = useDeferredValue(busca)
  const f = useMemo(() => filtrar(q), [q])
  // Com busca, todas as seções com resultado aparecem juntas; sem busca, só a aba escolhida
  const visiveis = f.ativo ? ABAS.filter(a => f.n[a.id] > 0) : ABAS.filter(a => a.id === aba)
  const total = ABAS.reduce((s, a) => s + f.n[a.id], 0)

  const escolher = (id: Aba) => {
    if (f.ativo) {
      document.getElementById(ancora(id))?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
      return
    }
    setSp(p => { p.set('aba', id); return p }, { replace: true })
  }

  return (
    <div className="space-y-6">
      <PageHeader kicker="Livro de regras · Edição Saga" title="Regras">
        Tabelas de referência rápida do livro (v1.05 PT-BR). Busque qualquer termo para filtrar todas as tabelas de uma vez.
      </PageHeader>

      <div className="z-10 -mx-4 lg:sticky lg:top-0 space-y-3 border-b border-line-2 bg-void/90 px-4 py-3 backdrop-blur-sm sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12">
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="regras-busca">Buscar nas regras</label>
          <input id="regras-busca" type="search" className="input min-w-0 flex-1" value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="Buscar: limiar, sabre, Vontade, Wookiee..." autoComplete="off" />
          {busca && <button type="button" className="btn btn-sm btn-ghost shrink-0" onClick={() => setBusca('')}>Limpar</button>}
        </div>
        <nav aria-label="Seções das regras" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {ABAS.map(a => {
            const n = f.n[a.id]
            const atual = !f.ativo && a.id === aba
            return (
              <button key={a.id} type="button" onClick={() => escolher(a.id)} disabled={f.ativo && n === 0}
                aria-current={atual ? 'page' : undefined}
                className={clsx('shrink-0 border px-3 py-1 font-display text-base tracking-[.18em] transition-colors disabled:opacity-30',
                  atual ? 'border-gold bg-gold text-black' : 'border-line-2 text-ash hover:border-gold hover:text-gold')}>
                {a.nome}{f.ativo && <span className="ml-1.5 font-mono text-xs tabular-nums">{n}</span>}
              </button>
            )
          })}
        </nav>
      </div>

      {f.ativo && (
        <p className="font-mono text-sm text-ash" aria-live="polite">
          {total ? `${total} resultado${total === 1 ? '' : 's'} para “${q.trim()}”` : `Nada encontrado para “${q.trim()}”.`}
        </p>
      )}

      {visiveis.map(a => {
        const S = SECOES[a.id]
        return (
          <section key={a.id} id={ancora(a.id)} className="scroll-mt-32 space-y-3" aria-labelledby={`${ancora(a.id)}-t`}>
            <h2 id={`${ancora(a.id)}-t`} className={clsx('font-display text-3xl tracking-[.2em] text-gold', !f.ativo && 'sr-only')}>{a.nome}</h2>
            <S f={f} />
          </section>
        )
      })}
    </div>
  )
}
