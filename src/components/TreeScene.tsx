import { memo, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { crownHalfWidth, generateTree, growthOf, leaderHeight, type Seg, type Tree } from '../lib/tree'
import type { Stage } from '../lib/store'
import { rng } from '../lib/text'

export interface Fruit {
  vid: string
  stage: Stage
  thirsty: boolean
}

interface Props {
  seed: number
  growth: number
  fruits: Fruit[]
  hour: number
  /** whole growth days – unlocks scene features */
  level: number
  onFruit?: (vid: string) => void
  fresh?: string | null
  className?: string
  /** px covered by UI at the top (header) – the tree is framed below it */
  topInset?: number
}

// ── colour helpers ───────────────────────────────────────────────
type RGB = [number, number, number]
const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
const css = (c: RGB) => `rgb(${c.map((x) => Math.round(x)).join(',')})`

interface Sky {
  top: string
  mid: string
  low: string
  hillFar: string
  hillNear: string
  leaf: [string, string, string]
  wood: [string, string]
  dark: number // 0 day … 1 night
  sun: string
}

const KEYS: [number, Sky][] = [
  [0, { top: '#040915', mid: '#0A1630', low: '#132a3e', hillFar: '#0d1d2b', hillNear: '#0a1820', leaf: ['#0f3326', '#1d5a3c', '#3f8c63'], wood: ['#1b130f', '#3a2a20'], dark: 1, sun: '#dfe8ff' }],
  [5, { top: '#060c1c', mid: '#121c3a', low: '#2a2c4a', hillFar: '#141d33', hillNear: '#0e1826', leaf: ['#123528', '#215c40', '#418c64'], wood: ['#1d1410', '#3a2a20'], dark: 0.9, sun: '#dfe8ff' }],
  [6.5, { top: '#1c2350', mid: '#6d4f80', low: '#f0a47c', hillFar: '#4b3a5c', hillNear: '#23263a', leaf: ['#1d4a35', '#2f7a4f', '#7cc48a'], wood: ['#2a1d17', '#5a3d2c'], dark: 0.35, sun: '#ffd9a0' }],
  [9, { top: '#1f5d84', mid: '#5fa5c4', low: '#c9e5d6', hillFar: '#5c8f86', hillNear: '#2f5a4b', leaf: ['#1f5a3d', '#2f8a57', '#7fd193'], wood: ['#3a291f', '#6b4a35'], dark: 0, sun: '#fff4d6' }],
  [16.5, { top: '#22608a', mid: '#6aaac6', low: '#e2e3c4', hillFar: '#61907f', hillNear: '#31594a', leaf: ['#1f5a3d', '#2f8a57', '#86d495'], wood: ['#3a291f', '#6b4a35'], dark: 0, sun: '#fff1c9' }],
  [19, { top: '#1b1c48', mid: '#8a4a72', low: '#f3a45f', hillFar: '#5a3a5a', hillNear: '#26213a', leaf: ['#1c4234', '#2c6e4b', '#89b979'], wood: ['#2a1c17', '#5c3b2b'], dark: 0.4, sun: '#ffc27a' }],
  [21, { top: '#070c1d', mid: '#111b38', low: '#23284a', hillFar: '#131a30', hillNear: '#0c1624', leaf: ['#10342a', '#1f5a40', '#3d8a62'], wood: ['#1b130f', '#3a2a20'], dark: 0.95, sun: '#dfe8ff' }],
  [24, { top: '#040915', mid: '#0A1630', low: '#132a3e', hillFar: '#0d1d2b', hillNear: '#0a1820', leaf: ['#0f3326', '#1d5a3c', '#3f8c63'], wood: ['#1b130f', '#3a2a20'], dark: 1, sun: '#dfe8ff' }],
]

function skyAt(hour: number): Sky {
  let i = 0
  while (i < KEYS.length - 2 && KEYS[i + 1][0] <= hour) i++
  const [h0, a] = KEYS[i]
  const [h1, b] = KEYS[i + 1]
  const t = Math.min(1, Math.max(0, (hour - h0) / (h1 - h0)))
  const m = (x: string, y: string) => css(mix(hex(x), hex(y), t))
  return {
    top: m(a.top, b.top),
    mid: m(a.mid, b.mid),
    low: m(a.low, b.low),
    hillFar: m(a.hillFar, b.hillFar),
    hillNear: m(a.hillNear, b.hillNear),
    leaf: [m(a.leaf[0], b.leaf[0]), m(a.leaf[1], b.leaf[1]), m(a.leaf[2], b.leaf[2])],
    wood: [m(a.wood[0], b.wood[0]), m(a.wood[1], b.wood[1])],
    dark: a.dark + (b.dark - a.dark) * t,
    sun: m(a.sun, b.sun),
  }
}

const BASE_X = 200
const BASE_Y = 645

function branchPath(s: Seg, L: number, wScale: number) {
  const a = (s.w0 * wScale) / 2
  const c = Math.max(0.6, (s.w1 * wScale) / 2)
  const b = s.bend * (L / s.len)
  return `M${-a} 0 Q${(-a * 0.85 + b).toFixed(2)} ${(-L / 2).toFixed(2)} ${(-c + b * 0.5).toFixed(2)} ${(-L).toFixed(2)} L${(c + b * 0.5).toFixed(2)} ${(-L).toFixed(2)} Q${(a * 0.85 + b).toFixed(2)} ${(-L / 2).toFixed(2)} ${a} 0Z`
}

type Pass = 'wood' | 'leaf0' | 'leaf1' | 'leaf2' | 'fruit'

function useSize() {
  const ref = useRef<SVGSVGElement>(null)
  const [size, setSize] = useState({ w: 390, h: 610 })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth || 390, h: el.clientHeight || 610 }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, size] as const
}

