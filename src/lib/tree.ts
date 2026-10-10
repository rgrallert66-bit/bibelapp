// Procedural, seeded tree. Every user gets their own unique tree; it is generated fully grown once and
// then revealed segment by segment as "growth days" (days with the daily goal met) accumulate.

import { rng } from './text'

export interface Blob {
  x: number
  y: number
  r: number
  layer: 0 | 1 | 2 // shadow / mid / highlight
}

export interface Seg {
  id: number
  parent: number
  depth: number
  apical: boolean
  /** rotation relative to parent (deg) */
  angle: number
  /** absolute angle (deg, 0 = up) */
  abs: number
  len: number
  w0: number
  w1: number
  /** attach position along parent (0..1) */
  t: number
  bend: number
  birth: number
  children: number[]
  blobs: Blob[]
  /** fruit slots in local coords */
  slots: { x: number; y: number }[]
}

export interface Tree {
  segs: Seg[]
  /** all fruit slots, sorted by when they become available */
  slots: { seg: number; i: number; birth: number }[]
  roots: { pts: [number, number][]; birth: number; w: number }[]
}

const MAX_DEPTH = 6

export function generateTree(seed: number): Tree {
  const r = rng(seed)
  const segs: Seg[] = []

  const add = (parent: number, depth: number, angle: number, len: number, w0: number, t: number, apical: boolean): number => {
    const pAbs = parent >= 0 ? segs[parent].abs : 0
    let a = angle
    let abs = pAbs + a
    // gentle gravitropism: keep branches from pointing downward
    if (abs > 100) {
      a -= abs - 100
      abs = 100
    }
    if (abs < -100) {
      a += -100 - abs
      abs = -100
    }
    const id = segs.length
    segs.push({
      id,
      parent,
      depth,
      apical,
      angle: a,
      abs,
      len,
      w0,
      w1: w0 * (depth >= MAX_DEPTH - 1 ? 0.45 : 0.68),
      t,
      bend: (r() - 0.5) * len * 0.12,
      birth: 0,
      children: [],
      blobs: [],
      slots: [],
    })
    if (parent >= 0) segs[parent].children.push(id)
    return id
  }

  const grow = (id: number) => {
    const s = segs[id]
    if (s.depth >= MAX_DEPTH) return
    const d = s.depth
    // apical continuation keeps a clear leader for the first levels
    if (d < MAX_DEPTH - 1) {
      const c = add(id, d + 1, (r() - 0.5) * (d < 2 ? 14 : 26), s.len * (0.74 + r() * 0.12), s.w1 * 0.92, 1, true)
      grow(c)
    }
    const laterals = d === 0 ? 2 : d === 1 ? 2 : d === 2 ? (r() < 0.6 ? 2 : 1) : d === 3 ? 1 : r() < 0.65 ? 1 : 0
    let side = r() < 0.5 ? -1 : 1
    for (let i = 0; i < laterals; i++) {
      const t = d === 0 ? 0.62 + i * 0.2 + r() * 0.08 : 0.4 + r() * 0.5
      const ang = side * (20 + r() * 20 + (d === 0 ? 8 : 0))
      const len = s.len * (d === 0 ? 0.72 : 0.6 + r() * 0.18)
      const w = (s.w0 + (s.w1 - s.w0) * t) * (0.58 + r() * 0.1)
      const c = add(id, d + 1, ang, len, w, t, false)
      grow(c)
      side = -side
    }
  }

  const trunk = add(-1, 0, (r() - 0.5) * 4, 92, 19, 1, true)
  grow(trunk)

  // Birth order: depth first, leaders before laterals, a little randomness.
  const prio = segs.map((s) => s.depth * 1.0 + (s.apical ? 0 : 0.55) + r() * 0.9)
  const order = segs.map((s) => s.id).sort((a, b) => prio[a] - prio[b])
  const N = segs.length
  const T = 24
  order.forEach((id, i) => {
    const s = segs[id]
    if (id === trunk) {
      s.birth = 0
      return
    }
    // count(day) = N·(1 − e^(−day/T)) → fast early growth (quick wins), then a slower, steady crown.
    s.birth = -T * Math.log(1 - Math.min(0.985, (i + 0.4) / (N * 1.015)))
  })
  // parents are always created before their children, so one pass in id order enforces causality
  for (const s of segs) if (s.parent >= 0) s.birth = Math.max(s.birth, segs[s.parent].birth + 0.6)

  // Foliage clusters and fruit slots
  for (const s of segs) {
    const leafy = s.depth >= 2 || s.children.length === 0
    const base = s.depth >= 4 ? 17 : s.depth >= 3 ? 21 : 25
    const n = leafy ? 2 + Math.floor(r() * 2) : 2
    for (let i = 0; i < n; i++) {
      const ang = r() * Math.PI * 2
      const dist = r() * base * 0.55
      const rr = base * (0.65 + r() * 0.45)
      const x = Math.cos(ang) * dist
      const y = -s.len + Math.sin(ang) * dist * 0.75
      // light comes from the upper left: shadow offset down-right, highlight up-left
      s.blobs.push({ x: x + rr * 0.16, y: y + rr * 0.2, r: rr * 1.04, layer: 0 })
      s.blobs.push({ x: x - rr * 0.05, y: y - rr * 0.06, r: rr * 0.86, layer: 1 })
      if (r() < 0.55) s.blobs.push({ x: x - rr * 0.3, y: y - rr * 0.34, r: rr * 0.42, layer: 2 })
    }
    if (s.depth >= 1) {
      s.slots.push({ x: (r() - 0.5) * 18, y: -s.len * (0.85 + r() * 0.15) + 6 })
      s.slots.push({ x: (r() < 0.5 ? -1 : 1) * (8 + r() * 10), y: -s.len * (0.45 + r() * 0.2) })
    }
  }

  const slots = segs
    .flatMap((s) => s.slots.map((_, i) => ({ seg: s.id, i, birth: s.birth + i * 0.3 })))
    .sort((a, b) => a.birth - b.birth)

  // Roots: organic random walks under the ground (tapered), revealed with consistency.
  const roots: Tree['roots'] = []
  const walk = (x: number, y: number, ang: number, steps: number, w: number, birth: number, depth: number) => {
    const pts: [number, number][] = [[x, y]]
    for (let i = 0; i < steps; i++) {
      ang += (r() - 0.5) * 0.5
      // roots drift sideways and slowly downward
      ang = Math.max(0.15, Math.min(Math.PI - 0.15, ang))
      x += Math.cos(ang) * 7
      y += Math.sin(ang) * 7 * 0.62
      pts.push([x, y])
      if (depth < 1 && i > 2 && i < steps - 2 && r() < 0.18) walk(x, y, ang + (r() < 0.5 ? -0.7 : 0.7), Math.floor(steps * 0.45), w * 0.5, birth + 4, depth + 1)
    }
    roots.push({ pts, birth, w })
  }
  const ROOTS = 9
  for (let i = 0; i < ROOTS; i++) {
    const side = i % 2 === 0 ? -1 : 1
    const spread = 0.25 + (i / ROOTS) * 1.05 + r() * 0.2
    const ang = Math.PI / 2 + side * spread
    walk(side * 2, 0, ang, 7 + Math.floor(r() * 7), 5.5 - i * 0.35, i * 4.5 + r() * 2, 0)
  }
  roots.sort((a, b) => a.birth - b.birth)

  return { segs, slots, roots }
}

