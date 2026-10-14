import { useEffect, useState } from 'react'
import { PageHeader } from '../components/ui/PageHeader'
import clsx from 'clsx'
import { ARMORS, WEAPONS } from '../data/saga'
import { ACOES, ITENS, MATERIAIS, PLANETAS, PLANETA_BY, TAGS, acoesPadrao, type AcaoId, type Tag } from '../data/galaxy'
import { useStore } from '../store/campaign'
import { novoId, useGalaxy, type ItemPersonalizado, type Local, type Pedido, type Recompensa } from '../store/galaxy'
import { PRECISA_EMAIL, campanhaAtual, contaAtual, criarCampanha, enviarImagem, enviarLinkEmail, entrarCampanha, sairCampanha, sync } from '../sync'
import { supabase } from '../lib/supabase'
import { MestreToggle } from '../components/galaxy/PlanetInfo'
import { WantedPoster } from '../components/WantedPoster'
import type { Character } from '../rules/types'

const cr = (n: number) => `${n.toLocaleString('pt-BR')} cr`
const campo = 'input'
const rotulo = 'font-display text-sm uppercase tracking-[.2em] text-ash'
const btn = 'btn btn-primary'
const btn2 = 'btn btn-ghost'

type Aba = 'pedidos' | 'arsenal' | 'mural' | 'locais' | 'mesa'
const ABAS: { id: Aba; nome: string }[] = [
  { id: 'pedidos', nome: 'Pedidos' }, { id: 'arsenal', nome: 'Arsenal' }, { id: 'mural', nome: 'Mural' },
  { id: 'locais', nome: 'Locais' }, { id: 'mesa', nome: 'Mesa online' },
]

export default function Mestre() {
  const g = useGalaxy()
  const [aba, setAba] = useState<Aba>('pedidos')
  const pendentes = g.pedidos.filter(p => p.status === 'pendente' && p.tipo !== 'compra').length
  const podeSerMestre = !g.campanha || g.campanha.papel === 'gm'

  return (
    <div className="space-y-6">
      <PageHeader bg="mestre" kicker="Área do mestre" title="Mestre" actions={podeSerMestre ? <MestreToggle /> : undefined}>
        {g.campanha && <span className="font-mono text-sm">Mesa {g.campanha.name} · código <b className="text-bone">{g.campanha.code}</b></span>}
      </PageHeader>

      {!g.mestre ? (
        <>
          <p className="border border-line bg-hull p-5 text-ash">
            {podeSerMestre ? 'Ligue o modo mestre para ver os pedidos, o mural e os locais.' : 'Esta área é do mestre da mesa. Aqui você só pode trocar de mesa.'}
          </p>
          <MesaOnline />
        </>
      ) : (
        <>
          <nav className="flex flex-wrap gap-1" aria-label="Seções do mestre">
            {ABAS.map(a => (
              <button key={a.id} type="button" onClick={() => setAba(a.id)}
                className={clsx('px-4 py-2 font-display text-sm font-semibold uppercase tracking-[.2em]', aba === a.id ? 'bg-gold text-black' : 'border border-line text-ash hover:text-bone')}>
                {a.nome}{a.id === 'pedidos' && pendentes > 0 && <span className="ml-2 bg-gold px-1.5 text-black">{pendentes}</span>}
              </button>
            ))}
          </nav>
          {aba === 'pedidos' && <Pedidos />}
          {aba === 'arsenal' && <Arsenal />}
          {aba === 'mural' && <MuralMestre />}
          {aba === 'locais' && <Locais />}
          {aba === 'mesa' && <MesaOnline />}
        </>
      )}
    </div>
  )
}

/* -------------------------------- Pedidos -------------------------------- */

