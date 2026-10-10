import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { VERSE_BY_ID } from '../data/verses'
import { sfx, haptic } from '../lib/audio'
import { useT } from '../lib/i18n'
import { useStore } from '../lib/store'
import { burst, ring } from '../components/Sparkles'
import type { SessionSummary } from './Session'

function useCount(to: number, delay = 0, dur = 900) {
  // start close to the final value: a short, confident count-up (no misleading "7%" flashes)
  const [v, setV] = useState(to * 0.8)
  useEffect(() => {
    let raf = 0
    const t0 = performance.now() + delay
    const tick = (now: number) => {
      const k = Math.min(1, Math.max(0, (now - t0) / dur))
      setV(to * (0.8 + 0.2 * (1 - Math.pow(1 - k, 3))))
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [to, delay, dur])
  return v
}

export function Complete({ summary, grew, onContinue }: { summary: SessionSummary; grew: boolean; onContinue: () => void }) {
  const t = useT()
  const lang = useStore((s) => s.lang)
  const acc = summary.words ? Math.round((summary.correct / summary.words) * 100) : 100
  const words = useCount(Math.round(summary.correct), 500)
  const accV = useCount(acc, 700)
  const flow = useCount(summary.bestFlow, 900)
  const mins = Math.floor(summary.ms / 60000)
  const secs = Math.round((summary.ms % 60000) / 1000)

  useEffect(() => {
    sfx.celebrate()
    haptic('success')
    // confetti bursts out from behind the medal once it has landed
    const id = setTimeout(() => {
      const m = document.querySelector('.medal')?.getBoundingClientRect()
      const x = m ? m.left + m.width / 2 : window.innerWidth / 2
      const y = m ? m.top + m.height / 2 : window.innerHeight * 0.18
      burst(x, y, { count: 34, speed: 6.5, colors: ['#FFE7A3', '#FFF6DE', '#9BE8B4', '#F7A6B9', '#9FD8FF'], kinds: ['dot', 'star', 'leaf'], size: 4.2, up: 3 })
      ring(x, y)
    }, 420)
    return () => clearTimeout(id)
  }, [])

  return (
    <div className="screen complete">
      <div className="complete-glow" />
      <motion.div className="medal" initial={{ scale: 0.2, rotate: -40, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.1 }}>
        <svg viewBox="0 0 120 120" width="132" height="132" aria-hidden>
          <defs>
            <radialGradient id="mg" cx="0.35" cy="0.3">
              <stop offset="0" stopColor="#FFF8E1" />
              <stop offset="0.45" stopColor="#FFD56B" />
              <stop offset="1" stopColor="#C98A1A" />
            </radialGradient>
          </defs>
          <circle cx="60" cy="60" r="56" fill="none" stroke="rgba(255,213,107,.25)" strokeWidth="2" className="spin-slow" strokeDasharray="4 10" />
          <circle cx="60" cy="64" r="34" fill="url(#mg)" />
          <path d="M62 30 Q78 18 90 26 Q76 38 62 30Z" fill="#6aa84f" />
          <path d="M60 30 L60 38" stroke="#5a3d2b" strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="49" cy="52" rx="8" ry="5" fill="#fff" opacity="0.6" />
        </svg>
      </motion.div>
      <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        {summary.free ? t.completeTitleFree : t.completeTitle}
      </motion.h1>

      <motion.div className="stat-row" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <div className="stat">
          <div className="stat-n">{Math.round(words)}</div>
          <div className="stat-l">{t.wordsRecalled}</div>
        </div>
        <div className="stat">
          <div className="stat-n">{Math.round(accV)}%</div>
          <div className="stat-l">{t.accuracy}</div>
        </div>
        <div className="stat">
          <div className="stat-n">{Math.round(flow)}</div>
          <div className="stat-l">{t.bestFlow}</div>
        </div>
      </motion.div>
      <motion.div className="time-pill" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
        {t.time}: {mins}:{String(secs).padStart(2, '0')}
      </motion.div>

      <div className="complete-list">
        {summary.newVids.map((vid, i) => (
          <motion.div key={vid} className="complete-item" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.75 + i * 0.1 }}>
            <span className="ci-icon ci-bud" />
            {t.newOnTree(VERSE_BY_ID[vid].ref[lang])}
          </motion.div>
        ))}
        {summary.reviewed.length > 0 && (
          <motion.div className="complete-item" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.85 + summary.newVids.length * 0.1 }}>
            <span className="ci-icon ci-drop" />
            {t.strengthened(summary.reviewed.length)}
          </motion.div>
        )}
      </div>

      <motion.div className="complete-cta" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0, type: 'spring', stiffness: 260, damping: 24 }}>
        <button className={`btn btn-primary btn-xl ${grew ? 'breathe' : ''}`} onClick={onContinue}>
          {grew ? (
            <>
              <DropIcon /> {t.waterTree}
            </>
          ) : (
            t.backHome
          )}
        </button>
      </motion.div>
    </div>
  )
}

export function DropIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.5c3.6 4.6 6.5 8.3 6.5 11.6A6.5 6.5 0 0 1 5.5 14.1C5.5 10.8 8.4 7.1 12 2.5z" />
    </svg>
  )
}
