import { describe, expect, it } from 'vitest'
import { chunk, tokenize, hintMask, clozeTargets, normLetter } from '../text'
import { initMemory, intervalDays, nextMemory, retrievability, ratingFrom } from '../fsrs'
import { VERSES } from '../../data/verses'

describe('text', () => {
  it('tokenizes with punctuation and quotes', () => {
    const t = tokenize('Es steht geschrieben: »Nicht von Brot allein')
    expect(t.map((x) => x.key).join('')).toBe('esgnvba')
    expect(t[3].word).toBe('Nicht')
  })
  it('normalises umlauts', () => {
    expect(normLetter('Ü')).toBe('u')
    expect(tokenize('Über alles')[0].key).toBe('u')
  })
  it('handles dash-only tokens', () => {
    const t = tokenize('Alles – nichts')
    expect(t[1].wi).toBe(-1)
    expect(t[2].wi).toBe(1)
  })
  it('chunks every verse into 2–8 word phrases that rebuild the text', () => {
    for (const v of VERSES) {
      for (const lang of ['de', 'en'] as const) {
        const c = chunk(v.text[lang])
        expect(c.join(' ')).toBe(v.text[lang].split(/\s+/).join(' '))
        for (const p of c) expect(p.split(' ').length).toBeLessThanOrEqual(8)
      }
    }
  })
  it('hint mask shows the requested share', () => {
    const t = tokenize('Der HERR ist mein Hirte, mir wird nichts mangeln.')
    expect(hintMask(t, 0, 1).filter(Boolean).length).toBe(0)
    expect(hintMask(t, 1, 1).filter(Boolean).length).toBe(9)
    expect(hintMask(t, 0.5, 1).filter(Boolean).length).toBe(5)
  })
  it('cloze picks sorted unique targets', () => {
    const t = tokenize(VERSES[4].text.de)
    const c = clozeTargets(t, 0.3, 4)
    expect(new Set(c).size).toBe(c.length)
    expect([...c].sort((a, b) => a - b)).toEqual(c)
  })
})

describe('fsrs', () => {
  it('retrievability is 0.9 after S days', () => {
    expect(retrievability(10, 10)).toBeCloseTo(0.9, 2)
  })
  it('intervals grow with good recalls and shrink on lapse', () => {
    let m = initMemory(3)
    const ivls: number[] = []
    for (let i = 0; i < 5; i++) {
      const ivl = intervalDays(m.s)
      ivls.push(ivl)
      m = nextMemory(m, ivl, 3)
    }
    for (let i = 1; i < ivls.length; i++) expect(ivls[i]).toBeGreaterThanOrEqual(ivls[i - 1])
    expect(ivls[4]).toBeGreaterThan(10)
    const lapsed = nextMemory(m, intervalDays(m.s), 1)
    expect(lapsed.s).toBeLessThan(m.s)
  })
  it('maps performance to ratings', () => {
    expect(ratingFrom(0.5, 1, false)).toBe(1)
    expect(ratingFrom(0.8, 1, false)).toBe(2)
    expect(ratingFrom(0.95, 1, false)).toBe(3)
    expect(ratingFrom(1, 1, false)).toBe(4)
    expect(ratingFrom(1, 1, true)).toBe(3)
  })
})
