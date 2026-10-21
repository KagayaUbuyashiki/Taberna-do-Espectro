/*
 * Sons do site. Começam desligados (o botão Som liga).
 *
 * Cada som é sintetizado com WebAudio, sem arquivo. Se existir um arquivo com o nome do som em
 * public/assets/sfx/ (.mp3, .ogg ou .wav), ele toca no lugar do sintetizado: assim dá para trocar
 * qualquer som por uma gravação com licença sem mexer no código. Os nomes estão em `SONS`.
 */
let ctx: AudioContext | null = null
let on = false
let mestre: GainNode | null = null
const ac = () => {
  if (!ctx) {
    try { ctx = new AudioContext(); mestre = ctx.createGain(); mestre.gain.value = 0.9; mestre.connect(ctx.destination) } catch { ctx = null }
  }
  return ctx
}
const saida = (c: AudioContext) => mestre ?? c.destination

function env(g: GainNode, t: number, a: number, d: number, peak = 0.25) {
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(peak, t + a)
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d)
}
function noise(c: AudioContext, dur: number) {
  const b = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * dur)), c.sampleRate)
  const d = b.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  const s = c.createBufferSource()
  s.buffer = b
  return s
}
const osc = (c: AudioContext, type: OscillatorType, f: number) => { const o = c.createOscillator(); o.type = type; o.frequency.value = f; return o }
const filtro = (c: AudioContext, type: BiquadFilterType, f: number, q = 1) => { const b = c.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b }

/* ------------------------------------------------------------ arquivos opcionais */

/** Sons que podem ser trocados por arquivo em public/assets/sfx/<nome>.(mp3|ogg|wav). */
export const SONS = [
  'blaster', 'blaster-pesado', 'ion', 'lesma', 'bowcaster', 'flecha', 'sabre-ligar', 'sabre-golpe', 'sabre-choque',
  'vibro', 'soco', 'garra', 'arremesso', 'explosao', 'termal', 'missil', 'chamas', 'impacto', 'grito', 'morte',
  'droide-morte', 'rugido', 'forca',
] as const
export type Som = (typeof SONS)[number]

const buffers = new Map<Som, AudioBuffer | null>()
const pedidos = new Set<Som>()
function carregar(c: AudioContext, nome: Som) {
  if (buffers.has(nome) || pedidos.has(nome)) return
  pedidos.add(nome)
  void (async () => {
    for (const ext of ['mp3', 'ogg', 'wav']) {
      try {
        const r = await fetch(`./assets/sfx/${nome}.${ext}`)
        // o servidor de desenvolvimento devolve o index.html para arquivo que não existe
        if (!r.ok || !(r.headers.get('content-type') ?? '').startsWith('audio')) continue
        buffers.set(nome, await c.decodeAudioData(await r.arrayBuffer()))
        return
      } catch { /* tenta a próxima extensão */ }
    }
    buffers.set(nome, null)
  })()
}
function arquivo(c: AudioContext, nome: Som, t: number) {
  const b = buffers.get(nome)
  if (!b) { carregar(c, nome); return false }
  const s = c.createBufferSource()
  s.buffer = b
  s.connect(saida(c))
  s.start(t)
  return true
}
/** Toca o arquivo, se houver; senão o sintetizado. `atraso` em segundos. */
function tocar(nome: Som, sint: (c: AudioContext, t: number) => void, atraso = 0) {
  const c = on && ac(); if (!c) return
  const t = c.currentTime + Math.max(0, atraso)
  if (!arquivo(c, nome, t)) sint(c, t)
}

/* ------------------------------------------------------------ sintetizados */

/** Disparo de blaster: varredura rápida do agudo para o grave com eco metálico (o "pew" de mola). */
function sBlaster(c: AudioContext, t: number, grave = 1, cor = 1) {
  const g = c.createGain(), eco = c.createDelay(0.2), fb = c.createGain(), bp = filtro(c, 'bandpass', 1800 * cor, 2.5)
  eco.delayTime.value = 0.028; fb.gain.value = 0.38
  for (const [tipo, k] of [['square', 1], ['sawtooth', 1.51], ['sine', 0.5]] as const) {
    const o = osc(c, tipo, (3400 * cor * k) / grave)
    o.frequency.setValueAtTime((3400 * cor * k) / grave, t)
    o.frequency.exponentialRampToValueAtTime((170 * k) / grave, t + 0.2 * grave)
    o.connect(bp); o.start(t); o.stop(t + 0.32 * grave)
  }
  bp.frequency.setValueAtTime(2600 * cor, t); bp.frequency.exponentialRampToValueAtTime(300, t + 0.22 * grave)
  bp.connect(g); g.connect(saida(c)); g.connect(eco); eco.connect(fb).connect(eco); eco.connect(saida(c))
  env(g, t, 0.003, 0.28 * grave, 0.22)
  const n = noise(c, 0.03), ng = c.createGain(), hp = filtro(c, 'highpass', 3000)
  n.connect(hp).connect(ng).connect(saida(c)); env(ng, t, 0.001, 0.03, 0.18); n.start(t)
}

