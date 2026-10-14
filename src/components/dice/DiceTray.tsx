import { useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import clsx from 'clsx'
import { useStore } from '../../store/campaign'
import { useUI, toast } from '../../store/ui'
import { rollFree } from '../../lib/rolls'
import { SFX } from '../../lib/sfx'
import { calc } from '../../rules/engine'
import { rnd } from '../../rules/dice'

const DICE = [4, 6, 8, 10, 12, 20, 100]

/** Rolador de dados flutuante com diário de rolagens e gasto de Pontos de Força. */
export function DiceTray() {
  const open = useUI(s => s.diceOpen)
  const setOpen = useUI(s => s.setDiceOpen)
  const sound = useUI(s => s.sound)
  const setSound = useUI(s => s.setSound)
  const log = useStore(s => s.log)
  const clearLog = useStore(s => s.clearLog)
  const cur = useStore(s => (s.current ? s.chars[s.current] : undefined))
  const [expr, setExpr] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (rollFree(expr) == null) toast('Use algo como 3d8+2 ou 1d20+5.')
  }

  const spendFP = () => {
    if (!cur || cur.fp <= 0) { toast('Sem Pontos de Força.'); return }
    const K = calc(cur)
    const rs = Array.from({ length: K.fDice }, () => rnd(K.fDie))
    const best = Math.max(...rs)
    useStore.getState().patchChar(cur.id, { fp: cur.fp - 1 })
    const last = useStore.getState().log.find(l => l.nat != null)
    if (last) {
      const total = last.total + best
      const hit = last.vs != null ? last.nat === 20 || (last.nat !== 1 && total >= last.vs) : last.hit
      useStore.getState().patchRoll(last.t, { total, hit, det: `${last.det} +PF ${K.fDice}d${K.fDie}[${rs.join(',')}]→${best}` })
      useUI.getState().showPopup({ value: total, label: `Ponto de Força em "${last.label}"` })
    } else {
      useUI.getState().showPopup({ value: best, label: 'Ponto de Força' })
    }
    SFX.force()
  }

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="dice-panel"
        className="fixed bottom-[calc(16px+env(safe-area-inset-bottom,0px))] right-4 z-40 grid h-16 w-16 place-items-center rounded-full bg-gold font-display text-xl tracking-wider text-black shadow-[0_0_0_4px_rgba(255,210,74,.25),0_8px_24px_rgba(0,0,0,.7)] transition-transform hover:scale-105"
      >
        d20
      </button>
      <AnimatePresence>
        {open && (
          <motion.section
            id="dice-panel"
            aria-label="Rolador de dados"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-[calc(96px+env(safe-area-inset-bottom,0px))] right-4 z-40 flex max-h-[70vh] w-[min(380px,calc(100vw-32px))] flex-col border border-gold-dim bg-black/95 shadow-[0_12px_40px_rgba(0,0,0,.8)]"
          >
            <div className="flex flex-col gap-3 border-b border-line p-4">
              <div className="flex items-center justify-between">
                <h2 className="panel-title">Rolagens</h2>
                <div className="flex gap-2">
                  <button className={clsx('btn btn-sm', sound ? '' : 'btn-ghost')} aria-pressed={sound} onClick={() => { setSound(!sound); SFX.set(!sound); if (!sound) SFX.saber() }}>Som</button>
                  <button className="btn btn-sm btn-ghost" onClick={clearLog}>Limpar</button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {DICE.map(n => (
                  <button key={n} className="border border-line-2 py-2 font-mono text-sm text-bone hover:border-gold hover:text-gold" onClick={() => rollFree(`1d${n}`)}>d{n}</button>
                ))}
              </div>
              <form onSubmit={submit} className="flex gap-2">
                <input className="input" value={expr} onChange={e => setExpr(e.target.value)} placeholder="ex.: 3d8+2" aria-label="Expressão de dados" />
                <button className="btn btn-primary btn-sm">Rolar</button>
              </form>
              {cur && (
                <div className="flex items-center gap-2">
                  <button className="btn btn-sm border-holo text-holo hover:bg-holo/10" onClick={spendFP}>Ponto de Força ({cur.fp})</button>
                  <span className="text-xs text-ash">soma à última rolagem de {cur.name.split(' ')[0]}</span>
                </div>
              )}
            </div>
            <ol className="flex-1 overflow-y-auto p-3 text-sm" aria-live="polite">
              {log.length === 0 && <li className="text-ash">As rolagens da ficha, da mesa e do rolador aparecem aqui.</li>}
              {log.map(l => (
                <li key={l.t} className={clsx('border-b border-line py-1.5', l.kind === 'crit' && 'text-gold', l.kind === 'fumble' && 'text-ember')}>
                  <div className="flex items-baseline gap-2">
                    {l.who && <span className="font-display tracking-wider text-gold-dim">{l.who}</span>}
                    <span className="flex-1">{l.label}</span>
                    <b className="font-display text-2xl font-normal">{l.total}</b>
                  </div>
                  {l.vs != null && (
                    <span className={clsx('chip', l.hit ? 'border-rebel text-rebel' : 'border-ember text-ember')}>
                      {l.hit ? 'acerta' : 'erra'} {l.target ?? ''} ({l.vs})
                    </span>
                  )}
                  <div className="font-mono text-xs text-ash">{l.det}</div>
                </li>
              ))}
            </ol>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  )
}
