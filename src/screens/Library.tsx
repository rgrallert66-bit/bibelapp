import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { PATHS, VERSES } from '../data/verses'
import { useT } from '../lib/i18n'
import { cardKey, getState, stageOf, useStore, type Stage } from '../lib/store'
import { sfx } from '../lib/audio'
import { nextNewVerses } from '../lib/session'

export function StageIcon({ stage, size = 18 }: { stage: Stage | null; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="-10 -10 20 20" aria-hidden className="stage-icon">
      {stage === null && <circle r="3.2" fill="none" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1.4" strokeDasharray="2 2" />}
      {stage === 'bud' && <ellipse rx="3.6" ry="5" fill="#8fd48a" />}
      {stage === 'blossom' &&
        [0, 72, 144, 216, 288].map((a) => <ellipse key={a} cy="-3.8" rx="2.8" ry="3.8" fill="#ffe1ea" transform={`rotate(${a})`} />)}
      {stage === 'blossom' && <circle r="2" fill="#ffcf5a" />}
      {stage === 'fruit' && <circle r="6" fill="#ff7a59" />}
      {stage === 'gold' && <circle r="6.4" fill="#ffd56b" stroke="#fff3c4" strokeWidth="1" />}
    </svg>
  )
}

export function Library({ onVerse }: { onVerse: (vid: string) => void }) {
  const t = useT()
  const lang = useStore((s) => s.lang)
  const cards = useStore((s) => s.cards)
  useStore((s) => s.next) // re-render when the queue changes
  const [open, setOpen] = useState<string | null>('start')
  const upcoming = nextNewVerses(getState(), 1, lang)[0]

  return (
    <div className="screen library scroll">
      <header className="page-head">
        <h1>{t.libraryTitle}</h1>
        <p>{t.librarySub}</p>
      </header>
      <div className="paths">
        {PATHS.map((p, pi) => {
          const vs = VERSES.filter((v) => v.path === p.id)
          const learned = vs.filter((v) => cards[cardKey(lang, v.id)]).length
          const isOpen = open === p.id
          return (
            <motion.div
              key={p.id}
              className={`path ${isOpen ? 'path-open' : ''}`}
              style={{ '--h': p.hue } as React.CSSProperties}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: pi * 0.04 }}
            >
              <button
                className="path-head"
                onClick={() => {
                  sfx.tap()
                  setOpen(isOpen ? null : p.id)
                }}
                aria-expanded={isOpen}
              >
                <span className="path-icon">
                  <PathIcon icon={p.icon} />
                </span>
                <span className="path-txt">
                  <span className="path-title">{p.title[lang]}</span>
                  <span className="path-sub">{p.subtitle[lang]}</span>
                </span>
                <Ring value={learned / vs.length} label={`${learned}/${vs.length}`} />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.ul className="verse-list" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}>
                    {vs.map((v) => {
                      const c = cards[cardKey(lang, v.id)]
                      return (
                        <li key={v.id}>
                          <button className="verse-row" onClick={() => { sfx.tap(); onVerse(v.id) }}>
                            <StageIcon stage={c ? stageOf(c) : null} />
                            <span className="vr-txt">
                              <span className="vr-ref">
                                {v.ref[lang]}
                                {!c && upcoming === v.id && <span className="tag-next">{t.queued}</span>}
                              </span>
                              <span className="vr-text">{v.text[lang]}</span>
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </motion.ul>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>
      <div className="tabbar-spacer" />
    </div>
  )
}

function Ring({ value, label }: { value: number; label: string }) {
  const C = 2 * Math.PI * 15
  return (
    <span className="ring">
      <svg width="42" height="42" viewBox="0 0 40 40" aria-hidden>
        <circle cx="20" cy="20" r="15" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="3.5" />
        <motion.circle cx="20" cy="20" r="15" fill="none" stroke="hsl(var(--h) 70% 68%)" strokeWidth="3.5" strokeLinecap="round" transform="rotate(-90 20 20)" strokeDasharray={C} initial={{ strokeDashoffset: C }} animate={{ strokeDashoffset: C * (1 - value) }} transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }} />
      </svg>
      <span className="ring-l">{label}</span>
    </span>
  )
}

export function PathIcon({ icon }: { icon: string }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      {icon === 'seed' && <path {...p} d="M12 21v-7M12 14c0-4 3-7 7-7 0 4-3 7-7 7zM12 16c0-3-2.5-5.5-6-5.5 0 3 2.5 5.5 6 5.5z" />}
      {icon === 'shield' && <path {...p} d="M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6l7-3z" />}
      {icon === 'dove' && <path {...p} d="M3 13c4 0 6-2 7-5 1 3 3 4 6 4l5-4-2 6c-1 4-5 6-9 6-3 0-5-1-7-3l4-1c-2-1-3-2-4-3z" />}
      {icon === 'heart' && <path {...p} d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />}
      {icon === 'fruit' && <path {...p} d="M12 8c-4-2-8 1-7 6s4 7 7 6c3 1 6-1 7-6s-3-8-7-6zM12 8c0-2 1-4 3-5" />}
      {icon === 'lamp' && <path {...p} d="M9 18h6M10 21h4M8 10a4 4 0 1 1 8 0c0 2-1 3-2 4H10c-1-1-2-2-2-4zM12 2v1" />}
      {icon === 'star' && <path {...p} d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.3 6L12 16.4 6.6 19.4l1.3-6L3.4 9.3l6-.7z" />}
    </svg>
  )
}
