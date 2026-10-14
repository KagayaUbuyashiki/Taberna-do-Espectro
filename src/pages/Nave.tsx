import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { PLANETAS, PLANETA_BY, TIERS } from '../data/galaxy'
import { useGalaxy } from '../store/galaxy'
import { GalaxyMap } from '../components/galaxy/GalaxyMap'
import { PlanetGlobe } from '../components/galaxy/PlanetGlobe'
import { rng } from '../components/galaxy/rng'
import { MestreToggle, PlanetInfo, TierBadge } from '../components/galaxy/PlanetInfo'

export default function Nave() {
  const g = useGalaxy()
  const [aberto, setAberto] = useState(false)
  const [foco, setFoco] = useState<string | null>(null)
  const atual = PLANETA_BY[g.naveEm]
  const conhecidos = PLANETAS.filter(p => g.rastreados.includes(p.id) && p.tipo !== 'kyber')
  const kyber = PLANETAS.filter(p => g.kyber.includes(p.id))

  const abrir = (id: string | null = null) => { setFoco(id); setAberto(true) }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden border-l-4 border-blood bg-panel">
        <div className="grid items-center gap-6 p-6 md:grid-cols-[1fr_auto]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-xs uppercase tracking-[.3em] text-ember">Nave · Computador de bordo</p>
              <MestreToggle />
            </div>
            {g.mestre ? (
              <input value={g.nomeNave} onChange={e => g.setNomeNave(e.target.value)} aria-label="Nome da nave"
                className="w-full border-b border-line bg-transparent font-display text-5xl font-extrabold uppercase outline-none focus:border-ember" />
            ) : (
              <h1 className="font-display text-5xl font-extrabold uppercase">{g.nomeNave}</h1>
            )}
            <p className="text-lg">Em órbita de <b className="text-bone">{atual.nome}</b> <span className="text-ash">· {atual.terreno}</span></p>
            <TierBadge tier={atual.tier} />
            <div className="flex flex-wrap gap-3 pt-2">
              <button type="button" onClick={() => abrir()}
                className="group relative bg-blood px-10 py-4 font-display text-2xl font-extrabold uppercase tracking-[.3em] text-bone transition hover:bg-ember focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember">
                Navegar
                <span className="absolute inset-x-0 -bottom-1 h-1 bg-ember transition group-hover:bg-bone" />
              </button>
              <Link to="/ambiente" className="border border-line px-6 py-4 font-display text-lg font-semibold uppercase tracking-[.2em] text-ash hover:border-ember hover:text-bone">
                Desembarcar
              </Link>
            </div>
          </div>
          <div className="hidden justify-self-center md:block"><PlanetGlobe planeta={atual} size={240} /></div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="border border-line bg-hull p-5">
          <h2 className="font-display text-xl font-bold uppercase tracking-[.2em]">Coordenadas conhecidas</h2>
          <p className="mt-1 text-sm text-ash">Só dá para saltar para planetas com coordenadas. Compre cartas de astrogação no Ambiente ou peça ao mestre.</p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {conhecidos.map(p => (
              <li key={p.id}>
                <button type="button" onClick={() => abrir(p.id)}
                  className={clsx('flex w-full items-center gap-3 border bg-panel px-3 py-2 text-left hover:border-ember', p.id === g.naveEm ? 'border-ember' : 'border-line')}>
                  <span className="h-6 w-6 shrink-0 rounded-full" style={{ background: p.cor, boxShadow: `0 0 0 2px ${TIERS[p.tier].cor}` }} />
                  <span className="flex-1">
                    <span className="block font-display font-semibold uppercase tracking-wider">{p.nome}</span>
                    <span className="font-mono text-[11px] text-ash">Tier {p.tier} · {p.grade}</span>
                  </span>
                  {p.id === g.naveEm && <span className="font-mono text-[11px] text-ember">AQUI</span>}
                </button>
              </li>
            ))}
          </ul>
          {kyber.length > 0 && (
            <>
              <h3 className="mt-6 font-display text-sm uppercase tracking-[.2em] text-ember">Sinais de kyber rastreados</h3>
              <ul className="mt-2 flex flex-wrap gap-2">
                {kyber.map(p => (
                  <li key={p.id}><button type="button" onClick={() => abrir(p.id)} className="border border-line bg-panel px-3 py-1 font-display uppercase tracking-wider hover:border-ember">◆ {p.nome}</button></li>
                ))}
              </ul>
            </>
          )}
        </section>
        <section className="border border-line bg-hull p-5">
          <h2 className="font-display text-xl font-bold uppercase tracking-[.2em]">Diário de bordo</h2>
          {g.viagens.length === 0 ? <p className="mt-3 text-sm text-ash">Nenhum salto registrado.</p> : (
            <ol className="mt-3 space-y-1.5 font-mono text-sm">
              {g.viagens.slice(0, 12).map(v => (
                <li key={v.t} className="flex justify-between gap-2 border-b border-line/60 pb-1">
                  <span>{PLANETA_BY[v.de]?.nome} → <b className="text-bone">{PLANETA_BY[v.para]?.nome}</b></span>
                  <span className="text-ash">{new Date(v.t).toLocaleDateString('pt-BR')}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      {aberto && <Navegacao inicial={foco} onClose={() => setAberto(false)} />}
    </div>
  )
}

function Navegacao({ inicial, onClose }: { inicial: string | null; onClose: () => void }) {
  const g = useGalaxy()
  const [sel, setSel] = useState<string | null>(inicial)
  const [busca, setBusca] = useState('')
  const [salto, setSalto] = useState<string | null>(null)
  const [chegada, setChegada] = useState<string | null>(null)

  const alcancaveis = useMemo(() => new Set(g.mestre ? PLANETAS.map(p => p.id) : [...g.rastreados, ...g.kyber]), [g.mestre, g.rastreados, g.kyber])
  const visiveis = useMemo(() => new Set(PLANETAS.filter(p => p.tipo === 'comum' || g.mestre || g.rastreados.includes(p.id) || g.kyber.includes(p.id)).map(p => p.id)), [g.mestre, g.rastreados, g.kyber])
  const resultados = busca.trim() ? PLANETAS.filter(p => visiveis.has(p.id) && p.nome.toLowerCase().includes(busca.trim().toLowerCase())).slice(0, 6) : []
  const p = sel ? PLANETA_BY[sel] : null
  const conhecido = p ? alcancaveis.has(p.id) : false

  const saltar = () => {
    if (!p) return
    setSalto(p.id)
    setTimeout(() => {
      g.viajar(p.id)
      setSalto(null)
      setChegada(p.id)
    }, 1600)
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-void" role="dialog" aria-modal="true" aria-label="Mapa de navegação">
      <header className="flex flex-wrap items-center gap-3 border-b-2 border-blood bg-hull px-4 py-2">
        <p className="font-display text-lg font-bold uppercase tracking-[.3em]">Navegação</p>
        <p className="hidden font-mono text-xs text-ash md:block">Arraste para mover · roda ou pinça para zoom · clique num planeta</p>
        <div className="relative ml-auto">
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar planeta" aria-label="Buscar planeta"
            className="w-44 border border-line bg-void px-3 py-1.5 font-mono text-sm outline-none focus:border-ember sm:w-60" />
          {resultados.length > 0 && (
            <ul className="absolute right-0 top-full z-10 mt-1 w-full border border-line bg-panel">
              {resultados.map(r => (
                <li key={r.id}><button type="button" className="w-full px-3 py-1.5 text-left hover:bg-blood" onClick={() => { setSel(r.id); setBusca('') }}>{r.nome}</button></li>
              ))}
            </ul>
          )}
        </div>
        <button type="button" onClick={onClose} className="border border-line px-3 py-1.5 font-display uppercase tracking-[.2em] hover:border-ember">Fechar ✕</button>
      </header>

      <div className="relative flex-1">
        <GalaxyMap selected={sel} onSelect={setSel} naveEm={g.naveEm} alcancaveis={alcancaveis} visiveis={visiveis} reservaDireita={400} />

        {p && (
          <aside className="absolute inset-x-0 bottom-0 max-h-[60%] overflow-y-auto border-t-2 border-blood bg-hull/95 p-5 backdrop-blur md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[400px] md:border-l-2 md:border-t-0">
            <button type="button" onClick={() => setSel(null)} className="absolute right-3 top-3 text-ash hover:text-bone" aria-label="Fechar detalhes">✕</button>
            <div className="flex justify-center py-2"><PlanetGlobe key={p.id} planeta={p} size={200} /></div>
            <PlanetInfo planeta={p} />
            <div className="mt-5 space-y-2">
              {p.id === g.naveEm ? (
                <p className="border border-ember px-3 py-2 text-center font-display uppercase tracking-[.2em] text-ember">Você está aqui</p>
              ) : conhecido ? (
                <button type="button" onClick={saltar} className="w-full bg-blood py-3 font-display text-lg font-extrabold uppercase tracking-[.3em] hover:bg-ember">
                  Saltar para o hiperespaço
                </button>
              ) : (
                <p className="border border-line px-3 py-2 text-sm text-ash">
                  <b className="text-bone">Sem coordenadas.</b> {p.tipo === 'kyber' ? 'Este mundo só aparece rastreando um cristal kyber.' : 'Compre uma carta de astrogação ou peça ao mestre para liberar.'}
                </p>
              )}
              {g.mestre && p.id !== g.naveEm && (
                g.rastreados.includes(p.id) || g.kyber.includes(p.id)
                  ? <button type="button" onClick={() => g.esquecer(p.id)} className="w-full border border-line py-2 font-display uppercase tracking-[.2em] text-ash hover:border-ember">Mestre: remover coordenadas</button>
                  : <button type="button" onClick={() => (p.tipo === 'kyber' ? g.rastrearKyber(p.id) : g.rastrear([p.id]))} className="w-full border border-ember py-2 font-display uppercase tracking-[.2em] text-ember hover:bg-blood hover:text-bone">Mestre: liberar para os jogadores</button>
              )}
            </div>
          </aside>
        )}

        {chegada && !salto && (
          <div className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 items-center gap-3 border border-ember bg-panel px-4 py-2 shadow-lg">
            <span>Chegamos em <b>{PLANETA_BY[chegada].nome}</b>.</span>
            <Link to="/ambiente" className="font-display uppercase tracking-[.2em] text-ember hover:text-bone">Ver ambiente →</Link>
            <button type="button" onClick={() => setChegada(null)} className="text-ash hover:text-bone" aria-label="Fechar aviso">✕</button>
          </div>
        )}
      </div>

      {salto && <Hiperespaco destino={PLANETA_BY[salto].nome} />}
    </div>
  )
}

/** Efeito de salto: estrelas viram riscos saindo do centro. */
function Hiperespaco({ destino }: { destino: string }) {
  const riscos = useMemo(() => {
    const r = rng(destino)
    return Array.from({ length: 140 }, () => ({ a: r() * 360, d: r() * 0.6, l: 20 + r() * 60, w: r() > 0.85 ? 2 : 1 }))
  }, [destino])
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-void" aria-live="assertive">
      <style>{`@keyframes hs{0%{transform:translateX(0) scaleX(.02);opacity:0}25%{opacity:1}100%{transform:translateX(70vmax) scaleX(1);opacity:0}}`}</style>
      {riscos.map((s, i) => (
        <div key={i} className="absolute left-1/2 top-1/2 h-0 w-0" style={{ transform: `rotate(${s.a}deg)` }}>
          <div className="origin-left bg-bone" style={{ width: `${s.l}vmin`, height: s.w, animation: `hs 1.4s ${s.d}s cubic-bezier(.6,0,.9,.4) both` }} />
        </div>
      ))}
      <p className="relative font-display text-2xl font-extrabold uppercase tracking-[.4em] text-bone">Saltando para {destino}</p>
    </div>
  )
}
