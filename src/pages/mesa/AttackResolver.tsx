import { useMemo, useState } from 'react'
import { useStore } from '../../store/campaign'
import { PainelAtaque } from '../../combate/PainelAtaque'
import { participantes, participanteDoToken } from '../../combate/participantes'
import { TacticalMap } from '../mapas/TacticalMap'
import { useTokInfo } from '../mapas/tokInfo'
import type { CombView } from './combat'

/**
 * Resolve um ataque: atacante, ataque, alvo e defesa; 20 natural é crítico e dobra o dano.
 * Com as fichas no mapa, a distância, a faixa de alcance e a cobertura saem do mapa e o tiro aparece nele.
 * O componente é remontado a cada turno (key), então começa com o combatente da vez.
 */
export function AttackResolver({ list, turnId }: { list: CombView[]; turnId?: string }) {
  const campaign = useStore(s => s.campaign)
  const chars = useStore(s => s.chars)
  const todos = useMemo(() => participantes(campaign, chars), [campaign, chars])
  const first = list.find(x => x.id === turnId) ?? list[0]
  const [att, setAtt] = useState(first?.id ?? '')
  const atual = todos.find(p => p.chave === att)
  const padraoAlvo = todos.find(p => p.chave !== att && p.lado !== atual?.lado)?.chave ?? ''
  const [alvo, setAlvo] = useState(padraoAlvo)
  const [verMapa, setVerMapa] = useState(false)
  const [sel, setSel] = useState<string | null>(null)
  const { info } = useTokInfo()

  if (todos.length < 2) return <p className="text-sm text-ash">Adicione pelo menos dois combatentes.</p>

  const temFichas = campaign.map.tokens.some(t => t.ref)
  return (
    <div className="space-y-3">
      <PainelAtaque lista={todos} atacante={att} onAtacante={setAtt} alvo={alvo} onAlvo={setAlvo}
        dicaAlvo="Escolha o alvo (ou clique nele no mapa)." />
      {temFichas && (
        <div>
          <button type="button" className="btn btn-sm btn-ghost" aria-expanded={verMapa} onClick={() => setVerMapa(v => !v)}>
            {verMapa ? 'Esconder o mapa' : 'Ver no mapa'}
          </button>
          {verMapa && (
            <div className="mt-2 border border-line-2">
              <TacticalMap tool="mover" gmView range="pistolas" zoom="ajustar" sel={sel} onSelect={setSel} info={info} readOnly maxH="50vh"
                onPick={id => {
                  const t = campaign.map.tokens.find(k => k.id === id)
                  const p = participanteDoToken(t?.ref, todos)
                  if (p && p.chave !== att) setAlvo(p.chave)
                }} />
              <p className="mt-1 px-2 pb-1 text-xs text-ash">Clique numa ficha para fazer dela o alvo. Para mover fichas, use a página Mapas.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
