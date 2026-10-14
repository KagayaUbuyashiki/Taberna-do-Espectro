import clsx from 'clsx'
import { ABIL_SHORT, CLASSES, COND, RANGES } from '../../data/saga'
import { ART } from '../../art/art'
import { Svg } from '../../components/Svg'
import { AssetImg } from '../../components/ui/AssetImg'
import { Portrait } from '../../components/ui/Portrait'
import { ASSET } from '../../lib/assets'
import { CHOICE_LABEL, classesDaPericia, classesDoTalento, donosDaArvore, modsDaEspecie, reqAptidao, reqTalento, type Filtro } from './dados'
import { Rico, Tabela, Titulo } from './Tabela'

const cr = (n: number) => n.toLocaleString('pt-BR')
const traco = <span className="text-ash">–</span>

/* ---------- Combate: condição, ações, defesas ---------- */
export function SecaoCombate({ f }: { f: Filtro }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {f.textos.map(t => (
        <div key={t.id} className="panel min-w-0">
          <Titulo t={t.titulo} code={t.ref} />
          {t.id === 'condicao' && (
            <ol className="mb-3 flex flex-wrap gap-1" aria-label="Passos do curso da condição">
              {COND.map((x, i) => (
                <li key={x.k} className={clsx('border px-2 py-0.5 text-center font-display text-sm leading-tight tracking-[.1em]',
                  i === 0 ? 'border-gold text-gold' : i < 4 ? 'border-line-2 text-bone' : 'border-ember text-ember')}>{x.l}</li>
              ))}
            </ol>
          )}
          <div className="space-y-2 text-sm text-bone/80">{t.ps.map((p, i) => <p key={i}><Rico t={p} /></p>)}</div>
        </div>
      ))}
    </div>
  )
}

/* ---------- CDs e alcance ---------- */
export function SecaoCDs({ f }: { f: Filtro }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {f.cds.length > 0 && (
        <div className="panel min-w-0">
          <Titulo t="Classe de dificuldade" code="CD" />
          <Tabela legenda="Classes de dificuldade" rows={f.cds} k={r => String(r[0])} cols={[
            { h: 'Tarefa', c: r => r[0], className: 'whitespace-nowrap' },
            { h: 'CD', c: r => r[1], num: true },
            { h: 'Exemplo', c: r => <span className="text-bone/75">{r[2]}</span> },
          ]} />
        </div>
      )}
      {f.alcance.length > 0 && (
        <div className="panel min-w-0">
          <Titulo t="Alcance" code="TABELA 8-5 · QUADRADOS DE 1,5 M" />
          <Tabela legenda="Faixas de alcance" rows={f.alcance} k={r => r[0]} cols={[
            { h: 'Tipo', c: r => <span className="capitalize">{r[0]}</span>, className: 'whitespace-nowrap' },
            { h: 'Queima-roupa', c: r => `0–${r[1][0]}`, num: true },
            { h: 'Curto -2', c: r => `${r[1][0] + 1}–${r[1][1]}`, num: true },
            { h: 'Médio -5', c: r => `${r[1][1] + 1}–${r[1][2]}`, num: true },
            { h: 'Longo -10', c: r => `${r[1][2] + 1}–${r[1][3]}`, num: true },
          ]} />
          <p className="mt-2 text-xs text-ash">Arremesso usa a primeira linha; demais armas seguem o seu grupo ({Object.keys(RANGES).length} faixas).</p>
        </div>
      )}
    </div>
  )
}

/* ---------- Perícias ---------- */
export function SecaoPericias({ f }: { f: Filtro }) {
  return (
    <div className="panel min-w-0">
      <Titulo t="Perícias" code="TABELA 4-2" />
      <p className="mb-3 text-sm text-bone/80"><Rico t="**Teste:** 1d20 + ½ nível + habilidade + 5 se treinado (+5 com Foco em Perícia). Perícias marcadas com penalidade de armadura sofrem a penalidade sem proficiência." /></p>
      <Tabela legenda="Perícias" rows={f.pericias} k={r => r.n} cols={[
        { h: 'Perícia', c: r => r.n, className: 'whitespace-nowrap' },
        { h: 'Hab.', c: r => ABIL_SHORT[r.a], num: true },
        { h: 'Só treinado', c: r => (r.trainedOnly || r.force ? 'Sim' : traco) },
        { h: 'Armadura', c: r => (r.arm ? 'Penaliza' : traco) },
        { h: 'Classes', c: r => <span className="text-bone/75">{classesDaPericia(r.n).join(', ') || '–'}{r.force && <span className="text-ash"> · exige Sensitividade da Força</span>}</span> },
      ]} />
    </div>
  )
}