function TreeSceneImpl({ seed, growth, fruits, hour, level, onFruit, fresh, className, topInset = 140 }: Props) {
  const [svgRef, size] = useSize()
  // viewBox is 400×760 with "xMidYMax slice": work out which part of it is actually visible
  const vbScale = Math.max(size.w / 400, size.h / 760)
  const visibleTop = 760 - size.h / vbScale
  const headerUnits = topInset / vbScale
  const tree: Tree = useMemo(() => generateTree(seed), [seed])
  const sky = skyAt(hour)
  const g = Math.max(0, growth)
  const age = Math.min(1, g / 55)
  const wScale = 0.38 + 0.62 * age
  const H = Math.max(30, leaderHeight(tree, g))
  const W = useMemo(() => crownHalfWidth(tree, g), [tree, g])
  const maxH = Math.max(110, Math.min(345, BASE_Y - visibleTop - headerUnits - 26))
  const zoom = Math.min(1.6 - 0.72 * Math.min(1, g / 45), maxH / H, 188 / W)
  const fruitScale = 1 / zoom

  // assign verses to fruit slots (stable: slots are ordered by birth, new ones are appended)
  const visibleSlots = tree.slots.filter((sl) => sl.birth <= g)
  const fruitAt = new Map<string, Fruit[]>()
  fruits.forEach((f, i) => {
    if (!visibleSlots.length) return
    const sl = visibleSlots[i % visibleSlots.length]
    const k = `${sl.seg}:${sl.i}`
    fruitAt.set(k, [...(fruitAt.get(k) ?? []), f])
  })

  const lens = tree.segs.map((s) => s.len * growthOf(s, g))

  const render = (id: number, pass: Pass): ReactNode => {
    const s = tree.segs[id]
    const gf = growthOf(s, g)
    if (!gf) return null
    const L = lens[id]
    const pL = s.parent >= 0 ? lens[s.parent] : 0
    const sway = s.depth >= 1 && s.depth <= 2
    let content: ReactNode = null
    if (pass === 'wood') {
      content = <path d={branchPath(s, L, wScale)} fill="url(#wood)" />
    } else if (pass.startsWith('leaf')) {
      const layer = Number(pass[4])
      const visibleKids = s.children.some((c) => tree.segs[c].birth <= g)
      const leafy = s.depth >= 2 || !visibleKids
      if (leafy) {
        // young trees get proportionally bigger leaves, so a sapling looks lush instead of bare
        const sprout = Math.min(1, (g - s.birth) / 0.8)
        const k = (1 - Math.pow(1 - sprout, 3)) * (0.5 + 0.5 * Math.min(1, (g - s.birth) / 2.5)) * (0.6 + 0.4 * gf) * (1.25 - 0.3 * age)
        const sc = (L / s.len) * 0.5 + 0.5
        content = s.blobs
          .filter((b) => b.layer === layer)
          .map((b, i) => <circle key={i} cx={b.x * sc} cy={b.y * (L / s.len)} r={b.r * k} />)
      }
    } else {
      const items: ReactNode[] = []
      s.slots.forEach((slot, i) => {
        const fs = fruitAt.get(`${id}:${i}`)
        if (!fs) return
        fs.forEach((f, j) => {
          items.push(
            <g
              key={f.vid}
              transform={`translate(${(slot.x + j * 9) * (L / s.len) ** 0.5} ${slot.y * (L / s.len)}) rotate(${-s.abs})`}
            >
              <FruitMark fruit={f} scale={fruitScale} hit={22 / (zoom * vbScale)} fresh={fresh === f.vid} onTap={onFruit} />
            </g>,
          )
        })
      })
      content = items
    }
    return (
      <g key={id} transform={`translate(0 ${(-pL * s.t).toFixed(2)}) rotate(${s.angle.toFixed(2)})`}>
        <g
          className={sway ? 'sway' : undefined}
          style={sway ? ({ '--a': `${(s.depth === 1 ? 0.9 : 1.6).toFixed(2)}deg`, '--d': `${5 + (id % 5) * 0.7}s`, '--dl': `${-(id % 7)}s` } as React.CSSProperties) : undefined}
        >
          {content}
          {s.children.map((c) => render(c, pass))}
        </g>
      </g>
    )
  }

  const stars = useMemo(() => {
    const rr = rng(seed + 3)
    return Array.from({ length: 46 }, () => ({ x: rr() * 400, y: rr() * 360, s: 0.4 + rr() * 1.2, d: 2 + rr() * 4 }))
  }, [seed])
  const glints = useMemo(() => {
    const rr = rng(seed + 11)
    return Array.from({ length: 9 }, (_, i) => ({ x: -10 + i * 48 + rr() * 20, d: 1.6 + rr() * 2.4 }))
  }, [seed])

  // the sun travels across the right half of the sky so it never sits behind the header text
  const dayT = Math.min(1, Math.max(0, (hour - 6) / 14))
  const sunUp = hour >= 6 && hour <= 20.2
  const sunX = 230 + dayT * 130
  const skyTop = visibleTop + headerUnits * 0.55
  const sunY = skyTop + 50 + (1 - Math.sin(dayT * Math.PI)) * 120
  const moon = !sunUp
  const riverY = (x: number) => 618 + Math.sin(x / 70) * 6 - (x / 400) * 8

  return (
    <svg ref={svgRef} className={className} viewBox="0 0 400 760" preserveAspectRatio="xMidYMax slice" aria-hidden={!onFruit}>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky.top} />
          <stop offset="0.6" stopColor={sky.mid} />
          <stop offset="0.84" stopColor={sky.low} />
        </linearGradient>
        <linearGradient id="wood" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={sky.wood[1]} />
          <stop offset="0.45" stopColor={sky.wood[1]} />
          <stop offset="1" stopColor={sky.wood[0]} />
        </linearGradient>
        <linearGradient id="soil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky.hillNear} />
          <stop offset="0.18" stopColor="#0c1611" />
          <stop offset="1" stopColor="#070d0a" />
        </linearGradient>
        <radialGradient id="sunglow">
          <stop offset="0" stopColor={sky.sun} stopOpacity="0.9" />
          <stop offset="0.25" stopColor={sky.sun} stopOpacity="0.32" />
          <stop offset="1" stopColor={sky.sun} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="crownglow">
          <stop offset="0" stopColor="#ffe6a8" stopOpacity={0.2 + sky.dark * 0.12} />
          <stop offset="1" stopColor="#ffe6a8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="river" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky.low} stopOpacity="0.95" />
          <stop offset="1" stopColor={sky.mid} stopOpacity="0.75" />
        </linearGradient>
        <radialGradient id="g-bud" cx="0.35" cy="0.3">
          <stop offset="0" stopColor="#e9ffd0" />
          <stop offset="1" stopColor="#6fbf6a" />
        </radialGradient>
        <radialGradient id="g-fruit" cx="0.35" cy="0.3">
          <stop offset="0" stopColor="#ffd1a6" />
          <stop offset="0.45" stopColor="#ff7a59" />
          <stop offset="1" stopColor="#c23b3b" />
        </radialGradient>
        <radialGradient id="g-gold" cx="0.35" cy="0.3">
          <stop offset="0" stopColor="#fffbe6" />
          <stop offset="0.4" stopColor="#ffd56b" />
          <stop offset="1" stopColor="#d89a1e" />
        </radialGradient>
        <radialGradient id="g-halo">
          <stop offset="0" stopColor="#ffd56b" stopOpacity="0.6" />
          <stop offset="1" stopColor="#ffd56b" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x="-200" y="-200" width="800" height="1200" fill="url(#sky)" />

      {/* stars */}
      <g opacity={Math.max(0, sky.dark - 0.2) * 1.2}>
        {stars.map((s, i) => (
          <circle key={i} className="twinkle" cx={s.x} cy={s.y} r={s.s} fill="#fff" style={{ animationDuration: `${s.d}s`, animationDelay: `${-i * 0.37}s` }} />
        ))}
      </g>

      {/* sun / moon */}
      <g transform={`translate(${moon ? 330 : sunX} ${moon ? skyTop + 70 : sunY})`}>
        <circle r="95" fill="url(#sunglow)" opacity={moon ? 0.4 : 0.85} />
        <circle r={moon ? 14 : 18} fill={sky.sun} opacity="0.95" />
        {moon && <circle r="12" cx="6" cy="-4" fill={sky.top} opacity="0.92" />}
      </g>

      {/* distant hills and the stream of Psalm 1 ("planted by streams of water") */}
      <path d="M-40 585 C 40 540, 110 548, 170 572 S 300 538, 440 566 L440 760 L-40 760Z" fill={sky.hillFar} opacity="0.92" />
      <path
        d={`M-30 ${riverY(-30) - 4} ${Array.from({ length: 12 }, (_, i) => { const x = -30 + (i + 1) * 40; return `L${x} ${(riverY(x) - 3 - i * 0.25).toFixed(1)}` }).join(' ')} ${Array.from({ length: 12 }, (_, i) => { const x = 450 - (i + 1) * 40; return `L${x} ${(riverY(x) + 4 + (11 - i) * 0.25).toFixed(1)}` }).join(' ')} Z`}
        fill="url(#river)"
        opacity={0.55 + (1 - sky.dark) * 0.3}
      />
      {glints.map((gl, i) => (
        <ellipse key={i} className="glint" cx={gl.x} cy={riverY(gl.x)} rx="6" ry="0.9" fill="#fff" style={{ animationDuration: `${gl.d}s`, animationDelay: `${-i * 0.7}s` }} />
      ))}
      <path d="M-40 634 C 60 616, 150 620, 200 624 S 330 616, 440 630 L440 760 L-40 760Z" fill={sky.hillNear} />

      {/* soil cross-section with roots */}
      <path d="M-40 648 C 80 636, 150 640, 200 641 S 320 636, 440 648 L440 800 L-40 800Z" fill="url(#soil)" />
      <g transform={`translate(${BASE_X} ${BASE_Y + 2})`} className={level >= 66 ? 'root-gold' : undefined}>
        {tree.roots.map((rt, i) => {
          const k = Math.max(0, Math.min(1, (level + 1.5 - rt.birth) / 8))
          if (!k) return null
          const n = Math.max(2, Math.round(rt.pts.length * k))
          const pts = rt.pts.slice(0, n)
          const w = rt.w * (0.45 + 0.55 * age)
          const left: string[] = []
          const right: string[] = []
          pts.forEach(([x, y], j) => {
            const [nx, ny] = pts[Math.min(pts.length - 1, j + 1)]
            const [px, py] = pts[Math.max(0, j - 1)]
            const dx = nx - px
            const dy = ny - py
            const len = Math.hypot(dx, dy) || 1
            const ww = (w * (1 - j / pts.length)) / 2 + 0.25
            left.push(`${(x - (dy / len) * ww).toFixed(1)} ${(y + (dx / len) * ww).toFixed(1)}`)
            right.push(`${(x + (dy / len) * ww).toFixed(1)} ${(y - (dx / len) * ww).toFixed(1)}`)
          })
          return <path key={i} d={`M${left.join(' L')} L${right.reverse().join(' L')}Z`} fill={level >= 66 ? '#f2c46b' : '#c9a37a'} opacity={level >= 66 ? 0.8 : 0.34} />
        })}
      </g>

      {/* glow behind the crown */}
      <ellipse cx={BASE_X} cy={BASE_Y - H * zoom * 0.62} rx={130 * Math.min(1, (zoom * H) / 200 + 0.3)} ry={120 * Math.min(1, (zoom * H) / 200 + 0.3)} fill="url(#crownglow)" />

      {/* the tree */}
      <g transform={`translate(${BASE_X} ${BASE_Y}) scale(${zoom.toFixed(4)})`} className="tree-root">
        <g>{render(0, 'wood')}</g>
        <g fill={sky.leaf[0]}>{render(0, 'leaf0')}</g>
        <g fill={sky.leaf[1]}>{render(0, 'leaf1')}</g>
        <g fill={sky.leaf[2]} opacity="0.7">{render(0, 'leaf2')}</g>
        <g>{render(0, 'fruit')}</g>
      </g>

      {/* grass tufts at the base */}
      <g fill={sky.leaf[1]} opacity="0.9">
        {[-38, -26, -14, 12, 24, 40].map((x, i) => (
          <path key={i} className="sway" style={{ '--a': '4deg', '--d': `${3 + i * 0.4}s`, '--dl': `${-i}s` } as React.CSSProperties} transform={`translate(${BASE_X + x} ${BASE_Y + 3})`} d="M-2 0 Q-1 -8 0 -12 Q1 -8 2 0Z" />
        ))}
      </g>

      <SceneLife level={level} dark={sky.dark} H={H * zoom} />
    </svg>
  )
}

