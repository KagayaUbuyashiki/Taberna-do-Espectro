/*
 * Monta a figura 3D de um herói com peças simples do three.js (cilindros, esferas, caixas):
 * corpo articulado, traços de cada espécie, roupa, manto, armas nas mãos, pose fixa e a base.
 * Sem animação: é uma estátua, pronta para virar miniatura ou action figure (STL em mm).
 *
 * Unidades: o humano padrão tem ALTURA_HUMANO de altura. A figura olha para +z; a direita dela é -x.
 */
import * as THREE from 'three'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { FontLoader, type Font } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import fonteUrl from 'three/examples/fonts/helvetiker_bold.typeface.json?url'
import type { Figura } from './tipos'

export const ALTURA_HUMANO = 1.75
/** Milímetros por unidade, para a impressão. */
export const mmPorUnidade = (f: Pick<Figura, 'escalaMm'>) => f.escalaMm / ALTURA_HUMANO

/* ------------------------------------------------------------------ materiais */

class Oficina {
  mats = new Map<string, THREE.MeshStandardMaterial>()
  mat(cor: string, o: { brilho?: boolean; metal?: boolean } = {}) {
    const k = `${cor}|${o.brilho ? 1 : 0}|${o.metal ? 1 : 0}`
    let m = this.mats.get(k)
    if (!m) {
      m = new THREE.MeshStandardMaterial({
        color: cor, roughness: o.metal ? 0.35 : 0.72, metalness: o.metal ? 0.65 : 0.02,
        emissive: o.brilho ? new THREE.Color(cor) : new THREE.Color(0), emissiveIntensity: o.brilho ? 1.6 : 0,
      })
      m.name = k
      this.mats.set(k, m)
    }
    return m
  }
  malha(geo: THREE.BufferGeometry, cor: string, o?: { brilho?: boolean; metal?: boolean }) {
    const m = new THREE.Mesh(geo, this.mat(cor, o))
    m.castShadow = true
    m.receiveShadow = true
    return m
  }
}

const SEG = 20
const esfera = (r: number) => new THREE.SphereGeometry(r, SEG, Math.round(SEG * 0.75))
const cilindro = (rTopo: number, rBase: number, h: number, seg = SEG) => new THREE.CylinderGeometry(rTopo, rBase, h, seg)
const caixa = (x: number, y: number, z: number) => new THREE.BoxGeometry(x, y, z)
const em = <T extends THREE.Object3D>(o: T, x = 0, y = 0, z = 0) => { o.position.set(x, y, z); return o }
const escala = <T extends THREE.Object3D>(o: T, x: number, y: number, z: number) => { o.scale.set(x, y, z); return o }

/** Tubo afinando por uma lista de pontos (lekku, tentáculos, trança, chifres): cilindros e juntas esféricas. */
function tubo(of: Oficina, pts: THREE.Vector3[], r0: number, r1: number, cor: string, listra?: string) {
  const g = new THREE.Group()
  const n = pts.length - 1
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[i + 1]
    const ra = r0 + (r1 - r0) * (i / n), rb = r0 + (r1 - r0) * ((i + 1) / n)
    const len = a.distanceTo(b)
    const c = listra && i % 2 === 1 ? listra : cor
    const seg = of.malha(cilindro(rb, ra, len, 12), c)
    seg.position.copy(a).add(b).multiplyScalar(0.5)
    seg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize())
    g.add(seg)
    g.add(em(of.malha(esfera(rb), c), b.x, b.y, b.z))
  }
  g.add(em(of.malha(esfera(r0), cor), pts[0].x, pts[0].y, pts[0].z))
  return g
}
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

/* ------------------------------------------------------------------ poses */

interface Braco { frente: number; abre: number; cotovelo: number; arma: number }
interface Perna { frente: number; abre: number; joelho: number }
interface Pose { inclina: number; giro: number; cabeca: [number, number]; d: Braco; e: Braco; pd: Perna; pe: Perna }

const B = (frente: number, abre: number, cotovelo: number, arma = 0): Braco => ({ frente, abre, cotovelo, arma })
const P = (frente: number, abre: number, joelho: number): Perna => ({ frente, abre, joelho })

/** Ângulos de cada pose (radianos). `frente` leva o membro para a frente; `arma` inclina o que está na mão. */
const POSES: Record<Figura['pose'], Pose> = {
  parado: { inclina: 0, giro: 0, cabeca: [0, 0], d: B(0.08, 0.12, 0.2, Math.PI / 4), e: B(0.05, 0.12, 0.2, Math.PI / 4), pd: P(0, 0.05, 0), pe: P(0, 0.05, 0) },
  guarda: { inclina: 0.06, giro: -0.35, cabeca: [-0.05, 0.3], d: B(0.55, 0.15, 1.45, 0), e: B(0.4, 0.2, 1.2, 0.2), pd: P(0.3, 0.12, 0.25), pe: P(-0.25, 0.1, 0.15) },
  mirando: { inclina: 0, giro: -0.3, cabeca: [0, 0.3], d: B(1.5, 0.05, 0, 0), e: B(1.35, -0.25, 0.35, 0), pd: P(0.15, 0.1, 0.05), pe: P(-0.15, 0.1, 0.05) },
  heroico: { inclina: -0.05, giro: 0.15, cabeca: [-0.15, 0], d: B(2.85, 0.2, 0.1, Math.PI / 2), e: B(0.1, 0.55, 1.6, Math.PI / 4), pd: P(0.05, 0.22, 0), pe: P(0.35, 0.08, 0.55) },
  meditando: { inclina: 0.05, giro: 0, cabeca: [0.15, 0], d: B(0.55, 0.25, 0.9, Math.PI / 2), e: B(0.55, 0.25, 0.9, Math.PI / 2), pd: P(1.45, 0.75, 2.55), pe: P(1.45, 0.75, 2.55) },
  avanco: { inclina: 0.3, giro: -0.2, cabeca: [-0.25, 0.1], d: B(-0.5, 0.35, 0.9, -0.2), e: B(0.9, 0.2, 0.5, 0.2), pd: P(0.7, 0.08, 0.9), pe: P(-0.55, 0.08, 0.2) },
}

