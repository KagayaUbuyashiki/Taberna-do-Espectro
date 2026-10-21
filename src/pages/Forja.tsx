import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import clsx from 'clsx'
import type * as THREE from 'three'
import { PageHeader } from '../components/ui/PageHeader'
import { useStore } from '../store/campaign'
import { toast } from '../store/ui'
import {
  BASES, CABELOS, CAPAS, ESCALAS, ESPECIES_3D, MAOS, NOME, NOME_ESPECIE, POSES, TRONCOS,
  comEspecie, especieDaFicha, figuraPadrao, normalizarFigura, type Corpo, type Figura,
} from '../forja/tipos'
import { ALTURA_HUMANO, carregarFonte, descartar, mmPorUnidade, montarFigura, raioBase } from '../forja/montar'
import { abrirModelo, apagarModelo, encaixarModelo, FORMATOS, guardarModelo, LIMITE_MB } from '../forja/importar'
import { baixar, glb, nomeArquivo, stl } from '../forja/exportar'
import { Visor, type Fotografar } from '../forja/Visor'

const ABAS = [['especie', 'Espécie'], ['corpo', 'Corpo'], ['roupa', 'Roupa'], ['equipamento', 'Equipamento'], ['pose', 'Pose'], ['base', 'Base'], ['modelo', 'Modelo próprio'], ['exportar', 'Imprimir']] as const
type Aba = (typeof ABAS)[number][0]
const AVULSA = ''

const CORES: [keyof Figura['cores'], string][] = [
  ['pele', 'Pele / pelo / chapa'], ['cabelo', 'Cabelo e pelagem'], ['olhos', 'Olhos'], ['roupa', 'Roupa'], ['roupa2', 'Roupa de cima e manto'],
  ['couro', 'Couro e botas'], ['metal', 'Metal'], ['lamina', 'Lâmina do sabre'], ['base', 'Base'],
]
const LAMINAS = [['#4fc3ff', 'azul'], ['#5fd38a', 'verde'], ['#ff2a2a', 'vermelho'], ['#b8a1ff', 'roxo'], ['#ffd24a', 'amarelo'], ['#ffffff', 'branco']] as const

/**
 * A forja: o jogador monta o herói em 3D (espécie, corpo, roupa, armas, pose e base) e baixa o STL
 * para imprimir a miniatura ou a action figure. A figura fica parada: no mapa, só os inimigos animam.
 */
