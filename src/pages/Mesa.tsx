import { useMemo, type ReactNode } from 'react'
import clsx from 'clsx'
import { PageHeader } from '../components/ui/PageHeader'
import { Portrait } from '../components/ui/Portrait'
import { useStore } from '../store/campaign'
import { toast } from '../store/ui'
import { AttackResolver } from './mesa/AttackResolver'
import { Bestiary, CustomNPC } from './mesa/Bestiary'
import { CombatRow } from './mesa/CombatRow'
import { addPC, combView, endCombat, nextTurn, rollInitAll, sortByInit, type CombView } from './mesa/combat'

/** Painel do console: título em display, código em mono à direita. */
function Console({ title, code, children, className }: { title: string; code?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={clsx('panel', className)}>
      <header className="scanlines -mx-4 -mt-4 mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-line-2 px-4 py-2">
        <h2 className="panel-title">{title}</h2>
        {code && <span className="font-mono text-xs tracking-[.2em] text-gold-dim">{code}</span>}
      </header>
      {children}
    </section>
  )
}

export default function Mesa() {
  const combat = useStore(s => s.campaign.combat)
  const chars = useStore(s => s.chars)
  const views = useMemo(() => combat.list.map(x => combView(x, chars)).filter((v): v is CombView => !!v), [combat.list, chars])
  const activeId = combat.list[combat.turn]?.id
  const active = views.find(v => v.id === activeId)
  const heroes = Object.values(chars)
  const enemies = views.filter(v => v.side === 'npc')
  const standing = enemies.filter(v => v.cond < 5).length

  const proximo = () => { const r = nextTurn(); if (r) toast(`Rodada ${r}`) }
  const encerrar = () => { endCombat(); toast('Combate encerrado. Os heróis continuam na lista.') }

  return (
    <div className="space-y-6">
      <PageHeader bg="mesa" kicker="Console de combate" title="Mesa">
        Iniciativa, pontos de vida, limiar de dano e ataques resolvidos contra as defesas, como no capítulo de combate.
      </PageHeader>

      {/* Leitura rápida da ponte */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="stat"><small>Rodada</small><b className="font-mono">{combat.round}</b></div>
        <div className="stat"><small>Turno</small><b className="font-mono">{views.length ? `${Math.min(combat.turn + 1, combat.list.length)}/${combat.list.length}` : '–'}</b></div>
        <div className="stat min-w-0"><small>Agindo</small><b className="truncate !text-2xl text-gold">{active?.name ?? '–'}</b></div>
        <div className="stat"><small>Inimigos de pé</small><b className={clsx('font-mono', standing ? 'text-ember' : 'text-bone')}>{standing}/{enemies.length}</b></div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Console title="Ordem de iniciativa" code={`RODADA ${combat.round}`}>
          <div className="mb-4 flex flex-wrap gap-2">
            <button type="button" className="btn btn-sm btn-primary" onClick={rollInitAll} disabled={!views.length}>Rolar de todos</button>
            <button type="button" className="btn btn-sm" onClick={sortByInit} disabled={views.length < 2}>Ordenar</button>
            <button type="button" className="btn btn-sm" onClick={proximo} disabled={!views.length}>Próximo turno →</button>
            <button type="button" className="btn btn-sm btn-ghost" onClick={encerrar} disabled={!combat.list.length}>Encerrar combate</button>
          </div>
          {views.length ? (
            <ol className="space-y-2">
              {views.map(v => <CombatRow key={v.id} v={v} active={v.id === activeId} />)}
            </ol>
          ) : <p className="text-ash">Adicione heróis e inimigos ao lado.</p>}
        </Console>

        <div className="min-w-0 space-y-6">
          <Console title="Resolver ataque" code="d20 vs DEFESA">
            <AttackResolver key={`${combat.round}-${activeId ?? ''}-${views.length}`} list={views} turnId={activeId} />
          </Console>

          <Console title="Adicionar heróis">
            {heroes.length ? (
              <div className="flex flex-wrap gap-2">
                {heroes.map(c => {
                  const dentro = combat.list.some(x => x.charId === c.id)
                  return (
                    <button key={c.id} type="button" disabled={dentro} onClick={() => addPC(c.id)}
                      className="flex min-w-0 items-center gap-2 border border-gold/70 bg-black/60 py-1 pl-1 pr-3 font-display tracking-[.12em] text-gold transition-colors hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-40">
                      <Portrait species={c.species} src={c.portrait} className="w-8 shrink-0" />
                      <span className="truncate">{c.name || 'Sem nome'}</span>
                      {dentro && <span className="text-xs text-ash">✓</span>}
                    </button>
                  )
                })}
              </div>
            ) : <p className="text-ash">Crie fichas primeiro.</p>}
          </Console>

          <Console title="Inimigo improvisado">
            <CustomNPC />
          </Console>
        </div>
      </div>

      <Console title="Bestiário" code="CAPÍTULO 16">
        <Bestiary />
      </Console>
    </div>
  )
}