/* ---------- Talentos ---------- */
export function SecaoTalentos({ f }: { f: Filtro }) {
  return (
    <div className="panel min-w-0">
      <Titulo t="Talentos" code="TABELA 5-1" />
      <Tabela legenda="Talentos" rows={f.talentos} k={r => r.n} cols={[
        { h: 'Talento', c: r => (
          <div className="min-w-40">
            <div className="font-semibold text-bone">{r.n}</div>
            <div className="mt-1 flex flex-wrap gap-1">
              {r.multi && <span className="chip text-xs">Repetível</span>}
              {r.choice && <span className="chip text-xs">{CHOICE_LABEL[r.choice] ?? r.choice}</span>}
            </div>
            <p className="mt-1 text-bone/80 sm:hidden">{r.d}</p>
            {classesDoTalento(r.n).length > 0 && <p className="mt-0.5 text-xs text-ash sm:hidden">Bônus de {classesDoTalento(r.n).join(', ')}</p>}
          </div>
        ) },
        { h: 'Pré-requisitos', c: r => <span className="text-bone/80">{reqTalento(r) || '–'}</span>, className: 'min-w-40' },
        { h: 'Benefício', c: r => <span className="text-bone/80">{r.d}</span>, className: 'min-w-56', largo: true },
        { h: 'Bônus de', c: r => <span className="text-ash">{classesDoTalento(r.n).join(', ') || '–'}</span>, className: 'min-w-28', largo: true },
      ]} />
    </div>
  )
}

/* ---------- Aptidões (árvores de talentos de classe) ---------- */
export function SecaoAptidoes({ f }: { f: Filtro }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {f.aptidoes.map(([arv, ts]) => (
        <div key={arv} className="panel min-w-0">
          <Titulo t={arv} code={donosDaArvore(arv).join(' · ').toUpperCase()} />
          <Tabela legenda={`Aptidões: ${arv}`} rows={ts} k={r => r.n} cols={[
            { h: 'Aptidão', c: r => (
              <>
                <span className="font-semibold text-bone">{r.n}{r.multi ? <span className="ml-1 font-mono text-xs text-ash">×{r.multi}</span> : null}</span>
                <p className="mt-1 text-bone/80 sm:hidden">{r.d}</p>
              </>
            ), className: 'min-w-36' },
            { h: 'Pré-requisitos', c: r => <span className="text-bone/80">{reqAptidao(r) || '–'}</span>, className: 'min-w-32' },
            { h: 'Efeito', c: r => <span className="text-bone/80">{r.d}</span>, className: 'min-w-56', largo: true },
          ]} />
        </div>
      ))}
    </div>
  )
}

/* ---------- Poderes da Força ---------- */
export function SecaoForca({ f }: { f: Filtro }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {f.poderes.map(p => (
        <article key={p.n} className="panel flex min-w-0 flex-col gap-2">
          <div className="flex items-start gap-3">
            <AssetImg path={ASSET.power(p.n)} className="h-16 w-16 shrink-0 border border-line-2 object-cover" />
            <div className="min-w-0">
              <h3 className={clsx('font-display text-2xl leading-none tracking-[.12em]', p.desc === 'lado sombrio' ? 'text-ember' : 'text-gold')}>{p.n}</h3>
              <div className="mt-1 flex flex-wrap gap-1">
                {p.desc && <span className={clsx('chip text-xs', p.desc === 'lado sombrio' ? 'border-ember text-ember' : 'chip-gold')}>{p.desc}</span>}
                <span className="chip text-xs">{p.t}</span>
              </div>
            </div>
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-sm">
            <dt className="font-display tracking-[.15em] text-ash">Alvo</dt><dd className="text-bone/85">{p.a}</dd>
            {p.vs && <><dt className="font-display tracking-[.15em] text-ash">Contra</dt><dd className="text-bone/85">{p.vs}</dd></>}
            {p.dmg && <><dt className="font-display tracking-[.15em] text-ash">Dano</dt><dd className="font-mono tabular-nums text-ember">{p.dmg}</dd></>}
          </dl>
          <p className="text-sm text-bone/80">{p.d}</p>
          {p.tiers && (
            <Tabela legenda={`CDs de ${p.n}`} rows={p.tiers} k={r => String(r[0])} cols={[
              { h: 'CD Usar a Força', c: r => r[0], num: true },
              { h: 'Efeito', c: r => r[1] },
            ]} />
          )}
        </article>
      ))}
    </div>
  )
}

