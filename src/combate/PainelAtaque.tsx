/*
 * Painel de ataque ligado ao mapa: escolhe atacante, ataque e alvo, lê do mapa a distância,
 * a faixa de alcance e a cobertura, rola e mostra o tiro (ou o golpe) no mapa com o som da arma.
 * Usado na página Mapas (ficha selecionada) e na Mesa (resolver ataque).
 */
import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { sgn } from '../rules/dice'
import { useStore } from '../store/campaign'
import { toast } from '../store/ui'
import { DEF_LABEL, type DefKey } from '../pages/mesa/combat'
import { aplicarDano, atacar, causarDano, notaDoMapa } from './acoes'
import { mirar, mostrarAlcance } from './mapa'
import type { Participante } from './participantes'

const EXTRAS = [['0', 'nenhum'], ['2', 'flanqueando (+2)'], ['1', 'mirando (+1)']] as const
const MANUAL_ALCANCE = [['0', 'queima-roupa / adjacente'], ['-2', 'curto (-2)'], ['-5', 'médio (-5)'], ['-10', 'longo (-10)']] as const
const MANUAL_COB = [['0', 'nenhuma'], ['5', 'cobertura (+5 Ref)'], ['10', 'cobertura melhorada (+10 Ref)']] as const

interface Res { acerto: boolean | null; critico: boolean; dano: string; arma: string; atacante: string; alvo: string; valor: number | null; aplicado: boolean; txt: string }

interface Props {
  lista: Participante[]
  atacante: string
  /** Sem `onAtacante`, o atacante é fixo (a ficha selecionada no mapa). */
  onAtacante?: (chave: string) => void
  alvo: string
  onAlvo: (chave: string) => void
  /** Texto de ajuda para escolher o alvo no mapa. */
  dicaAlvo?: string
}

