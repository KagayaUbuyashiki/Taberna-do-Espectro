import { useState, type ReactNode } from 'react'
import clsx from 'clsx'
import { ABILS, CLASSES } from '../../data/saga'
import { babOf, calc, classLevels, has } from '../../rules/engine'
import { mod, rnd, sgn } from '../../rules/dice'
import { useStore } from '../../store/campaign'
import { toast } from '../../store/ui'
import { SFX } from '../../lib/sfx'
import type { AbilKey, Character, ClassId } from '../../rules/types'
import { Dialog } from './Dialog'
import { addFeats, classSkillList } from './util'

/** Assistente de subida de nível (Capítulo 3): classe, PV, aumentos de habilidade e perícia por Int.
 * Os pontos de talento e de aptidão que o nível dá são gastos depois, na Árvore de Habilidades. */
export function LevelUp({ c, onClose, onDone }: { c: Character; onClose: () => void; onDone?: () => void }) {
  const K = calc(c)
  const nl = K.lvl + 1
  const CL = classLevels(c)
  const [cls, setCls] = useState<ClassId>(c.cls[c.cls.length - 1] || 'soldado')
  const [hp, setHp] = useState<number | null>(null)
  const [start, setStart] = useState<string | null>(null)
  const [inc, setInc] = useState<AbilKey[]>([])
  const [skill, setSkill] = useState<string | null>(null)

  const C = CLASSES[cls]
  const newClassLv = (CL[cls] || 0) + 1
  const isNew = !CL[cls]
  // Livro: talento a cada 3 níveis de personagem; aptidão nos níveis ímpares da classe, talento bônus nos pares; +1 em duas habilidades a cada 4 níveis.
  const needFeat = nl % 3 === 0
  const needTalent = newClassLv % 2 === 1
  const needBonus = newClassLv % 2 === 0
  const needInc = nl % 4 === 0

  // Ficha provisória com o novo nível e as outras escolhas (para checar pré-requisitos).
  const incObj = { ...c.inc }
  if (needInc) inc.forEach(k => { incObj[k] = (incObj[k] || 0) + 1 })
  const tmp: Character = { ...c, cls: [...c.cls, cls], inc: incObj, ...addFeats(c, isNew && start ? [start] : []) }
  const Kn = calc(tmp)
  const intUp = Kn.M.int > K.M.int
  const skillOpts = classSkillList(tmp).filter(s => !tmp.trained.includes(s))
  const needSkill = intUp && skillOpts.length > 0

  const hpGain = hp ? Math.max(1, hp + Kn.M.con) + (has(c, 'Vitalidade') ? 1 : 0) : 0
  const startOpts = C.start.filter(f => !has(c, f))

  const pickCls = (k: ClassId) => { setCls(k); setStart(null); setHp(null) }
  const toggleInc = (k: AbilKey) => setInc(l => (l.includes(k) ? l.filter(x => x !== k) : l.length < 2 ? [...l, k] : l))

  const apply = () => {
    const miss: string[] = []
    if (!hp) miss.push('pontos de vida')
    if (isNew && startOpts.length && !start) miss.push('talento inicial')
    if (needInc && inc.length < 2) miss.push('duas habilidades')
    if (needSkill && !skill) miss.push('perícia treinada')
    if (miss.length) { toast('Falta: ' + miss.join(', ') + '.'); return }
    const f = addFeats(c, isNew && start ? [start] : [])
    if (needSkill && skill && !f.trained.includes(skill)) f.trained.push(skill)
    const next: Character = {
      ...c, ...f, cls: [...c.cls, cls], hpRolls: [...c.hpRolls, hp!], inc: incObj,
    }
    const after = calc(next)
    next.hp = c.hp + Math.max(0, after.hpMax - K.hpMax)
    next.fp = after.fpMax
    useStore.getState().saveChar(next)
    SFX.crit()
    const gained = [needTalent && 'uma aptidão', needFeat && 'um talento', needBonus && `um talento bônus de ${C.name}`].filter(Boolean).join(', ')
    toast(`${c.name || 'Personagem'} agora é nível ${after.lvl}.${gained ? ` Gaste ${gained} na Árvore de Habilidades.` : ''}${after.forceSens && after.powersAllowed > next.powers.length ? ' Há poderes da Força para aprender.' : ''}`)
    onClose()
    onDone?.()
  }

  return (
    <Dialog
      wide
      title={`Subir para o nível ${nl}`}
      onClose={onClose}
      footer={<>
        <span className="mr-auto text-sm text-ash">Pontos de Força voltam a {Kn.fpMax}. PV {K.hpMax} → {K.hpMax + (hp ? Math.max(0, calc({ ...tmp, hpRolls: [...c.hpRolls, hp] }).hpMax - K.hpMax) : 0)}.</span>
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={apply}>Confirmar nível {nl}</button>
      </>}
    >
      <div className="flex flex-col gap-4">
        <Step title="Classe">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(CLASSES) as ClassId[]).map(k => (
              <button key={k} className={clsx('btn btn-sm', k === cls ? 'btn-primary' : 'btn-ghost')} aria-pressed={k === cls} onClick={() => pickCls(k)}>
                {CLASSES[k].name} {CL[k] ? CL[k]! + 1 : '(nova)'}
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-bone/80">
            {C.name} {newClassLv}: BBA {sgn(babOf({ ...c, cls: [...c.cls, cls] }))}, {needTalent ? 'ganha uma aptidão' : 'ganha um talento bônus de classe'}
            {needFeat ? ', e o nível ' + nl + ' dá um talento' : ''}{needInc ? ', e +1 em duas habilidades' : ''}.
            {isNew && ' Primeira vez nesta classe: escolha um dos talentos iniciais dela.'}
          </p>
        </Step>

        <Step title={`Pontos de vida: 1d${C.die} + Con ${sgn(Kn.M.con)}`}>
          <div className="flex flex-wrap items-end gap-3">
            <button className="btn btn-sm" onClick={() => { setHp(rnd(C.die)); SFX.dice() }}>Rolar d{C.die}</button>
            <label className="field">Ou valor do dado
              <input className="input w-28 font-mono" type="number" min={1} max={C.die} value={hp ?? ''}
                onChange={e => setHp(e.target.value === '' ? null : Math.max(1, Math.min(C.die, +e.target.value || 1)))} />
            </label>
            {hp != null && <span className="font-mono text-2xl text-gold">+{hpGain} PV</span>}
          </div>
        </Step>

        {isNew && (
          <Step title="Talento inicial da nova classe" done={start}>
            {startOpts.length ? (
              <select className="input max-w-md" value={start ?? ''} onChange={e => setStart(e.target.value || null)} aria-label="Talento inicial">
                <option value="">Escolha</option>
                {startOpts.map(f => <option key={f}>{f}</option>)}
              </select>
            ) : <p className="text-sm text-ash">Você já tem todos os talentos iniciais desta classe.</p>}
          </Step>
        )}

        {(needFeat || needTalent || needBonus) && (
          <Step title="Pontos para a árvore de habilidades">
            <ul className="flex flex-wrap gap-2">
              {needTalent && <li className="chip border-holo text-holo">+1 aptidão de {C.name}</li>}
              {needFeat && <li className="chip border-holo text-holo">+1 talento (nível {nl})</li>}
              {needBonus && <li className="chip border-holo text-holo">+1 talento bônus de {C.name}</li>}
            </ul>
            <p className="mt-2 text-sm text-ash">Depois de confirmar, os nós que você pode pegar acendem na Árvore de Habilidades da ficha.</p>
          </Step>
        )}

        {needInc && (
          <Step title="Aumento de habilidade: +1 em duas diferentes">
            <div className="flex flex-wrap gap-2">
              {ABILS.map(([k, , s]) => (
                <button key={k} className={clsx('btn btn-sm', inc.includes(k as AbilKey) ? 'btn-primary' : 'btn-ghost')} aria-pressed={inc.includes(k as AbilKey)} onClick={() => toggleInc(k as AbilKey)}>
                  {s} {K.A[k as AbilKey]}{inc.includes(k as AbilKey) ? ` → ${K.A[k as AbilKey] + 1}` : ''}
                </button>
              ))}
            </div>
          </Step>
        )}

        {needSkill && (
          <Step title={`Int subiu para ${sgn(mod(Kn.A.int))}: uma perícia treinada a mais`} done={skill} onClear={() => setSkill(null)}>
            <div className="flex flex-wrap gap-2">
              {skillOpts.map(s => <button key={s} className="btn btn-sm btn-ghost" onClick={() => setSkill(s)}>{s}</button>)}
            </div>
          </Step>
        )}
      </div>
    </Dialog>
  )
}

function Step({ title, done, onClear, children }: { title: string; done?: string | null; onClear?: () => void; children: ReactNode }) {
  return (
    <section className="min-w-0 border border-line-2 bg-black/40 p-3">
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <h3 className="font-display text-xl tracking-[.15em] text-gold">{title}</h3>
        {done && <span className="chip chip-gold">{done}</span>}
        {done && onClear && <button className="btn btn-sm btn-ghost" onClick={onClear}>Trocar</button>}
      </div>
      {!(done && onClear) && children}
    </section>
  )
}
