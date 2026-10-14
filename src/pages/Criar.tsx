import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import { PageHeader } from '../components/ui/PageHeader'
import { calc } from '../rules/engine'
import { SFX } from '../lib/sfx'
import { useStore } from '../store/campaign'
import { toast } from '../store/ui'
import { Barra } from './criar/Barra'
import { Resumo } from './criar/Resumo'
import { PassoClasse, PassoEspecie, PassoHabilidades, PassoPericias } from './criar/PassosBase'
import { PassoAptidao, PassoTalentos } from './criar/PassosTalentos'
import { PassoDetalhes, PassoEquipamento, PassoRevisao } from './criar/PassosFinal'
import { STEPS, S, clearDraft, cl, finalize, loadDraft, newDraft, problems, produce, saveDraft, sp, type Draft } from './criar/draft'

/** Assistente de criação de personagem em etapas (porte de wizard.js). */
export default function Criar() {
  const [d, setD] = useState<Draft>(loadDraft)
  const [confirmaReset, setConfirmaReset] = useState(false)
  const navigate = useNavigate()
  const saveChar = useStore(s => s.saveChar)
  const setCurrent = useStore(s => s.setCurrent)
  const reduce = useReducedMotion()

  const up = useCallback((fn: (x: Draft) => void) => setD(prev => produce(prev, fn)), [])
  // O rascunho sobrevive a recarregar a página (só nesta aba).
  useEffect(() => { saveDraft(d) }, [d])
  useEffect(() => {
    if (!confirmaReset) return
    const t = setTimeout(() => setConfirmaReset(false), 3500)
    return () => clearTimeout(t)
  }, [confirmaReset])

  const probs = useMemo(() => problems(d), [d])
  const K = calc(d.c)
  const step = d.step
  const ultimo = step === STEPS.length - 1

  const go = (i: number) => {
    const n = Math.max(0, Math.min(STEPS.length - 1, i))
    up(x => { x.step = n; x.seen = Math.max(x.seen, n) })
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  }
  const recomecar = () => {
    if (!confirmaReset) { setConfirmaReset(true); return }
    setConfirmaReset(false)
    setD(newDraft())
    window.scrollTo({ top: 0 })
  }
  const salvar = () => {
    const falta = probs.filter(p => p.block)
    if (falta.length) {
      toast(`Falta resolver: ${[...new Set(falta.map(p => STEPS[p.step]))].join(', ')}.`)
      go(falta[0].step)
      return
    }
    const c = finalize(d)
    saveChar(c)
    setCurrent(c.id)
    clearDraft()
    SFX.saber()
    toast(`${c.name} entrou para a tripulação.`)
    navigate(`/fichas?id=${c.id}`)
  }

  const corpo = [
    <PassoEspecie key="e" d={d} up={up} />,
    <PassoClasse key="c" d={d} up={up} />,
    <PassoHabilidades key="h" d={d} up={up} />,
    <PassoPericias key="p" d={d} up={up} />,
    <PassoTalentos key="t" d={d} up={up} />,
    <PassoAptidao key="a" d={d} up={up} />,
    <PassoEquipamento key="q" d={d} up={up} />,
    <PassoDetalhes key="d" d={d} up={up} />,
    <PassoRevisao key="r" d={d} probs={probs} go={go} finish={salvar} />,
  ][step]

  return (
    <div>
      <PageHeader
        bg="criar"
        kicker="Estaleiro da tripulação"
        title="Criar personagem"
        actions={step !== S.revisao && d.seen >= S.detalhes ? <button type="button" className="btn" onClick={() => go(S.revisao)}>Ir para a revisão</button> : undefined}
      >
        Espécie, classe, habilidades e tudo o que o livro pede para o 1º nível. O resumo ao lado acompanha cada escolha.
      </PageHeader>

      <Barra step={step} seen={d.seen} probs={probs} go={go} />

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <motion.div
            key={step}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {corpo}
          </motion.div>

          {/* Rodapé de navegação */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line-2 pt-4">
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-sm" disabled={step === 0} onClick={() => go(step - 1)}>← Voltar</button>
              <button type="button" className={confirmaReset ? 'btn btn-sm btn-danger' : 'btn btn-sm btn-ghost'} onClick={recomecar}>
                {confirmaReset ? 'Apagar rascunho?' : 'Recomeçar'}
              </button>
            </div>
            <div className="flex min-w-0 flex-wrap items-center gap-3">
              <span className="min-w-0 font-mono text-xs text-ash">
                {sp(d.c).name} {cl(d.c).name} · PV {K.hpMax} · Ref {K.ref} · Fort {K.fort} · Von {K.will}
              </span>
              {ultimo
                ? <button type="button" className="btn btn-primary" onClick={salvar}>Salvar ficha</button>
                : <button type="button" className="btn btn-primary" onClick={() => go(step + 1)}>Próximo →</button>}
            </div>
          </div>
        </div>

        <div className="min-w-0 xl:sticky xl:top-6 xl:max-h-[calc(100vh-3rem)] xl:self-start xl:overflow-y-auto">
          <Resumo d={d} />
        </div>
      </div>
    </div>
  )
}
