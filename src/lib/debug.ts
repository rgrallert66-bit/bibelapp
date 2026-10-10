// URL switches for demos, screenshots and QA:
//   ?hour=21        render the scene at a fixed time of day
//   ?day=3          pretend it is N days later (tests spacing)
//   ?demo=30        load a demo profile with 30 growth days and verses in all stages
//   ?reset          start fresh (onboarding)
//   ?lang=en        force translation
import { DEFAULT_ORDER } from '../data/verses'
import { addDays, dayKey, setDayOffset } from './date'
import { cardKey, initialState, replaceState, type Card, type State } from './store'

const params = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams()

export function hourOverride(): number | null {
  const h = params.get('hour')
  return h != null && h !== '' && !isNaN(Number(h)) ? Number(h) : null
}

export function applyDebugParams() {
  const day = params.get('day')
  if (day && !isNaN(Number(day))) setDayOffset(Number(day))
  if (params.has('reset')) {
    replaceState({ ...initialState(), lang: (params.get('lang') as State['lang']) ?? initialState().lang })
  }
  const demo = params.get('demo')
  if (demo != null) {
    const g = Math.max(0, Number(demo) || 30)
    replaceState(demoState(g, (params.get('lang') as State['lang']) ?? 'de'))
  } else if (params.get('lang') === 'de' || params.get('lang') === 'en') {
    replaceState({ ...JSON.parse(JSON.stringify(initialState())), ...readRaw(), lang: params.get('lang') as State['lang'] })
  }
  if (params.has('reset') || demo != null || params.has('lang')) {
    // keep the URL clean after applying one-shot switches (except hour/day which are view-only)
    const keep = new URLSearchParams()
    if (params.get('hour')) keep.set('hour', params.get('hour')!)
    if (params.get('day')) keep.set('day', params.get('day')!)
    history.replaceState(null, '', location.pathname + (keep.toString() ? '?' + keep : ''))
  }
}

function readRaw(): Partial<State> {
  try {
    return JSON.parse(localStorage.getItem('rooted.v1') || '{}')
  } catch {
    return {}
  }
}

export function demoState(growth: number, lang: State['lang']): State {
  const s = initialState()
  const today = dayKey()
  const n = Math.min(DEFAULT_ORDER.length, Math.max(1, Math.round(growth * 0.75)))
  const cards: Record<string, Card> = {}
  for (let i = 0; i < n; i++) {
    const vid = DEFAULT_ORDER[i]
    const age = Math.round(growth * (1 - i / n))
    const stab = [0.8, 2, 6, 14, 30, 60, 120][Math.min(6, Math.floor((age / Math.max(1, growth)) * 7))] * (growth / 30 + 0.3)
    cards[cardKey(lang, vid)] = {
      vid,
      s: stab,
      d: 5,
      due: addDays(today, i % 4 === 0 ? 0 : Math.max(1, Math.round(stab / 2))),
      last: addDays(today, -Math.min(age, Math.round(stab / 2))),
      reps: Math.max(1, Math.round(age / 5)),
      lapses: 0,
      learned: addDays(today, -age),
      hist: [3, 3],
    }
  }
  const days: State['days'] = {}
  for (let i = 1; i <= growth; i++) days[addDays(today, -i)] = { goal: true, words: 40, correct: 38, ms: 240000, reviews: 3, learned: [] }
  return {
    ...s,
    onboarded: true,
    goalChosen: true,
    lang,
    seed: 20251010,
    cards,
    days,
    growth,
    growthShown: growth,
    milestonesShown: [1, 3, 7, 14, 21, 30, 40, 66, 100].filter((m) => m <= growth),
    stats: { words: growth * 40, sessions: growth, perfect: growth * 2, bestFlow: 42 },
  }
}
