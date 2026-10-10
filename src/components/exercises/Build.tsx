import { useEffect, useMemo, useRef, useState } from 'react'
import { LayoutGroup, motion } from 'motion/react'
import { chunk, hashStr, rng, shuffle, tokenize } from '../../lib/text'
import { useT } from '../../lib/i18n'
import { sfx } from '../../lib/audio'
import { burstAt } from '../Sparkles'
import { verseSize, type ExProps } from './types'
import { ResultBanner } from './WordRecall'

interface Piece {
  id: number
  text: string
}

/** Put the phrases (or words for short verses) back in order – recognition with active sequencing. */
export function Build({ verse, lang, step, onDone, onCorrect, onWrong }: ExProps) {
  const t = useT()
  const pieces: Piece[] = useMemo(() => {
    const words = tokenize(verse.text[lang]).filter((x) => x.wi >= 0).length
    const parts = words <= 9 ? verse.text[lang].split(/\s+/) : chunk(verse.text[lang])
    return parts.map((text, id) => ({ id, text }))
  }, [verse, lang])
  const order = useMemo(() => {
    const r = rng(hashStr(step.key))
    let o = shuffle(pieces, r)
    for (let i = 0; i < 4 && o.every((p, j) => p.id === j); i++) o = shuffle(pieces, r)
    return o
  }, [pieces, step.key])

  const [placed, setPlaced] = useState<number[]>([])
  const [errors, setErrors] = useState<Set<number>>(new Set())
  const [shakeId, setShakeId] = useState<{ id: number; n: number } | null>(null)
  const [done, setDone] = useState<null | { score: number }>(null)
  const start = useRef(performance.now())
  const placedRefs = useRef<Record<number, HTMLElement | null>>({})
  const [wrongId, setWrongId] = useState<number | null>(null)
  useEffect(() => {
    if (wrongId == null) return
    const id = setTimeout(() => setWrongId(null), 380)
    return () => clearTimeout(id)
  }, [wrongId, shakeId])

  const pick = (p: Piece) => {
    if (done) return
    const nextIdx = placed.length
    const expected = pieces[nextIdx]
    if (p.text === expected.text) {
      // identical texts are interchangeable
      const np = [...placed, p.id]
      // feedback (sound, haptics, flow) now; particles fire where the piece lands
      onCorrect(null)
      setPlaced(np)
      if (np.length === pieces.length) {
        const score = pieces.length - errors.size
        setDone({ score })
        sfx.complete(errors.size === 0)
        setTimeout(() => onDone({ words: pieces.length, score, ms: performance.now() - start.current, graded: false }), 1150)
      }
    } else {
      onWrong()
      setErrors((e) => new Set(e).add(nextIdx))
      setShakeId({ id: p.id, n: Date.now() })
      setWrongId(p.id)
    }
  }

  const placedPieces = placed.map((id) => pieces.find((p) => p.id === id)!)
  const words = verse.text[lang].split(/\s+/).length

  return (
    <div className="ex ex-build">
      <div className="ex-head">
        <div className="ex-title">{t.buildTitle}</div>
        <div className="ref-chip">{verse.ref[lang]}</div>
      </div>
      <LayoutGroup>
        <div className="verse-scroll">
          <p className={`verse build-target ${verseSize(words)}`}>
            {placedPieces.map((p) => (
              <motion.span
                layoutId={`piece-${p.id}`}
                key={p.id}
                ref={(el) => {
                  placedRefs.current[p.id] = el
                }}
                className={`placed ${done ? 'w-wave' : ''}`}
                style={done ? { animationDelay: `${p.id * 50}ms` } : undefined}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                onLayoutAnimationComplete={() => {
                  const el = placedRefs.current[p.id]
                  if (!el || el.dataset.landed) return
                  el.dataset.landed = '1'
                  el.classList.add('placed-land')
                  burstAt(el, { count: 10, speed: 2.6, size: 4, colors: ['#F7D488', '#FFF3D6', '#FFE7A3'] })
                }}
              >
                {p.text}
              </motion.span>
            ))}
            {!done && <span className="caret" />}
          </p>
        </div>
        <div className="ex-foot">
          {done ? (
            <ResultBanner score={done.score} total={pieces.length} perfect={done.score === pieces.length} />
          ) : (
            <div className={`tiles ${pieces.length > 6 ? 'tiles-words' : ''}`}>
              {order.map((p) =>
                placed.includes(p.id) ? (
                  <span key={p.id} className="tile tile-ghost" aria-hidden>
                    {p.text}
                  </span>
                ) : (
                  <motion.button
                    key={p.id}
                    layoutId={`piece-${p.id}`}
                    className={`tile ${wrongId === p.id ? 'tile-wrong' : ''}`}
                    onPointerDown={(e) => {
                      e.preventDefault()
                      pick(p)
                    }}
                    animate={shakeId?.id === p.id ? { x: [0, -5, 5, -3, 3, 0] } : { x: 0 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 28, x: { duration: 0.3 } }}
                    whileTap={{ scale: 0.94 }}
                  >
                    {p.text}
                  </motion.button>
                ),
              )}
            </div>
          )}
        </div>
      </LayoutGroup>
    </div>
  )
}
