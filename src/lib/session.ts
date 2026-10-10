import { DEFAULT_ORDER, VERSE_BY_ID, type Lang } from '../data/verses'
import { addDays, dayKey, daysBetween } from './date'
import { initMemory, intervalDays, nextMemory, ratingFrom, type Rating } from './fsrs'
import { cardKey, cardsFor, getState, recallNow, setState, todayLog, type Card, type Goal, type State } from './store'
import { hashStr, wordCount } from './text'

export type StepKind = 'encounter' | 'build' | 'cloze' | 'type' | 'recall' | 'reference'

export interface Step {
  key: string
  kind: StepKind
  vid: string
  /** share of words shown as faint hints (type/recall) */
  hint: number
  review: boolean
  /** the step whose result schedules a newly learned verse */
  final?: boolean
  relearn?: boolean
}

export interface Plan {
  steps: Step[]
  newVids: string[]
  reviewVids: string[]
  minutes: number
  /** user-chosen extra practice – does not count as the daily goal */
  free: boolean
  /** nothing due and nothing new: a short top-up of the least stable verses */
  topUp: boolean
}

export const GOALS: Record<Goal, { reviews: number; newPerDay: number; minutes: number }> = {
  light: { reviews: 3, newPerDay: 0.5, minutes: 3 },
  normal: { reviews: 6, newPerDay: 1, minutes: 5 },
  deep: { reviews: 12, newPerDay: 2, minutes: 10 },
}

export function nextNewVerses(s: State, n: number, lang: Lang = s.lang): string[] {
  const has = new Set(cardsFor(s, lang).map((c) => c.vid))
  const order = [...s.next, ...DEFAULT_ORDER]
  const out: string[] = []
  for (const id of order) {
    if (!has.has(id) && !out.includes(id) && VERSE_BY_ID[id]) out.push(id)
    if (out.length >= n) break
  }
  return out
}

function newAllowance(s: State, today: string): number {
  const g = GOALS[s.goal]
  const learnedToday = todayLog(s, today).learned.length
  if (g.newPerDay >= 1) return Math.max(0, g.newPerDay - learnedToday)
  if (learnedToday) return 0
  // "light": one new verse every other day
  const learnedYesterday = todayLog(s, addDays(today, -1)).learned.length > 0
  return learnedYesterday ? 0 : 1
}

function reviewStep(c: Card, i: number, today: string): Step[] {
  const steps: Step[] = [{ key: `r-${c.vid}-${i}`, kind: 'recall', vid: c.vid, hint: c.s < 2 ? 0.3 : 0, review: true }]
  // Occasional reference retrieval (interleaved, cheap, builds the "address" of the verse).
  if (c.reps >= 2 && hashStr(c.vid + today) % 3 === 0) {
    steps.push({ key: `ref-${c.vid}-${i}`, kind: 'reference', vid: c.vid, hint: 0, review: true })
  }
  return steps
}

function learnSteps(vid: string, n: number): Step[][] {
  const words = wordCount(VERSE_BY_ID[vid].text.de)
  const short = words <= 9
  const p = `n${n}-${vid}`
  const blocks: Step[][] = [
    [
      { key: `${p}-e`, kind: 'encounter', vid, hint: 1, review: false },
      { key: `${p}-b`, kind: 'build', vid, hint: 1, review: false },
      ...(short ? [] : [{ key: `${p}-c`, kind: 'cloze' as const, vid, hint: 1, review: false }]),
    ],
    [{ key: `${p}-t`, kind: 'type', vid, hint: short ? 0.45 : 0.55, review: false }],
    [{ key: `${p}-f`, kind: 'recall', vid, hint: 0, review: false, final: true }],
  ]
  return blocks
}

/** Build today's session: reviews interleaved with the learning stages of new verses. */
export function planSession(s: State = getState(), practiceIds?: string[]): Plan {
  const today = dayKey()
  const lang = s.lang

  if (practiceIds?.length) {
    const cards = practiceIds.map((id) => s.cards[cardKey(lang, id)]).filter(Boolean)
    const steps = cards.flatMap((c, i) => reviewStep(c, i, today + 'p'))
    return { steps, newVids: [], reviewVids: cards.map((c) => c.vid), minutes: estimate(steps), free: true, topUp: false }
  }

  const g = GOALS[s.goal]
  const cards = cardsFor(s, lang)
  const due = cards
    .filter((c) => c.due <= today)
    .sort((a, b) => recallNow(a, today) - recallNow(b, today))
  const reviews = due.slice(0, g.reviews)
  const overloaded = due.length > g.reviews * 1.5
  const newIds = overloaded ? [] : nextNewVerses(s, newAllowance(s, today), lang)

  let reviewCards = reviews
  let topUp = false
  if (!reviews.length && !newIds.length) {
    // Everything is fresh: offer a short top-up of the least stable verses.
    reviewCards = cards.slice().sort((a, b) => recallNow(a, today) - recallNow(b, today)).slice(0, 3)
    topUp = true
  }

  const reviewQueue = reviewCards.map((c, i) => reviewStep(c, i, today))
  const steps: Step[] = []
  const takeReview = () => {
    const r = reviewQueue.shift()
    if (r) steps.push(...r)
  }

  // Warm-up with one review (retrieval first – quick win, primes attention)
  if (newIds.length) takeReview()
  newIds.forEach((vid, n) => {
    const [encounter, type, final] = learnSteps(vid, n)
    steps.push(...encounter)
    takeReview() // a short delay between study and the first retrieval
    steps.push(...type)
    takeReview()
    steps.push(...final)
  })
  while (reviewQueue.length) takeReview()

  return { steps, newVids: newIds, reviewVids: reviewCards.map((c) => c.vid), minutes: estimate(steps), free: false, topUp }
}

