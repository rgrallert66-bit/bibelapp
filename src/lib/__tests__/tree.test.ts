import { describe, expect, it } from 'vitest'
import { generateTree, growthOf } from '../tree'

describe('tree', () => {
  it('is deterministic per seed and grows over time', () => {
    const a = generateTree(42)
    const b = generateTree(42)
    expect(a.segs.length).toBe(b.segs.length)
    const vis = (g: number) => a.segs.filter((s) => growthOf(s, g) > 0).length
    expect(vis(1)).toBeGreaterThan(vis(0))
    expect(vis(30)).toBeGreaterThan(vis(7))
    expect(vis(120)).toBe(a.segs.length)
    for (const s of a.segs) if (s.parent >= 0) expect(s.birth).toBeGreaterThan(a.segs[s.parent].birth)
  })

  it('keeps a reasonable size for every seed', () => {
    for (let seed = 1; seed < 40; seed++) {
      const n = generateTree(seed * 7919).segs.length
      expect(n).toBeGreaterThan(50)
      expect(n).toBeLessThan(260)
    }
  })
})
