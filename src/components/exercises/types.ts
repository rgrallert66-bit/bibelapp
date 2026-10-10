import type { Lang, Verse } from '../../data/verses'
import type { Step } from '../../lib/session'

export interface ExResult {
  words: number
  /** first try = 1, second try = .5, revealed = 0 */
  score: number
  ms: number
  graded: boolean
}

export interface ExProps {
  verse: Verse
  lang: Lang
  step: Step
  onDone: (r: ExResult) => void
  /** feedback hooks – the session turns these into rising notes, haptics and the flow meter */
  onCorrect: (el?: Element | null) => void
  onWrong: () => void
}

export function verseSize(words: number): string {
  if (words <= 10) return 'v-xl'
  if (words <= 18) return 'v-lg'
  if (words <= 28) return 'v-md'
  return 'v-sm'
}