/** Zumbido do sabre: duas serras quase iguais e uma oitava, abafadas. */
function zumbido(c: AudioContext, t: number, dur: number, peak: number, pitch: (o: OscillatorNode, f: number) => void) {
  const g = c.createGain(), lp = filtro(c, 'lowpass', 1100)
  for (const f of [88, 90.5, 176]) { const o = osc(c, f > 100 ? 'triangle' : 'sawtooth', f); pitch(o, f); o.connect(lp); o.start(t); o.stop(t + dur + 0.05) }
  lp.connect(g).connect(saida(c))
  env(g, t, Math.min(0.12, dur / 3), dur, peak)
  return lp
}
function sSabreLigar(c: AudioContext, t: number) {
  zumbido(c, t, 1.2, 0.14, (o, f) => { o.frequency.setValueAtTime(f * 0.45, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.28) })
  const n = noise(c, 0.3), ng = c.createGain(), bp = filtro(c, 'bandpass', 900, 0.8)
  n.connect(bp).connect(ng).connect(saida(c)); env(ng, t, 0.01, 0.28, 0.12); n.start(t)
}
/** Golpe de sabre: o zumbido sobe e desce (efeito de passagem), com um sopro de ar. */
function sSabreGolpe(c: AudioContext, t: number) {
  const lp = zumbido(c, t, 0.55, 0.2, (o, f) => {
    o.frequency.setValueAtTime(f, t); o.frequency.linearRampToValueAtTime(f * 1.75, t + 0.16); o.frequency.linearRampToValueAtTime(f * 0.92, t + 0.5)
  })
  lp.frequency.setValueAtTime(700, t); lp.frequency.linearRampToValueAtTime(2600, t + 0.16); lp.frequency.linearRampToValueAtTime(800, t + 0.5)
  const n = noise(c, 0.45), ng = c.createGain(), bp = filtro(c, 'bandpass', 600, 1.4)
  bp.frequency.setValueAtTime(400, t); bp.frequency.exponentialRampToValueAtTime(2200, t + 0.18); bp.frequency.exponentialRampToValueAtTime(500, t + 0.42)
  n.connect(bp).connect(ng).connect(saida(c)); env(ng, t, 0.08, 0.32, 0.09); n.start(t)
}
/** Choque de lâminas: estalos elétricos em rajada sobre o zumbido. */
function sSabreChoque(c: AudioContext, t: number) {
  zumbido(c, t, 0.7, 0.16, (o, f) => { o.frequency.setValueAtTime(f * 1.2, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.4) })
  for (let i = 0; i < 6; i++) {
    const n = noise(c, 0.05), ng = c.createGain(), hp = filtro(c, 'highpass', 1800 + Math.random() * 2500)
    const ti = t + i * 0.045 + Math.random() * 0.02
    n.connect(hp).connect(ng).connect(saida(c)); env(ng, ti, 0.001, 0.05, i ? 0.16 : 0.32); n.start(ti)
  }
}
/** Explosão: ruído que escurece e um baque grave. */
function sExplosao(c: AudioContext, t: number, forte = 1) {
  const n = noise(c, 1.8 * forte), ng = c.createGain(), lp = filtro(c, 'lowpass', 3200)
  lp.frequency.setValueAtTime(4200, t); lp.frequency.exponentialRampToValueAtTime(140, t + 1.3 * forte)
  n.connect(lp).connect(ng).connect(saida(c)); env(ng, t, 0.004, 1.4 * forte, 0.55); n.start(t)
  const o = osc(c, 'sine', 70), og = c.createGain()
  o.frequency.setValueAtTime(95, t); o.frequency.exponentialRampToValueAtTime(28, t + 0.7)
  o.connect(og).connect(saida(c)); env(og, t, 0.004, 0.8, 0.5); o.start(t); o.stop(t + 0.9)
}
function sIon(c: AudioContext, t: number) {
  sBlaster(c, t, 0.8, 1.3)
  const o = osc(c, 'square', 60), g = c.createGain(), bp = filtro(c, 'bandpass', 2400, 6)
  const lfo = osc(c, 'square', 37), lg = c.createGain(); lg.gain.value = 1800; lfo.connect(lg).connect(bp.frequency)
  o.connect(bp).connect(g).connect(saida(c)); env(g, t, 0.01, 0.35, 0.12); o.start(t); o.stop(t + 0.4); lfo.start(t); lfo.stop(t + 0.4)
}
/** Arma de projétil (lança-lesma): estampido seco. */
function sLesma(c: AudioContext, t: number) {
  const n = noise(c, 0.25), g = c.createGain(), bp = filtro(c, 'bandpass', 1200, 0.7)
  n.connect(bp).connect(g).connect(saida(c)); env(g, t, 0.001, 0.22, 0.5); n.start(t)
  const o = osc(c, 'sine', 120), og = c.createGain(); o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(50, t + 0.12)
  o.connect(og).connect(saida(c)); env(og, t, 0.001, 0.14, 0.4); o.start(t); o.stop(t + 0.2)
}
function sFlecha(c: AudioContext, t: number) {
  const o = osc(c, 'triangle', 220), g = c.createGain(); o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(140, t + 0.15)
  o.connect(g).connect(saida(c)); env(g, t, 0.002, 0.18, 0.18); o.start(t); o.stop(t + 0.25)
  const n = noise(c, 0.3), ng = c.createGain(), bp = filtro(c, 'bandpass', 2500, 2)
  n.connect(bp).connect(ng).connect(saida(c)); env(ng, t + 0.03, 0.05, 0.2, 0.06); n.start(t)
}
function sSopro(c: AudioContext, t: number, vol = 0.12) {
  const n = noise(c, 0.35), g = c.createGain(), bp = filtro(c, 'bandpass', 500, 1.2)
  bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(1800, t + 0.15); bp.frequency.exponentialRampToValueAtTime(400, t + 0.3)
  n.connect(bp).connect(g).connect(saida(c)); env(g, t, 0.06, 0.25, vol); n.start(t)
}
/** Lâmina vibratória: zumbido agudo de motor no golpe. */
function sVibro(c: AudioContext, t: number) {
  const o = osc(c, 'sawtooth', 210), g = c.createGain(), lfo = osc(c, 'sine', 55), lg = c.createGain()
  lg.gain.value = 40; lfo.connect(lg).connect(o.frequency)
  o.frequency.setValueAtTime(190, t); o.frequency.linearRampToValueAtTime(320, t + 0.15); o.frequency.linearRampToValueAtTime(200, t + 0.4)
  o.connect(filtro(c, 'lowpass', 2400)).connect(g).connect(saida(c)); env(g, t, 0.03, 0.38, 0.12)
  o.start(t); o.stop(t + 0.45); lfo.start(t); lfo.stop(t + 0.45)
  sSopro(c, t, 0.08)
}
/** Soco ou coronhada: baque abafado. */
function sSoco(c: AudioContext, t: number) {
  sSopro(c, t, 0.08)
  const o = osc(c, 'sine', 140), g = c.createGain(); o.frequency.setValueAtTime(160, t + 0.12); o.frequency.exponentialRampToValueAtTime(55, t + 0.25)
  o.connect(g).connect(saida(c)); env(g, t + 0.12, 0.002, 0.16, 0.5); o.start(t); o.stop(t + 0.35)
  const n = noise(c, 0.06), ng = c.createGain(), lp = filtro(c, 'lowpass', 1500)
  n.connect(lp).connect(ng).connect(saida(c)); env(ng, t + 0.12, 0.001, 0.06, 0.3); n.start(t + 0.12)
}
/** Rugido de fera (garras, mordidas, morte de fera). */
function sRugido(c: AudioContext, t: number, dur = 0.9) {
  const g = c.createGain()
  const o = osc(c, 'sawtooth', 85), lfo = osc(c, 'sine', 11), lg = c.createGain()
  lg.gain.value = 9; lfo.connect(lg).connect(o.frequency)
  o.frequency.setValueAtTime(70, t); o.frequency.linearRampToValueAtTime(110, t + dur * 0.3); o.frequency.linearRampToValueAtTime(60, t + dur)
  const n = noise(c, dur), ng = c.createGain(); ng.gain.value = 0.5
  const f1 = filtro(c, 'bandpass', 600, 3), f2 = filtro(c, 'bandpass', 1100, 4)
  o.connect(f1); o.connect(f2); n.connect(ng).connect(f1)
  f1.connect(g); f2.connect(g); g.connect(saida(c)); env(g, t, 0.06, dur, 0.5)
  o.start(t); o.stop(t + dur + 0.1); lfo.start(t); lfo.stop(t + dur + 0.1); n.start(t)
}
function sChamas(c: AudioContext, t: number) {
  const n = noise(c, 1.2), g = c.createGain(), lp = filtro(c, 'lowpass', 900), lfo = osc(c, 'sine', 7), lg = c.createGain()
  lg.gain.value = 400; lfo.connect(lg).connect(lp.frequency)
  n.connect(lp).connect(g).connect(saida(c)); env(g, t, 0.08, 1.0, 0.45); n.start(t); lfo.start(t); lfo.stop(t + 1.2)
}
/** O tiro chega no alvo: chiado curto. */
function sImpacto(c: AudioContext, t: number) {
  const n = noise(c, 0.18), g = c.createGain(), bp = filtro(c, 'bandpass', 3200, 1.5)
  n.connect(bp).connect(g).connect(saida(c)); env(g, t, 0.002, 0.16, 0.22); n.start(t)
  const o = osc(c, 'sine', 180), og = c.createGain(); o.frequency.setValueAtTime(180, t); o.frequency.exponentialRampToValueAtTime(70, t + 0.1)
  o.connect(og).connect(saida(c)); env(og, t, 0.002, 0.12, 0.25); o.start(t); o.stop(t + 0.15)
}

