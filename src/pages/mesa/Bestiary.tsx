import { useState, type FormEvent } from 'react'
import { BESTIARY } from '../../data/saga'
import { sgn } from '../../rules/dice'
import { toast } from '../../store/ui'
import { BeastArt } from './BeastArt'
import { SIDE_LABEL, addCustomNPC, addNPC, type Attack, type Beast } from './combat'

/** Ficha de um inimigo do bestiário (Capítulo 16) com quantidade e botão de entrar no combate. */
function BeastCard({ b }: { b: Beast }) {
  const [q, setQ] = useState('1')
  const stats: [string, number | string][] = [
    ['Ref', b.ref], ['Fort', b.fort], ['Von', b.will], ['PV', b.hp], ['Limiar', b.thr], ['Inic', sgn(b.init)], ['Perc', sgn(b.per)], ['Desl', b.spd],
  ]
  return (
    <article className="flex min-w-0 flex-col border border-line-2 border-t-2 border-t-ember bg-black/60">
      <div className="grid grid-cols-[88px_1fr] gap-3 p-3">
        <BeastArt name={b.n} side={b.side} className="aspect-square w-[88px]" />
        <div className="min-w-0">
          <h3 className="font-display text-xl leading-tight tracking-[.12em] text-bone">{b.n}</h3>
          <p className="font-mono text-xs text-ember">ND {b.nd} · {SIDE_LABEL[b.side] ?? ''}</p>
          <div className="mt-2 grid grid-cols-4 gap-1">
            {stats.map(([k, v]) => (
              <div key={k} className="border border-line bg-black/60 px-1 py-0.5 text-center">
                <small className="block font-display text-[10px] tracking-[.15em] text-ash">{k}</small>
                <b className="block font-mono text-sm font-normal text-bone">{v}</b>
              </div>
            ))}
          </div>
        </div>
      </div>
      <ul className="space-y-0.5 border-t border-line px-3 py-2 font-mono text-xs">
        {(b.atk as Attack[]).map(a => (
          <li key={a[0]} className="flex justify-between gap-2"><span className="min-w-0 truncate text-bone">{a[0]}{a[3] ? '' : ' (corpo a corpo)'}</span><span className="shrink-0 text-ash">{sgn(a[1])} · {a[2]}</span></li>
        ))}
      </ul>
      {b.notes && <p className="px-3 pb-2 text-xs text-ash">{b.notes}</p>}
      <div className="mt-auto flex items-center gap-2 border-t border-line p-2">
        <input type="number" min={1} max={12} value={q} onChange={e => setQ(e.target.value)} className="input !w-16 !px-2 !py-1 font-mono" aria-label={`Quantidade de ${b.n}`} />
        <button type="button" className="btn btn-sm btn-danger flex-1" onClick={() => { addNPC(b, +q); toast(`${b.n} entrou no combate.`) }}>+ Combate</button>
      </div>
    </article>
  )
}

export function Bestiary() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {BESTIARY.map(b => <BeastCard key={b.n} b={b} />)}
    </div>
  )
}

/** Inimigo improvisado pelo mestre. */
export function CustomNPC() {
  const [f, setF] = useState({ n: '', ref: '', hp: '', thr: '' })
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const ref = +f.ref || 12
    addCustomNPC(f.n.trim(), ref, +f.hp || 10, +f.thr || ref)
    setF({ n: '', ref: '', hp: '', thr: '' })
  }
  const inp = (k: keyof typeof f, label: string, num = true) => (
    <label className="field min-w-0">{label}
      <input className="input !px-2 !py-1.5" type={num ? 'number' : 'text'} value={f[k]} placeholder={num ? '' : 'Inimigo'} onChange={e => setF({ ...f, [k]: e.target.value })} />
    </label>
  )
  return (
    <form onSubmit={submit} className="grid grid-cols-3 items-end gap-2 sm:grid-cols-[2fr_1fr_1fr_1fr_auto]">
      <div className="col-span-3 sm:col-span-1">{inp('n', 'Nome', false)}</div>
      {inp('ref', 'Ref')}{inp('hp', 'PV')}{inp('thr', 'Limiar')}
      <button className="btn btn-sm btn-danger col-span-3 sm:col-span-1">Criar</button>
    </form>
  )
}
