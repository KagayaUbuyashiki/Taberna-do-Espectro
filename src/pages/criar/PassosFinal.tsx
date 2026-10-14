/* Etapas 7 a 9: equipamento, detalhes (com retrato) e revisão. */
import clsx from 'clsx'
import { ABILS, ARMORS, ARMOR_BY, GEAR, WEAPONS } from '../../data/saga'
import { sgn } from '../../rules/dice'
import { calc, has, isProfGroup, uid, weaponStats } from '../../rules/engine'
import type { AbilKey, Character } from '../../rules/types'
import { rollFree } from '../../lib/rolls'
import { SFX } from '../../lib/sfx'
import { Portrait } from '../../components/ui/Portrait'
import { toast } from '../../store/ui'
import {
  STEPS, applyCredits, cl, cr, creditsLeft, shrinkImage, sp, type Draft, type DraftChar, type Problem, type StepProps,
} from './draft'

function Remover({ label, onClick }: { label: string; onClick: () => void }) {
  return <button type="button" aria-label={`Devolver ${label}`} onClick={onClick} className="ml-1 px-1 text-ash hover:text-gold">×</button>
}

function Loja({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="panel min-w-0">
      <h2 className="panel-title mb-2">{titulo}</h2>
      <ul className="max-h-[28rem] divide-y divide-line overflow-y-auto pr-1">{children}</ul>
    </section>
  )
}
function Item({ nome, info, aviso, preco, on, disabled, onClick }: { nome: string; info?: string; aviso?: string; preco: number; on?: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <li className="flex items-center justify-between gap-3 py-1.5">
      <span className="min-w-0">
        <span className="block text-bone">{nome}</span>
        {(info || aviso) && <span className="block font-mono text-xs text-ash">{info}{aviso && <span className="text-gold-dim"> · {aviso}</span>}</span>}
      </span>
      <button type="button" className={clsx('btn btn-sm shrink-0 font-mono !tracking-normal', on && 'btn-primary')} aria-pressed={on} disabled={disabled} onClick={onClick}>{cr(preco)}</button>
    </li>
  )
}

/* ===== 7. Equipamento ===== */
export function PassoEquipamento({ d, up }: StepProps) {
  const c = d.c
  const x = cl(c)
  const rolado = d.credits != null
  const resta = creditsLeft(d)
  const armaduraAtual = c.armor ? ARMOR_BY[c.armor]?.cost || 0 : 0

  const rolarCreditos = () => {
    const total = rollFree(`${x.credits[0]}d${x.credits[1]}×${x.credits[2]}`)
    if (total == null) return
    up(n => applyCredits(n, total))
  }
  const comprarArma = (nome: string) => {
    SFX.blaster()
    up(n => { n.c.weapons.push({ id: uid(), n: nome, base: nome, atkMisc: 0, dmgMisc: 0, notes: '' }) })
  }
  const comprarItem = (nome: string, custo: number, peso: number) => up(n => {
    const ex = n.c.gear.find(g => g.n === nome && !g.free)
    if (ex) ex.q++
    else n.c.gear.push({ n: nome, q: 1, w: peso, cost: custo })
  })

  return (
    <div className="space-y-5">
      <section className="panel flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h2 className="panel-title">Créditos</h2>
          {rolado ? (
            <>
              <span className={clsx('font-mono text-3xl', resta < 0 ? 'text-ember' : 'text-gold')}>{cr(resta)} cr</span>
              <span className="text-sm text-ash">de {cr(d.credits!)} rolados</span>
            </>
          ) : (
            <button type="button" className="btn btn-primary" onClick={rolarCreditos}>Rolar {x.credits[0]}d{x.credits[1]} × {x.credits[2]}</button>
          )}
        </div>
        {c.cls[0] === 'jedi' && <span className="chip chip-gold">O Mestre Jedi fornece um sabre de luz</span>}
      </section>
      {!rolado && <p className="text-sm text-ash">Role os créditos iniciais da classe para comprar. A rolagem vai para o diário da mesa.</p>}

      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        <Loja titulo="Armas">
          {WEAPONS.filter(w => w.n !== 'Desarmado').map(w => (
            <Item key={w.n} nome={w.n} info={`${w.dmg} · ${w.g}`} aviso={isProfGroup(c as Character, w.g, w.n) ? undefined : 'sem proficiência'}
              preco={w.cost} disabled={!rolado || w.cost > resta} onClick={() => comprarArma(w.n)} />
          ))}
        </Loja>
        <Loja titulo="Armaduras">
          {ARMORS.map(a => {
            const on = c.armor === a.n
            return (
              <Item key={a.n} nome={a.n} info={`+${a.ref} Ref${a.fort ? ` · +${a.fort} Fort` : ''} · Des máx. ${a.maxDex} · ${a.cat}`}
                aviso={has(c, `Proficiência em Armadura (${a.cat})`) ? undefined : 'sem proficiência'} preco={a.cost} on={on}
                disabled={!rolado || (!on && a.cost > resta + armaduraAtual)} onClick={() => up(n => { n.c.armor = n.c.armor === a.n ? null : a.n })} />
            )
          })}
        </Loja>
        <Loja titulo="Equipamento">
          {GEAR.map(([nome, custo, peso]) => (
            <Item key={nome as string} nome={nome as string} info={`${peso} kg`} preco={custo as number}
              disabled={!rolado || (custo as number) > resta} onClick={() => comprarItem(nome as string, custo as number, peso as number)} />
          ))}
        </Loja>
      </div>

      <section className="panel">
        <h2 className="panel-title mb-2">Carregando</h2>
        <div className="flex flex-wrap gap-1.5">
          {c.weapons.map((w, i) => (
            <span key={w.id} className="chip chip-gold">{w.n}{w.free && <span className="text-ash"> (grátis)</span>}<Remover label={w.n} onClick={() => up(n => { n.c.weapons.splice(i, 1) })} /></span>
          ))}
          {c.armor && <span className="chip chip-gold">{c.armor}<Remover label={c.armor} onClick={() => up(n => { n.c.armor = null })} /></span>}
          {c.gear.map((g, i) => (
            <span key={g.n + i} className="chip">{g.n}{g.q > 1 ? ` ×${g.q}` : ''}{g.free && <span className="text-ash"> (espécie)</span>}
              <Remover label={g.n} onClick={() => up(n => { const it = n.c.gear[i]; if (it.q > 1) it.q--; else n.c.gear.splice(i, 1) })} />
            </span>
          ))}
          {!c.weapons.length && !c.armor && !c.gear.length && <span className="text-sm text-ash">Nada ainda. Os ataques desarmados entram na ficha sozinhos.</span>}
        </div>
      </section>
    </div>
  )
}

