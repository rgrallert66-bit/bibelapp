import { useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { VERSES } from '../../data/verses'
import { hashStr, rng, shuffle } from '../../lib/text'
import { useT } from '../../lib/i18n'
import { sfx } from '../../lib/audio'
import type { ExProps } from './types'

/** Where is this from? Ties the words to their address (interleaved, very short). */
export function Reference({ verse, lang, step, onDone, onCorrect, onWrong }: ExProps) {
  const t = useT()
  const options = useMemo(() => {
    const r = rng(hashStr(step.key))
    const others = shuffle(
      VERSES.filter((v) => v.id !== verse.id),
      r,
    )
      .sort((a, b) => (a.path === verse.path ? -1 : 0) - (b.path === verse.path ? -1 : 0))
      .slice(0, 3)
    return shuffle([verse, ...others], r)
  }, [verse, step.key])
  const [picked, setPicked] = useState<string | null>(null)
  const [wrong, setWrong] = useState<string[]>([])
  const start = useRef(performance.now())
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})

  const choose = (id: string) => {
    if (picked) return
    if (id === verse.id) {
      setPicked(id)
      onCorrect(refs.current[id])
      sfx.complete(wrong.length === 0)
      setTimeout(() => onDone({ words: 1, score: wrong.length ? 0.5 : 1, ms: performance.now() - start.current, graded: false }), 900)
    } else {
      onWrong()
      setWrong((w) => [...w, id])
    }
  }

  const text = verse.text[lang]
  const teaser = text.split(/\s+/).slice(0, 14).join(' ') + (text.split(/\s+/).length > 14 ? ' …' : '')

  return (
    <div className="ex ex-ref">
      <div className="ex-head">
        <div className="ex-title">{t.referenceTitle}</div>
      </div>
      <div className="verse-scroll">
        <p className="verse v-md quote">„{teaser}“</p>
      </div>
      <div className="ex-foot">
        <div className="options options-col">
          {options.map((v) => (
            <motion.button
              key={v.id}
              ref={(el) => {
                refs.current[v.id] = el
              }}
              className={`option ${picked === v.id ? 'option-right' : ''} ${wrong.includes(v.id) ? 'option-wrong option-dead' : ''}`}
              onPointerDown={(e) => {
                e.preventDefault()
                if (!wrong.includes(v.id)) choose(v.id)
              }}
              animate={wrong.at(-1) === v.id ? { x: [0, -8, 8, -4, 4, 0] } : picked === v.id ? { scale: [1, 1.06, 1] } : {}}
              transition={{ duration: 0.32 }}
            >
              {v.ref[lang]}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}