/* ------------------------------------------------------------------ montagem */

/** Medidas do corpo, já com as proporções da figura (antes da altura, que escala tudo). */
function medidas(f: Figura) {
  const { massa, ombros, cabeca, pernas } = f.corpo
  return {
    coxa: 0.45 * pernas, canela: 0.43 * pernas, pe: 0.06,
    rCoxa: 0.068 * massa, rCanela: 0.05 * massa, quadril: 0.095 * massa,
    pelvisL: 0.3 * massa, pelvisA: 0.14, pelvisP: 0.19 * massa,
    abdomenA: 0.2, peitoA: 0.28, peitoL: 0.38 * ombros * Math.sqrt(massa), peitoP: 0.22 * massa,
    braco: 0.3, antebraco: 0.27, rBraco: 0.046 * Math.sqrt(massa), rAntebraco: 0.039 * Math.sqrt(massa), mao: 0.046 * Math.sqrt(massa),
    pescoco: 0.07, rCabeca: 0.115 * cabeca,
  }
}

const COURO_OU = (f: Figura, c: string) => (f.especie === 'droide' ? f.cores.pele : c)

/** Monta a figura; com `modelo` (o arquivo importado já encaixado), ele fica no lugar do boneco. */
export function montarFigura(f: Figura, modelo?: THREE.Object3D | null): THREE.Group {
  const of = new Oficina()
  const raiz = new THREE.Group()
  raiz.name = 'figura'
  const base = montarBase(of, f)
  raiz.add(base)
  const corpo = modelo ?? montarCorpo(of, f)
  raiz.add(corpo)
  pousar(corpo, base)
  return raiz
}

/** Põe o pé mais baixo da figura sobre a base, seja qual for a pose. */
export function pousar(corpo: THREE.Object3D, base: THREE.Object3D) {
  corpo.updateMatrixWorld(true)
  const caixaCorpo = new THREE.Box3().setFromObject(corpo)
  const topo = new THREE.Box3().setFromObject(base).max.y
  corpo.position.y += topo - caixaCorpo.min.y - 0.005
}

