import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { Keyboard } from '../Keyboard'
import { hintMask, hashStr, tokenize } from '../../lib/text'
import { useT, pick } from '../../lib/i18n'
import { sfx } from '../../lib/audio'
import { verseSize, type ExProps } from './types'

type WS = 'hidden' | 'ok' | 'ok2' | 'missed'

/**
 * The core loop: type the first letter of each word. Every correct key reveals a word with a pop and
 * a rising note. Hints fade from step to step (vanishing cues) until the verse comes from memory alone.
 */
export function WordRecall({ verse, lang, step, onDone, onCorrect, onWrong }: ExProps) {
  const t = useT()
  const tokens = useMemo(() => tokenize(verse.text[lang]), [verse, lang])
  const words = useMemo(() => tokens.filter((x) => x.wi >= 0), [tokens])
  const mask = useMemo(() => hintMask(tokens, step.hint, hashStr(step.key)), [tokens, step])
  const [states, setStates] = useState<WS[]>(() => words.map(() => 'hidden'))
  const [idx, setIdx] = useState(0)
  const [miss, setMiss] = useState(0)
  const [wrongKey, setWrongKey] = useState<{ k: string; n: number } | null>(null)
  const [finished, setFinished] = useState<null | { score: number; perfect: boolean }>(null)
  const [shake, setShake] = useState(0)
  const start = useRef(performance.now())
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([])
  const doneRef = useRef(false)

  useEffect(() => {
    const el = wordRefs.current[idx]
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [idx])

  const finish = (st: WS[]) => {
    if (doneRef.current) return
    doneRef.current = true
    const score = st.reduce((a, s) => a + (s === 'ok' ? 1 : s === 'ok2' ? 0.5 : 0), 0)
    const perfect = score === words.length
    const ms = performance.now() - start.current
    setFinished({ score, perfect })
    sfx.complete(perfect)
    setTimeout(() => onDone({ words: words.length, score, ms, graded: true }), perfect ? 1250 : 1500)
  }

  const advance = (st: WS[]) => {
    setStates(st)
    setMiss(0)
    if (idx + 1 >= words.length) finish(st)
    else setIdx(idx + 1)
  }

  const onKey = (k: string) => {
    if (finished) return
    const w = words[idx]
    if (!w) return
    if (k === w.key) {
      const st = states.slice()
      st[idx] = miss === 0 ? 'ok' : 'ok2'
      onCorrect(wordRefs.current[idx])
      advance(st)
    } else {
      setWrongKey({ k, n: Date.now() })
      setShake((s) => s + 1)
      onWrong()
      if (miss >= 1) {
        const st = states.slice()
        st[idx] = 'missed'
        advance(st)
      } else setMiss(1)
    }
  }

  const reveal = () => {
    if (finished) return
    sfx.tap()
    onWrong()
    const st = states.slice()
    st[idx] = 'missed'
    advance(st)
  }

  const title = step.kind === 'type' ? t.typeTitle : step.final ? t.recallTitleFinal : t.recallTitle

  return (
    <div className="ex ex-recall">
      <div className="ex-head">
        <div className="ex-title">{title}</div>
        <div className="ref-chip">{verse.ref[lang]}</div>
      </div>

      <div className="verse-scroll">
        <p className={`verse ${verseSize(words.length)}`}>
          {tokens.map((tok, i) => {
            if (tok.wi < 0) return <span key={i} className="w w-punct">{tok.text} </span>
            const s = states[tok.wi]
            const current = tok.wi === idx && !finished
            if (s === 'hidden') {
              const showGhost = mask[tok.wi]
              const firstLetterCue = current && miss > 0
              return (
                <span key={i}>
                  <motion.span
                    ref={(el) => {
                      wordRefs.current[tok.wi] = el
                    }}
                    className={`w w-hidden ${current ? 'w-current' : ''} ${showGhost ? 'w-ghost' : ''}`}
                    animate={current && shake ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
                    transition={{ duration: 0.32 }}
                    key={current ? `c${shake}` : 'h'}
                  >
                    {firstLetterCue ? (
                      <>
                        <span className="cue">{tok.text[0] === tok.word[0] ? tok.text[0] : tok.text.slice(0, tok.text.indexOf(tok.word[0]) + 1)}</span>
                        <span className="invis">{tok.text.slice(tok.text.indexOf(tok.word[0]) + 1)}</span>
                      </>
                    ) : (
                      tok.text
                    )}
                  </motion.span>{' '}
                </span>
              )
            }
            return (
              <span key={i}>
                <motion.span
                  ref={(el) => {
                    wordRefs.current[tok.wi] = el
                  }}
                  className={`w w-${s} ${finished ? 'w-wave' : ''}`}
                  style={finished ? { animationDelay: `${tok.wi * 28}ms` } : undefined}
                  initial={{ scale: 0.6, opacity: 0, y: 6, filter: 'blur(4px)' }}
                  animate={{ scale: 1, opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ type: 'spring', stiffness: 700, damping: 22, mass: 0.6 }}
                >
                  {tok.text}
                </motion.span>{' '}
              </span>
            )
          })}
        </p>
      </div>

      <div className="ex-foot">
        {finished ? (
          <ResultBanner score={finished.score} total={words.length} perfect={finished.perfect} />
        ) : (
          <div className="recall-tools">
            <div className="progress-words">
              {idx}/{words.length}
            </div>
            <button className="ghost-btn" onClick={reveal}>
              <IconBulb /> {t.hint}
            </button>
          </div>
        )}
        <Keyboard lang={lang} onKey={onKey} wrongKey={wrongKey} disabled={!!finished} />
      </div>
    </div>
  )
}

export function ResultBanner({ score, total, perfect }: { score: number; total: number; perfect: boolean }) {
  const t = useT()
  const ratio = total ? score / total : 1
  const [label] = useState(() => (perfect ? pick(t.praise) : ratio >= 0.85 ? pick(t.good) : pick(t.ok)))
  return (
    <motion.div
      className={`result-banner ${perfect ? 'rb-perfect' : ratio >= 0.85 ? 'rb-good' : 'rb-ok'}`}
      initial={{ y: 24, opacity: 0, scale: 0.9 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 420, damping: 24 }}
    >
      <span className="rb-label">{label}</span>
      <span className="rb-sub">{perfect ? `${total}/${total}` : t.wordsOf(Math.round(score * 10) / 10, total)}</span>
    </motion.div>
  )
}

export function IconBulb() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V17h6v-.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z" />
    </svg>
  )
}
