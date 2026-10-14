import { useCallback, useState, type FormEvent } from 'react'
import { PageHeader } from '../components/ui/PageHeader'
import { DC_TABLE, PLANETS, XP_TABLE } from '../data/saga'
import { SFX } from '../lib/sfx'
import { useStore } from '../store/campaign'
import { toast } from '../store/ui'
import type { Campaign } from '../rules/types'
import { Abertura } from './narracao/Abertura'
import { paragrafos } from './narracao/dados'
import { Cenas } from './narracao/Cenas'
import { GEN_BOTOES, gerar, useGeradores, type GenTipo } from './narracao/geradores'

const quando = (t: number) => new Date(t).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

/** Acrescenta uma entrada ao diário da campanha. */
function useAnotar() {
  const patchCampaign = useStore(s => s.patchCampaign)
  return useCallback((txt: string) => patchCampaign(c => ({ ...c, log: [...(c.log || []), { t: Date.now(), txt }] })), [patchCampaign])
}

function Cabecalho({ titulo, code }: { titulo: string; code?: string }) {
  return (
    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
      <h2 className="panel-title">{titulo}</h2>
      {code && <span className="font-mono text-xs tracking-[.2em] text-ash">{code}</span>}
    </div>
  )
}

/* ---------- Abertura da sessão ---------- */
function EditorAbertura({ onPlay }: { onPlay: () => void }) {
  const crawl = useStore(s => s.campaign.crawl)
  const patchCampaign = useStore(s => s.patchCampaign)
  const set = (k: keyof Campaign['crawl'], v: string) => patchCampaign(c => ({ ...c, crawl: { ...c.crawl, [k]: v } }))
  const ps = paragrafos(crawl.body)
  return (
    <section className="panel min-w-0">
      <Cabecalho titulo="Abertura da sessão" code="TEXTO DE ABERTURA" />
      <div className="grid gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="field">Episódio<input className="input" value={crawl.ep} onChange={e => set('ep', e.target.value)} /></label>
          <label className="field">Título<input className="input" value={crawl.title} onChange={e => set('title', e.target.value)} /></label>
        </div>
        <label className="field">Texto (um parágrafo por linha em branco)
          <textarea className="input min-h-44 resize-y leading-relaxed" rows={8} value={crawl.body} onChange={e => set('body', e.target.value)} />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="btn btn-primary" onClick={onPlay} disabled={!crawl.title.trim() && !ps.length}>▶ Exibir em tela cheia</button>
          <span className="text-sm text-ash">Clique ou Esc para sair. Ligue o som no topo para a nota de abertura.</span>
        </div>
        {/* Prévia em perspectiva, parada */}
        <div className="relative h-40 overflow-hidden border border-line-2 bg-black [perspective:300px]" aria-hidden>
          <div className="absolute inset-x-[8%] top-3 text-justify text-sm font-semibold text-gold [transform:rotateX(28deg)] [transform-origin:50%_0]">
            <div className="text-center font-display tracking-[.2em]">{crawl.ep}</div>
            <div className="mb-2 text-center font-display text-lg tracking-[.18em]">{crawl.title.toUpperCase()}</div>
            {ps.slice(0, 3).map((p, i) => <p key={i} className="mb-2">{p}</p>)}
          </div>
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black to-transparent" />
        </div>
      </div>
    </section>
  )
}

/* ---------- Diário ---------- */
function Diario() {
  const log = useStore(s => s.campaign.log) || []
  const patchCampaign = useStore(s => s.patchCampaign)
  const anotar = useAnotar()
  const [txt, setTxt] = useState('')
  const enviar = (e: FormEvent) => {
    e.preventDefault()
    const v = txt.trim()
    if (!v) return
    anotar(v)
    setTxt('')
  }
  const apagar = (i: number) => patchCampaign(c => ({ ...c, log: c.log.filter((_, j) => j !== i) }))
  return (
    <section className="panel min-w-0">
      <Cabecalho titulo="Diário da campanha" code={`${log.length} REGISTRO${log.length === 1 ? '' : 'S'}`} />
      <form className="flex gap-2" onSubmit={enviar}>
        <input className="input min-w-0 flex-1" value={txt} onChange={e => setTxt(e.target.value)} placeholder="O que aconteceu?" aria-label="Novo registro" />
        <button type="submit" className="btn btn-sm btn-primary">Registrar</button>
      </form>
      <ol className="mt-3 max-h-[340px] space-y-2 overflow-y-auto pr-1">
        {log.length === 0 && <li className="text-sm text-ash">Nenhum registro ainda. Anote o que acontece na sessão.</li>}
        {log.map((l, i) => ({ l, i })).reverse().map(({ l, i }) => (
          <li key={`${l.t}-${i}`} className="flex items-start justify-between gap-3 border-b border-line pb-2">
            <div className="min-w-0">
              <time className="font-mono text-xs tabular-nums text-ash" dateTime={new Date(l.t).toISOString()}>{quando(l.t)}</time>
              <div className="break-words">{l.txt}</div>
            </div>
            <button type="button" className="btn btn-sm btn-ghost shrink-0 px-2" onClick={() => apagar(i)} aria-label="Apagar registro">×</button>
          </li>
        ))}
      </ol>
    </section>
  )
}

