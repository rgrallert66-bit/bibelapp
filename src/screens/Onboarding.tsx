import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { TRANSLATION, type Lang } from '../data/verses'
import { DICT } from '../lib/i18n'
import { setState, useStore } from '../lib/store'
import { haptic, sfx, unlockAudio } from '../lib/audio'
import { burst, ring } from '../components/Sparkles'

export function Onboarding({ onStart }: { onStart: () => void }) {
  const lang = useStore((s) => s.lang)
  const t = DICT[lang]
  const [phase, setPhase] = useState<'lang' | 'plant' | 'planted'>('lang')

  return (
    <div className="screen onboarding">
      <div className="ob-sky" />
      <AnimatePresence mode="wait">
        {phase === 'lang' && (
          <motion.div key="lang" className="ob-step" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
            <motion.div className="logo" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 180, damping: 16, delay: 0.1 }}>
              <LogoMark />
            </motion.div>
            <motion.h1 className="ob-title" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              Rooted
            </motion.h1>
            <motion.p className="ob-tag" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
              {t.tagline}
            </motion.p>
            <motion.div className="ob-langs" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, type: 'spring', stiffness: 220, damping: 24 }}>
              <div className="ob-label">{t.chooseLang}</div>
              {(['de', 'en'] as Lang[]).map((l) => (
                <button
                  key={l}
                  className={`lang-card ${lang === l ? 'on' : ''}`}
                  onClick={() => {
                    unlockAudio()
                    sfx.correct(l === 'de' ? 4 : 6)
                    haptic('light')
                    setState({ lang: l })
                    setTimeout(() => setPhase('plant'), 260)
                  }}
                >
                  <span className="lang-main">{l === 'de' ? 'Deutsch' : 'English'}</span>
                  <span className="lang-sub">{TRANSLATION[l].name}</span>
                </button>
              ))}
            </motion.div>
          </motion.div>
        )}
        {phase !== 'lang' && (
          <motion.div key="plant" className="ob-step" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <Planter planted={phase === 'planted'} onPlanted={() => setPhase('planted')} label={t.holdToPlant} />
            <AnimatePresence>
              {phase === 'planted' && (
                <motion.div className="ob-after" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, type: 'spring', stiffness: 200, damping: 22 }}>
                  <h2>{t.planted}</h2>
                  <p>{t.firstVerseIntro}</p>
                  <button
                    className="btn btn-primary btn-xl breathe"
                    onClick={() => {
                      sfx.tap()
                      setState({ onboarded: true })
                      onStart()
                    }}
                  >
                    {t.begin}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Planter({ planted, onPlanted, label }: { planted: boolean; onPlanted: () => void; label: string }) {
  const [p, setP] = useState(0)
  const holding = useRef(false)
  const raf = useRef(0)
  const lastNote = useRef(-1)
  const seedRef = useRef<SVGSVGElement>(null)

  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  const loop = (t0: number, p0: number) => (now: number) => {
    const np = Math.min(1, p0 + (now - t0) / 1100)
    setP(np)
    const note = Math.floor(np * 8)
    if (note !== lastNote.current) {
      lastNote.current = note
      sfx.correct(note)
      haptic('light')
    }
    if (np >= 1) {
      holding.current = false
      sfx.celebrate()
      haptic('success')
      const r = seedRef.current?.getBoundingClientRect()
      if (r) {
        burst(r.left + r.width / 2, r.top + r.height * 0.62, { count: 36, speed: 5, colors: ['#9BE8B4', '#FFF3D6', '#FFE7A3'], kinds: ['leaf', 'dot', 'star'], up: 2.5 })
        ring(r.left + r.width / 2, r.top + r.height * 0.62)
      }
      onPlanted()
      return
    }
    if (holding.current) raf.current = requestAnimationFrame(loop(t0, p0))
  }

  const down = (e: React.PointerEvent) => {
    e.preventDefault()
    if (planted) return
    unlockAudio()
    holding.current = true
    lastNote.current = -1
    raf.current = requestAnimationFrame(loop(performance.now(), p))
  }
  const up = () => {
    if (planted || !holding.current) return
    holding.current = false
    cancelAnimationFrame(raf.current)
    // ease back
    const start = performance.now()
    const from = p
    const back = (now: number) => {
      const np = Math.max(0, from - (now - start) / 500)
      setP(np)
      if (np > 0 && !holding.current) raf.current = requestAnimationFrame(back)
    }
    raf.current = requestAnimationFrame(back)
  }

  const C = 2 * Math.PI * 70
  return (
    <div className="planter">
      <motion.svg
        ref={seedRef}
        viewBox="0 0 200 220"
        className="planter-svg"
        onPointerDown={down}
        onPointerUp={up}
        onPointerLeave={up}
        onPointerCancel={up}
        animate={planted ? { scale: 1 } : { scale: 1 + p * 0.06 }}
        style={{ touchAction: 'none' }}
      >
        <defs>
          <radialGradient id="seedg" cx="0.4" cy="0.35">
            <stop offset="0" stopColor="#ffe9b5" />
            <stop offset="0.6" stopColor="#c98a3a" />
            <stop offset="1" stopColor="#7a4a1e" />
          </radialGradient>
          <radialGradient id="seedglow">
            <stop offset="0" stopColor="#ffd56b" stopOpacity="0.55" />
            <stop offset="1" stopColor="#ffd56b" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="soilg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2a2016" />
            <stop offset="1" stopColor="#120d09" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="128" r={60 + p * 30 + (planted ? 20 : 0)} fill="url(#seedglow)" opacity={0.4 + p * 0.6} />
        <circle cx="100" cy="128" r="70" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="3" />
        <circle cx="100" cy="128" r="70" fill="none" stroke="#ffd56b" strokeWidth="3.5" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - (planted ? 1 : p))} transform="rotate(-90 100 128)" opacity={planted ? 0 : 1} style={{ transition: 'opacity .6s' }} />
        <ellipse cx="100" cy="160" rx="62" ry="14" fill="url(#soilg)" />
        {planted ? (
          <g>
            <motion.path d="M100 160 C 100 140, 98 120, 101 100" stroke="#6fcf7d" strokeWidth="5" fill="none" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }} />
            <motion.path d="M101 104 C 84 92, 72 98, 68 106 C 82 114, 94 110, 101 104Z" fill="#6fcf7d" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ transformOrigin: '101px 104px' }} transition={{ delay: 0.6, type: 'spring', stiffness: 260, damping: 14 }} />
            <motion.path d="M101 100 C 116 84, 130 88, 136 96 C 124 108, 110 106, 101 100Z" fill="#8fe3a6" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ transformOrigin: '101px 100px' }} transition={{ delay: 0.75, type: 'spring', stiffness: 260, damping: 14 }} />
          </g>
        ) : (
          <motion.ellipse cx="100" cy={150 - p * 6} rx="13" ry="17" fill="url(#seedg)" animate={{ rotate: p > 0 ? [0, -3, 3, 0] : 0 }} transition={{ repeat: p > 0 ? Infinity : 0, duration: 0.3 }} style={{ transformOrigin: '100px 150px' }} />
        )}
      </motion.svg>
      <AnimatePresence>
        {!planted && (
          <motion.div className="planter-label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function LogoMark({ size = 84 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <defs>
        <radialGradient id="lg" cx="0.4" cy="0.3">
          <stop offset="0" stopColor="#fff6dc" />
          <stop offset="0.5" stopColor="#ffd56b" />
          <stop offset="1" stopColor="#d18f22" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill="#0f2219" stroke="rgba(255,213,107,.35)" strokeWidth="1.5" />
      <path d="M50 74 L50 46" stroke="#e9c486" strokeWidth="4" strokeLinecap="round" />
      <path d="M50 74 C 42 80, 36 82, 30 84 M50 74 C 58 80, 64 82, 70 84 M50 74 L50 86" stroke="#e9c486" strokeOpacity="0.6" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <circle cx="50" cy="36" r="17" fill="#2f8a57" />
      <circle cx="40" cy="44" r="11" fill="#1f5a3d" />
      <circle cx="61" cy="43" r="12" fill="#3f9c66" />
      <circle cx="56" cy="38" r="5.5" fill="url(#lg)" />
    </svg>
  )
}