function Pedidos() {
  const g = useGalaxy()
  const chars = useStore(s => s.chars)
  const [filtro, setFiltro] = useState<'pendente' | 'todos'>('pendente')
  const [resp, setResp] = useState<Record<string, string>>({})
  const [kyberAlvo, setKyberAlvo] = useState<Record<string, string>>({})
  const [criando, setCriando] = useState<Pedido | null>(null)
  const kyberPlanetas = PLANETAS.filter(p => p.tipo === 'kyber')
  const lista = g.pedidos.filter(p => p.tipo !== 'compra' && (filtro === 'todos' || p.status === 'pendente'))

  const creditar = (p: Pedido, valor: number) => {
    const id = acharFicha(useStore.getState().chars, p)
    const c = id ? useStore.getState().chars[id] : null
    if (c && valor) useStore.getState().patchChar(c.id, { credits: c.credits - valor })
  }
  const aprovar = (p: Pedido) => {
    const id = acharFicha(chars, p)
    const c = id ? chars[id] : null
    if (p.tipo !== 'contrato') creditar(p, p.custo)
    if (p.tipo === 'minerar' && p.itemId && c) {
      const nome = ITENS.find(i => i.id === p.itemId)?.nome ?? p.titulo
      useStore.getState().patchChar(c.id, { gear: [...c.gear, { n: nome, q: 1, w: 1 }] })
    }
    if (p.tipo === 'rastrear-kyber') g.rastrearKyber(kyberAlvo[p.id] ?? kyberPlanetas[0].id)
    g.responder(p.id, 'aprovado', resp[p.id] ?? '')
  }
  const pagarContrato = (p: Pedido) => {
    creditar(p, p.custo) // custo negativo: o personagem recebe
    const r = p.itemId ? g.mural[p.itemId] : null
    if (r) g.salvarRecompensa({ ...r, status: 'capturado' })
    g.responder(p.id, 'entregue', resp[p.id] || 'Recompensa paga.')
  }

  if (criando) return <ItemForm pedido={criando} onFim={() => setCriando(null)} />

  return (
    <section className="space-y-3">
      <div className="flex gap-1">
        {(['pendente', 'todos'] as const).map(f => (
          <button key={f} type="button" onClick={() => setFiltro(f)} className={clsx('border px-3 py-1 font-display text-sm uppercase tracking-[.15em]', filtro === f ? 'border-gold bg-gold text-black' : 'border-line text-ash')}>
            {f === 'pendente' ? 'Pendentes' : 'Todos'}
          </button>
        ))}
      </div>
      {lista.length === 0 && <p className="text-ash">Nenhum pedido {filtro === 'pendente' ? 'esperando você' : 'ainda'}.</p>}
      <ul className="space-y-2">
        {lista.map(p => {
          const personalizado = p.tipo === 'armadura-personalizada' || p.tipo === 'arma-personalizada'
          const item = Object.values(g.arsenal).find(i => i.pedidoId === p.id)
          return (
            <li key={p.id} className={clsx('border bg-panel p-4', personalizado ? 'border-gold/60' : 'border-line')}>
              <div className="flex flex-wrap items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-semibold uppercase tracking-wider">{p.titulo}</p>
                  <p className="font-mono text-[11px] text-ash">{p.charNome} · {PLANETA_BY[p.planeta]?.nome}{p.local && g.locais[p.local] ? ` · ${g.locais[p.local].nome}` : ''} · {p.custo > 0 ? cr(p.custo) : p.custo < 0 ? `recebe ${cr(-p.custo)}` : 'sem custo'} · {new Date(p.t).toLocaleString('pt-BR')}</p>
                  {p.detalhes && <p className="mt-1 whitespace-pre-line text-sm text-ash">{p.detalhes}</p>}
                  {p.resposta && <p className="mt-1 border-l-2 border-gold pl-2 text-sm">Você: {p.resposta}</p>}
                </div>
                <span className="border border-line px-2 py-0.5 font-mono text-[11px] uppercase text-ash">{p.status}</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {p.tipo === 'rastrear-kyber' && p.status === 'pendente' && (
                  <select aria-label="Planeta do cristal" value={kyberAlvo[p.id] ?? kyberPlanetas[0].id} onChange={e => setKyberAlvo(k => ({ ...k, [p.id]: e.target.value }))} className="border border-line bg-void px-2 py-1.5 text-sm">
                    {kyberPlanetas.map(k => <option key={k.id} value={k.id}>Revelar {k.nome}</option>)}
                  </select>
                )}
                {(p.status === 'pendente' || (p.tipo === 'contrato' && p.status === 'aprovado')) && (
                  <input value={resp[p.id] ?? ''} onChange={e => setResp(r => ({ ...r, [p.id]: e.target.value }))} placeholder="Resposta para o jogador"
                    className="input min-w-40 flex-1 py-1.5 text-sm" />
                )}
                {personalizado && p.status !== 'entregue' && p.status !== 'recusado' && (
                  <button type="button" onClick={() => setCriando(p)} className={btn}>{item ? 'Editar item' : 'Criar item'}</button>
                )}
                {!personalizado && p.status === 'pendente' && <button type="button" onClick={() => aprovar(p)} className={btn}>{p.tipo === 'contrato' ? 'Aceitar contrato' : 'Aprovar'}</button>}
                {p.tipo === 'contrato' && p.status === 'aprovado' && <button type="button" onClick={() => pagarContrato(p)} className={btn}>Alvo entregue: pagar</button>}
                {p.status === 'pendente' && <button type="button" onClick={() => g.responder(p.id, 'recusado', resp[p.id] ?? '')} className={btn2}>Recusar</button>}
                {p.status !== 'pendente' && <button type="button" onClick={() => g.apagarPedido(p.id)} className="font-mono text-[11px] text-ash hover:text-ember">apagar</button>}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/* ---------------------------- Criação de itens ---------------------------- */

/** Coloca o item na ficha: arma vira uma entrada de arma, armadura é vestida. */
function entregar(item: ItemPersonalizado, char: Character, cobrar: boolean) {
  const patch: Partial<Character> = cobrar ? { credits: char.credits - item.custo } : {}
  if (item.tipo === 'arma') {
    patch.weapons = [...char.weapons, {
      id: novoId(), n: item.nome, base: item.base, atkMisc: item.atkMisc ?? 0, dmgMisc: item.dmgMisc ?? 0,
      notes: [item.dano && `Dano ${item.dano}`, item.material !== 'Duraço' && item.material, item.especial].filter(Boolean).join(' · '),
    }]
  } else {
    patch.armor = item.base
    patch.armaduraPersonalizada = { nome: item.nome, base: item.base, cat: item.cat ?? 'leve', ref: item.ref ?? 0, fort: item.fort ?? 0, maxDex: item.maxDex ?? 0, especial: [item.material, item.especial].filter(Boolean).join(' · ') }
  }
  useStore.getState().patchChar(char.id, patch)
}

/** Ficha de quem pediu: pelo id, ou pelo nome enquanto as fichas ainda não sincronizam entre aparelhos. */
function acharFicha(chars: Record<string, Character>, p?: Pedido | null) {
  if (!p) return null
  if (p.charId && chars[p.charId]) return p.charId
  return Object.values(chars).find(c => c.name === p.charNome)?.id ?? null
}

function lerDetalhe(detalhes: string, rotulo: string) {
  return detalhes.split('\n').find(l => l.startsWith(`${rotulo}: `))?.slice(rotulo.length + 2) ?? ''
}

function ItemForm({ pedido, inicial, onFim }: { pedido?: Pedido; inicial?: ItemPersonalizado; onFim: () => void }) {
  const g = useGalaxy()
  const chars = useStore(s => s.chars)
  const existente = inicial ?? (pedido ? Object.values(g.arsenal).find(i => i.pedidoId === pedido.id) : undefined)
  const tipoPedido = pedido?.tipo === 'arma-personalizada' ? 'arma' : 'armadura'
  const [it, setIt] = useState<ItemPersonalizado>(() => {
    if (existente) return existente
    const tipo = pedido ? tipoPedido : 'armadura'
    const baseNome = pedido ? lerDetalhe(pedido.detalhes, 'Base') : ''
    const material = pedido ? lerDetalhe(pedido.detalhes, 'Material') || 'Duraço' : 'Duraço'
    const a = ARMORS.find(x => x.n === baseNome) ?? ARMORS[0]
    const w = WEAPONS.find(x => x.n === baseNome) ?? WEAPONS.find(x => x.n === 'Pistola blaster')!
    const mat = MATERIAIS.find(m => m.nome === material)
    return {
      id: novoId(), tipo, nome: pedido ? pedido.titulo.replace(/^(Armadura|Arma): /, '') : '', material,
      base: tipo === 'arma' ? w.n : a.n, custo: pedido?.custo ?? 0,
      especial: pedido ? [lerDetalhe(pedido.detalhes, 'Visual') && `Visual: ${lerDetalhe(pedido.detalhes, 'Visual')}`, lerDetalhe(pedido.detalhes, 'Pedido especial')].filter(Boolean).join('. ') : '',
      cat: a.cat as ItemPersonalizado['cat'], ref: a.ref, fort: a.fort + (mat?.id === 'beskar' ? 2 : 0), maxDex: a.maxDex,
      dano: w.dmg, atkMisc: mat?.id === 'corusca' ? 1 : 0, dmgMisc: 0, dono: acharFicha(chars, pedido), pedidoId: pedido?.id, t: Date.now(),
    }
  })
  const set = <K extends keyof ItemPersonalizado>(k: K, v: ItemPersonalizado[K]) => setIt(x => ({ ...x, [k]: v }))
  const trocarBase = (n: string) => {
    if (it.tipo === 'arma') { const w = WEAPONS.find(x => x.n === n); setIt(x => ({ ...x, base: n, dano: w?.dmg ?? x.dano })) }
    else { const a = ARMORS.find(x => x.n === n); if (a) setIt(x => ({ ...x, base: n, cat: a.cat as ItemPersonalizado['cat'], ref: a.ref, fort: a.fort, maxDex: a.maxDex })) }
  }
  const dono = it.dono ? chars[it.dono] : null
  const salvar = () => { g.salvarItem({ ...it, t: Date.now() }); return it }
  const salvarEEntregar = () => {
    const item = salvar()
    if (dono) entregar(item, dono, true)
    if (pedido) g.responder(pedido.id, 'entregue', `${item.nome} foi forjada e entregue.`)
    onFim()
  }
  const numero = (k: 'ref' | 'fort' | 'maxDex' | 'custo' | 'atkMisc' | 'dmgMisc', label: string) => (
    <label className="space-y-1"><span className={rotulo}>{label}</span>
      <input type="number" className={campo} value={it[k] ?? 0} onChange={e => set(k, Number(e.target.value))} /></label>
  )

  return (
    <section className="space-y-4 border border-gold bg-hull p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-2xl font-bold uppercase tracking-[.2em]">{existente ? 'Editar' : 'Criar'} {it.tipo === 'arma' ? 'arma' : 'armadura'} personalizada</h2>
        <button type="button" onClick={onFim} className={btn2}>Voltar</button>
      </div>
      {pedido && <p className="whitespace-pre-line border-l-2 border-gold bg-panel px-3 py-2 text-sm text-ash"><b className="text-bone">Pedido de {pedido.charNome}:</b>{'\n'}{pedido.detalhes}</p>}
      <div className="grid gap-4 md:grid-cols-3">
        {!pedido && (
          <label className="space-y-1"><span className={rotulo}>Tipo</span>
            <select className={campo} value={it.tipo} onChange={e => { const t = e.target.value as 'arma' | 'armadura'; setIt(x => ({ ...x, tipo: t, base: t === 'arma' ? 'Pistola blaster' : ARMORS[0].n })) }}>
              <option value="armadura">Armadura</option><option value="arma">Arma</option>
            </select></label>
        )}
        <label className="space-y-1"><span className={rotulo}>Nome</span><input className={campo} value={it.nome} onChange={e => set('nome', e.target.value)} /></label>
        <label className="space-y-1"><span className={rotulo}>Modelo base (regras)</span>
          <select className={campo} value={it.base} onChange={e => trocarBase(e.target.value)}>
            {(it.tipo === 'arma' ? WEAPONS.map(w => w.n) : ARMORS.map(a => a.n)).map(n => <option key={n}>{n}</option>)}
          </select></label>
        <label className="space-y-1"><span className={rotulo}>Material</span>
          <select className={campo} value={it.material} onChange={e => set('material', e.target.value)}>
            {MATERIAIS.map(m => <option key={m.id}>{m.nome}</option>)}
          </select></label>
        {it.tipo === 'armadura' ? (
          <>
            <label className="space-y-1"><span className={rotulo}>Categoria</span>
              <select className={campo} value={it.cat} onChange={e => set('cat', e.target.value as ItemPersonalizado['cat'])}>
                <option value="leve">Leve</option><option value="média">Média</option><option value="pesada">Pesada</option>
              </select></label>
            {numero('ref', 'Bônus em Reflexos')}
            {numero('fort', 'Bônus em Fortitude')}
            {numero('maxDex', 'Destreza máxima')}
          </>
        ) : (
          <>
            <label className="space-y-1"><span className={rotulo}>Dano</span><input className={campo} value={it.dano ?? ''} onChange={e => set('dano', e.target.value)} placeholder="3d8" /></label>
            {numero('atkMisc', 'Bônus de ataque')}
            {numero('dmgMisc', 'Bônus de dano')}
          </>
        )}
        {numero('custo', 'Custo (créditos)')}
        <label className="space-y-1"><span className={rotulo}>Dono</span>
          <select className={campo} value={it.dono ?? ''} onChange={e => set('dono', e.target.value || null)}>
            <option value="">Ninguém (guardar no arsenal)</option>
            {Object.values(chars).map(c => <option key={c.id} value={c.id}>{c.name} ({cr(c.credits)})</option>)}
          </select></label>
        <label className="space-y-1 md:col-span-3"><span className={rotulo}>Habilidades especiais</span>
          <textarea className={clsx(campo, 'min-h-24')} value={it.especial} onChange={e => set('especial', e.target.value)} placeholder="Ex.: resiste a sabres de luz; jetpack (voo 6 quadrados); lâmina retrátil 1d6." /></label>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={!it.nome} onClick={() => { salvar(); onFim() }} className={btn2}>Salvar no arsenal</button>
        <button type="button" disabled={!it.nome || !dono} onClick={salvarEEntregar} className={btn}>
          {dono ? `Forjar e entregar a ${dono.name} (−${cr(it.custo)})` : 'Escolha o dono para entregar'}
        </button>
      </div>
    </section>
  )
}

function Arsenal() {
  const g = useGalaxy()
  const chars = useStore(s => s.chars)
  const [editando, setEditando] = useState<ItemPersonalizado | 'novo' | null>(null)
  const itens = Object.values(g.arsenal).sort((a, b) => b.t - a.t)
  if (editando) return <ItemForm inicial={editando === 'novo' ? undefined : editando} onFim={() => setEditando(null)} />
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-ash">Armas e armaduras que você criou. Dá para criar do zero e entregar como recompensa.</p>
        <button type="button" onClick={() => setEditando('novo')} className={btn}>Criar item</button>
      </div>
      {itens.length === 0 && <p className="text-ash">O arsenal está vazio.</p>}
      <ul className="grid gap-2 md:grid-cols-2">
        {itens.map(i => (
          <li key={i.id} className="border border-line bg-panel p-4">
            <p className="font-display text-lg font-semibold uppercase tracking-wider">{i.nome} <span className="font-mono text-xs text-ash">{i.tipo}</span></p>
            <p className="font-mono text-xs text-ash">
              {i.base} · {i.material} · {i.tipo === 'armadura' ? `${i.cat} · Ref +${i.ref} · Fort +${i.fort} · Des máx +${i.maxDex}` : `${i.dano}${i.atkMisc ? ` · atq +${i.atkMisc}` : ''}${i.dmgMisc ? ` · dano +${i.dmgMisc}` : ''}`} · {cr(i.custo)}
            </p>
            {i.especial && <p className="mt-1 text-sm">{i.especial}</p>}
            <p className="mt-1 font-mono text-[11px] text-ash">{i.dono && chars[i.dono] ? `Dono: ${chars[i.dono].name}` : 'Sem dono'}</p>
            <div className="mt-2 flex gap-3">
              <button type="button" onClick={() => setEditando(i)} className="font-mono text-xs text-ash hover:text-bone">editar / entregar</button>
              <button type="button" onClick={() => g.apagarItem(i.id)} className="font-mono text-xs text-ash hover:text-ember">apagar</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ---------------------------------- Mural ---------------------------------- */

function MuralMestre() {
  const g = useGalaxy()
  const vazio = (): Recompensa => ({ id: novoId(), alvo: '', crime: '', imagem: '', recompensa: 1000, condicao: 'Vivo', planeta: g.naveEm, nivel: 1, notas: '', status: 'aberto', visivel: true })
  const [r, setR] = useState<Recompensa>(vazio)
  const set = <K extends keyof Recompensa>(k: K, v: Recompensa[K]) => setR(x => ({ ...x, [k]: v }))
  const lista = Object.values(g.mural)
  const editando = !!g.mural[r.id]
  const [enviando, setEnviando] = useState(false)
  const imagem = (f: File | undefined) => {
    if (!f) return
    setEnviando(true)
    enviarImagem(f).then(url => set('imagem', url)).catch(e => alert(e.message)).finally(() => setEnviando(false))
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <form onSubmit={e => { e.preventDefault(); g.salvarRecompensa(r); setR(vazio()) }} className="space-y-3 border border-line bg-hull p-5">
        <h2 className="font-display text-xl font-bold uppercase tracking-[.2em]">{editando ? 'Editar cartaz' : 'Novo cartaz de procurado'}</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1"><span className={rotulo}>Alvo</span><input required className={campo} value={r.alvo} onChange={e => set('alvo', e.target.value)} placeholder="Ex.: Vex Dorran" /></label>
          <label className="space-y-1"><span className={rotulo}>Crime</span><input className={campo} value={r.crime} onChange={e => set('crime', e.target.value)} placeholder="Ex.: Roubo de coaxium" /></label>
          <label className="space-y-1"><span className={rotulo}>Recompensa (cr)</span><input type="number" className={campo} value={r.recompensa} onChange={e => set('recompensa', Number(e.target.value))} /></label>
          <label className="space-y-1"><span className={rotulo}>Condição</span>
            <select className={campo} value={r.condicao} onChange={e => set('condicao', e.target.value as Recompensa['condicao'])}>
              <option>Vivo</option><option>Morto</option><option>Vivo ou morto</option>
            </select></label>
          <label className="space-y-1"><span className={rotulo}>Onde aparece</span>
            <select className={campo} value={r.planeta} onChange={e => set('planeta', e.target.value)}>
              <option value="galaxia">Em todos os murais</option>
              {PLANETAS.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select></label>
          <label className="space-y-1"><span className={rotulo}>Nível do alvo</span><input type="number" min={1} className={campo} value={r.nivel} onChange={e => set('nivel', Number(e.target.value))} /></label>
          <label className="space-y-1"><span className={rotulo}>Imagem do personagem{enviando && ' (enviando…)'}</span><input type="file" accept="image/*" className={campo} onChange={e => imagem(e.target.files?.[0])} /></label>
          <label className="space-y-1"><span className={rotulo}>Situação</span>
            <select className={campo} value={r.status} onChange={e => set('status', e.target.value as Recompensa['status'])}>
              <option value="aberto">Aberto</option><option value="capturado">Capturado</option><option value="encerrado">Encerrado</option>
            </select></label>
          <label className="space-y-1 md:col-span-2"><span className={rotulo}>Pistas para os jogadores</span>
            <textarea className={clsx(campo, 'min-h-20')} value={r.notas} onChange={e => set('notas', e.target.value)} placeholder="Visto pela última vez na cantina de Mos Eisley." /></label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={r.visivel} onChange={e => set('visivel', e.target.checked)} className="accent-[var(--color-gold)]" />Visível para os jogadores</label>
        </div>
        <div className="flex gap-2">
          <button type="submit" className={btn}>{editando ? 'Salvar cartaz' : 'Pregar no mural'}</button>
          {editando && <button type="button" onClick={() => setR(vazio())} className={btn2}>Cancelar</button>}
        </div>
      </form>
      <div className="space-y-2">
        <p className={rotulo}>Prévia</p>
        <WantedPoster name={r.alvo || 'Nome do alvo'} subtitle={r.crime} image={r.imagem || undefined} tilt={-1.5}
          stats={[{ label: 'Nível', value: r.nivel }, { label: 'Condição', value: r.condicao }]} reward={cr(r.recompensa)} />
      </div>
      <div className="lg:col-span-2">
        <h3 className="font-display text-lg font-bold uppercase tracking-[.2em]">No mural ({lista.length})</h3>
        <ul className="mt-2 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {lista.map(x => (
            <li key={x.id} className="flex items-center gap-3 border border-line bg-panel p-3">
              <div className="min-w-0 flex-1">
                <p className="font-display font-semibold uppercase tracking-wider">{x.alvo} <span className="font-mono text-xs text-ash">{cr(x.recompensa)}</span></p>
                <p className="font-mono text-[11px] text-ash">{x.planeta === 'galaxia' ? 'Toda a galáxia' : PLANETA_BY[x.planeta]?.nome} · {x.status}{x.visivel ? '' : ' · oculto'}</p>
              </div>
              <button type="button" onClick={() => setR(x)} className="font-mono text-xs text-ash hover:text-bone">editar</button>
              <button type="button" onClick={() => g.apagarRecompensa(x.id)} className="font-mono text-xs text-ash hover:text-ember">apagar</button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/* --------------------------------- Locais --------------------------------- */

function Locais() {
  const g = useGalaxy()
  const [planetaId, setPlanetaId] = useState(g.naveEm)
  const vazio = (): Local => ({ id: novoId(), planeta: planetaId, nome: '', tags: [], acoes: ['descansar'], nota: '', visivel: false })
  const [form, setForm] = useState<Local>(vazio)
  const editando = !!g.locais[form.id]
  const locais = Object.values(g.locais).filter(l => l.planeta === planetaId)

  const alternarTag = (t: Tag) => setForm(f => {
    const tags = f.tags.includes(t) ? f.tags.filter(x => x !== t) : [...f.tags, t]
    return { ...f, tags, acoes: [...new Set([...acoesPadrao(tags), ...f.acoes.filter(a => a !== 'funcoes')])] }
  })
  const alternarAcao = (a: AcaoId) => setForm(f => ({ ...f, acoes: f.acoes.includes(a) ? f.acoes.filter(x => x !== a) : [...f.acoes, a] }))

  return (
    <section className="space-y-4 border border-line bg-hull p-5">
      <p className="text-sm text-ash">Crie lugares dentro de um planeta (uma cantina, uma base, o mapa de uma missão). As tags sugerem o que dá para fazer ali e você liga ou desliga cada ação. Locais ocultos só aparecem para os jogadores quando você revelar.</p>
      <label className="flex items-center gap-3"><span className={rotulo}>Planeta</span>
        <select className="border border-line bg-void px-3 py-1.5" value={planetaId} onChange={e => { setPlanetaId(e.target.value); setForm(f => ({ ...f, planeta: e.target.value })) }}>
          {PLANETAS.map(p => <option key={p.id} value={p.id}>{p.nome}{p.id === g.naveEm ? ' (nave aqui)' : ''}</option>)}
        </select></label>
      {locais.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {locais.map(l => (
            <li key={l.id} className="flex items-center gap-2 border border-line bg-panel px-2 py-1">
              <span className="font-display uppercase tracking-wider">{l.nome}</span>
              <button type="button" onClick={() => g.salvarLocal({ ...l, visivel: !l.visivel })} className={clsx('font-mono text-[11px]', l.visivel ? 'text-gold' : 'text-ash')}>{l.visivel ? 'revelado' : 'oculto'}</button>
              <button type="button" onClick={() => setForm(l)} className="font-mono text-[11px] text-ash hover:text-bone">editar</button>
              <button type="button" onClick={() => g.apagarLocal(l.id)} className="font-mono text-[11px] text-ash hover:text-ember">apagar</button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={e => { e.preventDefault(); g.salvarLocal({ ...form, planeta: planetaId }); setForm(vazio()) }} className="space-y-3">
        <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome do local" required className={campo} />
        <div>
          <p className={rotulo}>Tags</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {(Object.keys(TAGS) as Tag[]).map(t => (
              <button key={t} type="button" onClick={() => alternarTag(t)}
                className={clsx('border px-1.5 py-0.5 font-mono text-[11px] uppercase', form.tags.includes(t) ? 'border-gold bg-gold text-black' : 'border-line text-ash')}>#{TAGS[t]}</button>
            ))}
          </div>
        </div>
        <div>
          <p className={rotulo}>Liberado para os jogadores</p>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
            {(Object.keys(ACOES) as AcaoId[]).filter(a => a !== 'funcoes').map(a => (
              <label key={a} className="flex items-center gap-1.5 text-sm">
                <input type="checkbox" checked={form.acoes.includes(a)} onChange={() => alternarAcao(a)} className="accent-[var(--color-gold)]" />{ACOES[a]}
              </label>
            ))}
          </div>
        </div>
        <textarea value={form.nota} onChange={e => setForm(f => ({ ...f, nota: e.target.value }))} placeholder="Descrição que os jogadores veem" className={clsx(campo, 'min-h-20')} />
        <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.visivel} onChange={e => setForm(f => ({ ...f, visivel: e.target.checked }))} className="accent-[var(--color-gold)]" />Revelado (os jogadores já encontraram)</label>
        <div className="flex gap-2">
          <button type="submit" className={btn}>{editando ? 'Salvar local' : 'Criar local'}</button>
          {editando && <button type="button" onClick={() => setForm(vazio())} className={btn2}>Cancelar</button>}
        </div>
      </form>
    </section>
  )
}

/* ------------------------------- Mesa online ------------------------------- */

function MesaOnline() {
  const campanha = useGalaxy(s => s.campanha)
  const [nome, setNome] = useState('')
  const [codigo, setCodigo] = useState('')
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [precisaEmail, setPrecisaEmail] = useState(false)
  const [email, setEmail] = useState('')
  const [conta, setConta] = useState<string | null>(null)
  const [linkEnviado, setLinkEnviado] = useState(false)
  useEffect(() => { contaAtual().then(setConta) }, [])
  const rodar = (f: () => Promise<void>) => {
    setErro(''); setOcupado(true)
    f().catch(e => {
      setOcupado(false)
      if (e.message === PRECISA_EMAIL) setPrecisaEmail(true)
      else setErro(e.message)
    })
  }
  const pedirLink = () => rodar(async () => { await enviarLinkEmail(email); setLinkEnviado(true); setOcupado(false) })

  return (
    <section className="space-y-3 border border-line bg-hull p-5">
      <h2 className="font-display text-xl font-bold uppercase tracking-[.2em]">Mesa online</h2>
      {!supabase ? (
        <p className="text-sm text-ash">
          Agora as mudanças aparecem na hora em todas as abas abertas neste navegador. Para o mestre e os jogadores
          jogarem em aparelhos diferentes, o site precisa do Supabase configurado ({sync.nome === 'local' ? 'ainda não está' : 'ok'}).
        </p>
      ) : campanha || campanhaAtual() ? (
        <div className="space-y-2">
          {campanha ? (
            <p>Você está na mesa <b>{campanha.name}</b> como <b>{campanha.papel === 'gm' ? 'mestre' : 'jogador'}</b>. Código para os jogadores entrarem: <b className="font-mono text-2xl text-gold">{campanha.code}</b></p>
          ) : <p className="text-ash">Conectando à mesa…</p>}
          <button type="button" onClick={sairCampanha} className={btn2}>Sair da mesa</button>
        </div>
      ) : precisaEmail && !conta ? (
        linkEnviado ? (
          <p>Mandei um link para <b>{email}</b>. Abra o e-mail <b>neste mesmo navegador</b> e clique no link; você volta para cá já logado.</p>
        ) : (
          <form onSubmit={e => { e.preventDefault(); pedirLink() }} className="max-w-md space-y-2">
            <p className="text-sm text-ash">Para entrar numa mesa online, informe seu e-mail. Você recebe um link de entrada, sem senha.</p>
            <input type="email" className={campo} value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required />
            <button type="submit" disabled={ocupado} className={btn}>Receber link</button>
          </form>
        )
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {conta && <p className="text-sm text-ash md:col-span-2">Logado como {conta}.</p>}
          <form onSubmit={e => { e.preventDefault(); rodar(() => entrarCampanha(codigo)) }} className="space-y-2">
            <p className={rotulo}>Entrar com o código do mestre</p>
            <input className={clsx(campo, 'font-mono uppercase')} value={codigo} onChange={e => setCodigo(e.target.value)} placeholder="Ex.: K7QX2M" maxLength={6} required />
            <button type="submit" disabled={ocupado} className={btn}>Entrar</button>
          </form>
          <form onSubmit={e => { e.preventDefault(); rodar(() => criarCampanha(nome)) }} className="space-y-2">
            <p className={rotulo}>Criar uma mesa (você vira o mestre)</p>
            <input className={campo} value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome da campanha" />
            <button type="submit" disabled={ocupado} className={btn2}>Criar mesa</button>
          </form>
        </div>
      )}
      {erro && <p className="text-sm text-ember" role="alert">{erro}</p>}
    </section>
  )
}