/** How far a segment has grown (0 = hidden, 1 = full length). */
export function growthOf(s: Seg, g: number): number {
  if (s.birth > g) return 0
  const k = Math.min(1, (g - s.birth) / 5)
  const e = 1 - Math.pow(1 - k, 2)
  return 0.28 + 0.72 * e
}

/** Height of the leader at growth g (for camera framing). */
export function leaderHeight(tree: Tree, g: number): number {
  let h = 0
  let id = 0
  while (id >= 0) {
    const s = tree.segs[id]
    const gf = growthOf(s, g)
    if (!gf) break
    h += s.len * gf * Math.cos((s.abs * Math.PI) / 180)
    const next = s.children.find((c) => tree.segs[c].apical)
    id = next ?? -1
  }
  return h
}

/** Widest horizontal extent of the visible crown from the trunk axis (incl. foliage), for framing. */
export function crownHalfWidth(tree: Tree, g: number): number {
  const pos: { x: number; y: number; a: number }[] = []
  let w = 30
  for (const s of tree.segs) {
    const gf = growthOf(s, g)
    if (!gf) {
      pos.push({ x: 0, y: 0, a: 0 })
      continue
    }
    const p = s.parent >= 0 ? pos[s.parent] : { x: 0, y: 0, a: 0 }
    const pl = s.parent >= 0 ? tree.segs[s.parent].len * growthOf(tree.segs[s.parent], g) * s.t : 0
    const bx = p.x + Math.sin((p.a * Math.PI) / 180) * pl
    const by = p.y - Math.cos((p.a * Math.PI) / 180) * pl
    const a = p.a + s.angle
    pos.push({ x: bx, y: by, a })
    const tipX = bx + Math.sin((a * Math.PI) / 180) * s.len * gf
    w = Math.max(w, Math.abs(tipX) + 22)
  }
  return w
}
