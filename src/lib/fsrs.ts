// Free Spaced Repetition Scheduler (FSRS-4.5 DSR memory model, Ye et al.).
// Models each verse with Difficulty, Stability (days until recall probability drops to 90%)
// and Retrievability. Scheduling at 90% target retention.

export type Rating = 1 | 2 | 3 | 4 // Again | Hard | Good | Easy

const W = [0.4872, 1.4003, 3.7145, 13.8206, 5.1618, 1.2298, 0.8975, 0.031, 1.6474, 0.1367, 1.0461, 2.1072, 0.0793, 0.3246, 1.587, 0.2272, 2.8755]
const DECAY = -0.5
const FACTOR = 19 / 81
export const TARGET_RETENTION = 0.9
/** Verbatim text is more fragile than a flashcard fact – start a bit more conservatively. */
const VERBATIM_INITIAL_SCALE = 0.5

export interface Memory {
  s: number // stability in days
  d: number // difficulty 1..10
}

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x))

export function retrievability(elapsedDays: number, s: number): number {
  return Math.pow(1 + (FACTOR * Math.max(0, elapsedDays)) / s, DECAY)
}

function initDifficulty(r: Rating) {
  return clamp(W[4] - (r - 3) * W[5], 1, 10)
}

export function initMemory(r: Rating): Memory {
  return { s: Math.max(0.2, W[r - 1] * VERBATIM_INITIAL_SCALE), d: initDifficulty(r) }
}

export function nextMemory(m: Memory, elapsedDays: number, r: Rating): Memory {
  const R = retrievability(elapsedDays, m.s)
  const dNext = m.d - W[6] * (r - 3)
  const d = clamp(W[7] * initDifficulty(4) + (1 - W[7]) * dNext, 1, 10)
  let s: number
  if (r === 1) {
    s = W[11] * Math.pow(m.d, -W[12]) * (Math.pow(m.s + 1, W[13]) - 1) * Math.exp(W[14] * (1 - R))
    s = Math.min(s, m.s) // a lapse never increases stability
  } else {
    const hard = r === 2 ? W[15] : 1
    const easy = r === 4 ? W[16] : 1
    s = m.s * (Math.exp(W[8]) * (11 - m.d) * Math.pow(m.s, -W[9]) * (Math.exp(W[10] * (1 - R)) - 1) * hard * easy + 1)
  }
  return { s: clamp(s, 0.1, 36500), d }
}

/** Interval in whole days (>=1) for the target retention. */
export function intervalDays(s: number, fuzzSeed = 0.5): number {
  const ivl = (s / FACTOR) * (Math.pow(TARGET_RETENTION, 1 / DECAY) - 1)
  let days = Math.max(1, Math.round(ivl))
  if (days > 6) {
    const fuzz = 1 + (fuzzSeed - 0.5) * 0.1
    days = Math.round(days * fuzz)
  }
  return Math.min(days, 3650)
}

/**
 * Map an observed recall performance to an FSRS rating.
 * accuracy: share of words produced correctly (first try = 1, second try = .5, revealed = 0)
 * secPerWord: average time per word.
 */
export function ratingFrom(accuracy: number, secPerWord: number, isFirstLearn: boolean): Rating {
  if (accuracy < 0.6) return 1
  if (accuracy < 0.85) return 2
  if (!isFirstLearn && accuracy >= 0.99 && secPerWord < 1.6) return 4
  return 3
}
