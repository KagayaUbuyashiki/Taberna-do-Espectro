import { useState, type ChangeEvent } from 'react'
import clsx from 'clsx'
import { Portrait } from '../../components/ui/Portrait'
import { AlienText } from '../../components/AlienText'
import { XP_TABLE } from '../../data/saga'
import { has, hasT, type Calc } from '../../rules/engine'
import { useStore } from '../../store/campaign'
import { toast } from '../../store/ui'
import { SFX } from '../../lib/sfx'
import type { Character } from '../../rules/types'
import { Dialog } from './Dialog'
import { classLine, duplicate, exportJson, exportName, shrinkImage } from './util'

const ID_FIELDS: [keyof Character, string][] = [['player', 'Jogador'], ['age', 'Idade'], ['sex', 'Sexo'], ['height', 'Altura'], ['weight', 'Peso']]

/** Cabeçalho em estilo dossiê: retrato, nome, identificação, XP e ações da ficha. */
export function Header({ c, K, onLevelUp, onOpen, onDeleted }: { c: Character; K: Calc; onLevelUp: () => void; onOpen: (id: string) => void; onDeleted: () => void }) {
  const up = (p: Partial<Character>) => useStore.getState().patchChar(c.id, p)
  const [editName, setEditName] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const [exp, setExp] = useState(false)

  const swMax = 1 + (hasT(c, 'Duro Feito Pedra') ? 1 : 0) + (has(c, 'Segunda Chance Extra') ? 1 : 0)
  const swOk = c.hp <= K.hpMax / 2 && (c.secondWind || 0) < swMax
  const prevXp = XP_TABLE[Math.min(20, K.lvl)] || 0
  const xpPct = K.xpNext ? Math.max(0, Math.min(100, ((c.xp - prevXp) / (K.xpNext - prevXp)) * 100)) : 100
  const canLevel = K.lvl < 20 && !!K.xpNext && c.xp >= K.xpNext

  const portrait = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    const url = await shrinkImage(f)
    if (url) up({ portrait: url }); else toast('Não consegui ler essa imagem.')
  }
  const secondWind = () => {
    // Livro: cura ¼ dos PV máximos ou o valor de Constituição, o que for maior.
    const h = Math.max(Math.floor(K.hpMax / 4), K.A.con)
    up({ hp: Math.min(K.hpMax, c.hp + h), secondWind: (c.secondWind || 0) + 1 })
    toast(`Segunda Chance: +${h} PV.`)
    SFX.force()
  }
  const rest = () => {
    const mult = c.species === 'wookiee' ? 2 : 1
    const powers = c.powers.map(p => ({ ...p, used: false }))
    if (c.persistent) { up({ secondWind: 0, powers }); toast('Condição persistente impede a cura natural.'); return }
    up({ hp: Math.min(K.hpMax, c.hp + K.lvl * mult), cond: 0, secondWind: 0, powers })
    toast(`Descanso: +${K.lvl * mult} PV, curso da condição limpo.`)
  }
  const dup = () => {
    const n = duplicate(c)
    useStore.getState().saveChar(n)
    toast('Ficha duplicada.')
    onOpen(n.id)
  }
  const del = () => {
    useStore.getState().deleteChar(c.id)
    toast('Ficha excluída.')
    setConfirmDel(false)
    onDeleted()
  }

  return (
    <section className="relative overflow-hidden border border-line-2 border-l-4 border-l-gold bg-panel/90 backdrop-blur-sm">
      <div className="scanlines pointer-events-none absolute inset-0 opacity-40" aria-hidden />
      <div className="relative grid gap-5 p-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:p-6">
        <div className="flex flex-row gap-3 sm:flex-col">
          <Portrait species={c.species} src={c.portrait} className="w-32 shrink-0 sm:w-44" />
          <div className="flex min-w-0 flex-col gap-2">
            <label className="btn btn-sm btn-ghost cursor-pointer whitespace-normal">
              Trocar retrato
              <input type="file" accept="image/*" className="sr-only" onChange={portrait} />
            </label>
            {c.portrait && <button className="btn btn-sm btn-ghost whitespace-normal" onClick={() => up({ portrait: null })}>Usar arte da espécie</button>}
            <span className="font-mono text-xs tracking-widest text-ash">FICHA {c.id.slice(0, 6).toUpperCase()}</span>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <div className="min-w-0">
            <div className="kicker text-base sm:text-xl">{K.sp.name} · {classLine(c)}</div>
            {editName ? (
              <input
                autoFocus
                className="input mt-2 font-display text-3xl tracking-[.1em]"
                value={c.name}
                aria-label="Nome"
                onChange={e => up({ name: e.target.value })}
                onBlur={() => setEditName(false)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setEditName(false) }}
              />
            ) : (
              <button className="group mt-2 block max-w-full text-left" onClick={() => setEditName(true)} title="Editar nome">
                <h2 className="title-outline break-words text-[clamp(2.2rem,6vw,4.2rem)] group-hover:[-webkit-text-stroke-color:var(--color-bone)]">{c.name || 'Sem nome'}</h2>
                <span className="sr-only">Editar nome</span>
              </button>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="chip chip-gold">Nível {K.lvl}</span>
              {K.forceSens && <span className="chip border-holo text-holo">Sensitivo à Força</span>}
              {c.sample && <span className="chip">Exemplo</span>}
              <AlienText text={c.name || 'ficha'} size={10} className="ml-1 text-gold/40" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {ID_FIELDS.map(([k, l]) => (
              <label key={k} className="field min-w-0">{l}
                <input className="input py-1.5" value={String(c[k] ?? '')} onChange={e => up({ [k]: e.target.value } as Partial<Character>)} />
              </label>
            ))}
            <label className="field min-w-0">XP
              <input className="input py-1.5 font-mono" type="number" min={0} value={c.xp || 0} onChange={e => up({ xp: +e.target.value || 0 })} />
            </label>
          </div>

          <div>
            <div className="h-1.5 w-full bg-black/70 ring-1 ring-line-2"><div className={clsx('h-full', canLevel ? 'bg-gold' : 'bg-gold-dim/70')} style={{ width: `${xpPct}%` }} /></div>
            <p className="mt-1 text-sm text-ash">
              {K.lvl >= 20 ? 'Nível máximo.' : canLevel
                ? <span className="text-gold">XP suficiente para o nível {K.lvl + 1}.</span>
                : <>Próximo nível: <span className="font-mono">{(K.xpNext || 0).toLocaleString('pt-BR')}</span> XP</>}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button className="btn btn-primary btn-sm" disabled={K.lvl >= 20} onClick={onLevelUp}>Subir de nível</button>
            <button className="btn btn-sm" disabled={!swOk} onClick={secondWind} title="Ação rápida, com metade dos PV ou menos">
              Segunda Chance <span className="font-mono">{c.secondWind || 0}/{swMax}</span>
            </button>
            <button className="btn btn-sm" onClick={rest}>Descanso de 8 h</button>
            <button className="btn btn-sm btn-ghost" onClick={() => setExp(true)}>Exportar</button>
            <button className="btn btn-sm btn-ghost" onClick={dup}>Duplicar</button>
            <button className="btn btn-sm btn-danger" onClick={() => setConfirmDel(true)}>Excluir</button>
          </div>

          {confirmDel && (
            <div role="alertdialog" aria-label="Confirmar exclusão" className="border border-ember bg-blood/20 p-3">
              <p className="text-bone"><b>Excluir {c.name || 'esta ficha'}?</b> A ficha some deste navegador e da conta. Não dá para desfazer.</p>
              <div className="mt-3 flex flex-wrap justify-end gap-2">
                <button className="btn btn-sm btn-ghost" autoFocus onClick={() => setConfirmDel(false)}>Cancelar</button>
                <button className="btn btn-sm btn-danger" onClick={del}>Excluir de vez</button>
              </div>
            </div>
          )}
        </div>
      </div>
      {exp && <ExportDialog c={c} onClose={() => setExp(false)} />}
    </section>
  )
}

function ExportDialog({ c, onClose }: { c: Character; onClose: () => void }) {
  const json = exportJson(c)
  const download = () => {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = exportName(c)
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    toast('Arquivo enviado para download.')
  }
  const copy = () => {
    navigator.clipboard?.writeText(json).then(() => toast('Copiado.'), () => toast('Selecione o texto e use Ctrl+C.'))
  }
  return (
    <Dialog title="Exportar ficha" onClose={onClose} footer={<><button className="btn btn-ghost" onClick={copy}>Copiar texto</button><button className="btn btn-primary" onClick={download}>Baixar .json</button></>}>
      <p className="mb-2 text-sm text-ash">Guarde o arquivo ou o texto. Para trazer de volta, use Importar na lista de fichas.</p>
      <textarea className="input h-56 font-mono text-xs" readOnly value={json} onFocus={e => e.target.select()} aria-label="Ficha em JSON" />
    </Dialog>
  )
}