/* ===== 8. Detalhes ===== */
type Campo = 'name' | 'player' | 'age' | 'sex' | 'height' | 'weight' | 'destiny' | 'langs' | 'notes'

export function PassoDetalhes({ d, up }: StepProps) {
  const c = d.c
  const K = calc(c)
  const set = (k: Campo, v: string) => up(n => { n.c[k] = v })
  const campo = (k: Campo, label: string, ph = '') => (
    <label className="field min-w-0">
      {label}
      <input className="input" value={c[k]} placeholder={ph} onChange={e => set(k, e.target.value)} />
    </label>
  )
  const enviar = async (f: File | undefined) => {
    if (!f) return
    const url = await shrinkImage(f)
    if (!url) { toast('Não foi possível ler a imagem.'); return }
    up(n => { n.c.portrait = url })
  }
  return (
    <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
      <section className="panel min-w-0 space-y-3">
        <h2 className="panel-title">Quem é você?</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {campo('name', 'Nome', 'ex.: Kira Vel')}
          {campo('player', 'Jogador')}
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {campo('age', 'Idade')}{campo('sex', 'Sexo')}{campo('height', 'Altura')}{campo('weight', 'Peso')}
        </div>
        {campo('destiny', 'Destino', 'ex.: Vingar a queda da sua família')}
        <div>
          {campo('langs', 'Idiomas')}
          <p className="mt-1 text-sm text-ash">Idiomas extras pela Inteligência: {Math.max(0, K.M.int)}.</p>
        </div>
        <label className="field">
          História
          <textarea className="input min-h-36" value={c.notes} placeholder="De onde vem, o que busca, quem deixou para trás..." onChange={e => set('notes', e.target.value)} />
        </label>
      </section>

      <section className="panel min-w-0 space-y-3 self-start">
        <h2 className="panel-title">Retrato</h2>
        <div className="flex flex-wrap items-start gap-4">
          <Portrait species={c.species} src={c.portrait} className="w-40 shrink-0" />
          <div className="flex min-w-0 flex-1 basis-40 flex-col items-start gap-2">
            <label className="btn btn-sm cursor-pointer">
              Enviar imagem
              <input type="file" accept="image/*" className="sr-only" onChange={e => { void enviar(e.target.files?.[0]); e.target.value = '' }} />
            </label>
            {c.portrait && <button type="button" className="btn btn-sm btn-ghost" onClick={() => up(n => { n.c.portrait = null })}>Usar arte da espécie</button>}
            <p className="text-sm text-ash">Sem imagem, a ficha usa o retrato da espécie.</p>
          </div>
        </div>
      </section>
    </div>
  )
}

/* ===== 9. Revisão ===== */
function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <h3 className="font-display text-sm tracking-[.25em] text-gold">{titulo}</h3>
      <div className="mt-1">{children}</div>
    </div>
  )
}

