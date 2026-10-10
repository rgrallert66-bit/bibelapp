// Turning a verse into words, chunks and recall targets.

export interface Token {
  /** Display text including punctuation, e.g. "»Nicht" or "Hirte,". */
  text: string
  /** Letters only, used for tiles / cloze. */
  word: string
  /** Normalised first letter the learner has to type (a–z, ä→a). Empty for punctuation-only tokens. */
  key: string
  /** Index among real words (punctuation-only tokens get -1). */
  wi: number
}

const LETTER = /[\p{L}\p{N}]/u

export function normLetter(ch: string): string {
  return ch.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export function tokenize(text: string): Token[] {
  let wi = 0
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => {
      const m = t.match(LETTER)
      const word = t.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '')
      if (!m) return { text: t, word: '', key: '', wi: -1 }
      return { text: t, word, key: normLetter(m[0]), wi: wi++ }
    })
}

export function wordCount(text: string): number {
  return tokenize(text).filter((t) => t.wi >= 0).length
}

const BREAK = /[,;:.!?»«“”‘’"]$/

/**
 * Split a verse into meaningful phrases of roughly 2–7 words (working memory holds ~4 chunks,
 * Cowan 2001). Breaks at punctuation first, then balances very short / very long pieces.
 */
export function chunk(text: string): string[] {
  const toks = text.split(/\s+/).filter(Boolean)
  const raw: string[][] = []
  let cur: string[] = []
  for (const t of toks) {
    cur.push(t)
    if (BREAK.test(t)) {
      raw.push(cur)
      cur = []
    }
  }
  if (cur.length) raw.push(cur)

  // split long phrases
  const split: string[][] = []
  for (const c of raw) {
    if (c.length <= 7) split.push(c)
    else {
      const parts = Math.ceil(c.length / 6)
      const size = Math.ceil(c.length / parts)
      for (let i = 0; i < c.length; i += size) split.push(c.slice(i, i + size))
    }
  }
  // merge tiny phrases with the following (or previous) one
  const merged: string[][] = []
  for (let i = 0; i < split.length; i++) {
    const c = split[i]
    if (c.length < 2 && i + 1 < split.length && split[i + 1].length + c.length <= 7) {
      split[i + 1] = [...c, ...split[i + 1]]
    } else if (c.length < 2 && merged.length && merged[merged.length - 1].length + c.length <= 8) {
      merged[merged.length - 1].push(...c)
    } else merged.push(c)
  }
  return merged.map((c) => c.join(' '))
}

/** Deterministic PRNG (mulberry32). */
export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hashStr(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function shuffle<T>(arr: T[], rand: () => number = Math.random): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Which words stay visible as faint hints at a given hint level (0 = none, 1 = all).
 * Short function words are kept visible first, so the learner has to produce the content words.
 */
export function hintMask(tokens: Token[], level: number, seed: number): boolean[] {
  const words = tokens.filter((t) => t.wi >= 0)
  const n = Math.round(words.length * Math.max(0, Math.min(1, level)))
  const r = rng(seed)
  const ranked = words.map((t) => ({ wi: t.wi, s: t.word.length + r() * 4 })).sort((a, b) => a.s - b.s)
  const shown = new Set(ranked.slice(0, n).map((x) => x.wi))
  return words.map((t) => shown.has(t.wi))
}

/** Words worth blanking in a cloze: longer, content-carrying words first. */
export function clozeTargets(tokens: Token[], ratio: number, seed: number): number[] {
  const words = tokens.filter((t) => t.wi >= 0)
  const r = rng(seed)
  const n = Math.max(1, Math.min(6, Math.round(words.length * ratio)))
  return words
    .map((t) => ({ wi: t.wi, s: t.word.length + r() * 3 + (t.word === t.word.toUpperCase() && t.word.length > 1 ? 4 : 0) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, n)
    .map((x) => x.wi)
    .sort((a, b) => a - b)
}
