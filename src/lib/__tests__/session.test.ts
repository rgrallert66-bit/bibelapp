import { beforeEach, describe, expect, it } from 'vitest'
import { initialState, replaceState, getState, cardKey } from '../store'
import { planSession, recordRecall, completeSession } from '../session'
import { dayKey, setDayOffset } from '../date'

beforeEach(() => {
  setDayOffset(0)
  replaceState({ ...initialState(), lang: 'de', onboarded: true })
})

describe('session planning', () => {
  it('first session teaches the first verse with scaffolded steps', () => {
    const p = planSession()
    expect(p.newVids).toEqual(['ps23_1'])
    expect(p.steps.map((s) => s.kind)).toEqual(['encounter', 'build', 'type', 'recall'])
    expect(p.steps.at(-1)!.final).toBe(true)
  })

  it('schedules a learned verse for tomorrow and interleaves it with the next new verse', () => {
    const p = planSession()
    recordRecall(p.steps.at(-1)!, { vid: 'ps23_1', words: 9, score: 9, ms: 9000 })
    expect(completeSession(1, 9, false)).toBe(true)
    expect(getState().growth).toBe(1)
    expect(completeSession(1, 9, false)).toBe(false)
    expect(getState().cards[cardKey('de', 'ps23_1')].due > dayKey()).toBe(true)

    setDayOffset(1)
    const p2 = planSession()
    expect(p2.reviewVids).toEqual(['ps23_1'])
    expect(p2.newVids).toEqual(['ps119_11'])
    expect(p2.steps[0]).toMatchObject({ kind: 'recall', vid: 'ps23_1', review: true })
  })

  it('a lapse brings the verse back the next day', () => {
    const p = planSession()
    recordRecall(p.steps.at(-1)!, { vid: 'ps23_1', words: 9, score: 9, ms: 9000 })
    setDayOffset(1)
    const step = planSession().steps[0]
    recordRecall(step, { vid: 'ps23_1', words: 9, score: 2, ms: 20000 })
    const c = getState().cards[cardKey('de', 'ps23_1')]
    expect(c.lapses).toBe(1)
    setDayOffset(2)
    expect(planSession().reviewVids).toContain('ps23_1')
  })
})