function montarCorpo(of: Oficina, f: Figura) {
  const m = medidas(f)
  const c = f.cores
  const pose = POSES[f.pose]
  const droide = f.especie === 'droide'
  const peludo = f.especie === 'wookiee' || f.especie === 'ewok' || f.especie === 'bothan'
  const pele = c.pele
  const calca = droide ? pele : f.especie === 'wookiee' ? c.cabelo : f.tronco === 'macacao' ? c.roupa : c.roupa2
  const bota = droide ? pele : f.especie === 'wookiee' ? c.cabelo : c.couro
  const manga = droide ? pele : f.especie === 'wookiee' ? c.cabelo : f.tronco === 'colete' ? pele : f.tronco === 'jaqueta' ? c.roupa2 : f.tronco === 'armadura' ? c.roupa2 : c.roupa
  const luva = f.tronco === 'armadura' || f.tronco === 'macacao' ? COURO_OU(f, c.couro) : pele
  const metal = droide ? { metal: true } : undefined

  const corpo = new THREE.Group()
  corpo.name = 'corpo'
  corpo.scale.setScalar(f.corpo.altura)
  const pelvisY = m.coxa + m.canela + m.pe
  const pelvis = em(new THREE.Group(), 0, pelvisY, 0)
  corpo.add(pelvis)

  // pernas
  for (const lado of [-1, 1] as const) {
    const pp = lado < 0 ? pose.pd : pose.pe
    const quadril = em(new THREE.Group(), lado * m.quadril, 0, 0)
    quadril.rotation.set(-pp.frente, 0, lado * pp.abre)
    quadril.add(em(of.malha(cilindro(m.rCoxa, m.rCoxa * 0.82, m.coxa), calca, metal), 0, -m.coxa / 2, 0))
    quadril.add(of.malha(esfera(m.rCoxa), calca, metal))
    const joelho = em(new THREE.Group(), 0, -m.coxa, 0)
    joelho.rotation.x = pp.joelho
    joelho.add(of.malha(esfera(m.rCanela * 1.08), calca, metal))
    joelho.add(em(of.malha(cilindro(m.rCanela * 1.05, m.rCanela * 0.85, m.canela * 0.5), calca, metal), 0, -m.canela * 0.25, 0))
    // bota no meio de baixo da canela
    joelho.add(em(of.malha(cilindro(m.rCanela * 1.12, m.rCanela * 1.02, m.canela * 0.55), bota, metal), 0, -m.canela * 0.72, 0))
    const pe = em(of.malha(caixa(m.rCanela * 2.1, m.pe, m.rCanela * 4.2), bota, metal), 0, -m.canela - m.pe / 2, m.rCanela * 1.1)
    joelho.add(pe)
    quadril.add(joelho)
    pelvis.add(quadril)
  }

  // tronco
  const tronco = new THREE.Group()
  tronco.rotation.set(pose.inclina, pose.giro, 0)
  pelvis.add(tronco)
  tronco.add(em(escala(of.malha(esfera(0.5), calca, metal), m.pelvisL, m.pelvisA * 1.6, m.pelvisP), 0, 0, 0))
  const roupaTronco = droide ? pele : f.especie === 'wookiee' ? c.cabelo : c.roupa
  tronco.add(em(escala(of.malha(cilindro(0.5, 0.5, 1), roupaTronco, metal), m.pelvisL * 0.92, m.abdomenA, m.pelvisP * 0.95), 0, m.abdomenA / 2 + 0.02, 0))
  const peitoY = m.abdomenA + m.peitoA / 2
  const peito = em(escala(of.malha(esfera(0.5), roupaTronco, metal), m.peitoL, m.peitoA * 1.25, m.peitoP), 0, peitoY, 0)
  tronco.add(peito)
  vestir(of, f, tronco, m, peitoY)

  // pescoço e cabeça
  const topo = m.abdomenA + m.peitoA
  tronco.add(em(of.malha(cilindro(0.045, 0.05, m.pescoco + 0.04), droide ? c.metal : pele, metal), 0, topo + m.pescoco / 2, 0))
  const cabeca = em(new THREE.Group(), 0, topo + m.pescoco + m.rCabeca * 0.85, 0.01)
  cabeca.name = 'cabeca'
  cabeca.userData.raio = m.rCabeca
  cabeca.rotation.set(pose.cabeca[0], pose.cabeca[1], 0)
  montarCabeca(of, f, cabeca, m.rCabeca)
  tronco.add(cabeca)
  if (peludo) {
    // pelagem: tufos no peito e nos ombros
    for (const [x, y, z] of [[-0.12, 0.05, 0.1], [0.12, 0.05, 0.1], [0, -0.06, 0.11], [-0.18, 0.12, 0], [0.18, 0.12, 0]] as const) {
      tronco.add(em(of.malha(esfera(0.05 * f.corpo.massa), c.cabelo), x * f.corpo.ombros, peitoY + y, z * f.corpo.massa))
    }
  }

  // braços
  const ombroY = topo - 0.05
  for (const lado of [-1, 1] as const) {
    const pb = lado < 0 ? pose.d : pose.e
    const ombro = em(new THREE.Group(), lado * (m.peitoL / 2 + 0.015), ombroY, 0)
    ombro.rotation.set(-pb.frente, 0, lado * pb.abre)
    ombro.add(of.malha(esfera(m.rBraco * 1.25), manga, metal))
    ombro.add(em(of.malha(cilindro(m.rBraco, m.rBraco * 0.9, m.braco), manga, metal), 0, -m.braco / 2, 0))
    if (f.tronco === 'armadura') ombro.add(em(escala(of.malha(esfera(m.rBraco * 1.6), c.metal, { metal: true }), 1.05, 0.7, 1.05), 0, 0.01, 0))
    const cotovelo = em(new THREE.Group(), 0, -m.braco, 0)
    cotovelo.rotation.x = -pb.cotovelo
    cotovelo.add(of.malha(esfera(m.rBraco * 0.92), manga, metal))
    const antebraco = f.tronco === 'colete' && !droide && f.especie !== 'wookiee' ? pele : manga
    cotovelo.add(em(of.malha(cilindro(m.rAntebraco * 1.05, m.rAntebraco * 0.85, m.antebraco), antebraco, metal), 0, -m.antebraco / 2, 0))
    if (f.capa === 'manto' || f.capa === 'capuz') {
      // manga larga do manto
      cotovelo.add(em(of.malha(cilindro(m.rAntebraco * 1.3, m.rAntebraco * 2.1, m.antebraco * 0.55), c.roupa2), 0, -m.antebraco * 0.62, 0))
    }
    const mao = em(new THREE.Group(), 0, -m.antebraco - m.mao * 0.7, 0)
    mao.add(escala(of.malha(esfera(m.mao), luva, metal), 0.9, 1.15, 1))
    const item = montarItem(of, f, lado < 0 ? f.maoDireita : f.maoEsquerda)
    if (item) {
      // armas de lâmina saem do punho (perpendicular); as de fogo seguem o antebraço
      if (item.userData.lamina) item.rotation.x = Math.PI / 2 + pb.arma
      mao.add(item)
    }
    cotovelo.add(mao)
    ombro.add(cotovelo)
    tronco.add(ombro)
  }

  // capa e manto (atrás das costas)
  if (f.capa !== 'nenhuma') {
    const longa = f.capa !== 'capa'
    const alto = longa ? topo + m.coxa + m.canela * 0.75 : topo + m.coxa * 0.4
    const capa = capaCurva(of, f.cores.roupa2, m.peitoL * (longa ? 1.25 : 1.15), alto, longa ? 0.55 : 0.25)
    capa.position.set(0, topo - 0.02, -m.peitoP * 0.5 - 0.015)
    capa.rotation.x = 0.06 - pose.inclina * 0.6
    tronco.add(capa)
    if (f.capa === 'capuz') {
      // o capuz fica atrás e em cima: o rosto aparece na frente
      const capuz = of.malha(esfera(m.rCabeca * 1.3), f.cores.roupa2)
      capuz.scale.set(1.04, 1.08, 0.92)
      capuz.position.set(0, m.rCabeca * 0.1, -m.rCabeca * 0.6)
      cabeca.add(capuz)
    }
  }
  return corpo
}