export function PassoRevisao({ d, probs, go, finish }: { d: Draft; probs: Problem[]; go: (i: number) => void; finish: () => void }) {
  const c = d.c
  const ch = c as DraftChar as Character
  const K = calc(c)
  const bloqueia = probs.some(p => p.block)
  // A ficha final ganha o ataque desarmado.
  const ataques = c.weapons.some(w => w.base === 'Desarmado') ? c.weapons : [...c.weapons, { id: 'desarmado', n: 'Desarmado', base: 'Desarmado', atkMisc: 0, dmgMisc: 0, notes: '' }]
  return (
    <div className="space-y-5">
      {probs.length > 0 && (
        <section className={clsx('panel space-y-2', bloqueia && '!border-ember/70')}>
          <h2 className={clsx('panel-title', bloqueia && '!text-ember')}>{bloqueia ? 'Antes de salvar' : 'Avisos'}</h2>
          <ul className="space-y-1.5">
            {probs.map((p, i) => (
              <li key={i} className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-1.5">
                <span className={clsx('min-w-0', p.block ? 'text-bone' : 'text-ash')}>
                  <span className={clsx('mr-2 font-mono text-xs', p.block ? 'text-ember' : 'text-gold-dim')}>{p.block ? 'FALTA' : 'AVISO'}</span>{p.msg}
                </span>
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => go(p.step)}>{STEPS[p.step]}</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="panel space-y-5">
        <div className="flex flex-wrap items-start gap-5">
          <Portrait species={c.species} src={c.portrait} className="w-32 shrink-0 sm:w-40" />
          <div className="min-w-0 flex-1 basis-56">
            <div className="kicker !text-base">Ficha de 1º nível</div>
            <h2 className="mt-1 break-words font-display text-5xl tracking-[.1em] text-bone">{c.name.trim() || 'Sem nome'}</h2>
            <p className="font-display text-lg tracking-[.2em] text-ash">{sp(c).name} · {cl(c).name} 1{c.player ? ` · jogador: ${c.player}` : ''}</p>
            {c.destiny && <p className="mt-1 text-bone/90">Destino: {c.destiny}</p>}
            <p className="mt-1 text-sm text-ash">Idiomas: {c.langs || '—'}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {ABILS.map(([k, , short]) => (
            <div key={k} className="stat"><small>{short}</small><b>{K.A[k as AbilKey]}</b><span className="font-mono text-sm text-gold">{sgn(K.M[k as AbilKey])}</span></div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 xl:grid-cols-10">
          <div className="stat"><small>PV</small><b>{K.hpMax}</b></div>
          <div className="stat"><small>Reflexo</small><b>{K.ref}</b></div>
          <div className="stat"><small>Fortitude</small><b>{K.fort}</b></div>
          <div className="stat"><small>Vontade</small><b>{K.will}</b></div>
          <div className="stat"><small>Limiar</small><b>{K.thr}</b></div>
          <div className="stat"><small>BBA</small><b>{sgn(K.bab)}</b></div>
          <div className="stat"><small>Agarrar</small><b>{sgn(K.grapple)}</b></div>
          <div className="stat"><small>Desloc.</small><b>{K.speed}</b></div>
          <div className="stat"><small>PF</small><b>{K.fpMax}</b></div>
          <div className="stat"><small>Força</small><b className="!text-2xl">{K.fDice}d{K.fDie}</b></div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <Bloco titulo="Perícias">
            <ul className="grid gap-x-4 text-sm sm:grid-cols-2">
              {K.skills.map(s => (
                <li key={s.n} className={clsx('flex justify-between gap-2', s.tr ? 'text-bone' : 'text-ash', !s.usable && 'opacity-40')}>
                  <span className="min-w-0 truncate">{s.tr && <span className="text-gold">● </span>}{s.n}</span>
                  <span className={clsx('font-mono', s.tr && 'text-gold')}>{s.usable ? sgn(s.tot) : '—'}</span>
                </li>
              ))}
            </ul>
          </Bloco>
          <div className="space-y-4">
            <Bloco titulo="Talentos">
              <div className="flex flex-wrap gap-1">{c.feats.map((f, i) => <span key={f + i} className="chip !text-xs">{f}</span>)}</div>
            </Bloco>
            <Bloco titulo="Aptidão"><p className="text-bone">{d.talent || '—'}</p></Bloco>
            {d.powers.length > 0 && <Bloco titulo="Poderes da Força"><p className="text-bone">{d.powers.join(', ')}</p></Bloco>}
            <Bloco titulo="Ataques">
              <ul className="space-y-0.5 text-sm">
                {ataques.map(w => {
                    const st = weaponStats(ch, w, K)
                    return (
                      <li key={w.id} className="flex justify-between gap-2">
                        <span className="min-w-0 truncate">{w.n}{!st.prof && <span className="text-gold-dim"> · sem proficiência</span>}</span>
                        <span className="font-mono text-gold">{sgn(st.atk)} · {st.dmg}</span>
                      </li>
                    )
                  })}
              </ul>
            </Bloco>
            <Bloco titulo="Equipamento">
              <p className="text-sm text-bone">
                {[c.armor, ...c.gear.map(g => `${g.n}${g.q > 1 ? ` ×${g.q}` : ''}`)].filter(Boolean).join(', ') || '—'}
              </p>
              <p className="mt-1 font-mono text-sm text-gold">{cr(Math.max(0, creditsLeft(d)))} créditos</p>
            </Bloco>
          </div>
        </div>
        {c.notes && <Bloco titulo="História"><p className="whitespace-pre-line text-sm text-bone/90">{c.notes}</p></Bloco>}
      </section>

      <div className="flex justify-end">
        <button type="button" className="btn btn-primary px-8 py-3 text-xl" onClick={finish}>Salvar ficha</button>
      </div>
    </div>
  )
}
