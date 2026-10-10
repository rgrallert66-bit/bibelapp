import { useSyncExternalStore } from 'react'
import type { Lang } from '../data/verses'
import { dayKey, daysBetween, now } from './date'
import { retrievability } from './fsrs'

export interface Card {
  vid: string
  s: number
  d: number
  due: string
  last: string
  reps: number
  lapses: number
  learned: string
  /** last ratings, newest last (max 20) */
  hist: number[]
}

export interface DayLog {
  goal: boolean
  words: number
  correct: number
  ms: number
  reviews: number
  learned: string[]
}

export type Goal = 'light' | 'normal' | 'deep'

export interface State {
  v: 1
  onboarded: boolean
  lang: Lang
  seed: number
  goal: Goal
  goalChosen: boolean
  moment: string | null
  sound: boolean
  haptics: boolean
  cards: Record<string, Card>
  next: string[]
  days: Record<string, DayLog>
  growth: number
  growthShown: number
  milestonesShown: number[]
  stats: { words: number; sessions: number; perfect: number; bestFlow: number }
}

const KEY = 'rooted.v1'

export function initialState(): State {
  return {
    v: 1,
    onboarded: false,
    lang: typeof navigator !== 'undefined' && !navigator.language?.toLowerCase().startsWith('de') ? 'en' : 'de',
    seed: Math.floor(Math.random() * 1e9),
    goal: 'normal',
    goalChosen: false,
    moment: null,
    sound: true,
    haptics: true,
    cards: {},
    next: [],
    days: {},
    growth: 0,
    growthShown: 0,
    milestonesShown: [],
    stats: { words: 0, sessions: 0, perfect: 0, bestFlow: 0 },
  }
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...initialState(), ...JSON.parse(raw) }
  } catch {
    /* storage unavailable – run in memory */
  }
  return initialState()
}

let state: State = typeof window === 'undefined' ? initialState() : load()
const listeners = new Set<() => void>()

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* ignore */
  }
}

export function getState() {
  return state
}

export function setState(patch: Partial<State> | ((s: State) => Partial<State>)) {
  const p = typeof patch === 'function' ? patch(state) : patch
  state = { ...state, ...p }
  persist()
  listeners.forEach((l) => l())
}

export function replaceState(s: State) {
  state = s
  persist()
  listeners.forEach((l) => l())
}

export function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => sel(state), () => sel(state))
}

// ── derived helpers ──────────────────────────────────────────────

export const cardKey = (lang: Lang, vid: string) => `${lang}:${vid}`

export function cardsFor(s: State, lang: Lang = s.lang): Card[] {
  return Object.entries(s.cards)
    .filter(([k]) => k.startsWith(lang + ':'))
    .map(([, c]) => c)
}

export type Stage = 'bud' | 'blossom' | 'fruit' | 'gold'

/** Memory stability rendered as a growth stage: the tree literally shows how firmly a verse sits. */
export function stageOf(c: Card): Stage {
  if (c.s < 3) return 'bud'
  if (c.s < 21) return 'blossom'
  if (c.s < 90) return 'fruit'
  return 'gold'
}

export function recallNow(c: Card, today = dayKey()): number {
  return retrievability(daysBetween(c.last, today), c.s)
}

export function isDue(c: Card, today = dayKey()) {
  return c.due <= today
}

export function todayLog(s: State, key = dayKey()): DayLog {
  return s.days[key] ?? { goal: false, words: 0, correct: 0, ms: 0, reviews: 0, learned: [] }
}

export function goalMetToday(s: State) {
  return todayLog(s).goal
}

export function timeOfDay(t = now()): number {
  const d = new Date(t)
  return d.getHours() + d.getMinutes() / 60
}