/* ---------- Geradores ---------- */
function Geradores() {
  const { out, add, clear } = useGeradores()
  const anotar = useAnotar()
  const patchCampaign = useStore(s => s.patchCampaign)
  const gen = (k: GenTipo) => { add(gerar(k)); SFX.dice() }
  return (
    <section className="panel min-w-0">
      <Cabecalho titulo="Geradores do mestre" code="IMPROVISO" />
      <div className="flex flex-wrap gap-2">
        {GEN_BOTOES.map(([k, l]) => <button key={k} type="button" className="btn btn-sm" onClick={() => gen(k)}>{l}</button>)}
      </div>
      <div className="mt-3 space-y-2" aria-live="polite">
        {out.length === 0 && <p className="text-sm text-ash">Os resultados aparecem aqui.</p>}
        {out.map(g => (
          <div key={g.id} className="border border-line-2 bg-black/50 p-3">
            <div className="flex flex-wrap items-start gap-2">
              <span className="chip chip-gold shrink-0">{g.k}</span>
              <p className="min-w-0 flex-1 break-words">{g.t}</p>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => { anotar(g.t); toast('Anotado no diário.') }}>Anotar no diário</button>
              {g.local && (
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => { patchCampaign(c => ({ ...c, location: g.local! })); toast(`Local atual: ${g.local}.`) }}>Usar como local atual</button>
              )}
            </div>
          </div>
        ))}
        {out.length > 0 && <button type="button" className="btn btn-sm btn-ghost" onClick={clear}>Limpar resultados</button>}
      </div>
    </section>
  )
}

/* ---------- Local atual ---------- */
function LocalAtual() {
  const location = useStore(s => s.campaign.location)
  const patchCampaign = useStore(s => s.patchCampaign)
  const anotar = useAnotar()
  const planeta = PLANETS.find(p => p.n.toLowerCase() === (location || '').trim().toLowerCase())
  return (
    <section className="panel min-w-0">
      <Cabecalho titulo="Local atual" code={(location || '—').toUpperCase()} />
      <div className="flex flex-wrap items-end gap-2">
        <label className="field min-w-0 flex-1">Onde o grupo está
          <input className="input" list="narracao-planetas" value={location} onChange={e => patchCampaign(c => ({ ...c, location: e.target.value }))} placeholder="Planeta, estação, nave..." />
        </label>
        <button type="button" className="btn btn-sm" disabled={!location?.trim()} onClick={() => { anotar(`Chegada a ${location.trim()}.`); toast('Anotado no diário.') }}>Anotar chegada</button>
      </div>
      <datalist id="narracao-planetas">{PLANETS.map(p => <option key={p.n} value={p.n} />)}</datalist>
      {planeta && (
        <p className="mt-3 border-l-2 border-gold pl-3 text-sm text-bone/85">
          <span className="font-display tracking-[.2em] text-gold">{planeta.r}</span> · {planeta.d}
        </p>
      )}
    </section>
  )
}

/* ---------- Guia rápido ---------- */
function GuiaRapido() {
  const th = 'border-b border-line-2 px-2 py-1.5 text-left font-display text-base font-normal tracking-[.2em] text-gold'
  return (
    <section className="panel min-w-0">
      <Cabecalho titulo="Guia rápido do mestre" />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr><th className={th}>Tarefa</th><th className={`${th} text-right`}>CD</th></tr></thead>
          <tbody>
            {DC_TABLE.map(r => (
              <tr key={r[0]} className="border-b border-line">
                <td className="px-2 py-1.5">{r[0]} <span className="text-xs text-ash">{r[2]}</span></td>
                <td className="px-2 py-1.5 text-right font-mono tabular-nums text-bone">{r[1]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3 className="mt-4 font-display text-lg tracking-[.2em] text-gold">Lado Sombrio: quando marcar +1</h3>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-bone/80">
        <li><b className="text-bone">Sempre:</b> ato maligno óbvio, poder [lado sombrio], usar a Força com raiva, medo ou ódio.</li>
        <li><b className="text-bone">Talvez:</b> ferir com a Força sem necessidade, ato questionável.</li>
        <li><b className="text-bone">Raramente:</b> violência desproporcional repetida.</li>
        <li>Penitência: 1 Ponto de Força tira 1 ponto. Caiu (pontuação = Sab)? Só um ato de heroísmo dramático.</li>
      </ul>
      <h3 className="mt-4 font-display text-lg tracking-[.2em] text-gold">Experiência por nível</h3>
      <div className="mt-2 grid grid-cols-4 gap-1.5 sm:grid-cols-5">
        {XP_TABLE.slice(1).map((x, i) => (
          <div key={i} className="stat">
            <small>{i + 1}º</small>
            <span className="block font-mono text-sm tabular-nums text-bone">{x.toLocaleString('pt-BR')}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function Narracao() {
  const crawl = useStore(s => s.campaign.crawl)
  const location = useStore(s => s.campaign.location)
  const [tocando, setTocando] = useState(false)
  const parar = useCallback(() => setTocando(false), [])
  return (
    <div className="space-y-6">
      <PageHeader bg="narrar" kicker={`Holonet · ${location || 'Narração'}`} title="Narrar"
        actions={<button type="button" className="btn btn-primary" onClick={() => setTocando(true)}>▶ Abertura</button>}>
        Abertura animada da sessão, cenas para mostrar à mesa, diário da campanha e geradores para improvisar.
      </PageHeader>

      <Cenas />

      <div className="grid gap-6 lg:grid-cols-2">
        <EditorAbertura onPlay={() => setTocando(true)} />
        <div className="grid min-w-0 content-start gap-6">
          <LocalAtual />
          <Diario />
        </div>
        <Geradores />
        <GuiaRapido />
      </div>

      {tocando && <Abertura crawl={crawl} onClose={parar} />}
    </div>
  )
}
