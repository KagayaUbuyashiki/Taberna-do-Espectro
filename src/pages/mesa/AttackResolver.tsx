import { useState } from 'react'
import { d20, rollDamage } from '../../lib/rolls'
import { sgn } from '../../rules/dice'
import { toast } from '../../store/ui'
import { DEF_LABEL, applyDmgComb, type CombView, type DefKey } from './combat'

const MODS = [
  ['0', 'nenhum'], ['-2', 'alcance curto (-2)'], ['-5', 'alcance médio / combate físico (-5)'], ['-10', 'alcance longo (-10)'],
  ['2', 'flanqueando (+2)'], ['1', 'mirando (+1)'],
] as const
const COVER = [['0', 'nenhuma'], ['5', 'cobertura (+5 Ref)'], ['10', 'cobertura melhorada (+10 Ref)']] as const

interface Res { hit: boolean; crit: boolean; expr: string; attName: string; tgtId: string; dmg: number | null; txt: string }

/**
 * Resolve um ataque: atacante, ataque, alvo e defesa; 20 natural é crítico e dobra o dano.
 * O componente é remontado a cada turno (key), então começa com o combatente da vez.
 */
export function AttackResolver({ list, turnId }: { list: CombView[]; turnId?: string }) {
  const first = list.find(x => x.id === turnId) ?? list[0]
  const [attSel, setAttSel] = useState(first?.id ?? '')
  const att = list.find(x => x.id === attSel) ?? first
  const [atkI, setAtkI] = useState(0)
  const defaultTgt = (a?: CombView) => (list.find(x => x.id !== a?.id && x.side !== a?.side) ?? list.find(x => x.id !== a?.id))?.id ?? ''
  const [tgtSel, setTgtSel] = useState(() => defaultTgt(first))
  const tgt = list.find(x => x.id === tgtSel) ?? list.find(x => x.id === defaultTgt(att))
  const [def, setDef] = useState<DefKey>('ref')
  const [mod, setMod] = useState('0')
  const [cov, setCov] = useState('0')
  const [res, setRes] = useState<Res | null>(null)

  if (list.length < 2) return <p className="text-sm text-ash">Adicione pelo menos dois combatentes.</p>
  if (!att || !tgt) return null
  const a = att.atk[atkI] ?? att.atk[0]

  const rolar = () => {
    if (!a) { toast('Esse combatente não tem ataques.'); return }
    const vs = tgt[def] + (def === 'ref' ? +cov : 0)
    const r = d20(`${a[0]} → ${tgt.name}`, a[1] + +mod, att.name, { vs, target: tgt.name })
    const crit = r.nat === 20
    setRes({
      hit: !!r.hit, crit, expr: a[2], attName: att.name, tgtId: tgt.id, dmg: null,
      txt: `${att.name} rolou ${r.total} contra ${DEF_LABEL[def]} ${vs}: ${r.hit ? (crit ? 'ACERTO CRÍTICO' : 'acerto') : 'erro'}.`,
    })
  }
  const dano = () => {
    if (!res) return
    const dmg = rollDamage('Dano' + (res.crit ? ' crítico' : ''), res.expr, res.attName, res.crit)
    setRes({ ...res, dmg, txt: `${res.txt} Dano: ${dmg}${res.crit ? ' (dobrado)' : ''}.` })
  }
  const aplicar = () => {
    if (!res || res.dmg == null) return
    const m = applyDmgComb(res.tgtId, res.dmg)
    toast(m)
    setRes({ ...res, dmg: null, txt: `${res.txt} ${m}` })
  }

  const sel = 'input !py-1.5'
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="field">Atacante
          <select className={sel} value={att.id} onChange={e => { setAttSel(e.target.value); setAtkI(0); setRes(null) }}>
            {list.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
        </label>
        <label className="field">Ataque
          <select className={sel} value={atkI} onChange={e => { setAtkI(+e.target.value); setRes(null) }} disabled={!att.atk.length}>
            {att.atk.length ? att.atk.map((k, i) => <option key={i} value={i}>{k[0]} ({sgn(k[1])}, {k[2]})</option>) : <option>sem ataques</option>}
          </select>
        </label>
        <label className="field">Alvo
          <select className={sel} value={tgt.id} onChange={e => { setTgtSel(e.target.value); setRes(null) }}>
            {list.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
        </label>
        <label className="field">Contra
          <select className={sel} value={def} onChange={e => setDef(e.target.value as DefKey)}>
            {(Object.keys(DEF_LABEL) as DefKey[]).map(k => <option key={k} value={k}>{DEF_LABEL[k]} ({tgt[k]})</option>)}
          </select>
        </label>
        <label className="field">Modificador
          <select className={sel} value={mod} onChange={e => setMod(e.target.value)}>
            {MODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label className="field">Cobertura do alvo
          <select className={sel} value={cov} onChange={e => setCov(e.target.value)} disabled={def !== 'ref'}>
            {COVER.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary btn-sm" onClick={rolar}>Rolar ataque</button>
        <button type="button" className="btn btn-danger btn-sm" onClick={dano} disabled={!res?.hit || res.dmg != null}>Rolar dano</button>
        <button type="button" className="btn btn-sm" onClick={aplicar} disabled={res?.dmg == null}>Aplicar {res?.dmg ?? ''} no alvo</button>
      </div>
      {res && (
        <p className={'border-l-2 bg-black/60 px-3 py-2 font-mono text-sm ' + (res.crit && res.hit ? 'border-gold text-gold' : res.hit ? 'border-bone text-bone' : 'border-line-2 text-ash')} aria-live="polite">{res.txt}</p>
      )}
    </div>
  )
}
