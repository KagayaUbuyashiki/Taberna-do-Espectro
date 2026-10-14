import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import clsx from 'clsx'
import { PageHeader } from '../components/ui/PageHeader'
import { Portrait } from '../components/ui/Portrait'
import { SPECIES_BY } from '../data/saga'
import { calc } from '../rules/engine'
import { useStore } from '../store/campaign'
import { toast } from '../store/ui'
import type { Character } from '../rules/types'
import { Dialog } from './fichas/Dialog'
import { Header } from './fichas/Header'
import { LevelUp } from './fichas/LevelUp'
import { AbilitiesPanel, CombatPanel, VitalsPanel, WeaponsPanel } from './fichas/Combat'
import { ForcePanel, PowersPanel } from './fichas/Force'
import { FeatsPanel, GearPanel, NotesPanel, SkillsPanel } from './fichas/Traits'
import { classLine, parseImport } from './fichas/util'

export default function Fichas() {
  const chars = useStore(s => s.chars)
  const current = useStore(s => s.current)
  const setCurrent = useStore(s => s.setCurrent)
  const [params, setParams] = useSearchParams()
  const [importing, setImporting] = useState(false)

  const list = useMemo(() => Object.values(chars).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'pt-BR')), [chars])
  // Seleção: ?id= da URL, senão a ficha atual da store, senão a primeira.
  const want = params.get('id')
  const id = want && chars[want] ? want : current && chars[current] ? current : list[0]?.id ?? null
  const c = id ? chars[id] : null

  useEffect(() => { if (id && id !== current) setCurrent(id) }, [id, current, setCurrent])

  const open = (nid: string) => {
    setParams({ id: nid })
    setCurrent(nid)
  }
  const afterDelete = () => setParams({})

  return (
    <div className="space-y-6">
      <PageHeader
        bg="fichas"
        kicker="Tripulação"
        title="Fichas"
        actions={<>
          <Link to="/criar" className="btn btn-primary">+ Novo</Link>
          <button className="btn" onClick={() => setImporting(true)}>Importar</button>
        </>}
      >
        Defesas, limiar, perícias e armas calculados pelo livro. Clique num número para rolar.
      </PageHeader>

      {list.length > 0 && (
        <nav aria-label="Personagens" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {list.map(x => <CharCard key={x.id} c={x} on={x.id === id} onOpen={() => open(x.id)} />)}
        </nav>
      )}

      {c ? <Sheet key={c.id} c={c} onOpen={open} onDeleted={afterDelete} /> : (
        <div className="panel scanlines grid min-h-48 place-items-center text-center">
          <div>
            <div className="font-display text-4xl tracking-[.2em] text-gold/80">Nenhuma ficha</div>
            <p className="mt-2 text-ash">Use o assistente para criar o primeiro herói ou importe uma ficha exportada.</p>
            <Link to="/criar" className="btn btn-primary mt-4">Criar personagem</Link>
          </div>
        </div>
      )}

      {importing && <ImportDialog onClose={() => setImporting(false)} onDone={nid => { setImporting(false); open(nid) }} />}
    </div>
  )
}

function CharCard({ c, on, onOpen }: { c: Character; on: boolean; onOpen: () => void }) {
  const K = calc(c)
  return (
    <button onClick={onOpen} aria-current={on ? 'true' : undefined}
      className={clsx('group flex min-w-0 gap-3 border bg-black/70 p-2.5 text-left transition-colors', on ? 'border-gold bg-gold/5' : 'border-line-2 hover:border-gold')}>
      <Portrait species={c.species} src={c.portrait} className="w-16 shrink-0" />
      <div className="min-w-0">
        <div className={clsx('truncate font-display text-xl tracking-[.08em]', on ? 'text-gold' : 'text-bone group-hover:text-gold')}>{c.name || 'Sem nome'}</div>
        <div className="truncate font-display text-sm tracking-[.18em] text-ash">{SPECIES_BY[c.species]?.name} · {classLine(c)}</div>
        <div className="mt-1 flex flex-wrap gap-x-3 font-mono text-xs text-bone/85">
          <span className={c.hp <= K.hpMax / 2 ? 'text-ember' : ''}>PV {c.hp}/{K.hpMax}</span><span>REF {K.ref}</span><span>FORT {K.fort}</span><span>VON {K.will}</span>
        </div>
        {c.sample && <span className="chip mt-1 px-1.5 py-0 text-xs">Exemplo</span>}
      </div>
    </button>
  )
}

function Sheet({ c, onOpen, onDeleted }: { c: Character; onOpen: (id: string) => void; onDeleted: () => void }) {
  const K = calc(c)
  const [leveling, setLeveling] = useState(false)
  return (
    <article className="space-y-4" aria-label={`Ficha de ${c.name || 'personagem'}`}>
      <Header c={c} K={K} onLevelUp={() => setLeveling(true)} onOpen={onOpen} onDeleted={onDeleted} />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2"><AbilitiesPanel c={c} K={K} /></div>
        <VitalsPanel c={c} K={K} />
        <CombatPanel c={c} K={K} />
        <div className="min-w-0 lg:col-span-2"><WeaponsPanel c={c} K={K} /></div>
        <SkillsPanel c={c} K={K} />
        <div className="min-w-0 lg:col-span-2"><FeatsPanel c={c} K={K} /></div>
        <ForcePanel c={c} K={K} />
        <div className="min-w-0 lg:col-span-2"><PowersPanel c={c} K={K} /></div>
        <GearPanel c={c} K={K} />
        <div className="min-w-0 lg:col-span-2"><NotesPanel c={c} /></div>
      </div>
      {leveling && <LevelUp c={c} onClose={() => setLeveling(false)} />}
    </article>
  )
}

function ImportDialog({ onClose, onDone }: { onClose: () => void; onDone: (id: string) => void }) {
  const [txt, setTxt] = useState('')
  const run = (s: string) => {
    const c = parseImport(s)
    if (!c) { toast('Não reconheci esse arquivo como uma ficha.'); return }
    useStore.getState().saveChar(c)
    toast('Ficha importada.')
    onDone(c.id)
  }
  const file = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (f) f.text().then(run)
  }
  return (
    <Dialog title="Importar ficha" onClose={onClose} footer={<button className="btn btn-primary" disabled={!txt.trim()} onClick={() => run(txt)}>Importar texto</button>}>
      <label className="btn cursor-pointer">
        Escolher arquivo .json
        <input type="file" accept=".json,application/json" className="sr-only" onChange={file} />
      </label>
      <p className="mb-1 mt-4 text-sm text-ash">ou cole o texto exportado:</p>
      <textarea className="input h-48 font-mono text-xs" value={txt} onChange={e => setTxt(e.target.value)} aria-label="Texto da ficha" />
    </Dialog>
  )
}