/**
 * Voz sintetizada: pulso glotal filtrado por três formantes (a vogal), com contorno de altura.
 * `alturas` são pares [segundo, Hz]; `vogais` são pares [segundo, formantes].
 */
function voz(c: AudioContext, t: number, dur: number, alturas: [number, number][], vogais: [number, number[]][], peak: number, aspereza = 0.15) {
  const o = osc(c, 'sawtooth', alturas[0][1])
  o.frequency.setValueAtTime(alturas[0][1], t)
  alturas.slice(1).forEach(([s, f]) => o.frequency.linearRampToValueAtTime(f, t + s))
  const vib = osc(c, 'sine', 6.2), vg = c.createGain(); vg.gain.value = 9; vib.connect(vg).connect(o.frequency)
  const n = noise(c, dur + 0.1), ng = c.createGain(); ng.gain.value = aspereza
  n.connect(ng)
  const g = c.createGain()
  const larg = [70, 90, 140]
  for (let i = 0; i < 3; i++) {
    const f = filtro(c, 'bandpass', vogais[0][1][i], vogais[0][1][i] / larg[i])
    f.frequency.setValueAtTime(vogais[0][1][i], t)
    vogais.slice(1).forEach(([s, fs]) => f.frequency.linearRampToValueAtTime(fs[i], t + s))
    const fg = c.createGain(); fg.gain.value = [1, 0.7, 0.35][i]
    o.connect(f); ng.connect(f); f.connect(fg).connect(g)
  }
  g.connect(saida(c))
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + 0.04)
  g.gain.setValueAtTime(peak, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.start(t); o.stop(t + dur + 0.05); vib.start(t); vib.stop(t + dur + 0.05); n.start(t)
}
const AH = [760, 1150, 2600], UH = [620, 1200, 2500], EH = [600, 1700, 2600], OH = [500, 850, 2500]