/** Capa: uma chapa grossa curvada em volta das costas, abrindo para baixo. */
function capaCurva(of: Oficina, cor: string, largura: number, alto: number, abre: number) {
  const espessura = 0.028
  const geo = new THREE.BoxGeometry(largura, alto, espessura, 16, 8, 1)
  const p = geo.attributes.position
  const R = largura * 0.55
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i)
    const desce = 0.5 - y / alto // 0 no topo, 1 embaixo
    const larg = 1 + abre * desce
    const a = (x * larg) / R
    const r = R + z + desce * 0.06
    p.setXYZ(i, Math.sin(a) * r, y - alto / 2, R - Math.cos(a) * r)
  }
  geo.computeVertexNormals()
  // as bordas vêm para a frente: o lado côncavo abraça as costas
  return of.malha(geo, cor)
}

function vestir(of: Oficina, f: Figura, tronco: THREE.Group, m: ReturnType<typeof medidas>, peitoY: number) {
  const c = f.cores
  if (f.especie === 'droide') {
    // placas e o painel do peito
    tronco.add(em(of.malha(caixa(m.peitoL * 0.55, m.peitoA * 0.5, 0.03), c.metal, { metal: true }), 0, peitoY, m.peitoP / 2))
    return
  }
  // cinto
  const cinto = of.malha(new THREE.TorusGeometry(0.5, 0.035, 8, 28), COURO_OU(f, c.couro))
  cinto.rotation.x = Math.PI / 2
  cinto.scale.set(m.pelvisL * 0.98, m.pelvisP * 1.02, 1.3)
  cinto.position.y = 0.05
  tronco.add(cinto)
  tronco.add(em(of.malha(caixa(0.07, 0.05, 0.02), c.metal, { metal: true }), 0, 0.05, m.pelvisP * 0.52))
  if (f.especie === 'wookiee') {
    // bandoleira cruzando o peito
    const b = of.malha(caixa(0.06, m.peitoA * 1.6, m.peitoP * 1.08), c.couro)
    b.position.set(0, peitoY - 0.02, 0)
    b.rotation.z = 0.7
    tronco.add(b)
    return
  }
  if (f.tronco === 'tunica') {
    // aba da túnica até o meio da coxa, cruzada no peito
    tronco.add(em(of.malha(cilindro(m.pelvisL * 0.52, m.pelvisL * 0.68, 0.22, 24), c.roupa), 0, -0.1, 0))
    const cruza = of.malha(caixa(0.05, m.peitoA * 1.1, 0.02), c.roupa2)
    cruza.position.set(0.02, peitoY, m.peitoP * 0.49)
    cruza.rotation.z = -0.35
    tronco.add(cruza)
  } else if (f.tronco === 'jaqueta') {
    tronco.add(em(escala(of.malha(esfera(0.5), c.roupa2), m.peitoL * 1.06, m.peitoA * 1.3, m.peitoP * 1.08), 0, peitoY, 0))
    tronco.add(em(of.malha(cilindro(0.07, 0.085, 0.07), c.roupa2), 0, m.abdomenA + m.peitoA + 0.01, -0.01))
    tronco.add(em(of.malha(caixa(0.012, m.peitoA * 0.9, 0.012), c.metal, { metal: true }), 0, peitoY, m.peitoP * 0.54))
  } else if (f.tronco === 'colete') {
    for (const lado of [-1, 1]) {
      tronco.add(em(escala(of.malha(esfera(0.5), c.roupa2), m.peitoL * 0.55, m.peitoA * 1.3, m.peitoP * 1.08), lado * m.peitoL * 0.24, peitoY, 0))
    }
  } else if (f.tronco === 'armadura') {
    tronco.add(em(escala(of.malha(esfera(0.5), c.metal, { metal: true }), m.peitoL * 1.04, m.peitoA * 1.15, m.peitoP * 1.1), 0, peitoY + 0.01, 0))
    tronco.add(em(escala(of.malha(cilindro(0.5, 0.5, 1), c.metal, { metal: true }), m.pelvisL * 0.98, m.abdomenA * 0.5, m.pelvisP * 1.02), 0, m.abdomenA * 0.62, 0))
  } else {
    // macacão: arnês e o colete salva-vidas do piloto
    for (const lado of [-1, 1]) {
      const alca = of.malha(caixa(0.035, m.peitoA * 1.2, m.peitoP * 1.06), c.roupa2)
      alca.position.set(lado * m.peitoL * 0.2, peitoY, 0)
      tronco.add(alca)
    }
    tronco.add(em(of.malha(caixa(m.peitoL * 0.5, 0.06, 0.03), c.metal, { metal: true }), 0, peitoY - 0.04, m.peitoP * 0.52))
  }
}

/* ------------------------------------------------------------------ cabeças */

function olhos(of: Oficina, cab: THREE.Group, r: number, cor: string, o: { x?: number; y?: number; z?: number; tam?: number; saltados?: boolean } = {}) {
  const x = (o.x ?? 0.36) * r, y = (o.y ?? 0.1) * r, z = (o.z ?? 0.88) * r, t = (o.tam ?? 0.13) * r
  for (const lado of [-1, 1]) {
    if (!o.saltados) cab.add(em(of.malha(esfera(t * 1.25), '#efe6d2'), lado * x, y, z - t * 0.45))
    cab.add(em(of.malha(esfera(t), cor, cor === '#c4141c' || cor === '#ffd24a' ? { brilho: true } : undefined), lado * x, y, z))
  }
}