/* ---------- Armas ---------- */
export function SecaoArmas({ f }: { f: Filtro }) {
  return (
    <div className="panel min-w-0">
      <Titulo t="Armas" code="TABELAS 8-3 E 8-4" />
      <Tabela legenda="Armas" rows={f.armas} k={r => r.n} cols={[
        { h: 'Arma', c: r => r.n, className: 'whitespace-nowrap font-semibold' },
        { h: 'Grupo', c: r => <span className="whitespace-nowrap text-bone/80">{r.g}</span> },
        { h: 'Dano', c: r => r.dmg, num: true },
        { h: 'Atordoar', c: r => ('stunOnly' in r && r.stunOnly ? r.dmg : r.stun) || traco, num: true },
        { h: 'Custo', c: r => cr(r.cost), num: true },
        { h: 'Tipo', c: r => <span className="text-bone/80">{r.type}</span>, className: 'min-w-32' },
        { h: 'Notas', c: r => {
          const n = [r.light && 'leve', r.thrown && 'arremesso', r.auto && 'automática', r.area && 'área', 'stunOnly' in r && r.stunOnly && 'só atordoa'].filter(Boolean)
          return n.length ? <span className="whitespace-nowrap text-ash">{n.join(', ')}</span> : traco
        } },
      ]} />
    </div>
  )
}

/* ---------- Armaduras ---------- */
export function SecaoArmaduras({ f }: { f: Filtro }) {
  return (
    <div className="panel min-w-0">
      <Titulo t="Armaduras" code="TABELA 8-7" />
      <Tabela legenda="Armaduras" rows={f.armaduras} k={r => r.n} cols={[
        { h: 'Armadura', c: r => r.n, className: 'whitespace-nowrap font-semibold' },
        { h: 'Tipo', c: r => r.cat },
        { h: 'Ref', c: r => `+${r.ref}`, num: true },
        { h: 'Fort', c: r => (r.fort ? `+${r.fort}` : '–'), num: true },
        { h: 'Des máx', c: r => `+${r.maxDex}`, num: true },
        { h: 'Custo', c: r => cr(r.cost), num: true },
      ]} />
      <p className="mt-3 text-sm text-ash">Sem proficiência: -2 (leve), -5 (média), -10 (pesada) em ataques e perícias físicas, e sem o bônus de equipamento. Média e pesada reduzem a velocidade de 6 para 4 quadrados.</p>
    </div>
  )
}

/* ---------- Espécies ---------- */
export function SecaoEspecies({ f }: { f: Filtro }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {f.especies.map(s => (
        <article key={s.id} className="panel flex min-w-0 flex-col gap-3">
          <div className="flex items-start gap-3">
            <Portrait species={s.id} className="w-20 shrink-0" />
            <div className="min-w-0">
              <h3 className="font-display text-2xl leading-none tracking-[.15em] text-gold">{s.name}</h3>
              <div className="mt-1 text-sm text-ash">{s.world}</div>
              <div className="mt-1 font-mono text-sm tabular-nums text-bone">{modsDaEspecie(s.mods as Record<string, number>)}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <div className="stat"><small>Tamanho</small><span className="block font-display text-lg tracking-[.1em] text-bone">{s.size}</span></div>
            <div className="stat"><small>Deslocamento</small><span className="block font-mono text-lg tabular-nums text-bone">{s.speed}{'swim' in s && s.swim ? ` · nado ${s.swim}` : ''}</span></div>
          </div>
          <div className="text-sm"><span className="font-display tracking-[.15em] text-ash">Idiomas </span><span className="text-bone/85">{s.langs.join(', ')}</span></div>
          <ul className="list-disc space-y-1 pl-5 text-sm text-bone/80">{s.traits.map(t => <li key={t}>{t}</li>)}</ul>
        </article>
      ))}
    </div>
  )
}

/* ---------- Classes ---------- */
const BBA = { full: 'Igual ao nível', '3/4': '¾ do nível' } as Record<string, string>
const DEF_NOME: Record<string, string> = { ref: 'Ref', fort: 'Fort', will: 'Von' }