export default function Forja() {
  const chars = useStore(s => s.chars)
  const patchChar = useStore(s => s.patchChar)
  const lista = Object.values(chars)
  const [charId, setCharId] = useState<string>(() => lista[0]?.id ?? AVULSA)
  const heroi = charId ? chars[charId] : undefined
  const daFicha = useCallback((id: string) => {
    const c = id ? chars[id] : undefined
    const f = normalizarFigura(c?.figura) ?? figuraPadrao(especieDaFicha(c?.species))
    return c && !c.figura ? { ...f, base: { ...f.base, texto: c.name } } : f
  }, [chars])
  const [fig, setFig] = useState<Figura>(() => daFicha(charId))
  const [mudou, setMudou] = useState(false)
  const [aba, setAba] = useState<Aba>('especie')
  const [girar, setGirar] = useState(false)
  const [fonteOk, setFonteOk] = useState(false)
  const [modeloBruto, setModeloBruto] = useState<THREE.Object3D | null>(null)
  const foto = useRef<Fotografar | null>(null)

  useEffect(() => { void carregarFonte().then(() => setFonteOk(true)) }, [])
  const trocarHeroi = (id: string) => {
    if (mudou && !confirm('Há mudanças na figura que não foram salvas na ficha. Trocar mesmo assim?')) return
    setCharId(id); setFig(daFicha(id)); setMudou(false)
  }
  const mexer = (f: (x: Figura) => Figura) => { setFig(x => f(x)); setMudou(true) }

  // modelo próprio, lido do IndexedDB
  const idModelo = fig.importado?.id
  useEffect(() => {
    let vivo = true
    setModeloBruto(null)
    if (idModelo) void abrirModelo(idModelo).then(o => { if (vivo) setModeloBruto(o) })
    return () => { vivo = false }
  }, [idModelo])

  const figura = useMemo(() => {
    const modelo = fig.importado && modeloBruto ? encaixarModelo(modeloBruto, ALTURA_HUMANO * fig.importado.altura, fig.importado.giro) : null
    return montarFigura(fig, modelo)
  }, [fig, modeloBruto, fonteOk]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => descartar(figura), [figura])

  const salvar = () => {
    if (!heroi) return
    const retrato = foto.current?.(256) ?? fig.retrato
    patchChar(heroi.id, { figura: { ...fig, retrato } })
    setFig(f => ({ ...f, retrato }))
    setMudou(false)
    toast(`Figura salva na ficha de ${heroi.name || 'Sem nome'}. A foto dela aparece na ficha do mapa.`)
  }

  const nome = heroi?.name || fig.base.texto || 'figura'
  const mm = mmPorUnidade(fig)
  return (
    <div className="space-y-6">
      <PageHeader bg="forja" kicker="Oficina de miniaturas" title="Forja"
        actions={<span className="chip chip-gold font-mono">{fig.escalaMm} mm</span>}>
        Monte o seu herói em 3D, peça por peça, e baixe o arquivo para imprimir a miniatura ou a action figure. No mapa, a ficha do herói mostra a foto da figura (os heróis ficam parados; só os inimigos animam).
      </PageHeader>

      <section className="panel">
        <div className="flex flex-wrap items-end gap-3">
          <label className="field min-w-0 flex-1 sm:max-w-sm">Herói
            <select className="input !py-1.5" value={charId} onChange={e => trocarHeroi(e.target.value)}>
              {lista.map(c => <option key={c.id} value={c.id}>{c.name || 'Sem nome'}</option>)}
              <option value={AVULSA}>Figura avulsa (sem ficha)</option>
            </select>
          </label>
          {heroi && <button type="button" className="btn btn-primary" onClick={salvar} disabled={!mudou && !!heroi.figura}>Salvar na ficha</button>}
          <button type="button" className="btn btn-ghost" onClick={() => { setFig(figuraPadrao(especieDaFicha(heroi?.species))); setMudou(true) }}>Recomeçar</button>
          {mudou && <span className="text-sm text-gold">Mudanças não salvas</span>}
          {!lista.length && <span className="text-sm text-ash">Crie um personagem na aba Criar para guardar a figura na ficha.</span>}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <section className="relative min-w-0 border border-line-2 bg-black">
          <div className="h-[62vh] min-h-[360px] lg:h-[74vh]">
            <Visor figura={figura} girar={girar} aoPronto={f => { foto.current = f }} />
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-between gap-2 p-2">
            <span className="chip pointer-events-auto bg-black/70 font-mono text-xs">{(ALTURA_HUMANO * fig.corpo.altura * mm).toFixed(0)} mm · base Ø {(raioBase(fig) * 2 * mm).toFixed(0)} mm</span>
            <button type="button" className={clsx('btn btn-sm pointer-events-auto', girar ? '' : 'btn-ghost')} aria-pressed={girar} onClick={() => setGirar(g => !g)}>Girar vitrine</button>
          </div>
        </section>

        <section className="panel min-w-0 self-start">
          <div className="flex flex-wrap gap-1" role="tablist" aria-label="Partes da figura">
            {ABAS.map(([id, l]) => (
              <button key={id} type="button" role="tab" aria-selected={aba === id} onClick={() => setAba(id)}
                className={clsx('btn btn-sm', aba === id ? 'btn-primary' : 'btn-ghost')}>{l}</button>
            ))}
          </div>
          <div className="mt-4 space-y-4" role="tabpanel">
            {fig.importado && aba !== 'modelo' && aba !== 'base' && aba !== 'exportar' && (
              <p className="border-l-2 border-gold bg-black/60 px-3 py-2 text-sm">Esta figura usa um modelo próprio ({fig.importado.nome}). As peças montadas voltam quando você tirar o modelo, na aba Modelo próprio.</p>
            )}
            {aba === 'especie' && (
              <Grade>
                {ESPECIES_3D.map(e => (
                  <Opcao key={e} ativo={fig.especie === e} onClick={() => mexer(f => comEspecie(f, e))}>{NOME_ESPECIE[e]}</Opcao>
                ))}
              </Grade>
            )}
            {aba === 'corpo' && (
              <>
                {([['altura', 'Altura', 0.5, 1.4], ['massa', 'Corpo (magro a forte)', 0.7, 1.7], ['ombros', 'Ombros', 0.8, 1.3], ['cabeca', 'Cabeça', 0.8, 1.6], ['pernas', 'Pernas', 0.75, 1.25]] as [keyof Corpo, string, number, number][]).map(([k, l, a, b]) => (
                  <Regua key={k} rotulo={l} valor={fig.corpo[k]} min={a} max={b} onChange={v => mexer(f => ({ ...f, corpo: { ...f.corpo, [k]: v } }))} />
                ))}
                <Cores fig={fig} chaves={['pele', 'cabelo', 'olhos']} mexer={mexer} />
                <Escolha rotulo="Cabelo" valor={fig.cabelo} opcoes={CABELOS} onChange={v => mexer(f => ({ ...f, cabelo: v }))} />
              </>
            )}
            {aba === 'roupa' && (
              <>
                <Escolha rotulo="Tronco" valor={fig.tronco} opcoes={TRONCOS} onChange={v => mexer(f => ({ ...f, tronco: v }))} />
                <Escolha rotulo="Manto e capa" valor={fig.capa} opcoes={CAPAS} onChange={v => mexer(f => ({ ...f, capa: v }))} />
                <Cores fig={fig} chaves={['roupa', 'roupa2', 'couro', 'metal']} mexer={mexer} />
              </>
            )}
            {aba === 'equipamento' && (
              <>
                <Escolha rotulo="Mão direita" valor={fig.maoDireita} opcoes={MAOS} onChange={v => mexer(f => ({ ...f, maoDireita: v }))} />
                <Escolha rotulo="Mão esquerda" valor={fig.maoEsquerda} opcoes={MAOS} onChange={v => mexer(f => ({ ...f, maoEsquerda: v }))} />
                <div>
                  <p className="field">Cor da lâmina</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {LAMINAS.map(([cor, l]) => (
                      <button key={cor} type="button" aria-pressed={fig.cores.lamina === cor} aria-label={`Lâmina ${l}`} title={l}
                        className={clsx('h-8 w-8 rounded-full border-2', fig.cores.lamina === cor ? 'border-gold' : 'border-line-2')}
                        style={{ background: cor, boxShadow: `0 0 10px ${cor}` }} onClick={() => mexer(f => ({ ...f, cores: { ...f.cores, lamina: cor } }))} />
                    ))}
                    <input type="color" className="h-8 w-12 cursor-pointer border border-line-2 bg-black" value={fig.cores.lamina} aria-label="Outra cor de lâmina"
                      onChange={e => { const v = e.target.value; mexer(f => ({ ...f, cores: { ...f.cores, lamina: v } })) }} />
                  </div>
                </div>
              </>
            )}
            {aba === 'pose' && (
              <Grade>
                {POSES.map(p => <Opcao key={p} ativo={fig.pose === p} onClick={() => mexer(f => ({ ...f, pose: p }))}>{NOME[p]}</Opcao>)}
              </Grade>
            )}
            {aba === 'base' && (
              <>
                <Escolha rotulo="Forma" valor={fig.base.forma} opcoes={BASES} onChange={v => mexer(f => ({ ...f, base: { ...f.base, forma: v } }))} />
                <label className="field">Nome gravado na base
                  <input className="input" maxLength={24} value={fig.base.texto} placeholder={heroi?.name || 'Nome do herói'}
                    onChange={e => { const v = e.target.value; mexer(f => ({ ...f, base: { ...f.base, texto: v } })) }} />
                  <span className="text-xs tracking-normal">Letras sem acento (a fonte do relevo não tem acentos).</span>
                </label>
                <Cores fig={fig} chaves={['base']} mexer={mexer} />
              </>
            )}
            {aba === 'modelo' && <ModeloProprio fig={fig} mexer={mexer} carregado={!!modeloBruto} />}
            {aba === 'exportar' && <Imprimir fig={fig} figura={figura} nome={nome} mexer={mexer} foto={foto} />}
          </div>
        </section>
      </div>
    </div>
  )
}