function montarCabeca(of: Oficina, f: Figura, cab: THREE.Group, r: number) {
  const c = f.cores
  const pele = c.pele
  const cranio = of.malha(esfera(r), pele, f.especie === 'droide' ? { metal: true } : undefined)
  cab.add(cranio)
  const orelhas = (forma: 'humana' | 'pontuda' | 'redonda') => {
    for (const lado of [-1, 1]) {
      if (forma === 'humana') cab.add(em(escala(of.malha(esfera(r * 0.22), pele), 0.5, 1, 0.8), lado * r * 0.98, 0, 0))
      else if (forma === 'redonda') cab.add(em(escala(of.malha(esfera(r * 0.34), pele), 0.45, 1, 1), lado * r * 0.95, r * 0.25, -r * 0.05))
      else {
        const o = of.malha(new THREE.ConeGeometry(r * 0.2, r * 0.75, 10), pele)
        o.position.set(lado * r * 0.95, r * 0.45, -r * 0.1)
        o.rotation.z = -lado * 0.7
        cab.add(o)
      }
    }
  }
  const nariz = () => cab.add(em(escala(of.malha(esfera(r * 0.14), pele), 0.8, 1, 1), 0, -r * 0.08, r * 0.96))
  const boca = (cor = '#4a2a20') => cab.add(em(of.malha(caixa(r * 0.36, r * 0.05, r * 0.06), cor), 0, -r * 0.42, r * 0.88))

  switch (f.especie) {
    case 'humano':
    case 'zabrak':
    case 'cereano':
      olhos(of, cab, r, c.olhos); nariz(); boca(); orelhas('humana')
      if (f.especie === 'zabrak') {
        // coroa de chifres pequenos
        for (let i = 0; i < 7; i++) {
          const a = (i / 6 - 0.5) * 2.2
          const h = of.malha(new THREE.ConeGeometry(r * 0.08, r * 0.3, 8), '#e8d8b0')
          const dir = V(Math.sin(a) * 0.55, 0.83, Math.cos(a) * 0.35).normalize()
          h.position.copy(dir.clone().multiplyScalar(r * 0.98))
          h.quaternion.setFromUnitVectors(V(0, 1, 0), dir)
          cab.add(h)
        }
      }
      if (f.especie === 'cereano') {
        // crânio alto e cônico
        const alto = of.malha(esfera(r * 0.92), pele)
        alto.scale.set(0.95, 1.55, 0.95)
        alto.position.y = r * 0.75
        cab.add(alto)
      }
      break
    case 'twilek':
    case 'togruta': {
      olhos(of, cab, r, c.olhos); nariz(); boca()
      const listra = f.especie === 'togruta' ? '#efe6d2' : undefined
      const atras = (lado: number) => [V(lado * r * 0.45, r * 0.25, -r * 0.6), V(lado * r * 0.55, -r * 0.6, -r * 0.95), V(lado * r * 0.5, -r * 1.8, -r * 1.05), V(lado * r * 0.45, -r * 2.9, -r * 0.85), V(lado * r * 0.4, -r * 3.6, -r * 0.6)]
      if (f.especie === 'twilek') for (const lado of [-1, 1]) cab.add(tubo(of, atras(lado), r * 0.36, r * 0.12, pele))
      else {
        // montrais (para cima) e três lekku listrados
        for (const lado of [-1, 1]) {
          cab.add(tubo(of, [V(lado * r * 0.5, r * 0.65, 0), V(lado * r * 0.8, r * 1.3, -r * 0.1), V(lado * r * 0.85, r * 1.85, -r * 0.35)], r * 0.3, r * 0.08, pele, listra))
          cab.add(tubo(of, [V(lado * r * 0.75, r * 0.1, r * 0.1), V(lado * r * 0.95, -r * 0.7, r * 0.3), V(lado * r * 0.8, -r * 1.7, r * 0.45), V(lado * r * 0.65, -r * 2.4, r * 0.5)], r * 0.3, r * 0.1, pele, listra))
        }
        cab.add(tubo(of, [V(0, r * 0.2, -r * 0.7), V(0, -r * 0.7, -r * 1.05), V(0, -r * 1.8, -r * 1.05), V(0, -r * 2.6, -r * 0.85)], r * 0.32, r * 0.1, pele, listra))
      }
      break
    }
    case 'wookiee':
    case 'bothan':
    case 'ewok': {
      // rosto peludo: a cabeça inteira na cor do pelo, focinho e olhos pequenos
      cranio.material = of.mat(c.cabelo)
      if (f.especie === 'wookiee') cranio.scale.set(0.95, 1.15, 1)
      olhos(of, cab, r, c.olhos, { tam: 0.1, y: 0.18 })
      cab.add(em(escala(of.malha(esfera(r * 0.42), c.cabelo), 1.1, 0.8, 1), 0, -r * 0.32, r * 0.65))
      cab.add(em(of.malha(esfera(r * 0.1), '#141418'), 0, -r * 0.18, r * 1.02))
      if (f.especie === 'bothan') { orelhas('pontuda'); cab.add(em(escala(of.malha(esfera(r * 0.25), c.cabelo), 1, 1.4, 0.8), 0, -r * 0.85, r * 0.55)) }
      if (f.especie === 'ewok') {
        // capuz de couro com orelhas redondas para fora
        const capuz = of.malha(esfera(r * 1.08), c.couro)
        capuz.scale.set(1, 1.08, 1)
        capuz.position.set(0, r * 0.12, -r * 0.22)
        cab.add(capuz)
        cab.add(em(of.malha(new THREE.ConeGeometry(r * 0.35, r * 0.6, 12), c.couro), 0, r * 1.1, -r * 0.25))
        orelhas('redonda')
      }
      break
    }
    case 'rodiano': {
      olhos(of, cab, r, '#141418', { x: 0.55, y: 0.15, z: 0.62, tam: 0.32, saltados: true })
      const focinho = of.malha(new THREE.ConeGeometry(r * 0.28, r * 0.75, 14), pele)
      focinho.rotation.x = Math.PI / 2
      focinho.position.set(0, -r * 0.35, r * 1.1)
      cab.add(focinho)
      for (const lado of [-1, 1]) cab.add(tubo(of, [V(lado * r * 0.3, r * 0.85, -r * 0.1), V(lado * r * 0.45, r * 1.25, -r * 0.3)], r * 0.07, r * 0.04, pele))
      // cristas no topo da cabeça
      for (let i = 0; i < 3; i++) cab.add(em(escala(of.malha(esfera(r * 0.22), pele), 0.4, 0.5, 1.4), 0, r * (0.85 - i * 0.05), -r * (0.1 + i * 0.35)))
      break
    }
    case 'moncal': {
      cranio.scale.set(0.95, 1.35, 1.05)
      cranio.position.y = r * 0.25
      olhos(of, cab, r, c.olhos, { x: 0.8, y: 0.1, z: 0.45, tam: 0.3, saltados: true })
      boca('#6a2a20')
      break
    }
    case 'duros': {
      cranio.scale.set(1.12, 1.05, 1)
      olhos(of, cab, r, c.olhos, { x: 0.42, y: 0.08, z: 0.82, tam: 0.24, saltados: true })
      cab.add(em(of.malha(caixa(r * 0.35, r * 0.04, r * 0.06), '#1f3a4a'), 0, -r * 0.45, r * 0.88))
      // chapéu de aba larga dos pistoleiros Duros
      cab.add(em(of.malha(cilindro(r * 1.6, r * 1.6, r * 0.06, 28), c.couro), 0, r * 0.62, 0))
      cab.add(em(of.malha(cilindro(r * 0.85, r * 0.95, r * 0.55, 24), c.couro), 0, r * 0.88, 0))
      break
    }
    case 'gamorreano': {
      cranio.scale.set(1.1, 0.95, 1)
      olhos(of, cab, r, c.olhos, { tam: 0.09, y: 0.22, x: 0.32 })
      const focinho = of.malha(cilindro(r * 0.32, r * 0.36, r * 0.4), pele)
      focinho.rotation.x = Math.PI / 2
      focinho.position.set(0, -r * 0.18, r * 1.05)
      cab.add(focinho)
      for (const lado of [-1, 1]) {
        cab.add(em(of.malha(esfera(r * 0.08), '#2a1d12'), lado * r * 0.13, -r * 0.18, r * 1.25))
        const presa = of.malha(new THREE.ConeGeometry(r * 0.07, r * 0.32, 8), '#efe6d2')
        presa.position.set(lado * r * 0.32, -r * 0.42, r * 0.85)
        cab.add(presa)
        const chifre = of.malha(new THREE.ConeGeometry(r * 0.1, r * 0.4, 8), '#e8d8b0')
        chifre.position.set(lado * r * 0.55, r * 0.8, 0)
        chifre.rotation.z = -lado * 0.5
        cab.add(chifre)
      }
      break
    }
    case 'gungan': {
      cranio.scale.set(0.9, 0.95, 1.05)
      // olhos em hastes e bico de pato
      for (const lado of [-1, 1]) {
        cab.add(tubo(of, [V(lado * r * 0.25, r * 0.7, r * 0.1), V(lado * r * 0.35, r * 1.2, r * 0.25)], r * 0.12, r * 0.1, pele))
        cab.add(em(of.malha(esfera(r * 0.18), c.olhos, { brilho: true }), lado * r * 0.35, r * 1.32, r * 0.3))
        const orelha = tubo(of, [V(lado * r * 0.7, r * 0.3, -r * 0.3), V(lado * r * 0.9, -r * 0.8, -r * 0.5), V(lado * r * 0.85, -r * 2.2, -r * 0.4), V(lado * r * 0.75, -r * 3.1, -r * 0.2)], r * 0.32, r * 0.18, pele)
        orelha.scale.z = 0.45
        cab.add(orelha)
      }
      cab.add(em(escala(of.malha(esfera(r * 0.5), pele), 0.8, 0.35, 1.5), 0, -r * 0.45, r * 0.95))
      break
    }
    case 'ithoriano': {
      // cabeça em martelo, curvada para a frente, olhos nas pontas
      cranio.scale.set(0.8, 0.8, 0.8)
      const martelo = of.malha(esfera(r), pele)
      martelo.scale.set(2.4, 0.9, 0.9)
      martelo.position.set(0, r * 0.65, r * 0.35)
      cab.add(martelo)
      for (const lado of [-1, 1]) cab.add(em(of.malha(esfera(r * 0.24), '#141418'), lado * r * 2.15, r * 0.7, r * 0.75))
      cab.add(em(escala(of.malha(esfera(r * 0.5), pele), 1.2, 0.6, 0.9), 0, -r * 0.3, r * 0.6))
      break
    }
    case 'keldor': {
      // óculos e a máscara de respiração
      for (const lado of [-1, 1]) {
        const lente = of.malha(cilindro(r * 0.22, r * 0.22, r * 0.12), '#141418', { metal: true })
        lente.rotation.x = Math.PI / 2
        lente.position.set(lado * r * 0.38, r * 0.12, r * 0.88)
        cab.add(lente)
      }
      const mascara = of.malha(cilindro(r * 0.4, r * 0.48, r * 0.4), c.metal, { metal: true })
      mascara.rotation.x = Math.PI / 2
      mascara.position.set(0, -r * 0.42, r * 0.85)
      cab.add(mascara)
      for (const lado of [-1, 1]) cab.add(tubo(of, [V(lado * r * 0.35, -r * 0.5, r * 0.95), V(lado * r * 0.65, -r * 0.65, r * 0.5), V(lado * r * 0.7, -r * 0.75, -r * 0.1)], r * 0.06, r * 0.05, '#141418'))
      orelhas('humana')
      break
    }
    case 'quarren': {
      cranio.scale.set(0.9, 1.3, 1)
      cranio.position.y = r * 0.2
      olhos(of, cab, r, c.olhos, { x: 0.45, y: 0.25, z: 0.72, tam: 0.16, saltados: true })
      // tentáculos do rosto
      for (const [x, z] of [[-0.35, 0.75], [-0.12, 0.88], [0.12, 0.88], [0.35, 0.75]] as const) {
        cab.add(tubo(of, [V(x * r, -r * 0.3, z * r), V(x * r * 1.1, -r * 0.9, z * r * 1.05), V(x * r * 1.2, -r * 1.5, z * r * 0.95)], r * 0.12, r * 0.05, pele))
      }
      break
    }
    case 'sullustano': {
      olhos(of, cab, r, '#141418', { x: 0.4, y: 0.15, z: 0.8, tam: 0.24, saltados: true })
      for (const lado of [-1, 1]) cab.add(em(of.malha(esfera(r * 0.38), pele), lado * r * 0.42, -r * 0.48, r * 0.55))
      orelhas('redonda')
      boca()
      break
    }
    case 'trandoshano': {
      olhos(of, cab, r, c.olhos, { x: 0.45, y: 0.22, z: 0.75, tam: 0.12 })
      cab.add(em(escala(of.malha(esfera(r * 0.55), pele), 0.85, 0.65, 1.2), 0, -r * 0.3, r * 0.7))
      for (let i = 0; i < 4; i++) cab.add(em(of.malha(new THREE.ConeGeometry(r * 0.07, r * 0.25, 6), pele), 0, r * (0.95 - i * 0.08), -r * (0.1 + i * 0.3)))
      break
    }
    case 'droide': {
      // cabeça de dróide de protocolo: olhos acesos e a boca em fenda
      cranio.scale.set(0.95, 1.05, 1)
      for (const lado of [-1, 1]) cab.add(em(of.malha(esfera(r * 0.18), c.olhos === '#141418' ? '#ffd24a' : c.olhos, { brilho: true }), lado * r * 0.36, r * 0.1, r * 0.82))
      cab.add(em(of.malha(caixa(r * 0.4, r * 0.06, r * 0.08), '#141418'), 0, -r * 0.42, r * 0.88))
      for (const lado of [-1, 1]) cab.add(em(of.malha(cilindro(r * 0.2, r * 0.2, r * 0.12), c.metal, { metal: true }), lado * r * 0.98, 0, 0).rotateZ(Math.PI / 2))
      break
    }
  }
  montarCabelo(of, f, cab, r)
}

