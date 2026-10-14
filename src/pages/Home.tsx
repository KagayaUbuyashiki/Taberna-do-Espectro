import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { useStore } from '../store/campaign'
import { useGalaxy } from '../store/galaxy'
import { CLASSES, SPECIES_BY } from '../data/saga'
import { calc, classLevels } from '../rules/engine'
import type { Character } from '../rules/types'
import { WantedPoster } from '../components/WantedPoster'
import { Portrait } from '../components/ui/Portrait'

const cr = (n: number) => `${n.toLocaleString('pt-BR')} créditos`

function UltimaRolagem() {
  const last = useStore(s => s.log[0])
  return (
    <div className="scanlines flex min-h-56 flex-col items-center justify-center border border-gold/70 bg-black/85 p-6 text-center">
      <div className="font-mono text-sm tracking-[.12em] text-ash">
        ÚLTIMA ROLAGEM{last ? ` · ${last.label.toUpperCase()} ${last.det}` : ''}
      </div>
      <div className="mt-1 font-display text-[110px] leading-none text-bone drop-shadow-[0_0_18px_rgba(196,20,28,.8)]">
        {last ? last.total : '–'}
      </div>
      <div className="font-display text-xl tracking-[.25em] text-ember">
        {!last ? 'Toque no d20 para rolar' : last.hit != null ? `${last.hit ? 'Acerta' : 'Erra'}${last.vs != null ? ` ${last.vs}` : ''}${last.target ? ` · ${last.target}` : ''}` : last.kind === 'crit' ? '20 natural' : last.kind === 'fumble' ? '1 natural' : last.who ?? ''}
      </div>
    </div>
  )
}

export default function Home() {
  const chars = useStore(s => s.chars)
  const mural = useGalaxy(s => s.mural)
  const procurados = Object.values(mural).filter(r => r.visivel && r.status === 'aberto').slice(0, 3)
  const tripulacao = Object.values(chars).sort((a, b) => b.updated - a.updated).slice(0, 4)

  return (
    <div className="-mx-4 -mt-6 sm:-mx-8 lg:-mx-12 lg:-mt-10">
      {/* Janela da ponte: o fundo animado aparece por trás */}
      <section className="flex min-h-[64vh] flex-col justify-center px-4 py-14 sm:px-8 lg:px-12">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="kicker">Ponte de comando</div>
          <h1 className="title-outline mt-3 text-balance text-[clamp(3rem,8.4vw,7rem)]">
            Toda lenda<br />nasce na mesa
          </h1>
          <p className="mt-5 max-w-[52ch] text-lg text-bone/90">
            Da ponte, o mestre vê a galáxia inteira: fichas, combate, mapas e os cartazes de quem a tripulação está caçando.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link to="/criar" className="btn btn-primary px-7 py-3 text-xl">Criar personagem</Link>
            <Link to="/mesa" className="btn px-7 py-3 text-xl">Abrir a mesa</Link>
          </div>
        </motion.div>
      </section>

      {/* Console da ponte */}
      <section className="border-t border-gold-dim/70 bg-gradient-to-b from-[#121214]/95 to-black/95 px-4 py-10 sm:px-8 lg:px-12">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0">
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="font-display text-3xl tracking-[.2em] text-gold">Mural de procurados</h2>
              <Link to="/mestre" className="font-display tracking-[.25em] text-ash hover:text-gold">Mural do mestre ›</Link>
            </div>
            {procurados.length ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {procurados.map((r, i) => (
                  <WantedPoster
                    key={r.id}
                    name={r.alvo}
                    subtitle={r.crime}
                    image={r.imagem || undefined}
                    tilt={[-1.5, 1, -0.5][i]}
                    stats={[{ label: 'Nível', value: r.nivel }, { label: 'Condição', value: r.condicao }]}
                    reward={cr(r.recompensa)}
                  />
                ))}
              </div>
            ) : (
              <div className="scanlines grid min-h-56 place-items-center border border-dashed border-gold/40 p-8 text-center">
                <div>
                  <div className="font-display text-4xl tracking-[.2em] text-gold/80">Mural vazio</div>
                  <p className="mx-auto mt-2 max-w-[42ch] text-ash">
                    Os cartazes aparecem aqui conforme o jogo avança. O mestre prega cada procurado, com a imagem do personagem, na aba Mestre.
                  </p>
                </div>
              </div>
            )}
          </div>
          <UltimaRolagem />
        </div>

        <div className="mt-12">
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="font-display text-3xl tracking-[.2em] text-gold">Tripulação</h2>
            <Link to="/fichas" className="font-display tracking-[.25em] text-ash hover:text-gold">Todas as fichas ›</Link>
          </div>
          {tripulacao.length ? (
            <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
              {tripulacao.map(c => {
                const k = calc(c)
                return (
                  <Link key={c.id} to={`/fichas?id=${c.id}`} className="group flex gap-4 border border-line-2 bg-black/70 p-3 transition-colors hover:border-gold">
                    <Portrait species={c.species} src={c.portrait} className="w-20 shrink-0" />
                    <div className="min-w-0">
                      <div className="truncate font-display text-2xl tracking-[.08em] text-bone group-hover:text-gold">{c.name || 'Sem nome'}</div>
                      <div className="truncate font-display text-sm tracking-[.2em] text-ash">
                        {SPECIES_BY[c.species]?.name} · {classLine(c)}
                      </div>
                      <div className="mt-1.5 flex gap-3 font-mono text-sm text-bone/90">
                        <span>PV {c.hp}/{k.hpMax}</span><span>REF {k.ref}</span><span>FORT {k.fort}</span><span>VON {k.will}</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <p className="text-ash">Ninguém a bordo ainda. <Link to="/criar" className="text-gold underline">Crie o primeiro personagem.</Link></p>
          )}
        </div>
      </section>
    </div>
  )
}

function classLine(c: Character) {
  return Object.entries(classLevels(c)).map(([id, lv]) => `${CLASSES[id as keyof typeof CLASSES].name} ${lv}`).join(' / ')
}
