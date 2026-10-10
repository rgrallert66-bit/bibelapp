import { useEffect, useRef } from 'react'

// One full-screen canvas for all particle effects. Idle when nothing is flying (no rAF loop).

interface P {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  size: number
  color: string
  kind: 'dot' | 'leaf' | 'ring' | 'star'
  rot: number
  vr: number
}

let particles: P[] = []
let kick: (() => void) | null = null

export interface BurstOpts {
  count?: number
  colors?: string[]
  spread?: number
  speed?: number
  kinds?: P['kind'][]
  gravity?: number
  size?: number
  up?: number
}

const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export function burst(x: number, y: number, o: BurstOpts = {}) {
  if (reduced) return
  const colors = o.colors ?? ['#F7D488', '#FFF3D6', '#9BE8B4']
  const count = o.count ?? 10
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2
    const sp = (o.speed ?? 3.2) * (0.4 + Math.random() * 0.8)
    const kinds = o.kinds ?? ['dot', 'dot', 'star']
    particles.push({
      x: x + (Math.random() - 0.5) * (o.spread ?? 10),
      y: y + (Math.random() - 0.5) * (o.spread ?? 10),
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - (o.up ?? 1.2),
      life: 0,
      max: 38 + Math.random() * 26,
      size: (o.size ?? 3) * (0.6 + Math.random() * 0.8),
      color: colors[Math.floor(Math.random() * colors.length)],
      kind: kinds[Math.floor(Math.random() * kinds.length)],
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
    })
  }
  kick?.()
}

export function ring(x: number, y: number, color = 'rgba(247,212,136,0.9)') {
  if (reduced) return
  particles.push({ x, y, vx: 0, vy: 0, life: 0, max: 26, size: 6, color, kind: 'ring', rot: 0, vr: 0 })
  kick?.()
}

/** Burst centred on a DOM element. */
export function burstAt(el: Element | null, o: BurstOpts = {}) {
  if (!el) return
  const r = el.getBoundingClientRect()
  burst(r.left + r.width / 2, r.top + r.height / 2, o)
}

export function Sparkles() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = ref.current!
    const ctx = cv.getContext('2d')!
    let raf = 0
    let running = false
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const resize = () => {
      cv.width = window.innerWidth * dpr
      cv.height = window.innerHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const frame = () => {
      ctx.clearRect(0, 0, cv.width, cv.height)
      ctx.globalCompositeOperation = 'lighter'
      particles = particles.filter((p) => p.life < p.max)
      for (const p of particles) {
        p.life++
        p.x += p.vx
        p.y += p.vy
        p.vx *= 0.94
        p.vy = p.vy * 0.94 + 0.09
        p.rot += p.vr
        const k = 1 - p.life / p.max
        ctx.globalAlpha = Math.max(0, k)
        ctx.fillStyle = p.color
        ctx.strokeStyle = p.color
        if (p.kind === 'dot') {
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * (0.5 + k * 0.5), 0, Math.PI * 2)
          ctx.fill()
        } else if (p.kind === 'star') {
          ctx.save()
          ctx.translate(p.x, p.y)
          ctx.rotate(p.rot)
          const s = p.size * 1.6 * (0.4 + k * 0.6)
          ctx.beginPath()
          ctx.moveTo(0, -s)
          ctx.quadraticCurveTo(0, 0, s, 0)
          ctx.quadraticCurveTo(0, 0, 0, s)
          ctx.quadraticCurveTo(0, 0, -s, 0)
          ctx.quadraticCurveTo(0, 0, 0, -s)
          ctx.fill()
          ctx.restore()
        } else if (p.kind === 'leaf') {
          ctx.save()
          ctx.translate(p.x, p.y)
          ctx.rotate(p.rot)
          ctx.beginPath()
          ctx.ellipse(0, 0, p.size * 1.6, p.size * 0.7, 0, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        } else {
          ctx.lineWidth = 2 * k
          ctx.beginPath()
          ctx.arc(p.x, p.y, 8 + (1 - k) * 34, 0, Math.PI * 2)
          ctx.stroke()
        }
      }
      ctx.globalAlpha = 1
      if (particles.length) raf = requestAnimationFrame(frame)
      else {
        running = false
        ctx.clearRect(0, 0, cv.width, cv.height)
      }
    }
    kick = () => {
      if (running) return
      running = true
      raf = requestAnimationFrame(frame)
    }
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      kick = null
    }
  }, [])
  return <canvas ref={ref} className="sparkles" aria-hidden />
}
