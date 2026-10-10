import { useEffect, useRef } from 'react'
import type { Lang } from '../data/verses'
import { normLetter } from '../lib/text'

const LAYOUT: Record<Lang, string[]> = {
  de: ['qwertzuiopü', 'asdfghjklöä', 'yxcvbnm'],
  en: ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'],
}

interface Props {
  lang: Lang
  onKey: (letter: string, el: HTMLElement | null) => void
  /** key the learner just got wrong (flashes) */
  wrongKey?: { k: string; n: number } | null
  /** reveal-help key flashes the right letter after mistakes */
  helpKey?: string | null
  disabled?: boolean
}

/**
 * Custom first-letter keyboard: no OS keyboard jumping in, instant response on pointerdown,
 * tactile press states. Physical keyboards work too.
 */
export function Keyboard({ lang, onKey, wrongKey, helpKey, disabled }: Props) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})
  const onKeyRef = useRef(onKey)
  onKeyRef.current = onKey

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (disabled || e.metaKey || e.ctrlKey || e.altKey || e.key.length !== 1) return
      if (!/\p{L}|\p{N}/u.test(e.key)) return
      e.preventDefault()
      const k = normLetter(e.key)
      const el = refs.current[k] ?? refs.current[e.key.toLowerCase()] ?? null
      if (el) {
        el.classList.remove('pressed')
        void el.offsetWidth
        el.classList.add('pressed')
        setTimeout(() => el.classList.remove('pressed'), 140)
      }
      onKeyRef.current(k, el)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [disabled])

  const wrongNorm = wrongKey ? wrongKey.k : null

  return (
    <div className={`kb ${disabled ? 'kb-off' : ''}`} role="group" aria-label="keyboard">
      {LAYOUT[lang].map((row, ri) => (
        <div className="kb-row" key={ri}>
          {[...row].map((ch) => {
            const n = normLetter(ch)
            const isWrong = wrongNorm === n && ch === [...row].find((c) => normLetter(c) === n)
            return (
              <button
                key={ch + (isWrong ? wrongKey!.n : '')}
                ref={(el) => {
                  if (!refs.current[ch] || ch === n) refs.current[ch] = el
                  if (ch === n) refs.current[n] = el
                }}
                className={`key ${isWrong ? 'key-wrong' : ''} ${helpKey && helpKey === n && ch === n ? 'key-help' : ''}`}
                onPointerDown={(e) => {
                  e.preventDefault()
                  if (disabled) return
                  onKey(n, e.currentTarget)
                }}
                aria-label={ch}
                tabIndex={-1}
              >
                {ch}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
