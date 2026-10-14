import clsx from 'clsx'
import { STEPS, type Problem } from './draft'
import { AssetImg } from '../../components/ui/AssetImg'
import { ASSET } from '../../lib/assets'

/** Barra de etapas em estilo console: número + nome; atual em dourado, visitadas clicáveis. */
export function Barra({ step, seen, probs, go }: { step: number; seen: number; probs: Problem[]; go: (i: number) => void }) {
  return (
    <nav aria-label="Etapas da criação" className="scanlines border border-line-2 bg-black/85">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line-2 px-3 py-1.5 font-mono text-xs tracking-[.2em] text-ash">
        <span>PASSO {String(step + 1).padStart(2, '0')} DE {String(STEPS.length).padStart(2, '0')} · {STEPS[step].toUpperCase()}</span>
        <span className="text-gold-dim" aria-hidden>{'▮'.repeat(step + 1)}<span className="text-line-2">{'▮'.repeat(STEPS.length - step - 1)}</span></span>
      </div>
      <ol className="grid grid-cols-3 sm:grid-cols-5 2xl:grid-cols-9">
        {STEPS.map((n, i) => {
          const cur = i === step
          const can = i <= seen
          const bad = can && !cur && probs.some(p => p.step === i && p.block)
          return (
            <li key={n} className="min-w-0 border-line border-r last:border-r-0">
              <button
                type="button"
                disabled={!can || cur}
                aria-current={cur ? 'step' : undefined}
                onClick={() => go(i)}
                className={clsx(
                  'flex w-full min-w-0 items-baseline gap-2 border-b-2 px-2.5 py-2 text-left transition-colors',
                  cur ? 'border-gold bg-gold/10 text-gold'
                    : can ? 'border-transparent text-bone hover:bg-gold/5 hover:text-gold'
                      : 'cursor-default border-transparent text-ash/45',
                )}
              >
                <AssetImg path={ASSET.step(n)} holo className={clsx('h-6 w-6 shrink-0 self-center object-contain', !can && 'opacity-40')}
                  fallback={<span className="font-mono text-sm">{String(i + 1).padStart(2, '0')}</span>} />
                <span className="truncate font-display text-base tracking-[.12em]">{n}</span>
                {can && !cur && (
                  <span className={clsx('ml-auto font-mono text-xs', bad ? 'text-ember' : 'text-gold-dim')} aria-label={bad ? 'pendente' : 'feito'}>
                    {bad ? '!' : '✓'}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
