// Tiny synthesized sound design (no audio files): warm kalimba-like plucks on a pentatonic scale,
// so a run of correct answers literally becomes a rising melody.

import { getState } from './store'

let ctx: AudioContext | null = null
let master: GainNode
let wet: GainNode

// D major pentatonic, starting at D4
const SCALE = [0, 2, 4, 7, 9]
const BASE = 293.66

export function noteFreq(step: number): number {
  const oct = Math.floor(step / SCALE.length)
  const deg = SCALE[((step % SCALE.length) + SCALE.length) % SCALE.length]
  return BASE * Math.pow(2, oct + deg / 12)
}

function impulse(c: AudioContext, seconds: number, decay: number) {
  const len = Math.floor(c.sampleRate * seconds)
  const buf = c.createBuffer(2, len, c.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay)
  }
  return buf
}

/** Must be called from a user gesture at least once (iOS). */
export function unlockAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') void ctx.resume()
    return
  }
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = 0.55
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -18
    comp.ratio.value = 3
    master.connect(comp).connect(ctx.destination)
    const rev = ctx.createConvolver()
    rev.buffer = impulse(ctx, 2.2, 3)
    wet = ctx.createGain()
    wet.gain.value = 0.28
    wet.connect(rev).connect(master)
  } catch {
    ctx = null
  }
}

function ready() {
  if (!getState().sound) return null
  if (!ctx) return null
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function voice(freq: number, t: number, opts: { gain?: number; decay?: number; type?: OscillatorType; wet?: number; detune?: number } = {}) {
  const c = ctx!
  const g = c.createGain()
  const peak = opts.gain ?? 0.22
  const decay = opts.decay ?? 0.9
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(peak, t + 0.006)
  g.gain.exponentialRampToValueAtTime(0.0001, t + decay)
  const o1 = c.createOscillator()
  o1.type = opts.type ?? 'sine'
  o1.frequency.value = freq
  o1.detune.value = opts.detune ?? 0
  // a soft upper partial gives the kalimba / marimba "tine"
  const o2 = c.createOscillator()
  o2.type = 'sine'
  o2.frequency.value = freq * 4.02
  const g2 = c.createGain()
  g2.gain.setValueAtTime(peak * 0.18, t)
  g2.gain.exponentialRampToValueAtTime(0.0001, t + decay * 0.25)
  o1.connect(g)
  o2.connect(g2).connect(g)
  g.connect(master)
  const send = c.createGain()
  send.gain.value = opts.wet ?? 1
  g.connect(send).connect(wet)
  o1.start(t)
  o2.start(t)
  o1.stop(t + decay + 0.05)
  o2.stop(t + decay + 0.05)
}

export const sfx = {
  /** Correct word: rising pentatonic note. */
  correct(step: number) {
    const c = ready()
    if (!c) return
    const f = noteFreq(Math.min(step, 14))
    voice(f, c.currentTime, { gain: 0.2, decay: 0.7 })
  },
  /** Streak milestone: the rising run resolves into a warm chord. */
  chord(level: number) {
    const c = ready()
    if (!c) return
    const t = c.currentTime
    const base = [0, 2, 4][Math.max(0, Math.min(2, level))] + 5
    ;[0, 2, 4, 5].forEach((s, i) => voice(noteFreq(base + s), t + i * 0.035, { gain: 0.12, decay: 1.6, type: i ? 'sine' : 'triangle' }))
    voice(noteFreq(base + 10), t + 0.16, { gain: 0.06, decay: 1.8 })
  },
  /** Soft, non-punishing "hm". */
  wrong() {
    const c = ready()
    if (!c) return
    const t = c.currentTime
    const o = c.createOscillator()
    const g = c.createGain()
    o.type = 'sine'
    o.frequency.setValueAtTime(196, t)
    o.frequency.exponentialRampToValueAtTime(140, t + 0.18)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.16, t + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22)
    o.connect(g).connect(master)
    o.start(t)
    o.stop(t + 0.25)
  },
  tap() {
    const c = ready()
    if (!c) return
    voice(1318, c.currentTime, { gain: 0.035, decay: 0.06, wet: 0 })
  },
  key() {
    const c = ready()
    if (!c) return
    voice(880, c.currentTime, { gain: 0.03, decay: 0.05, wet: 0, type: 'triangle' })
  },
  /** Verse finished: little arpeggio, brighter when perfect. */
  complete(perfect: boolean) {
    const c = ready()
    if (!c) return
    const t = c.currentTime
    const steps = perfect ? [5, 7, 9, 10, 12] : [5, 7, 9]
    steps.forEach((s, i) => voice(noteFreq(s), t + i * 0.075, { gain: 0.17, decay: 1.2 }))
    if (perfect) voice(noteFreq(17), t + 0.42, { gain: 0.08, decay: 1.8 })
  },
  /** Big moment: warm chord swell + bells. */
  celebrate() {
    const c = ready()
    if (!c) return
    const t = c.currentTime
    ;[0, 2, 4, 5].forEach((s, i) => voice(noteFreq(s), t + i * 0.02, { gain: 0.1, decay: 2.6, type: 'triangle' }))
    ;[10, 12, 14, 15, 17].forEach((s, i) => voice(noteFreq(s), t + 0.25 + i * 0.11, { gain: 0.09, decay: 1.6 }))
  },
  /** Water + growth. */
  grow() {
    const c = ready()
    if (!c) return
    const t = c.currentTime
    for (let i = 0; i < 7; i++) voice(noteFreq(8 + ((i * 3) % 8)), t + 0.15 + i * 0.16 + Math.random() * 0.05, { gain: 0.06, decay: 0.5 })
    ;[0, 4, 7, 9].forEach((s, i) => voice(noteFreq(s), t + 1.3 + i * 0.12, { gain: 0.1, decay: 2.4 }))
  },
  /** Drop on water. */
  drop() {
    const c = ready()
    if (!c) return
    const t = c.currentTime
    const o = c.createOscillator()
    const g = c.createGain()
    o.frequency.setValueAtTime(900, t)
    o.frequency.exponentialRampToValueAtTime(1800, t + 0.08)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.06, t + 0.005)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12)
    o.connect(g).connect(master)
    g.connect(wet)
    o.start(t)
    o.stop(t + 0.15)
  },
}

export function haptic(kind: 'light' | 'success' | 'error' | 'heavy') {
  if (!getState().haptics) return
  const nav = navigator as Navigator & { vibrate?: (p: number | number[]) => boolean }
  if (!nav.vibrate) return
  const pattern = { light: 6, success: [8, 40, 14], error: [18, 50, 18], heavy: 22 }[kind]
  try {
    nav.vibrate(pattern)
  } catch {
    /* ignore */
  }
}

/** Read a verse aloud with the device voice (production/audio encoding support). */
export function speak(text: string, lang: 'de' | 'en', onEnd?: () => void) {
  if (!('speechSynthesis' in window)) return false
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text.replace(/HERR/g, 'Herr').replace(/LORD/g, 'Lord'))
  u.lang = lang === 'de' ? 'de-DE' : 'en-US'
  u.rate = 0.92
  const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith(u.lang.slice(0, 2)))
  const best = voices.find((v) => /premium|enhanced|natural|neural/i.test(v.name)) ?? voices[0]
  if (best) u.voice = best
  if (onEnd) u.onend = onEnd
  window.speechSynthesis.speak(u)
  return true
}