function Grade({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{children}</div>
}
function Opcao({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" aria-pressed={ativo} onClick={onClick} className={clsx('btn btn-sm justify-center', ativo ? 'btn-primary' : '')}>{children}</button>
}
function Escolha<T extends string>({ rotulo, valor, opcoes, onChange }: { rotulo: string; valor: T; opcoes: readonly T[]; onChange: (v: T) => void }) {
  return (
    <div>
      <p className="field">{rotulo}</p>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {opcoes.map(o => <button key={o} type="button" aria-pressed={valor === o} onClick={() => onChange(o)} className={clsx('btn btn-sm', valor === o ? 'btn-primary' : 'btn-ghost')}>{NOME[o] ?? o}</button>)}
      </div>
    </div>
  )
}
function Regua({ rotulo, valor, min, max, onChange }: { rotulo: string; valor: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <label className="field">
      <span className="flex justify-between">{rotulo}<b className="font-mono font-normal text-bone">{Math.round(valor * 100)}%</b></span>
      <input type="range" min={min} max={max} step={0.01} value={valor} onChange={e => onChange(+e.target.value)} className="accent-[var(--color-gold)]" />
    </label>
  )
}
function Cores({ fig, chaves, mexer }: { fig: Figura; chaves: (keyof Figura['cores'])[]; mexer: (f: (x: Figura) => Figura) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {CORES.filter(([k]) => chaves.includes(k)).map(([k, l]) => (
        <label key={k} className="flex min-w-0 items-center gap-2 border border-line-2 bg-black/50 px-2 py-1.5 text-sm">
          <input type="color" className="h-7 w-9 shrink-0 cursor-pointer border border-line-2 bg-black" value={fig.cores[k]}
            onChange={e => { const v = e.target.value; mexer(f => ({ ...f, cores: { ...f.cores, [k]: v } })) }} />
          <span className="min-w-0 truncate">{l}</span>
        </label>
      ))}
    </div>
  )
}

function ModeloProprio({ fig, mexer, carregado }: { fig: Figura; mexer: (f: (x: Figura) => Figura) => void; carregado: boolean }) {
  const [enviando, setEnviando] = useState(false)
  const enviar = async (arq: File | undefined) => {
    if (!arq) return
    setEnviando(true)
    const r = await guardarModelo(arq).catch((e: Error) => ({ erro: e.message }))
    setEnviando(false)
    if ('erro' in r) { toast(r.erro); return }
    mexer(f => ({ ...f, importado: { id: r.id, nome: r.nome, altura: f.corpo.altura, giro: 0 } }))
  }
  const tirar = () => {
    const id = fig.importado?.id
    mexer(f => ({ ...f, importado: null }))
    if (id) void apagarModelo(id)
  }
  return (
    <div className="space-y-3 text-sm">
      <p>Já tem a miniatura pronta em outro programa (um criador de miniaturas, o Blender, um modelo comprado)? Traga o arquivo: ele entra no lugar do boneco montado, em cima da base, e sai junto no STL.</p>
      <label className="btn btn-sm w-fit cursor-pointer">
        {enviando ? 'Abrindo…' : fig.importado ? 'Trocar o modelo' : 'Enviar modelo 3D'}
        <input type="file" className="sr-only" accept={FORMATOS.join(',')} disabled={enviando} onChange={e => { void enviar(e.target.files?.[0]); e.target.value = '' }} />
      </label>
      <p className="text-xs text-ash">Aceita {FORMATOS.join(', ')} até {LIMITE_MB} MB. O .gltf precisa ser de arquivo único (texturas embutidas). O arquivo fica guardado só neste navegador.</p>
      {fig.importado && (
        <div className="space-y-3 border border-line-2 bg-black/50 p-3">
          <p className="font-mono">{fig.importado.nome}{!carregado && ' · não está neste navegador (envie de novo)'}</p>
          <Regua rotulo="Altura (perto do humano padrão)" valor={fig.importado.altura} min={0.3} max={2.5} onChange={v => mexer(f => ({ ...f, importado: f.importado && { ...f.importado, altura: v } }))} />
          <label className="field">
            <span className="flex justify-between">Virar<b className="font-mono font-normal text-bone">{Math.round((fig.importado.giro * 180) / Math.PI)}°</b></span>
            <input type="range" min={-Math.PI} max={Math.PI} step={Math.PI / 36} value={fig.importado.giro} className="accent-[var(--color-gold)]"
              onChange={e => { const v = +e.target.value; mexer(f => ({ ...f, importado: f.importado && { ...f.importado, giro: v } })) }} />
          </label>
          <button type="button" className="btn btn-sm btn-danger" onClick={tirar}>Voltar ao boneco montado</button>
        </div>
      )}
    </div>
  )
}

function Imprimir({ fig, figura, nome, mexer, foto }: { fig: Figura; figura: THREE.Object3D; nome: string; mexer: (f: (x: Figura) => Figura) => void; foto: React.RefObject<Fotografar | null> }) {
  const mm = mmPorUnidade(fig)
  const arq = nomeArquivo(nome)
  const lamina = 0.024 * mm * fig.corpo.altura
  const temLamina = !fig.importado && [fig.maoDireita, fig.maoEsquerda].some(m => m === 'sabre' || m === 'sabre-duplo' || m === 'cajado')
  const [ocupado, setOcupado] = useState(false)
  const baixarStl = () => { baixar(stl(figura, mm), `${arq}-${fig.escalaMm}mm.stl`, 'model/stl'); toast('STL baixado.') }
  const baixarGlb = async () => { setOcupado(true); try { baixar(await glb(figura, mm), `${arq}-${fig.escalaMm}mm.glb`, 'model/gltf-binary') } finally { setOcupado(false) } }
  const baixarFoto = () => {
    const url = foto.current?.(768)
    if (!url) return
    const a = document.createElement('a'); a.href = url; a.download = `${arq}.png`; a.click()
  }
  return (
    <div className="space-y-4 text-sm">
      <Escolha rotulo="Tamanho da impressão" valor={String(fig.escalaMm)} opcoes={ESCALAS.map(String)} onChange={v => mexer(f => ({ ...f, escalaMm: +v as Figura['escalaMm'] }))} />
      <ul className="space-y-1 border-l-2 border-gold bg-black/60 px-3 py-2 font-mono text-xs">
        <li>Altura da figura: {(ALTURA_HUMANO * fig.corpo.altura * mm).toFixed(1)} mm</li>
        <li>Base: Ø {(raioBase(fig) * 2 * mm).toFixed(1)} mm × {(0.11 * mm).toFixed(1)} mm</li>
        {temLamina && <li className={lamina < 0.8 ? 'text-ember' : ''}>Lâmina do sabre: Ø {lamina.toFixed(2)} mm{lamina < 0.8 ? ' (fina demais para filamento; use resina ou um tamanho maior)' : ''}</li>}
      </ul>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary" onClick={baixarStl}>Baixar STL (imprimir)</button>
        <button type="button" className="btn" onClick={() => void baixarGlb()} disabled={ocupado}>Baixar GLB (com cores)</button>
        <button type="button" className="btn btn-ghost" onClick={baixarFoto}>Baixar foto</button>
      </div>
      <div className="space-y-1.5 text-ash">
        <p><b className="text-bone">STL</b>: uma peça só, figura e base juntas, em milímetros. Abra no fatiador (PrusaSlicer, Cura, Chitubox, Lychee) e ligue os suportes: braços, armas e manto ficam no ar.</p>
        <p><b className="text-bone">28 e 32 mm</b> saem melhor em impressora de resina. <b className="text-bone">95 e 150 mm</b> (action figure) também vão bem em filamento, com camada de 0,1 a 0,15 mm.</p>
        <p><b className="text-bone">GLB</b>: a mesma figura com as cores, para ver em outro programa, pintar de referência ou mandar a um serviço de impressão colorida.</p>
        <p>As peças são sólidas que se encostam. Se o fatiador reclamar, peça para ele unir os volumes que se cruzam (no Cura, "Unir volumes sobrepostos"; no PrusaSlicer, o reparo do modelo).</p>
      </div>
    </div>
  )
}