function montarCabelo(of: Oficina, f: Figura, cab: THREE.Group, r: number) {
  const cor = f.cores.cabelo
  if (f.cabelo === 'careca' || f.capa === 'capuz') return
  if (['wookiee', 'ewok', 'droide', 'ithoriano', 'moncal', 'gungan', 'quarren', 'rodiano', 'keldor', 'duros', 'trandoshano', 'gamorreano', 'sullustano'].includes(f.especie)) return
  const calota = of.malha(new THREE.SphereGeometry(r * 1.07, SEG, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), cor)
  calota.rotation.x = -0.35
  calota.position.y = r * 0.04
  if (f.cabelo !== 'moicano') cab.add(calota)
  if (f.cabelo === 'longo') cab.add(em(escala(of.malha(esfera(r * 0.9), cor), 1.05, 1.5, 0.55), 0, -r * 0.7, -r * 0.62))
  if (f.cabelo === 'coque') cab.add(em(of.malha(esfera(r * 0.38), cor), 0, r * 0.55, -r * 0.85))
  if (f.cabelo === 'moicano') for (let i = 0; i < 6; i++) cab.add(em(escala(of.malha(esfera(r * 0.2), cor), 0.45, 1.3, 1), 0, Math.cos(i * 0.45 - 0.5) * r, Math.sin(i * 0.45 - 0.5) * r * 1.02 - r * 0.0))
  if (f.cabelo === 'tranca') cab.add(tubo(of, [V(0, r * 0.1, -r * 0.95), V(0, -r * 0.8, -r * 1.05), V(0, -r * 1.8, -r * 0.95), V(0, -r * 2.6, -r * 0.8)], r * 0.18, r * 0.1, cor))
}