export function SecaoClasses({ f }: { f: Filtro }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {f.classes.map(id => {
        const c = CLASSES[id]
        return (
          <article key={id} className="panel flex min-w-0 flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="h-20 w-20 shrink-0 overflow-hidden border border-line-2 bg-black">
                <AssetImg path={ASSET.cls(id)} className="h-full w-full object-cover"
                  fallback={<Svg html={ART.emblem(id)} className="block h-full w-full p-2 text-gold [&>svg]:h-full [&>svg]:w-full" />} />
              </div>
              <div className="min-w-0">
                <h3 className="font-display text-3xl leading-none tracking-[.15em] text-gold">{c.name}</h3>
                <p className="mt-1 text-sm text-bone/80">{c.blurb}</p>
                <p className="mt-1 text-xs text-ash">Ex.: {c.examples}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              <div className="stat"><small>PV iniciais</small><span className="block font-mono text-lg tabular-nums text-bone">{c.hp0} + Con</span></div>
              <div className="stat"><small>Dado de vida</small><span className="block font-mono text-lg tabular-nums text-bone">d{c.die}</span></div>
              <div className="stat"><small>Perícias</small><span className="block font-mono text-lg tabular-nums text-bone">{c.skillsN} + Int</span></div>
              <div className="stat"><small>Créditos</small><span className="block font-mono text-lg tabular-nums text-bone">{c.credits[0]}d{c.credits[1]}×{c.credits[2]}</span></div>
            </div>
            <dl className="grid gap-x-3 gap-y-1.5 text-sm sm:grid-cols-[auto_1fr]">
              <dt className="font-display tracking-[.15em] text-ash">BBA</dt><dd className="text-bone/85">{BBA[c.bab] ?? c.bab}</dd>
              <dt className="font-display tracking-[.15em] text-ash">Defesas</dt>
              <dd className="font-mono tabular-nums text-bone/85">{Object.entries(c.def).map(([k, v]) => `${DEF_NOME[k] ?? k} +${v}`).join(', ')}</dd>
              <dt className="font-display tracking-[.15em] text-ash">Habilidades</dt><dd className="text-bone/85">{c.key}</dd>
              <dt className="font-display tracking-[.15em] text-ash">Talentos iniciais</dt><dd className="text-bone/85">{c.start.join(', ')}</dd>
              <dt className="font-display tracking-[.15em] text-ash">Aptidões</dt><dd className="text-bone/85">{c.trees.join(', ')}</dd>
            </dl>
            <div>
              <div className="font-display text-sm tracking-[.2em] text-ash">Perícias de classe</div>
              <div className="mt-1 flex flex-wrap gap-1">{c.skills.map(s => <span key={s} className="chip text-xs">{s}</span>)}</div>
            </div>
            <details className="text-sm">
              <summary className="cursor-pointer font-display tracking-[.2em] text-gold">Talentos bônus ({c.bonus.length})</summary>
              <p className="mt-1 text-bone/80">{c.bonus.join(', ')}</p>
            </details>
          </article>
        )
      })}
    </div>
  )
}

/* ---------- Ideias ---------- */
export function SecaoIdeias({ f }: { f: Filtro }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {f.ideias.length > 0 && (
        <div className="panel min-w-0 xl:row-span-2">
          <Titulo t="Ideias para a galáxia" code="ROTEIRO" />
          <ul className="divide-y divide-line">
            {f.ideias.map(([s, t, d]) => (
              <li key={t} className="flex items-start gap-3 py-2.5">
                <span className={clsx('chip w-20 shrink-0 justify-center text-xs', s === 'Pronto' ? 'border-rebel text-rebel' : 'chip-gold')}>{s}</span>
                <div className="min-w-0"><b className="font-semibold text-bone">{t}</b><p className="text-sm text-bone/75">{d}</p></div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {f.ganchos.length > 0 && (
        <div className="panel min-w-0">
          <Titulo t="Ganchos de aventura" code={`${f.ganchos.length} IDEIAS`} />
          <ol className="list-decimal space-y-1.5 pl-5 text-sm text-bone/85 marker:font-mono marker:text-gold">{f.ganchos.map(g => <li key={g}>{g}</li>)}</ol>
        </div>
      )}
      {f.complicacoes.length > 0 && (
        <div className="panel min-w-0">
          <Titulo t="Complicações" code="QUANDO TUDO DÁ ERRADO" />
          <ol className="list-decimal space-y-1.5 pl-5 text-sm text-bone/85 marker:font-mono marker:text-gold">{f.complicacoes.map(g => <li key={g}>{g}</li>)}</ol>
        </div>
      )}
    </div>
  )
}
