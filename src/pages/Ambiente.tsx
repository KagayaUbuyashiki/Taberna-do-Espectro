import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import {
  ACOES, FUNCOES, ITENS, MATERIAIS, MINERIOS, PLANETAS, PLANETA_BY, TAGS, acoesPadrao, lojaDoPlaneta, planetasDaCarta,
  type AcaoId, type CategoriaItem, type Item, type Tag,
} from '../data/galaxy'
import { useStore } from '../store/campaign'
import { acoesDoAmbiente, novoId, useGalaxy, type Local, type Pedido, type TipoPedido } from '../store/galaxy'
import { PlanetGlobe } from '../components/galaxy/PlanetGlobe'
import { MestreToggle, TagList, TierBadge } from '../components/galaxy/PlanetInfo'
import type { Character } from '../rules/types'

const cr = (n: number) => `${n.toLocaleString('pt-BR')} cr`

const ICONES: Record<AcaoId, string> = {
  comprar: '◈', vender: '⇄', 'armadura-personalizada': '⛨', 'arma-personalizada': '⚔', minerar: '⛏',
  'rastrear-kyber': '◆', descansar: '✚', contratar: '☉', funcoes: '✦',
}

export default function Ambiente() {
  const g = useGalaxy()
  const chars = useStore(s => s.chars)
  const lista = Object.values(chars)
  const [charId, setCharId] = useState<string | null>(useStore.getState().current ?? lista[0]?.id ?? null)
  const [aba, setAba] = useState<AcaoId | null>(null)
  const char = charId ? chars[charId] ?? null : null

  const planeta = PLANETA_BY[g.naveEm]
  const locaisAqui = Object.values(g.locais).filter(l => l.planeta === planeta.id)
  const local = g.localAtual ? g.locais[g.localAtual] ?? null : null
  const tags: Tag[] = local ? local.tags : planeta.tags
  const liberadas = acoesDoAmbiente(planeta.id, local, g.bloqueadas)
  const todas = local ? local.acoes : acoesPadrao(planeta.tags, planeta)
  const visiveis = g.mestre ? todas : liberadas
  const abaAtiva = aba && liberadas.includes(aba) ? aba : null
  const ambienteId = local ? local.id : planeta.id

  const pedir = (tipo: TipoPedido, titulo: string, detalhes: string, custo = 0, itemId?: string) =>
    g.pedir({ tipo, titulo, detalhes, custo, itemId, charId, charNome: char?.name ?? 'Sem personagem', planeta: planeta.id, local: local?.id ?? null })

  return (
    <div className="space-y-6">
      {/* Cabeçalho do ambiente */}
      <section className="border-l-4 border-blood bg-panel">
        <div className="grid items-center gap-6 p-6 md:grid-cols-[auto_1fr]">
          <div className="justify-self-center"><PlanetGlobe planeta={planeta} size={170} /></div>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-xs uppercase tracking-[.3em] text-ember">Ambiente</p>
              <MestreToggle />
            </div>
            <h1 className="font-display text-5xl font-extrabold uppercase leading-none">{local ? local.nome : planeta.nome}</h1>
            {local && <p className="font-display uppercase tracking-[.2em] text-ash">{planeta.nome}</p>}
            <div className="flex flex-wrap items-center gap-2"><TierBadge tier={planeta.tier} /><TagList tags={tags} /></div>
            <p className="max-w-3xl leading-relaxed">{local?.nota || planeta.descricao}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Chip ativo={!local} onClick={() => g.setLocalAtual(null)}>{planeta.nome} (planeta)</Chip>
              {locaisAqui.map(l => <Chip key={l.id} ativo={local?.id === l.id} onClick={() => g.setLocalAtual(l.id)}>{l.nome}</Chip>)}
              <Link to="/nave" className="px-3 py-1 font-display text-sm uppercase tracking-[.2em] text-ash hover:text-bone">Ir para a nave →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Personagem */}
      <section className="flex flex-wrap items-center gap-4 border border-line bg-hull px-5 py-3">
        <label className="flex items-center gap-3">
          <span className="font-display text-sm uppercase tracking-[.2em] text-ash">Personagem</span>
          <select value={charId ?? ''} onChange={e => setCharId(e.target.value || null)} className="border border-line bg-void px-3 py-1.5 outline-none focus:border-ember">
            {lista.length === 0 && <option value="">Nenhum personagem</option>}
            {lista.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        {char && <p className="font-mono">Créditos: <b className="text-bone">{cr(char.credits)}</b></p>}
      </section>

      {/* Ações liberadas */}
      <section>
        <h2 className="font-display text-xl font-bold uppercase tracking-[.2em]">O que dá para fazer aqui</h2>
        {visiveis.length === 0 && <p className="mt-2 text-ash">O mestre ainda não liberou nada neste ambiente.</p>}
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {visiveis.map(a => {
            const on = liberadas.includes(a)
            return (
              <div key={a} className={clsx('relative border bg-panel', abaAtiva === a ? 'border-ember' : 'border-line', !on && 'opacity-50')}>
                <button type="button" disabled={!on} onClick={() => setAba(abaAtiva === a ? null : a)}
                  className="flex h-full w-full flex-col items-start gap-1 p-3 text-left hover:bg-blood/30 disabled:cursor-not-allowed">
                  <span className="text-2xl text-ember">{ICONES[a]}</span>
                  <span className="font-display text-sm font-semibold uppercase leading-tight tracking-wider">{ACOES[a]}</span>
                </button>
                {g.mestre && (
                  <button type="button" onClick={() => g.alternarAcao(ambienteId, a)} title={on ? 'Bloquear para os jogadores' : 'Liberar para os jogadores'}
                    className={clsx('absolute right-1 top-1 px-1.5 font-mono text-[10px] uppercase', on ? 'bg-blood text-bone' : 'border border-line text-ash')}>
                    {on ? 'liberado' : 'bloqueado'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {abaAtiva && (
        <section className="border border-ember bg-hull p-5">
          <h2 className="mb-4 font-display text-2xl font-bold uppercase tracking-[.2em]">{ACOES[abaAtiva]}</h2>
          {abaAtiva === 'comprar' && <Loja itens={lojaDoPlaneta(planeta, local?.tags)} char={char} pedir={pedir} />}
          {abaAtiva === 'vender' && <Vender char={char} pedir={pedir} />}
          {(abaAtiva === 'armadura-personalizada' || abaAtiva === 'arma-personalizada') && (
            <Personalizado tipo={abaAtiva} char={char} pedir={pedir} key={abaAtiva} onEnviado={() => setAba(null)} />
          )}
          {abaAtiva === 'minerar' && (
            <ul className="space-y-2">
              {(planeta.minerios ?? []).filter(m => m !== 'kyber').map(m => (
                <LinhaPedido key={m} titulo={MINERIOS[m].nome} desc={MINERIOS[m].efeito}
                  onPedir={() => pedir('minerar', `Extrair ${MINERIOS[m].nome}`, 'Expedição de mineração. O mestre decide o teste e o perigo.', 0, `minerio-${m}`)} />
              ))}
              {(planeta.minerios ?? []).filter(m => m !== 'kyber').length === 0 && <p className="text-ash">Nenhum minério exclusivo aqui. Fale com o mestre sobre o que existe neste local.</p>}
            </ul>
          )}
          {abaAtiva === 'rastrear-kyber' && (
            <LinhaPedido titulo="Meditar e seguir o chamado do cristal" desc="Teste de Usar a Força (CD 20 sugerida). Se o mestre aprovar, o planeta do cristal aparece no mapa da nave."
              onPedir={() => pedir('rastrear-kyber', 'Rastrear cristal kyber', `Meditação em ${planeta.nome}.`)} />
          )}
          {abaAtiva === 'descansar' && (
            <LinhaPedido titulo="Descansar uma noite" desc="Recupera PV de acordo com as regras de descanso e reseta o Fôlego. O mestre confirma se o lugar é seguro."
              onPedir={() => pedir('descansar', 'Descanso', `Descanso em ${local?.nome ?? planeta.nome}.`)} />
          )}
          {abaAtiva === 'contratar' && <Contratar pedir={pedir} />}
          {abaAtiva === 'funcoes' && (
            <ul className="space-y-2">
              {(planeta.funcoes ?? []).map(f => (
                <LinhaPedido key={f} titulo={FUNCOES[f].nome} desc={FUNCOES[f].desc} custo={FUNCOES[f].custo}
                  onPedir={() => pedir('funcao', FUNCOES[f].nome, FUNCOES[f].desc, FUNCOES[f].custo)} />
              ))}
            </ul>
          )}
        </section>
      )}

      <Pedidos />
      {g.mestre && <Locais planetaId={planeta.id} />}
    </div>
  )
}

function Chip({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={clsx('border px-3 py-1 font-display text-sm uppercase tracking-[.15em]', ativo ? 'border-ember bg-blood text-bone' : 'border-line text-ash hover:text-bone')}>
      {children}
    </button>
  )
}

type PedirFn = (tipo: TipoPedido, titulo: string, detalhes: string, custo?: number, itemId?: string) => Pedido

function LinhaPedido({ titulo, desc, custo, onPedir }: { titulo: string; desc: string; custo?: number; onPedir: () => void }) {
  const [ok, setOk] = useState(false)
  return (
    <li className="flex flex-wrap items-center gap-3 border border-line bg-panel p-3">
      <div className="min-w-0 flex-1">
        <p className="font-display font-semibold uppercase tracking-wider">{titulo}{custo ? <span className="ml-2 font-mono text-sm text-ash">{cr(custo)}</span> : null}</p>
        <p className="text-sm text-ash">{desc}</p>
      </div>
      <button type="button" disabled={ok} onClick={() => { onPedir(); setOk(true) }}
        className="bg-blood px-4 py-2 font-display uppercase tracking-[.2em] hover:bg-ember disabled:bg-panel disabled:text-ash">
        {ok ? 'Pedido enviado' : 'Solicitar'}
      </button>
    </li>
  )
}

/* ------------------------------- Loja ------------------------------- */

const CATS: { id: CategoriaItem; nome: string }[] = [
  { id: 'arma', nome: 'Armas' }, { id: 'armadura', nome: 'Armaduras' },
  { id: 'equipamento', nome: 'Equipamento' }, { id: 'minerio', nome: 'Minérios' }, { id: 'carta', nome: 'Cartas de astrogação' },
]

/** Entrega o item comprado na ficha do personagem. Cartas liberam coordenadas na nave. */
function entregarItem(item: Item, char: Character | null) {
  if (item.categoria === 'carta') {
    useGalaxy.getState().rastrear(planetasDaCarta(item))
    if (!char) return
  }
  if (!char) return
  const patch: Partial<Character> = { credits: char.credits - item.preco }
  if (item.categoria === 'arma') patch.weapons = [...char.weapons, { id: novoId(), n: item.nome, base: item.nome, atkMisc: 0, dmgMisc: 0, notes: '' }]
  else if (item.categoria === 'armadura') patch.armor = item.nome
  else if (item.categoria !== 'carta') {
    const gear = [...char.gear]
    const i = gear.findIndex(x => x.n === item.nome)
    if (i >= 0) gear[i] = { ...gear[i], q: gear[i].q + 1 }
    else gear.push({ n: item.nome, q: 1, w: item.peso ?? 1 })
    patch.gear = gear
  }
  useStore.getState().patchChar(char.id, patch)
}

function Loja({ itens, char, pedir }: { itens: Item[]; char: Character | null; pedir: PedirFn }) {
  const [cat, setCat] = useState<CategoriaItem>('arma')
  const [msg, setMsg] = useState('')
  const rastreados = useGalaxy(s => s.rastreados)
  const lista = useMemo(() => itens.filter(i => i.categoria === cat).sort((a, b) => a.tier - b.tier || a.preco - b.preco), [itens, cat])

  const comprar = (i: Item) => {
    if (!char) return setMsg('Escolha um personagem para comprar.')
    if (char.credits < i.preco) return setMsg(`${char.name} não tem créditos para ${i.nome}.`)
    entregarItem(i, char)
    const p = pedir('compra', `Comprou ${i.nome}`, i.detalhe ?? '', i.preco, i.id)
    useGalaxy.getState().responder(p.id, 'aprovado', 'Compra automática.')
    setMsg(i.categoria === 'carta' ? `Coordenadas gravadas no computador da nave: ${i.nome}.` : `${i.nome} foi para a ficha de ${char.name}.`)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        {CATS.map(c => {
          const n = itens.filter(i => i.categoria === c.id).length
          return n > 0 && <Chip key={c.id} ativo={cat === c.id} onClick={() => setCat(c.id)}>{c.nome} · {n}</Chip>
        })}
      </div>
      {msg && <p className="border-l-2 border-ember bg-panel px-3 py-2 text-sm" role="status">{msg}</p>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="font-display uppercase tracking-[.15em] text-ash">
            <tr className="border-b border-line"><th className="py-2">Item</th><th>Detalhes</th><th>Tier</th><th className="text-right">Preço</th><th /></tr>
          </thead>
          <tbody>
            {lista.map(i => {
              const jaTem = i.categoria === 'carta' && planetasDaCarta(i).every(id => rastreados.includes(id))
              return (
                <tr key={i.id} className="border-b border-line/50">
                  <td className="py-2 pr-3 font-semibold text-bone">
                    {i.nome}
                    {i.exclusivo && <span className="ml-2 border border-ember px-1 font-mono text-[10px] uppercase text-ember">exclusivo</span>}
                    {i.ilegal && <span className="ml-2 border border-line px-1 font-mono text-[10px] uppercase text-ash">ilegal</span>}
                  </td>
                  <td className="pr-3 text-ash">{i.detalhe}</td>
                  <td className="font-mono">{i.tier}</td>
                  <td className="text-right font-mono">{cr(i.preco)}</td>
                  <td className="pl-3 text-right">
                    <button type="button" onClick={() => comprar(i)} disabled={jaTem || (!!char && char.credits < i.preco)}
                      className="bg-blood px-3 py-1 font-display uppercase tracking-[.15em] hover:bg-ember disabled:bg-panel disabled:text-ash">
                      {jaTem ? 'Já tem' : 'Comprar'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Vender({ char, pedir }: { char: Character | null; pedir: PedirFn }) {
  const [enviados, setEnviados] = useState<string[]>([])
  if (!char) return <p className="text-ash">Escolha um personagem.</p>
  const coisas = [...char.weapons.map(w => w.n), ...(char.armor ? [char.armor] : []), ...char.gear.map(g => g.n)]
  const valor = (n: string) => Math.floor((ITENS.find(i => i.nome === n)?.preco ?? 0) / 2)
  return (
    <ul className="space-y-1">
      {coisas.length === 0 && <p className="text-ash">Nada para vender.</p>}
      {coisas.map((n, i) => (
        <li key={`${n}-${i}`} className="flex items-center justify-between gap-3 border-b border-line/50 py-1.5">
          <span>{n}</span>
          <span className="ml-auto font-mono text-ash">{valor(n) ? cr(valor(n)) : 'mestre avalia'}</span>
          <button type="button" disabled={enviados.includes(`${n}-${i}`)}
            onClick={() => { pedir('venda', `Vender ${n}`, 'Metade do preço de tabela, se o mestre aceitar.', -valor(n)); setEnviados(e => [...e, `${n}-${i}`]) }}
            className="border border-line px-3 py-1 font-display text-sm uppercase tracking-[.15em] hover:border-ember disabled:text-ash">
            {enviados.includes(`${n}-${i}`) ? 'Enviado' : 'Oferecer'}
          </button>
        </li>
      ))}
    </ul>
  )
}

function Personalizado({ tipo, char, pedir, onEnviado }: { tipo: 'armadura-personalizada' | 'arma-personalizada'; char: Character | null; pedir: PedirFn; onEnviado: () => void }) {
  const armadura = tipo === 'armadura-personalizada'
  const bases = ITENS.filter(i => i.categoria === (armadura ? 'armadura' : 'arma'))
  const [nome, setNome] = useState('')
  const [base, setBase] = useState(bases[0]?.id ?? '')
  const [material, setMaterial] = useState('durasteel')
  const [visual, setVisual] = useState('')
  const [extra, setExtra] = useState('')
  const b = bases.find(x => x.id === base)
  const mat = MATERIAIS.find(m => m.id === material)!
  const custo = Math.round(((b?.preco ?? 0) * 1.5 + mat.custo) / 50) * 50

  const enviar = (e: React.FormEvent) => {
    e.preventDefault()
    pedir(tipo, `${armadura ? 'Armadura' : 'Arma'}: ${nome || 'sem nome'}`,
      [`Base: ${b?.nome}`, `Material: ${mat.nome}`, visual && `Visual: ${visual}`, extra && `Pedido especial: ${extra}`].filter(Boolean).join('\n'), custo)
    onEnviado()
  }

  const campo = 'w-full border border-line bg-void px-3 py-2 outline-none focus:border-ember'
  return (
    <form onSubmit={enviar} className="grid gap-4 md:grid-cols-2">
      <label className="space-y-1"><span className="font-display text-sm uppercase tracking-[.2em] text-ash">Nome</span>
        <input className={campo} value={nome} onChange={e => setNome(e.target.value)} placeholder={armadura ? 'Ex.: Couraça do Espectro' : 'Ex.: Uivo Rubro'} required /></label>
      <label className="space-y-1"><span className="font-display text-sm uppercase tracking-[.2em] text-ash">Modelo base</span>
        <select className={campo} value={base} onChange={e => setBase(e.target.value)}>
          {bases.map(x => <option key={x.id} value={x.id}>{x.nome} ({cr(x.preco)})</option>)}
        </select></label>
      <label className="space-y-1"><span className="font-display text-sm uppercase tracking-[.2em] text-ash">Material</span>
        <select className={campo} value={material} onChange={e => setMaterial(e.target.value)}>
          {MATERIAIS.filter(m => armadura ? m.id !== 'kyber' : true).map(m => <option key={m.id} value={m.id}>{m.nome}{m.custo ? ` (+${cr(m.custo)})` : ''}</option>)}
        </select>
        <span className="block text-xs text-ash">{mat.desc}</span></label>
      <label className="space-y-1"><span className="font-display text-sm uppercase tracking-[.2em] text-ash">Visual e cores</span>
        <input className={campo} value={visual} onChange={e => setVisual(e.target.value)} placeholder="Ex.: preta com marcas vermelhas do clã" /></label>
      <label className="space-y-1 md:col-span-2"><span className="font-display text-sm uppercase tracking-[.2em] text-ash">O que ela tem de especial</span>
        <textarea className={clsx(campo, 'min-h-24')} value={extra} onChange={e => setExtra(e.target.value)} placeholder="Ex.: jetpack embutido, lâmina retrátil no pulso, modo atordoar..." /></label>
      <div className="flex flex-wrap items-center gap-4 md:col-span-2">
        <p className="font-mono">Custo estimado: <b className="text-bone">{cr(custo)}</b> <span className="text-ash">(o mestre define o final)</span></p>
        <button type="submit" disabled={!char} className="ml-auto bg-blood px-6 py-2 font-display uppercase tracking-[.2em] hover:bg-ember disabled:bg-panel disabled:text-ash">Enviar ao mestre</button>
      </div>
    </form>
  )
}

function Contratar({ pedir }: { pedir: PedirFn }) {
  const opcoes = [
    { t: 'Guia local', d: 'Conhece atalhos, perigos e quem subornar.', c: 100 },
    { t: 'Mercenário', d: 'Um combatente aliado por um dia de trabalho.', c: 500 },
    { t: 'Caçador de recompensa', d: 'Encontra (ou traz) alguém para você.', c: 2500 },
    { t: 'Piloto de aluguel', d: 'Assume o manche da nave numa fuga ou corrida.', c: 800 },
  ]
  return <ul className="space-y-2">{opcoes.map(o => <LinhaPedido key={o.t} titulo={o.t} desc={o.d} custo={o.c} onPedir={() => pedir('contratar', `Contratar: ${o.t}`, o.d, o.c)} />)}</ul>
}

/* ------------------------------ Pedidos ------------------------------ */

const STATUS_COR = { pendente: 'text-ash border-line', aprovado: 'text-bone border-ember bg-blood', recusado: 'text-ash border-line line-through' }

function Pedidos() {
  const g = useGalaxy()
  const chars = useStore(s => s.chars)
  const [respostas, setRespostas] = useState<Record<string, string>>({})
  const [kyberAlvo, setKyberAlvo] = useState<Record<string, string>>({})
  const lista = g.pedidos.filter(p => p.tipo !== 'compra' || g.mestre).slice(0, 40)
  const kyberPlanetas = PLANETAS.filter(p => p.tipo === 'kyber')

  const aprovar = (p: Pedido) => {
    const c = p.charId ? chars[p.charId] : null
    if (c && p.custo) useStore.getState().patchChar(c.id, { credits: c.credits - p.custo })
    if (p.tipo === 'minerar' && p.itemId && c) {
      const nome = ITENS.find(i => i.id === p.itemId)?.nome ?? p.titulo
      useStore.getState().patchChar(c.id, { gear: [...c.gear, { n: nome, q: 1, w: 1 }] })
    }
    if (p.tipo === 'rastrear-kyber') g.rastrearKyber(kyberAlvo[p.id] ?? kyberPlanetas[0].id)
    g.responder(p.id, 'aprovado', respostas[p.id] ?? '')
  }

  return (
    <section className="border border-line bg-hull p-5">
      <h2 className="font-display text-xl font-bold uppercase tracking-[.2em]">{g.mestre ? 'Pedidos dos jogadores' : 'Seus pedidos ao mestre'}</h2>
      {lista.length === 0 && <p className="mt-2 text-sm text-ash">Nenhum pedido ainda.</p>}
      <ul className="mt-3 space-y-2">
        {lista.map(p => (
          <li key={p.id} className="border border-line bg-panel p-3">
            <div className="flex flex-wrap items-start gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-display font-semibold uppercase tracking-wider">{p.titulo}</p>
                <p className="font-mono text-[11px] text-ash">{p.charNome} · {PLANETA_BY[p.planeta]?.nome}{p.local && g.locais[p.local] ? ` · ${g.locais[p.local].nome}` : ''} · {p.custo > 0 ? cr(p.custo) : p.custo < 0 ? `recebe ${cr(-p.custo)}` : 'sem custo'}</p>
                {p.detalhes && <p className="mt-1 whitespace-pre-line text-sm text-ash">{p.detalhes}</p>}
                {p.resposta && <p className="mt-1 border-l-2 border-ember pl-2 text-sm">Mestre: {p.resposta}</p>}
              </div>
              <span className={clsx('border px-2 py-0.5 font-mono text-[11px] uppercase', STATUS_COR[p.status])}>{p.status}</span>
            </div>
            {g.mestre && p.status === 'pendente' && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {p.tipo === 'rastrear-kyber' && (
                  <select aria-label="Planeta do cristal" value={kyberAlvo[p.id] ?? kyberPlanetas[0].id} onChange={e => setKyberAlvo(k => ({ ...k, [p.id]: e.target.value }))}
                    className="border border-line bg-void px-2 py-1 text-sm">
                    {kyberPlanetas.map(k => <option key={k.id} value={k.id}>Revelar {k.nome}</option>)}
                  </select>
                )}
                <input value={respostas[p.id] ?? ''} onChange={e => setRespostas(r => ({ ...r, [p.id]: e.target.value }))} placeholder="Resposta (opcional)"
                  className="min-w-40 flex-1 border border-line bg-void px-2 py-1 text-sm outline-none focus:border-ember" />
                <button type="button" onClick={() => aprovar(p)} className="bg-blood px-3 py-1 font-display text-sm uppercase tracking-[.15em] hover:bg-ember">Aprovar</button>
                <button type="button" onClick={() => g.responder(p.id, 'recusado', respostas[p.id] ?? '')} className="border border-line px-3 py-1 font-display text-sm uppercase tracking-[.15em] hover:border-ember">Recusar</button>
              </div>
            )}
            {g.mestre && p.status !== 'pendente' && (
              <button type="button" onClick={() => g.apagarPedido(p.id)} className="mt-2 font-mono text-[11px] text-ash hover:text-ember">apagar</button>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ------------------------- Locais do mestre ------------------------- */

function Locais({ planetaId }: { planetaId: string }) {
  const g = useGalaxy()
  const vazio = (): Local => ({ id: novoId(), planeta: planetaId, nome: '', tags: [], acoes: ['descansar'], nota: '' })
  const [form, setForm] = useState<Local>(vazio)
  const editando = !!g.locais[form.id]
  const locais = Object.values(g.locais).filter(l => l.planeta === planetaId)

  const alternarTag = (t: Tag) => setForm(f => {
    const tags = f.tags.includes(t) ? f.tags.filter(x => x !== t) : [...f.tags, t]
    return { ...f, tags, acoes: [...new Set([...acoesPadrao(tags), ...f.acoes.filter(a => a !== 'funcoes')])] }
  })
  const alternarAcao = (a: AcaoId) => setForm(f => ({ ...f, acoes: f.acoes.includes(a) ? f.acoes.filter(x => x !== a) : [...f.acoes, a] }))
  const salvar = (e: React.FormEvent) => {
    e.preventDefault()
    g.salvarLocal({ ...form, planeta: planetaId })
    setForm(vazio())
  }

  return (
    <section className="border border-ember/60 bg-hull p-5">
      <h2 className="font-display text-xl font-bold uppercase tracking-[.2em]">Mestre: locais e mapas deste planeta</h2>
      <p className="mt-1 text-sm text-ash">Crie lugares (uma cantina, uma base, o mapa de uma missão) com tags. As tags sugerem o que os jogadores podem fazer ali, e você liga ou desliga cada ação.</p>
      {locais.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {locais.map(l => (
            <li key={l.id} className="flex items-center gap-2 border border-line bg-panel px-2 py-1">
              <span className="font-display uppercase tracking-wider">{l.nome}</span>
              <button type="button" onClick={() => setForm(l)} className="font-mono text-[11px] text-ash hover:text-bone">editar</button>
              <button type="button" onClick={() => g.apagarLocal(l.id)} className="font-mono text-[11px] text-ash hover:text-ember">apagar</button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={salvar} className="mt-4 space-y-3">
        <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome do local" required
          className="w-full border border-line bg-void px-3 py-2 outline-none focus:border-ember" />
        <div>
          <p className="font-display text-sm uppercase tracking-[.2em] text-ash">Tags</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {(Object.keys(TAGS) as Tag[]).map(t => (
              <button key={t} type="button" onClick={() => alternarTag(t)}
                className={clsx('border px-1.5 py-0.5 font-mono text-[11px] uppercase', form.tags.includes(t) ? 'border-ember bg-blood text-bone' : 'border-line text-ash')}>#{TAGS[t]}</button>
            ))}
          </div>
        </div>
        <div>
          <p className="font-display text-sm uppercase tracking-[.2em] text-ash">Liberado para os jogadores</p>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
            {(Object.keys(ACOES) as AcaoId[]).filter(a => a !== 'funcoes').map(a => (
              <label key={a} className="flex items-center gap-1.5 text-sm">
                <input type="checkbox" checked={form.acoes.includes(a)} onChange={() => alternarAcao(a)} className="accent-[var(--color-ember)]" />{ACOES[a]}
              </label>
            ))}
          </div>
        </div>
        <textarea value={form.nota} onChange={e => setForm(f => ({ ...f, nota: e.target.value }))} placeholder="Descrição que os jogadores veem"
          className="min-h-20 w-full border border-line bg-void px-3 py-2 outline-none focus:border-ember" />
        <div className="flex gap-2">
          <button type="submit" className="bg-blood px-5 py-2 font-display uppercase tracking-[.2em] hover:bg-ember">{editando ? 'Salvar local' : 'Criar local'}</button>
          {editando && <button type="button" onClick={() => setForm(vazio())} className="border border-line px-4 py-2 font-display uppercase tracking-[.2em]">Cancelar</button>}
        </div>
      </form>
    </section>
  )
}