export function estimate(steps: Step[]): number {
  let sec = 0
  for (const st of steps) {
    const w = wordCount(VERSE_BY_ID[st.vid].text.de)
    sec += { encounter: 20 + w * 0.6, build: 15 + w * 0.8, cloze: 18, type: 6 + w * 1.4, recall: 6 + w * 1.5, reference: 6 }[st.kind]
  }
  return Math.max(1, Math.round(sec / 60))
}

// ── recording results ────────────────────────────────────────────

export interface RecallResult {
  vid: string
  words: number
  /** first try = 1, second try = .5, revealed = 0 */
  score: number
  ms: number
}

/** Schedule a verse after a graded recall. Returns the rating used. */
export function recordRecall(step: Step, res: RecallResult): Rating {
  const s = getState()
  const today = dayKey()
  const k = cardKey(s.lang, res.vid)
  const acc = res.words ? res.score / res.words : 1
  const secPerWord = res.ms / 1000 / Math.max(1, res.words)
  const existing = s.cards[k]
  let card: Card
  let rating: Rating
  if (!existing) {
    rating = ratingFrom(acc, secPerWord, true)
    const m = initMemory(rating)
    card = { vid: res.vid, s: m.s, d: m.d, due: addDays(today, 1), last: today, reps: 1, lapses: 0, learned: today, hist: [rating] }
  } else {
    rating = ratingFrom(acc, secPerWord, false)
    const elapsed = daysBetween(existing.last, today)
    // Same-day repeats (free practice) barely move stability – FSRS handles that via R≈1.
    const m = nextMemory(existing, elapsed, rating)
    const ivl = rating === 1 ? 1 : intervalDays(m.s, (hashStr(res.vid + today) % 1000) / 1000)
    card = {
      ...existing,
      s: m.s,
      d: m.d,
      last: today,
      due: addDays(today, ivl),
      reps: existing.reps + 1,
      lapses: existing.lapses + (rating === 1 ? 1 : 0),
      hist: [...existing.hist, rating].slice(-20),
    }
  }
  const log = todayLog(s, today)
  setState({
    cards: { ...s.cards, [k]: card },
    days: {
      ...s.days,
      [today]: {
        ...log,
        reviews: log.reviews + (existing && !step.relearn ? 1 : 0),
        learned: !existing ? [...log.learned, res.vid] : log.learned,
      },
    },
  })
  return rating
}

/** Count words etc. into today's log (called for every exercise). */
export function recordWords(words: number, correct: number, ms: number) {
  const s = getState()
  const today = dayKey()
  const log = todayLog(s, today)
  setState({
    days: { ...s.days, [today]: { ...log, words: log.words + words, correct: log.correct + correct, ms: log.ms + ms } },
    stats: { ...s.stats, words: s.stats.words + correct },
  })
}

/** Mark the daily goal reached. Returns true if this is the first completion today (tree grows). */
export function completeSession(perfectVerses: number, bestFlow: number, free: boolean): boolean {
  const s = getState()
  const today = dayKey()
  const log = todayLog(s, today)
  const first = !log.goal && !free
  setState({
    days: { ...s.days, [today]: { ...log, goal: log.goal || !free } },
    growth: first ? s.growth + 1 : s.growth,
    stats: {
      ...s.stats,
      sessions: s.stats.sessions + 1,
      perfect: s.stats.perfect + perfectVerses,
      bestFlow: Math.max(s.stats.bestFlow, bestFlow),
    },
  })
  return first
}

/** Free practice: the verses that would profit most from a refresh right now. */
export function practiceCandidates(s: State = getState(), n = 3): string[] {
  const today = dayKey()
  return cardsFor(s)
    .sort((a, b) => recallNow(a, today) - recallNow(b, today))
    .slice(0, n)
    .map((c) => c.vid)
}
