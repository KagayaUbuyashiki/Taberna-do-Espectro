/* Etapas 1 a 4: espécie, classe, habilidades e perícias. */
import clsx from 'clsx'
import { ABILS, ABIL_SHORT, CLASSES, SKILL_BY, SPECIES, STANDARD_ARRAY } from '../../data/saga'
import { rnd, sgn, mod } from '../../rules/dice'
import { ABIL_KEYS, calc, finalAbil } from '../../rules/engine'
import type { AbilKey, ClassId } from '../../rules/types'
import { ART } from '../../art/art'
import { ASSET } from '../../lib/assets'
import { SFX } from '../../lib/sfx'
import { Svg } from '../../components/Svg'
import { Portrait } from '../../components/ui/Portrait'
import { AssetImg } from '../../components/ui/AssetImg'
import { useStore } from '../../store/campaign'
import { toast } from '../../store/ui'
import {
  COST, POINT_BUDGET, baseTrained, cl, classSkillList, clsDef, featSkills, pointsSpent, setClass, setSpecies, skillSlots, sp,
  type Method, type StepProps,
} from './draft'

const modsText = (m: Record<string, number>) => Object.entries(m).map(([k, v]) => `${sgn(v)} ${ABIL_SHORT[k]}`).join(', ') || 'Sem ajustes'
const DEF_LABEL = { ref: 'Ref', fort: 'Fort', will: 'Von' } as const

function Linha({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line py-1.5">
      <span className="font-display text-sm tracking-[.2em] text-ash">{k}</span>
      <span className="text-right font-mono text-bone">{children}</span>
    </div>
  )
}