/** O grito raro das mortes: um "ah" curto e um longo que sobe e despenca. */
function sGrito(c: AudioContext, t: number) {
  voz(c, t, 0.16, [[0, 430], [0.16, 470]], [[0, EH], [0.16, AH]], 0.55, 0.1)
  voz(c, t + 0.22, 0.95, [[0, 480], [0.18, 590], [0.55, 540], [0.95, 260]], [[0, AH], [0.6, AH], [0.95, UH]], 0.6, 0.12)
}
/** Morte comum: gemido curto que cai. */
function sMorte(c: AudioContext, t: number) {
  voz(c, t, 0.5, [[0, 210], [0.5, 110]], [[0, UH], [0.5, OH]], 0.4, 0.25)
}
/** Dróide desligando: tom que despenca aos solavancos, com faíscas. */
function sDroideMorte(c: AudioContext, t: number) {
  const o = osc(c, 'square', 900), g = c.createGain()
  for (let i = 0; i < 6; i++) o.frequency.setValueAtTime(900 / (1 + i * 0.9), t + i * 0.09)
  o.frequency.exponentialRampToValueAtTime(40, t + 0.9)
  o.connect(filtro(c, 'lowpass', 2000)).connect(g).connect(saida(c)); env(g, t, 0.005, 0.95, 0.12); o.start(t); o.stop(t + 1)
  for (let i = 0; i < 4; i++) {
    const n = noise(c, 0.04), ng = c.createGain(), hp = filtro(c, 'highpass', 3000), ti = t + 0.1 + i * 0.17
    n.connect(hp).connect(ng).connect(saida(c)); env(ng, ti, 0.001, 0.04, 0.2); n.start(ti)
  }
}
function sForca(c: AudioContext, t: number) {
  const o = osc(c, 'sine', 220), g = c.createGain()
  o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(660, t + 0.6)
  o.connect(g).connect(saida(c)); env(g, t, 0.2, 0.7, 0.14); o.start(t); o.stop(t + 1)
}