function FruitMark({ fruit, scale, hit, fresh, onTap }: { fruit: Fruit; scale: number; hit: number; fresh: boolean; onTap?: (vid: string) => void }) {
  const s = Math.min(1.4, Math.max(0.55, scale))
  const dim = fruit.thirsty ? 0.62 : 1
  const [tapped, setTapped] = useState(0)
  return (
    <g
      transform={`scale(${s})`}
      className={`fruit ${fresh ? 'fresh' : ''} ${tapped ? (tapped % 2 ? 'tapped' : 'tapped2') : ''}`}
      onClick={
        onTap
          ? () => {
              setTapped((n) => n + 1)
              onTap(fruit.vid)
            }
          : undefined
      }
      style={{ cursor: onTap ? 'pointer' : undefined }}
      data-vid={fruit.vid}
    >
      {/* generous invisible tap target (~44px on screen) */}
      <circle r={Math.max(16, hit / s)} fill="transparent" />
      <g opacity={dim} className="fruit-inner">
        <path d="M0 -9 L0 -4" stroke="#3a2a20" strokeWidth="1.2" />
        {fruit.stage === 'bud' && (
          <>
            <ellipse cx="0" cy="1" rx="4.6" ry="6.2" fill="url(#g-bud)" />
            <path d="M-4 -3 Q0 -1 4 -3 Q2 -6 0 -5 Q-2 -6 -4 -3Z" fill="#3f8c4a" />
          </>
        )}
        {fruit.stage === 'blossom' && (
          <g className="blossom-spin">
            {[0, 72, 144, 216, 288].map((a) => (
              <ellipse key={a} cx="0" cy="-4.6" rx="3.4" ry="4.8" fill="#ffe8ef" stroke="#f6a7bd" strokeWidth="0.6" transform={`rotate(${a})`} />
            ))}
            <circle r="2.6" fill="#ffcf5a" />
          </g>
        )}
        {fruit.stage === 'fruit' && (
          <>
            <circle r="7.4" fill="url(#g-fruit)" />
            <path d="M1 -7 Q6 -11 9 -8 Q5 -5 1 -7Z" fill="#4c9a52" />
            <ellipse cx="-2.6" cy="-2.8" rx="2" ry="1.3" fill="#fff" opacity="0.55" />
          </>
        )}
        {fruit.stage === 'gold' && (
          <>
            <circle r="16" fill="url(#g-halo)" className="pulse" />
            <circle r="7.6" fill="url(#g-gold)" />
            <path d="M1 -7 Q6 -11 9 -8 Q5 -5 1 -7Z" fill="#6aa84f" />
            <ellipse cx="-2.6" cy="-2.8" rx="2" ry="1.3" fill="#fff" opacity="0.75" />
          </>
        )}
      </g>
    </g>
  )
}

