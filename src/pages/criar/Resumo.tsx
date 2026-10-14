import { ABILS } from '../../data/saga'
import { sgn } from '../../rules/dice'
import { calc } from '../../rules/engine'
import type { AbilKey } from '../../rules/types'
import { Portrait } from '../../components/ui/Portrait'
import { cl, cr, sp, type Draft } from './draft'

/** Painel lateral com o personagem montado até agora, recalculado a cada escolha. */
export function Resumo({ d }: { d: Draft }) {
  const c = d.c
  const K = calc(c)
  const trained = K.skills.filter(s => s.tr)
  return (
    <aside className="panel space-y-4" aria-label="Resumo do personagem">
      <div className="panel-title">Resumo</div>
      <div className="flex gap-3">
        <Portrait species={c.species} src={c.portrait} className="w-24 shrink-0" />
        <div className="min-w-0">
          <div className="truncate font-display text-2xl tracking-[.1em] text-bone">{c.name.trim() || 'Sem nome'}</div>
          <div className="font-display text-sm tracking-[.2em] text-ash">{sp(c).name} · {cl(c).name} 1</div>
          {d.talent && <div className="mt-1 truncate text-sm text-gold-dim">{d.talent}</div>}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        <div className="stat"><small>PV</small><b>{K.hpMax}</b></div>
        <div className="stat"><small>Ref</small><b>{K.ref}</b></div>
        <div className="stat"><small>Fort</small><b>{K.fort}</b></div>
        <div className="stat"><small>Von</small><b>{K.will}</b></div>
        <div className="stat"><small>Limiar</small><b className="!text-2xl">{K.thr}</b></div>
        <div className="stat"><small>BBA</small><b className="!text-2xl">{sgn(K.bab)}</b></div>
        <div className="stat"><small>Desl.</small><b className="!text-2xl">{K.speed}</b></div>
        <div className="stat"><small>PF</small><b className="!text-2xl">{K.fpMax}</b></div>
      </div>

      <div className="grid grid-cols-6 gap-1 text-center">
        {ABILS.map(([k, , short]) => (
          <div key={k} className="border border-line bg-black/50 py-1">
            <div className="font-display text-xs tracking-[.15em] text-ash">{short}</div>
            <div className="font-mono text-lg leading-tight text-bone">{K.A[k as AbilKey]}</div>
            <div className="font-mono text-xs text-gold-dim">{sgn(K.M[k as AbilKey])}</div>
          </div>
        ))}
      </div>

      <div>
        <h3 className="font-display text-sm tracking-[.25em] text-gold">Perícias treinadas</h3>
        {trained.length ? (
          <ul className="mt-1 space-y-0.5 text-sm">
            {trained.map(s => (
              <li key={s.n} className="flex justify-between gap-2">
                <span className="min-w-0 truncate">{s.n}{s.focus && <span className="text-gold-dim"> · foco</span>}</span>
                <span className="font-mono text-gold">{sgn(s.tot)}</span>
              </li>
            ))}
          </ul>
        ) : <p className="mt-1 text-sm text-ash">Nenhuma ainda.</p>}
      </div>

      <div>
        <h3 className="font-display text-sm tracking-[.25em] text-gold">Talentos</h3>
        <div className="mt-1 flex flex-wrap gap-1">
          {c.feats.length ? c.feats.map((f, i) => <span key={f + i} className="chip !text-xs">{f}</span>) : <span className="text-sm text-ash">Nenhum.</span>}
        </div>
      </div>

      {d.powers.length > 0 && (
        <div>
          <h3 className="font-display text-sm tracking-[.25em] text-gold">Poderes da Força</h3>
          <p className="mt-1 text-sm">{d.powers.join(', ')}</p>
        </div>
      )}

      <div className="flex justify-between border-t border-line pt-2 font-mono text-sm">
        <span className="text-ash">Créditos</span>
        <span className={d.credits == null ? 'text-ash' : c.credits < 0 ? 'text-ember' : 'text-gold'}>
          {d.credits == null ? 'não rolados' : `${cr(c.credits)} cr`}
        </span>
      </div>
    </aside>
  )
}