export const SFX = {
  get on() { return on },
  set(v: boolean) {
    on = v
    const c = v ? ac() : null
    if (c) { void c.resume(); SONS.forEach(n => carregar(c, n)) }
  },
  dice() {
    const c = on && ac(); if (!c) return
    const t = c.currentTime
    for (let i = 0; i < 3; i++) {
      const n = noise(c, 0.05), g = c.createGain(), f = filtro(c, 'bandpass', 2400 + i * 500)
      n.connect(f).connect(g).connect(saida(c))
      env(g, t + i * 0.06, 0.002, 0.05, 0.3)
      n.start(t + i * 0.06)
    }
  },
  crit() {
    const c = on && ac(); if (!c) return
    const t = c.currentTime
    ;[392, 523.3, 659.3, 784].forEach((f, i) => {
      const o = osc(c, 'triangle', f), g = c.createGain()
      o.connect(g).connect(saida(c))
      env(g, t + i * 0.09, 0.01, 0.35, 0.15)
      o.start(t + i * 0.09); o.stop(t + i * 0.09 + 0.5)
    })
  },
  /** Disparo de blaster. */
  blaster: (atraso = 0) => tocar('blaster', (c, t) => sBlaster(c, t), atraso),
  blasterPesado: (atraso = 0) => tocar('blaster-pesado', (c, t) => sBlaster(c, t, 1.5, 0.75), atraso),
  bowcaster: (atraso = 0) => tocar('bowcaster', (c, t) => sBlaster(c, t, 1.25, 0.9), atraso),
  ion: (atraso = 0) => tocar('ion', sIon, atraso),
  lesma: (atraso = 0) => tocar('lesma', sLesma, atraso),
  flecha: (atraso = 0) => tocar('flecha', sFlecha, atraso),
  /** Sabre ligando (toca também ao ligar o som). */
  saber: (atraso = 0) => tocar('sabre-ligar', sSabreLigar, atraso),
  sabreGolpe: (atraso = 0) => tocar('sabre-golpe', sSabreGolpe, atraso),
  sabreChoque: (atraso = 0) => tocar('sabre-choque', sSabreChoque, atraso),
  vibro: (atraso = 0) => tocar('vibro', sVibro, atraso),
  soco: (atraso = 0) => tocar('soco', sSoco, atraso),
  garra: (atraso = 0) => tocar('garra', (c, t) => { sSopro(c, t, 0.1); sRugido(c, t + 0.05, 0.5) }, atraso),
  arremesso: (atraso = 0) => tocar('arremesso', (c, t) => sSopro(c, t, 0.14), atraso),
  explosao: (atraso = 0) => tocar('explosao', (c, t) => sExplosao(c, t), atraso),
  termal: (atraso = 0) => tocar('termal', (c, t) => sExplosao(c, t, 1.6), atraso),
  missil: (atraso = 0) => tocar('missil', (c, t) => { sSopro(c, t, 0.2); sChamas(c, t) }, atraso),
  chamas: (atraso = 0) => tocar('chamas', sChamas, atraso),
  impacto: (atraso = 0) => tocar('impacto', sImpacto, atraso),
  /** O grito raro das mortes. */
  grito: (atraso = 0) => tocar('grito', sGrito, atraso),
  morte: (atraso = 0) => tocar('morte', sMorte, atraso),
  droideMorte: (atraso = 0) => tocar('droide-morte', sDroideMorte, atraso),
  rugido: (atraso = 0) => tocar('rugido', (c, t) => sRugido(c, t, 1.1), atraso),
  force: (atraso = 0) => tocar('forca', sForca, atraso),
}