/* ===== 1. Espécie ===== */
export function PassoEspecie({ d, up }: StepProps) {
  const c = d.c
  const s = sp(c)
  return (
    <div className="space-y-6">
      <section className="panel grid gap-5 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]">
        <Portrait species={s.id} className="w-full max-w-48" />
        <div className="min-w-0">
          <h2 className="font-display text-4xl tracking-[.15em] text-gold">{s.name}</h2>
          <p className="text-ash">Mundo natal: <span className="text-bone">{s.world}</span></p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="chip chip-gold">{modsText(s.mods as Record<string, number>)}</span>
            <span className="chip">Tamanho {s.size}</span>
            <span className="chip">Deslocamento {s.speed}</span>
            {s.swim && <span className="chip">Natação {s.swim}</span>}
          </div>
          <p className="mt-2 text-sm text-ash">Idiomas: <span className="text-bone">{s.langs.join(', ')}</span></p>
          <ul className="mt-3 list-inside list-[square] space-y-1 text-sm marker:text-gold-dim">
            {s.traits.map(t => <li key={t}>{t}</li>)}
          </ul>
          {s.id === 'ewok' && <p className="mt-2 text-sm text-ash">Ewoks não existem na era da Ascensão do Império.</p>}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
        {SPECIES.map(x => {
          const on = x.id === c.species
          return (
            <button
              key={x.id}
              type="button"
              aria-pressed={on}
              onClick={() => up(n => setSpecies(n, x.id))}
              className={clsx('group flex min-w-0 flex-col border bg-black/70 text-left transition-colors', on ? 'border-gold' : 'border-line-2 hover:border-gold/60')}
            >
              <Portrait species={x.id} className="w-full border-0" />
              <span className={clsx('block border-t px-2 py-1.5', on ? 'border-gold bg-gold/10' : 'border-line-2')}>
                <span className={clsx('block truncate font-display text-xl tracking-[.12em]', on ? 'text-gold' : 'text-bone group-hover:text-gold')}>{x.name}</span>
                <span className="block truncate font-mono text-xs text-ash">{modsText(x.mods as Record<string, number>)}</span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ===== 2. Classe ===== */
function Emblema({ id, className }: { id: string; className?: string }) {
  return (
    <AssetImg
      path={ASSET.cls(id)}
      className={clsx('aspect-[4/3] w-full object-cover', className)}
      fallback={<span className={clsx('grid aspect-[4/3] w-full place-items-center bg-black text-gold', className)}><Svg html={ART.emblem(id)} className="block w-1/2 [&>svg]:h-auto [&>svg]:w-full" /></span>}
    />
  )
}

export function PassoClasse({ d, up }: StepProps) {
  const k = d.c.cls[0]
  const x = CLASSES[k]
  const def = clsDef(k)
  const escolher = (id: ClassId) => {
    if (id === k) return
    if (d.c.trained.length || d.talent || d.credits != null) toast('Perícias, aptidão e equipamento recomeçam com a nova classe.')
    up(n => setClass(n, id))
  }
  return (
    <div className="space-y-6">
      <section className="panel grid gap-5 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
        <div className="border border-line-2"><Emblema id={k} /></div>
        <div className="min-w-0">
          <h2 className="font-display text-4xl tracking-[.15em] text-gold">{x.name}</h2>
          <p className="text-bone/90">{x.blurb} <span className="text-ash">Exemplos: {x.examples}.</span></p>
          <div className="mt-3 grid gap-x-6 md:grid-cols-2">
            <Linha k="PV iniciais">{x.hp0} + Con</Linha>
            <Linha k="Bônus base de ataque">{x.bab === 'full' ? '+1 por nível' : '¾ do nível'}</Linha>
            <Linha k="Defesas de classe">{(['ref', 'fort', 'will'] as const).filter(t => def[t]).map(t => `${DEF_LABEL[t]} +${def[t]}`).join(' · ')}</Linha>
            <Linha k="Perícias treinadas">{x.skillsN} + Int</Linha>
            <Linha k="Créditos iniciais">{x.credits[0]}d{x.credits[1]} × {x.credits[2]}</Linha>
            <Linha k="Dado de vida">d{x.die} por nível</Linha>
          </div>
          <h3 className="mt-4 font-display text-sm tracking-[.25em] text-gold">Talentos iniciais</h3>
          <div className="mt-1 flex flex-wrap gap-1.5">{x.start.map(f => <span key={f} className="chip">{f}</span>)}</div>
          <h3 className="mt-3 font-display text-sm tracking-[.25em] text-gold">Árvores de aptidão</h3>
          <div className="mt-1 flex flex-wrap gap-1.5">{x.trees.map(t => <span key={t} className="chip chip-gold">{t}</span>)}</div>
          <h3 className="mt-3 font-display text-sm tracking-[.25em] text-gold">Perícias de classe</h3>
          <p className="mt-1 text-sm text-ash">{x.skills.join(', ')}</p>
          <p className="mt-3 text-sm text-ash">Habilidades principais: <span className="text-bone">{x.key}</span>.</p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        {(Object.keys(CLASSES) as ClassId[]).map(id => {
          const y = CLASSES[id]
          const on = id === k
          return (
            <button
              key={id}
              type="button"
              aria-pressed={on}
              onClick={() => escolher(id)}
              className={clsx('group flex min-w-0 flex-col border bg-black/70 text-left transition-colors', on ? 'border-gold' : 'border-line-2 hover:border-gold/60')}
            >
              <Emblema id={id} />
              <span className={clsx('block flex-1 border-t p-3', on ? 'border-gold bg-gold/10' : 'border-line-2')}>
                <span className={clsx('block font-display text-2xl tracking-[.15em]', on ? 'text-gold' : 'text-bone group-hover:text-gold')}>{y.name}</span>
                <span className="mt-1 block text-sm text-bone/80">{y.blurb}</span>
                <span className="mt-2 block font-mono text-xs text-ash">PV {y.hp0} + Con · d{y.die}/nível</span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ===== 3. Habilidades ===== */
const METODOS: [Method, string][] = [['pacote', 'Pacote padrão'], ['pontos', 'Compra de pontos'], ['rolagem', 'Rolar 4d6']]

export function PassoHabilidades({ d, up }: StepProps) {
  const c = d.c
  const s = sp(c)
  const m = d.method
  const A = finalAbil(c)
  const gasto = pointsSpent(c)
  const somaMods = ABIL_KEYS.reduce((t, k) => t + mod(c.abil[k]), 0)
  const maior = Math.max(...ABIL_KEYS.map(k => c.abil[k]))
  const poolOrd = [...d.pool].sort((a, b) => b - a)

  // A sorte fica fora do atualizador do estado (que precisa ser puro).
  const rolar = () => {
    const det: string[] = []
    const pool = Array.from({ length: 6 }, () => {
      const r = [rnd(6), rnd(6), rnd(6), rnd(6)].sort((a, b) => b - a)
      det.push(`[${r.join(',')}]`)
      return r[0] + r[1] + r[2]
    })
    SFX.dice()
    useStore.getState().pushRoll({ label: 'Habilidades (4d6, descarta o menor)', who: c.name.trim() || undefined, total: pool.reduce((a, b) => a + b, 0), det: `${det.join(' ')} → ${pool.join(', ')}` })
    up(n => { n.method = 'rolagem'; n.pool = pool; n.arr = [...pool].sort((a, b) => b - a); n.rollDet = det.join(' ') })
  }
  const metodo = (mm: Method) => {
    if (mm === 'rolagem') { rolar(); return }
    up(n => {
      n.method = mm
      if (mm === 'pontos') ABIL_KEYS.forEach(k => { n.c.abil[k] = 8 })
      else { n.pool = [...STANDARD_ARRAY]; n.arr = [...STANDARD_ARRAY] }
    })
  }
  const atribuir = (i: number, v: number) => up(n => {
    const j = n.arr.findIndex((x, ix) => x === v && ix !== i)
    if (j >= 0) n.arr[j] = n.arr[i]
    n.arr[i] = v
  })
  const ponto = (k: AbilKey, dd: number) => up(n => {
    const nv = n.c.abil[k] + dd
    if (nv < 8 || nv > 18) return
    if (pointsSpent(n.c) - COST[n.c.abil[k]] + COST[nv] > POINT_BUDGET) return
    n.c.abil[k] = nv
  })

  return (
    <div className="space-y-5">
      <section className="panel space-y-3">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Método de geração">
          {METODOS.map(([id, label]) => (
            <button key={id} type="button" aria-pressed={m === id} onClick={() => metodo(id)} className={clsx('btn btn-sm', m === id && 'btn-primary')}>{label}</button>
          ))}
          {m === 'rolagem' && <button type="button" className="btn btn-sm btn-ghost" onClick={rolar}>Rolar de novo</button>}
          {m === 'pontos' && (
            <span className="ml-auto font-mono text-lg text-gold">{POINT_BUDGET - gasto} <span className="text-sm text-ash">de {POINT_BUDGET} pontos restantes</span></span>
          )}
        </div>
        <p className="text-sm text-ash">
          {m === 'pacote' && 'Distribua 15, 14, 13, 12, 10 e 8. Escolher um valor já usado troca os dois de lugar.'}
          {m === 'pontos' && 'Todas começam em 8. Custos: 9=1, 10=2, 11=3, 12=4, 13=5, 14=6, 15=8, 16=10, 17=13, 18=16.'}
          {m === 'rolagem' && <>Cada valor é 4d6 descartando o menor: <span className="font-mono text-bone">{d.rollDet}</span>. Escolher um valor já usado troca os dois de lugar.</>}
        </p>
        {m === 'rolagem' && (somaMods <= 0 || maior <= 13) && (
          <p className="chip chip-gold">Valores muito baixos: o livro permite rolar tudo de novo.</p>
        )}
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-6">
        {ABILS.map(([key, nome], i) => {
          const k = key as AbilKey
          const sm = (s.mods as Partial<Record<AbilKey, number>>)[k] || 0
          const v = c.abil[k]
          return (
            <div key={k} className="flex flex-col items-center gap-1.5 border border-line-2 bg-black/70 p-3 text-center">
              <span className="font-display text-lg tracking-[.25em] text-gold">{nome}</span>
              {m === 'pontos' ? (
                <>
                  <div className="flex items-center gap-2">
                    <button type="button" className="btn btn-sm !px-2.5" aria-label={`Diminuir ${nome}`} disabled={v <= 8} onClick={() => ponto(k, -1)}>−</button>
                    <span className="w-8 font-mono text-xl text-bone">{v}</span>
                    <button type="button" className="btn btn-sm !px-2.5" aria-label={`Aumentar ${nome}`} disabled={v >= 18 || gasto - COST[v] + COST[v + 1] > POINT_BUDGET} onClick={() => ponto(k, 1)}>+</button>
                  </div>
                  <span className="font-mono text-xs text-ash">custo {COST[v]}</span>
                </>
              ) : (
                <select className="input !w-24 text-center font-mono" aria-label={`Valor de ${nome}`} value={d.arr[i]} onChange={e => atribuir(i, +e.target.value)}>
                  {poolOrd.map((pv, j) => <option key={j} value={pv}>{pv}</option>)}
                </select>
              )}
              <span className="font-mono text-xs text-ash">{sm ? `espécie ${sgn(sm)}` : ' '}</span>
              <span className="font-display text-5xl leading-none text-bone">{A[k]}</span>
              <span className="font-mono text-lg text-gold">{sgn(mod(A[k]))}</span>
            </div>
          )
        })}
      </div>
      <p className="text-sm text-ash">Valores finais já incluem os ajustes da espécie. Importantes para {cl(c).name}: <span className="text-bone">{cl(c).key}</span>.</p>
    </div>
  )
}

/* ===== 4. Perícias ===== */
export function PassoPericias({ d, up }: StepProps) {
  const c = d.c
  const n = skillSlots(c)
  const lista = [...new Set([...classSkillList(c), ...c.trained])]
  const K = calc(c)
  const fs = featSkills(d)
  const bt = baseTrained(d)
  const s = sp(c)
  const alternar = (sk: string) => up(x => {
    if (x.c.trained.includes(sk)) x.c.trained = x.c.trained.filter(t => t !== sk)
    else if (baseTrained(x).length < skillSlots(x.c)) x.c.trained.push(sk)
  })
  return (
    <section className="panel space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="panel-title">Perícias treinadas</h2>
        <span className={clsx('font-mono text-xl', bt.length > n ? 'text-ember' : 'text-gold')}>{bt.length} / {n}</span>
      </div>
      <p className="text-sm text-ash">
        {cl(c).name}: {cl(c).skillsN} + mod. de Int ({sgn(K.M.int)}){s.extraSkill ? ' + 1 por ser Humano' : ''}. Treinado dá +5. Mecânica e Usar a Força exigem treino.
      </p>
      <div className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-3">
        {lista.map(sk => {
          const on = c.trained.includes(sk)
          const viaTalento = fs.includes(sk)
          const dis = viaTalento || (!on && bt.length >= n)
          const info = K.sk[sk]
          return (
            <label key={sk} className={clsx('flex min-w-0 cursor-pointer items-center gap-3 border px-3 py-2 transition-colors', on ? 'border-gold bg-gold/10' : 'border-line-2 bg-black/60 hover:border-gold/50', dis && !on && 'cursor-not-allowed opacity-45', viaTalento && 'cursor-default')}>
              <input type="checkbox" className="size-4 shrink-0 accent-[#ffd24a]" checked={on} disabled={dis} onChange={() => alternar(sk)} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-bone">{sk} <span className="font-mono text-xs text-ash">{ABIL_SHORT[SKILL_BY[sk].a]}</span></span>
                <span className="block text-xs text-ash">
                  {viaTalento ? 'Treinada pelo talento Treinamento em Perícia' : s.condFeat?.[0] === sk ? 'Treinada, a espécie dá Foco em Perícia' : s.reroll?.includes(sk) ? 'A espécie permite re-rolar' : ' '}
                </span>
              </span>
              <span className="font-mono text-lg text-gold">{sgn(info?.tot ?? 0)}</span>
            </label>
          )
        })}
      </div>
    </section>
  )
}
