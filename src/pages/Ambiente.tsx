import { useMemo, useState } from 'react'
import { PageHeader } from '../components/ui/PageHeader'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import {
  ACOES, FUNCOES, ITENS, MATERIAIS, MINERIOS, PLANETA_BY, acoesPadrao, iconeItem, lojaDoPlaneta, planetasDaCarta,
  type AcaoId, type CategoriaItem, type Item, type Tag,
} from '../data/galaxy'
import { useStore } from '../store/campaign'
import { acoesDoAmbiente, novoId, useGalaxy, type Pedido, type TipoPedido } from '../store/galaxy'
import { WantedPoster } from '../components/WantedPoster'
import { PlanetArt } from '../components/galaxy/PlanetArt'
import { MestreToggle, TagList, TierBadge } from '../components/galaxy/PlanetInfo'
import type { Character } from '../rules/types'

const cr = (n: number) => `${n.toLocaleString('pt-BR')} cr`

const ICONES: Record<AcaoId, string> = {
  comprar: '◈', vender: '⇄', 'armadura-personalizada': '⛨', 'arma-personalizada': '⚔', minerar: '⛏',
  'rastrear-kyber': '◆', descansar: '✚', contratar: '☉', mural: '☠', funcoes: '✦',
}

export default function Ambiente() {
  const g = useGalaxy()
  const chars = useStore(s => s.chars)
  const lista = Object.values(chars)
  const [charId, setCharId] = useState<string | null>(useStore.getState().current ?? lista[0]?.id ?? null)
  const [aba, setAba] = useState<AcaoId | null>(null)
  const char = charId ? chars[charId] ?? null : null

  const planeta = PLANETA_BY[g.naveEm]
  // Locais escondidos só aparecem quando o mestre revela: os jogadores exploram.
  const locaisAqui = Object.values(g.locais).filter(l => l.planeta === planeta.id && (g.mestre || l.visivel))
  const local = g.localAtual && locaisAqui.some(l => l.id === g.localAtual) ? g.locais[g.localAtual] : null
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
      <PageHeader bg="ambiente" kicker={local ? `Ambiente · ${planeta.nome}` : 'Ambiente'} title={local ? local.nome : planeta.nome} actions={<MestreToggle />} />
      {/* Cabeçalho do ambiente */}
      <section className="border-l-4 border-gold bg-panel">
        <div className="grid items-center gap-6 p-6 md:grid-cols-[auto_1fr]">
          <div className="justify-self-center"><PlanetArt planeta={planeta} size={170} /></div>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2"><TierBadge tier={planeta.tier} /><TagList tags={tags} /></div>
            <p className="max-w-3xl leading-relaxed">{local?.nota || planeta.descricao}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Chip ativo={!local} onClick={() => g.setLocalAtual(null)}>{planeta.nome} (planeta)</Chip>
              {locaisAqui.map(l => <Chip key={l.id} ativo={local?.id === l.id} onClick={() => g.setLocalAtual(l.id)}>{l.nome}{!l.visivel && ' (oculto)'}</Chip>)}
              {g.mestre && <Link to="/mestre" className="px-3 py-1 font-display text-sm uppercase tracking-[.2em] text-gold hover:text-bone">Criar locais →</Link>}
              <Link to="/nave" className="px-3 py-1 font-display text-sm uppercase tracking-[.2em] text-ash hover:text-bone">Ir para a nave →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Personagem */}
      <section className="flex flex-wrap items-center gap-4 border border-line bg-hull px-5 py-3">
        <label className="flex items-center gap-3">
          <span className="font-display text-sm uppercase tracking-[.2em] text-ash">Personagem</span>
          <select value={charId ?? ''} onChange={e => setCharId(e.target.value || null)} className="border border-line bg-void px-3 py-1.5 outline-none focus:border-gold">
            {lista.length === 0 && <option value="">Nenhum personagem</option>}
            {lista.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        {char && <p className="flex items-center gap-2 font-mono"><IconeItem item={{ icone: 'creditos' } as Item} />Créditos: <b className="text-bone">{cr(char.credits)}</b></p>}
      </section>

      {/* Ações liberadas */}
      <section>
        <h2 className="font-display text-xl font-bold uppercase tracking-[.2em]">O que dá para fazer aqui</h2>
        {visiveis.length === 0 && <p className="mt-2 text-ash">O mestre ainda não liberou nada neste ambiente.</p>}
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {visiveis.map(a => {
            const on = liberadas.includes(a)
            return (
              <div key={a} className={clsx('relative border bg-panel', abaAtiva === a ? 'border-gold' : 'border-line', !on && 'opacity-50')}>
                <button type="button" disabled={!on} onClick={() => setAba(abaAtiva === a ? null : a)}
                  className="flex h-full w-full flex-col items-start gap-1 p-3 text-left hover:bg-gold/10 disabled:cursor-not-allowed">
                  <span className="text-2xl text-gold">{ICONES[a]}</span>
                  <span className="font-display text-sm font-semibold uppercase leading-tight tracking-wider">{ACOES[a]}</span>
                </button>
                {g.mestre && (
                  <button type="button" onClick={() => g.alternarAcao(ambienteId, a)} title={on ? 'Bloquear para os jogadores' : 'Liberar para os jogadores'}
                    className={clsx('absolute right-1 top-1 px-1.5 font-mono text-[10px] uppercase', on ? 'bg-gold text-black' : 'border border-line text-ash')}>
                    {on ? 'liberado' : 'bloqueado'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {abaAtiva && (
        <section className="border border-gold bg-hull p-5">
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
          {abaAtiva === 'mural' && <Mural planetaId={planeta.id} pedir={pedir} />}
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
    </div>
  )
}

function Chip({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={clsx('border px-3 py-1 font-display text-sm uppercase tracking-[.15em]', ativo ? 'border-gold bg-gold text-black' : 'border-line text-ash hover:text-bone')}>
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
        className="btn btn-primary">
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
      {msg && <p className="border-l-2 border-gold bg-panel px-3 py-2 text-sm" role="status">{msg}</p>}
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
                    <IconeItem item={i} />
                    {i.nome}
                    {i.exclusivo && <span className="ml-2 border border-gold px-1 font-mono text-[10px] uppercase text-gold">exclusivo</span>}
                    {i.ilegal && <span className="ml-2 border border-line px-1 font-mono text-[10px] uppercase text-ash">ilegal</span>}
                  </td>
                  <td className="pr-3 text-ash">{i.detalhe}</td>
                  <td className="font-mono">{i.tier}</td>
                  <td className="text-right font-mono">{cr(i.preco)}</td>
                  <td className="pl-3 text-right">
                    <button type="button" onClick={() => comprar(i)} disabled={jaTem || (!!char && char.credits < i.preco)}
                      className="btn btn-primary">
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

/** Ícone do item (public/assets/equipamento). Some se a imagem ainda não chegou. */
function IconeItem({ item }: { item: Item }) {
  const src = iconeItem(item)
  const [ok, setOk] = useState(true)
  if (!src || !ok) return null
  return <img src={src} alt="" onError={() => setOk(false)} className="mr-2 inline-block h-8 w-8 object-contain align-middle mix-blend-screen" />
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
            className="btn btn-ghost">
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

  const campo = 'input'
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
        <button type="submit" disabled={!char} className="ml-auto btn btn-primary">Enviar ao mestre</button>
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

const STATUS_COR = { pendente: 'text-ash border-line', aprovado: 'border-gold text-gold', entregue: 'border-gold text-gold', recusado: 'text-ash border-line line-through' }

function Pedidos() {
  const g = useGalaxy()
  const lista = g.pedidos.filter(p => p.tipo !== 'compra').slice(0, 30)
  return (
    <section className="border border-line bg-hull p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-xl font-bold uppercase tracking-[.2em]">Pedidos ao mestre</h2>
        {g.mestre && <Link to="/mestre" className="font-display text-sm uppercase tracking-[.2em] text-gold hover:text-bone">Responder na aba Mestre →</Link>}
      </div>
      {lista.length === 0 && <p className="mt-2 text-sm text-ash">Nenhum pedido ainda.</p>}
      <ul className="mt-3 space-y-2">
        {lista.map(p => (
          <li key={p.id} className="flex flex-wrap items-start gap-2 border border-line bg-panel p-3">
            <div className="min-w-0 flex-1">
              <p className="font-display font-semibold uppercase tracking-wider">{p.titulo}</p>
              <p className="font-mono text-[11px] text-ash">{p.charNome} · {PLANETA_BY[p.planeta]?.nome} · {p.custo > 0 ? cr(p.custo) : p.custo < 0 ? `recebe ${cr(-p.custo)}` : 'sem custo'}</p>
              {p.resposta && <p className="mt-1 border-l-2 border-gold pl-2 text-sm">Mestre: {p.resposta}</p>}
            </div>
            <span className={clsx('border px-2 py-0.5 font-mono text-[11px] uppercase', STATUS_COR[p.status])}>{p.status}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ------------------------- Mural de recompensas ------------------------- */

function Mural({ planetaId, pedir }: { planetaId: string; pedir: PedirFn }) {
  const g = useGalaxy()
  const cartazes = Object.values(g.mural).filter(r => (r.planeta === planetaId || r.planeta === 'galaxia') && (g.mestre || r.visivel) && r.status === 'aberto')
  const [aceitos, setAceitos] = useState<string[]>([])
  if (cartazes.length === 0) return <p className="text-ash">Nenhum cartaz pregado aqui. {g.mestre && <Link to="/mestre" className="text-gold">Criar no Mural do mestre →</Link>}</p>
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {cartazes.map((r, i) => (
        <div key={r.id} className="space-y-2">
          <WantedPoster name={r.alvo} subtitle={r.crime} image={r.imagem || undefined} tilt={[-2, 1.5, -1, 2][i % 4]}
            stats={[{ label: 'Nível', value: r.nivel }, { label: 'Condição', value: r.condicao }]} reward={cr(r.recompensa)} />
          {r.notas && <p className="text-sm text-ash">{r.notas}</p>}
          <button type="button" disabled={aceitos.includes(r.id)}
            onClick={() => { pedir('contrato', `Contrato: ${r.alvo}`, `${r.crime}. ${r.condicao}. Recompensa ${cr(r.recompensa)}.`, -r.recompensa, r.id); setAceitos(a => [...a, r.id]) }}
            className="w-full btn btn-primary">
            {aceitos.includes(r.id) ? 'Contrato pedido' : 'Aceitar contrato'}
          </button>
        </div>
      ))}
    </div>
  )
}