/** Milestone creatures and ambience. */
function SceneLife({ level, dark, H }: { level: number; dark: number; H: number }) {
  const crownY = BASE_Y - H * 0.7
  return (
    <g pointerEvents="none">
      {/* light motes / fireflies */}
      {level >= 14 &&
        Array.from({ length: 12 }, (_, i) => (
          <circle
            key={i}
            className="firefly"
            cx={BASE_X + Math.sin(i * 2.1) * 90}
            cy={crownY + Math.cos(i * 1.7) * 60}
            r={1.6 + (i % 3) * 0.5}
            fill="#fff3a6"
            opacity={0.25 + dark * 0.75}
            style={{ animationDelay: `${-i * 1.3}s`, animationDuration: `${6 + (i % 4)}s` }}
          />
        ))}
      {/* falling petals */}
      {level >= 21 &&
        Array.from({ length: 6 }, (_, i) => (
          <ellipse key={i} className="petal" cx={BASE_X - 60 + i * 26} cy={crownY - 20} rx="2.6" ry="1.6" fill="#ffd3e0" style={{ animationDelay: `${-i * 2.2}s` }} />
        ))}
      {/* butterflies */}
      {level >= 30 &&
        [0, 1].map((i) => (
          <g key={i} opacity={1 - dark * 0.7}>
            <g className="butterfly">
              <path d="M0 0 C-5 -6 -9 -2 -6 2 C-4 4 -1 2 0 0 C1 2 4 4 6 2 C9 -2 5 -6 0 0Z" fill={i ? '#ffd56b' : '#9fd8ff'} />
            </g>
            <animateMotion dur={`${16 + i * 5}s`} repeatCount="indefinite" rotate="0" path={`M${110 + i * 120} ${crownY + 30} C ${60 + i * 200} ${crownY - 120}, ${300 - i * 140} ${crownY - 60}, ${230 - i * 40} ${crownY + 40} S ${140 + i * 80} ${crownY + 90}, ${110 + i * 120} ${crownY + 30}`} />
          </g>
        ))}
      {/* bird */}
      {level >= 7 && (
        <g transform={`translate(${BASE_X + 44} ${BASE_Y - H * 0.42})`} className="bird">
          <path d="M0 0 C 3 -6, 10 -6, 12 -2 L 16 -3 L 12 0 C 10 4, 3 4, 0 0Z" fill="#2b2420" />
          <circle cx="11" cy="-3" r="0.9" fill="#fff" />
          <path d="M3 -1 C 6 -4, 9 -3, 10 -1" stroke="#c9774a" strokeWidth="1.4" fill="none" />
        </g>
      )}
      {/* lantern: Ps 119,105 */}
      {level >= 40 && (
        <g transform={`translate(${BASE_X - 58} ${BASE_Y - H * 0.5})`} className="lantern">
          <line x1="0" y1="-16" x2="0" y2="-4" stroke="#3a2a20" strokeWidth="1" />
          <circle r="22" fill="url(#g-halo)" opacity={0.4 + dark * 0.6} />
          <rect x="-4.5" y="-4" width="9" height="12" rx="2" fill="#ffcf6b" stroke="#6b4a35" strokeWidth="1.2" />
        </g>
      )}
      {/* nest */}
      {level >= 100 && (
        <g transform={`translate(${BASE_X - 20} ${BASE_Y - H * 0.6})`}>
          <ellipse rx="11" ry="5" fill="#6b4a35" />
          <circle cx="-3" cy="-3" r="2.6" fill="#cfe7ff" />
          <circle cx="3" cy="-3" r="2.6" fill="#cfe7ff" />
        </g>
      )}
    </g>
  )
}

export const TreeScene = memo(TreeSceneImpl)