export function PainelAtaque({ lista, atacante, onAtacante, alvo, onAlvo, dicaAlvo }: Props) {
  // o mapa muda (fichas andando): a leitura acompanha
  const mapa = useStore(s => s.campaign.map)
  const att = lista.find(p => p.chave === atacante)
  const tgt = lista.find(p => p.chave === alvo && p.chave !== atacante)
  const [atkI, setAtkI] = useState(0)
  const [def, setDef] = useState<DefKey>('ref')
  const [extra, setExtra] = useState('0')
  const [manAlc, setManAlc] = useState('0')
  const [manCob, setManCob] = useState('0')
  const [res, setRes] = useState<Res | null>(null)
  const a = att?.ataques[atkI] ?? att?.ataques[0]

  const mira = useMemo(() => (a && att ? mirar(a.arma, att.quem, tgt?.quem) : null), [a, att, tgt, mapa]) // eslint-disable-line react-hooks/exhaustive-deps
  const noMapa = !!mira?.leitura
  const fora = !!mira?.leitura && mira.leitura.faixa < 0

  if (!att) return <p className="text-sm text-ash">Escolha quem ataca.</p>

  const rolar = () => {
    if (!a) { toast(`${att.nome} não tem ataques.`); return }
    const manual = noMapa ? 0 : +manAlc
    const cobManual = !noMapa && def === 'ref' ? +manCob : 0
    const r = atacar({
      arma: a.arma, bonus: a.bonus, extra: +extra + manual,
      quem: { ...att.quem, nome: att.nome },
      alvo: tgt ? { ...tgt.quem, nome: tgt.nome, defesa: tgt.defesas[def] + cobManual, contraReflexo: def === 'ref' } : undefined,
      rotulo: `${a.nome}${tgt ? ' → ' + tgt.nome : ''}`,
    })
    if (!r) { setRes(null); return }
    const nota = noMapa ? notaDoMapa({ ...r.mira, bonusRef: def === 'ref' ? r.mira.bonusRef : 0, cobertura: def === 'ref' ? r.mira.cobertura : null }) : ''
    const vs = r.vs != null ? ` contra ${DEF_LABEL[def]} ${r.vs}` : ''
    setRes({
      acerto: r.acerto, critico: r.critico, dano: a.dano, arma: a.nome, atacante: att.nome, alvo: tgt?.chave ?? '', valor: null, aplicado: false,
      txt: `${att.nome} atacou com ${a.nome}${vs}${nota ? ` (${nota})` : ''}: ${r.acerto == null ? (r.critico ? '20 natural' : 'rolado') : r.acerto ? (r.critico ? 'ACERTO CRÍTICO' : 'acerto') : 'erro'}.`,
    })
  }
  const dano = () => {
    if (!res || !a) return
    const alvoP = lista.find(p => p.chave === res.alvo)
    const { valor } = causarDano({ expr: res.dano, critico: res.critico, quem: res.atacante, arma: res.arma, alvo: alvoP ? { ...alvoP.quem, nome: alvoP.nome } : undefined })
    setRes({ ...res, valor, txt: `${res.txt} Dano: ${valor}${res.critico ? ' (dobrado)' : ''}.` })
  }
  const aplicar = () => {
    if (!res || res.valor == null) return
    const alvoP = lista.find(p => p.chave === res.alvo)
    if (!alvoP) return
    const msg = aplicarDano(alvoP.quem, res.valor)
    setRes({ ...res, aplicado: true, txt: `${res.txt} ${msg}` })
  }

  const sel = 'input !py-1.5'
  const alvos = lista.filter(p => p.chave !== att.chave)
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {onAtacante ? (
          <label className="field min-w-0">Atacante
            <select className={sel} value={att.chave} onChange={e => { onAtacante(e.target.value); setAtkI(0); setRes(null) }}>
              {lista.map(p => <option key={p.chave} value={p.chave}>{p.nome}</option>)}
            </select>
          </label>
        ) : (
          <div className="field min-w-0">Atacante<b className="truncate py-1.5 font-display text-lg tracking-[.08em] text-bone">{att.nome}</b></div>
        )}
        <label className="field min-w-0">Ataque
          <select className={sel} value={atkI} onChange={e => { setAtkI(+e.target.value); setRes(null) }} disabled={!att.ataques.length}>
            {att.ataques.length ? att.ataques.map((k, i) => <option key={i} value={i}>{k.nome} ({sgn(k.bonus)}, {k.dano})</option>) : <option>sem ataques</option>}
          </select>
        </label>
        <label className="field min-w-0">Alvo
          <select className={sel} value={tgt?.chave ?? ''} onChange={e => { onAlvo(e.target.value); setRes(null) }}>
            <option value="">sem alvo</option>
            {alvos.map(p => <option key={p.chave} value={p.chave}>{p.nome}</option>)}
          </select>
        </label>
        <label className="field min-w-0">Contra
          <select className={sel} value={def} onChange={e => setDef(e.target.value as DefKey)}>
            {(Object.keys(DEF_LABEL) as DefKey[]).map(k => <option key={k} value={k}>{DEF_LABEL[k]}{tgt ? ` (${tgt.defesas[k]})` : ''}</option>)}
          </select>
        </label>
        <label className="field min-w-0">Modificador
          <select className={sel} value={extra} onChange={e => setExtra(e.target.value)}>
            {EXTRAS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        {!noMapa && (
          <>
            <label className="field min-w-0">Alcance (sem mapa)
              <select className={sel} value={manAlc} onChange={e => setManAlc(e.target.value)}>
                {MANUAL_ALCANCE.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
            <label className="field min-w-0">Cobertura (sem mapa)
              <select className={sel} value={manCob} onChange={e => setManCob(e.target.value)} disabled={def !== 'ref'}>
                {MANUAL_COB.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
          </>
        )}
      </div>

      {/* O que o mapa diz do ataque */}
      <div className={clsx('border-l-2 bg-black/60 px-3 py-2 text-sm', fora ? 'border-ember text-ember' : noMapa ? 'border-gold text-bone' : 'border-line-2 text-ash')} aria-live="polite">
        {noMapa && mira?.leitura ? (
          <>
            <b className="font-mono">{mira.leitura.rotulo}</b>
            {!fora && (notaDoMapa(mira) || 'sem penalidade') && <span className="text-ash"> · {notaDoMapa(mira) || 'sem penalidade de alcance'}</span>}
            {mira.area.length > 0 && <span className="text-ash"> · área: {mira.area.length} quadrados</span>}
          </>
        ) : mira?.de ? (
          <span>{tgt ? `${tgt.nome} não está no mapa: use alcance e cobertura à mão.` : (dicaAlvo ?? 'Escolha o alvo.')}</span>
        ) : (
          <span>{att.nome} não está no mapa: alcance e cobertura à mão.</span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-sm" onClick={() => a && (mostrarAlcance(a.arma, att.quem) ?? toast(`${att.nome} não está no mapa.`))} disabled={!a}>Mostrar alcance</button>
        <button type="button" className="btn btn-primary btn-sm" onClick={rolar} disabled={!a}>Atacar{a ? ` ${sgn(a.bonus + +extra + (mira?.leitura?.penalidade ?? (noMapa ? 0 : +manAlc)))}` : ''}</button>
        <button type="button" className="btn btn-danger btn-sm" onClick={dano} disabled={!res || res.acerto === false || res.valor != null}>Rolar dano{a ? ` ${a.dano}` : ''}</button>
        <button type="button" className="btn btn-sm" onClick={aplicar} disabled={res?.valor == null || res.aplicado || !res.alvo}>Aplicar {res?.valor ?? ''} no alvo</button>
      </div>
      {res && (
        <p className={'border-l-2 bg-black/60 px-3 py-2 font-mono text-sm ' + (res.critico && res.acerto !== false ? 'border-gold text-gold' : res.acerto ? 'border-bone text-bone' : 'border-line-2 text-ash')} aria-live="polite">{res.txt}</p>
      )}
    </div>
  )
}