/* ------------------------------------------------------------------ itens */

function montarItem(of: Oficina, f: Figura, qual: Figura['maoDireita']) {
  const c = f.cores
  const g = new THREE.Group()
  const metal = { metal: true }
  switch (qual) {
    case 'vazia': return null
    case 'sabre':
    case 'sabre-duplo': {
      const duplo = qual === 'sabre-duplo'
      const cabo = duplo ? 0.26 : 0.15
      g.add(em(of.malha(cilindro(0.019, 0.019, cabo), c.metal, metal), 0, duplo ? 0 : 0.03, 0))
      g.add(em(of.malha(cilindro(0.023, 0.023, 0.02), '#2a2a30', metal), 0, duplo ? cabo / 2 : cabo / 2 + 0.03, 0))
      const lamina = (sinal: number) => {
        const base = (duplo ? cabo / 2 : cabo / 2 + 0.03) * sinal
        g.add(em(of.malha(cilindro(0.012, 0.014, 0.78, 12), c.lamina, { brilho: true }), 0, base + sinal * 0.4, 0))
        g.add(em(of.malha(esfera(0.012), c.lamina, { brilho: true }), 0, base + sinal * 0.79, 0))
      }
      lamina(1)
      if (duplo) { g.add(em(of.malha(cilindro(0.023, 0.023, 0.02), '#2a2a30', metal), 0, -cabo / 2, 0)); lamina(-1) }
      g.userData.lamina = true
      return g
    }
    case 'vibrolamina':
      g.add(em(of.malha(cilindro(0.016, 0.016, 0.12), c.couro), 0, 0, 0))
      g.add(em(of.malha(caixa(0.07, 0.015, 0.03), c.metal, metal), 0, 0.065, 0))
      g.add(em(of.malha(caixa(0.045, 0.38, 0.01), '#d8f6ff', metal), 0, 0.26, 0))
      g.userData.lamina = true
      return g
    case 'cajado':
      g.add(em(of.malha(cilindro(0.017, 0.017, 1.6), c.roupa2), 0, 0.1, 0))
      g.add(em(of.malha(esfera(0.03), c.metal, metal), 0, 0.9, 0))
      g.add(em(of.malha(esfera(0.03), c.metal, metal), 0, -0.7, 0))
      g.userData.lamina = true
      return g
    case 'blaster':
      // o cano segue o antebraço (para -y) e o cabo fica na palma
      g.add(em(of.malha(caixa(0.04, 0.2, 0.06), '#2a2a30', metal), 0, -0.06, 0.03))
      g.add(em(of.malha(cilindro(0.012, 0.012, 0.08), c.metal, metal), 0, -0.19, 0.04))
      g.add(em(of.malha(caixa(0.035, 0.05, 0.07), c.couro), 0, 0.02, -0.01))
      return g
    case 'rifle':
      g.add(em(of.malha(caixa(0.045, 0.5, 0.07), '#2a2a30', metal), 0, -0.14, 0.04))
      g.add(em(of.malha(cilindro(0.013, 0.013, 0.16), c.metal, metal), 0, -0.47, 0.05))
      g.add(em(of.malha(caixa(0.04, 0.2, 0.06), c.couro), 0, 0.17, 0.02))
      g.add(em(of.malha(cilindro(0.018, 0.018, 0.12), c.metal, metal), 0, -0.12, 0.1))
      return g
  }
}

