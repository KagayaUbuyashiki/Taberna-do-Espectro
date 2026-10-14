/* Sons sintetizados com WebAudio (sem arquivos). Começam desligados. */
let ctx: AudioContext | null = null
let on = false
const ac = () => {
  if (!ctx) {
    try { ctx = new AudioContext() } catch { ctx = null }
  }
  return ctx
}
function env(g: GainNode, t: number, a: number, d: number, peak = 0.25) {
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(peak, t + a)
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d)
}
function noise(c: AudioContext, dur: number) {
  const b = c.createBuffer(1, c.sampleRate * dur, c.sampleRate)
  const d = b.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  const s = c.createBufferSource()
  s.buffer = b
  return s
}

export const SFX = {
  get on() { return on },
  set(v: boolean) { on = v; if (v) void ac()?.resume() },
  dice() {
    const c = on && ac(); if (!c) return
    const t = c.currentTime
    for (let i = 0; i < 3; i++) {
      const n = noise(c, 0.05), g = c.createGain(), f = c.createBiquadFilter()
      f.type = 'bandpass'; f.frequency.value = 2400 + i * 500
      n.connect(f).connect(g).connect(c.destination)
      env(g, t + i * 0.06, 0.002, 0.05, 0.3)
      n.start(t + i * 0.06)
    }
  },
  blaster() {
    const c = on && ac(); if (!c) return
    const t = c.currentTime, o = c.createOscillator(), g = c.createGain()
    o.type = 'sawtooth'
    o.frequency.setValueAtTime(1900, t)
    o.frequency.exponentialRampToValueAtTime(140, t + 0.28)
    o.connect(g).connect(c.destination)
    env(g, t, 0.005, 0.3, 0.18)
    o.start(t); o.stop(t + 0.35)
  },
  saber() {
    const c = on && ac(); if (!c) return
    const t = c.currentTime
    for (const f of [90, 92.5]) {
      const o = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter()
      o.type = 'sawtooth'
      o.frequency.setValueAtTime(f * 0.6, t)
      o.frequency.linearRampToValueAtTime(f, t + 0.25)
      lp.type = 'lowpass'; lp.frequency.value = 900
      o.connect(lp).connect(g).connect(c.destination)
      env(g, t, 0.12, 1.1, 0.12)
      o.start(t); o.stop(t + 1.3)
    }
  },
  crit() {
    const c = on && ac(); if (!c) return
    const t = c.currentTime
    ;[392, 523.3, 659.3, 784].forEach((f, i) => {
      const o = c.createOscillator(), g = c.createGain()
      o.type = 'triangle'; o.frequency.value = f
      o.connect(g).connect(c.destination)
      env(g, t + i * 0.09, 0.01, 0.35, 0.15)
      o.start(t + i * 0.09); o.stop(t + i * 0.09 + 0.5)
    })
  },
  force() {
    const c = on && ac(); if (!c) return
    const t = c.currentTime, o = c.createOscillator(), g = c.createGain()
    o.type = 'sine'
    o.frequency.setValueAtTime(220, t)
    o.frequency.exponentialRampToValueAtTime(660, t + 0.6)
    o.connect(g).connect(c.destination)
    env(g, t, 0.2, 0.7, 0.14)
    o.start(t); o.stop(t + 1)
  },
}
