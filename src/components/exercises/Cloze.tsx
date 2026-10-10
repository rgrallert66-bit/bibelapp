import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { VERSES } from '../../data/verses'
import { clozeTargets, hashStr, rng, shuffle, tokenize } from '../../lib/text'
import { useT } from '../../lib/i18n'
import { sfx } from '../../lib/audio'
import { verseSize, type ExProps } from './types'
import { ResultBanner } from './WordRecall'

/** Fill the gaps: a quick generation exercise on the content words. */
export function Cloze({ verse, lang, step, onDone, onCorrect, onWrong }: ExProps) {
  const t = useT()
  const tokens = useMemo(() => tokenize(verse.text[lang]), [verse, lang])
  const targets = useMemo(() => clozeTargets(tokens, 0.28, hashStr(step.key)), [tokens, step.key])
  const words = tokens.filter((x) => x.wi >= 0)
  const [pos, setPos] = useState(0)
  const [errs, setErrs] = useState(0)
  const [wrong, setWrong] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const start = useRef(performance.now())
  const blankRef = useRef<HTMLSpanElement>(null)

  const options = useMemo(() => {
    if (pos >= targets.length) return []
    const r = rng(hashStr(step.key) + pos)
    const correct = words[targets[pos]].word
    const pool = new Set<string>()
    const lower = (s: string) => s.toLowerCase()
    // distractors: other words from this verse first (plausible), then from other verses
    for (const w of shuffle(words, r)) if (lower(w.word) !== lower(correct) && w.word.length > 2) pool.add(w.word)
    const others = shuffle(VERSES, r).flatMap((v) => tokenize(v.text[lang]).filter((x) => x.wi >= 0 && Math.abs(x.word.length - correct.length) <= 2))
    for (const w of others) if (lower(w.word) !== lower(correct)) pool.add(w.word)
    const distract = [...pool].sort((a, b) => Math.abs(a.length - correct.length) - Math.abs(b.length - correct.length) + (r() - 0.5) * 3).slice(0, 2)
    return shuffle([correct, ...distract], r)
  }, [pos, targets, words, step.key, lang])

  const choose = (w: string) => {
    if (done) return
    const correct = words[targets[pos]].word
    if (w === correct) {
      onCorrect(blankRef.current)
      setWrong(null)
      if (pos + 1 >= targets.length) {
        setPos(pos + 1)
        setDone(true)
        sfx.complete(errs === 0)
        setTimeout(() => onDone({ words: targets.length, score: targets.length - errs, ms: performance.now() - start.current, graded: false }), 1150)
      } else setPos(pos + 1)
    } else {
      onWrong()
      setErrs((e) => e + 1)
      setWrong(w)
    }
  }

  return (
    <div className="ex ex-cloze">
      <div className="ex-head">
        <div className="ex-title">{t.clozeTitle}</div>
        <div className="ref-chip">{verse.ref[lang]}</div>
      </div>
      <div className="verse-scroll">
        <p className={`verse ${verseSize(words.length)}`}>
          {tokens.map((tok, i) => {
            const ti = targets.indexOf(tok.wi)
            if (ti < 0) return <span key={i} className={`w ${done ? 'w-wave' : ''}`}>{tok.text} </span>
            const filled = ti < pos
            const current = ti === pos
            const pre = tok.text.slice(0, tok.text.indexOf(tok.word))
            const post = tok.text.slice(tok.text.indexOf(tok.word) + tok.word.length)
            return (
              <span key={i}>
                {pre}
                {filled ? (
                  <motion.span className="w w-ok w-filled" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 600, damping: 20 }}>
                    {tok.word}
                  </motion.span>
                ) : (
                  <span ref={current ? blankRef : undefined} className={`w w-hidden blank ${current ? 'w-current' : ''}`}>
                    {tok.word}
                  </span>
                )}
                {post}{' '}
              </span>
            )
          })}
        </p>
      </div>
      <div className="ex-foot">
        {done ? (
          <ResultBanner score={targets.length - errs} total={targets.length} perfect={errs === 0} />
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.div key={pos} className="options" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.22 }}>
              {options.map((o) => (
                <motion.button
                  key={o}
                  className={`option ${wrong === o ? 'option-wrong' : ''}`}
                  onPointerDown={(e) => {
                    e.preventDefault()
                    choose(o)
                  }}
                  animate={wrong === o ? { x: [0, -8, 8, -4, 4, 0] } : { x: 0 }}
                  transition={{ duration: 0.3 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {o}
                </motion.button>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