/* ------------------------------------------------------------------ base */

let fonte: Font | null = null
let pedido: Promise<Font> | null = null
/** Fonte do nome gravado na base (carrega uma vez; a figura é remontada quando chega). */
export function carregarFonte() {
  pedido ??= fetch(fonteUrl).then(r => r.json()).then(j => (fonte = new FontLoader().parse(j)))
  return pedido
}
/** A fonte só tem letras sem acento. */
const semAcento = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7e]/g, '')

/** Raio da base: cresce com as espécies grandes. */
export const raioBase = (f: Figura) => 0.62 * Math.max(1, f.corpo.altura * Math.sqrt(f.corpo.massa))

function montarBase(of: Oficina, f: Figura) {
  const g = new THREE.Group()
  g.name = 'base'
  const R = raioBase(f)
  const h = 0.11
  let geo: THREE.BufferGeometry
  if (f.base.forma === 'quadrada') geo = caixa(R * 1.8, h, R * 1.8)
  else geo = cilindro(R * 0.96, R, h, f.base.forma === 'hexagonal' ? 6 : 64)
  const b = em(of.malha(geo, f.cores.base), 0, h / 2, 0)
  if (f.base.forma === 'hexagonal') b.rotation.y = Math.PI / 6
  g.add(b)
  const texto = semAcento(f.base.texto.trim()).slice(0, 24)
  if (texto && fonte) {
    // nome em relevo na frente da base, de pé sobre ela
    const tam = Math.min(0.075, (R * 1.5) / Math.max(4, texto.length * 0.72))
    const tg = new TextGeometry(texto, { font: fonte, size: tam, depth: 0.018, curveSegments: 3 })
    tg.computeBoundingBox()
    const bb = tg.boundingBox!
    tg.translate(-(bb.max.x + bb.min.x) / 2, 0, 0)
    const t = of.malha(tg, f.cores.metal, { metal: true })
    t.rotation.x = -Math.PI / 2
    t.position.set(0, h - 0.002, R * (f.base.forma === 'quadrada' ? 0.86 : 0.78))
    g.add(t)
  }
  g.userData.topo = h
  g.userData.raio = R
  return g
}

/* ------------------------------------------------------------------ utilidades */

/** Libera geometrias e materiais de uma figura que saiu de cena. */
export function descartar(o: THREE.Object3D) {
  const mats = new Set<THREE.Material>()
  o.traverse(x => {
    const m = x as THREE.Mesh
    if (!m.isMesh) return
    m.geometry.dispose()
    ;(Array.isArray(m.material) ? m.material : [m.material]).forEach(mt => mats.add(mt))
  })
  mats.forEach(m => m.dispose())
}

/** Cópia em milímetros, pronta para exportar (só as malhas, com as posições finais). */
export function emMilimetros(o: THREE.Object3D, mm: number) {
  const g = new THREE.Group()
  const c = o.clone(true)
  g.add(c)
  g.scale.setScalar(mm)
  g.updateMatrixWorld(true)
  return g
}

/** Junta vértices repetidos de cada peça (o STL fica menor e os fatiadores leem melhor). */
export function soldar(o: THREE.Object3D) {
  o.traverse(x => {
    const m = x as THREE.Mesh
    if (m.isMesh && m.geometry.index === null) m.geometry = mergeVertices(m.geometry)
  })
  return o
}
