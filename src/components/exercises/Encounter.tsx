import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { chunk } from '../../lib/text'
import { useT } from '../../lib/i18n'
import { haptic, sfx, speak } from '../../lib/audio'
import { burstAt } from '../Sparkles'
import { verseSize, type ExProps } from './types'

/** First contact: the verse unfolds phrase by phrase at the learner's own pace. */
export function Encounter({ verse, lang, onDone }: ExProps) {
  const t = useT()
  const chunks = useMemo(() => chunk(verse.text[lang]), [verse, lang])
  const [shown, setShown] = useState(1)
  const [speaking, setSpeaking] = useState(false)
  const start = useRef(performance.now())
  const all = shown >= chunks.length
  const words = verse.text[lang].split(/\s+/).length
  const lastRef = useRef<HTMLSpanElement>(null)

  const next = () => {
    if (all) return
    setShown((n) => n + 1)
    sfx.correct(shown + 2)
    haptic('light')
    requestAnimationFrame(() => burstAt(lastRef.current, { count: 5, speed: 1.6, size: 2.2 }))
  }

  const listen = () => {
    setShown(chunks.length)
    setSpeaking(true)
    const ok = speak(verse.text[lang], lang, () => setSpeaking(false))
    if (!ok) setSpeaking(false)
  }

  return (
    <div className="ex ex-encounter" onClick={next}>
      <div className="ex-head">
        <div className="ex-title">{t.encounterTitle}</div>
      </div>
      <motion.div className="enc-ref" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        {verse.ref[lang]}
      </motion.div>
      <div className="verse-scroll">
        <p className={`verse ${verseSize(words)}`}>
          {chunks.map((c, i) => (
            <motion.span
              key={i}
              ref={i === shown - 1 ? lastRef : undefined}
              className={`chunk ${i < shown ? 'chunk-on' : 'chunk-off'} ${i === shown - 1 && !all ? 'chunk-new' : ''}`}
              initial={false}
              animate={i < shown ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 0.08, y: 4, filter: 'blur(5px)' }}
              transition={{ duration: 0.55, ease: [0.2, 0.8, 0.2, 1] }}
            >
              {c}{' '}
            </motion.span>
          ))}
        </p>
      </div>
      <div className="ex-foot enc-foot">
        <AnimatePresence mode="wait">
          {!all ? (
            <motion.div key="tap" className="tap-hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <span className="tap-dot" /> {t.encounterTap}
            </motion.div>
          ) : (
            <motion.div key="done" className="enc-done" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 26 }}>
              <div className="core">
                <span className="core-mark">✦</span> {verse.core[lang]}
              </div>
              <div className="row gap">
                <button
                  className={`btn btn-ghost ${speaking ? 'is-on' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    listen()
                  }}
                >
                  <IconSpeaker /> {t.listen}
                </button>
                <button
                  className="btn btn-primary grow"
                  onClick={(e) => {
                    e.stopPropagation()
                    window.speechSynthesis?.cancel()
                    sfx.tap()
                    onDone({ words: 0, score: 0, ms: performance.now() - start.current, graded: false })
                  }}
                >
                  {t.gotIt}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export function IconSpeaker() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M11 5 6 9H3v6h3l5 4V5z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  )
}
