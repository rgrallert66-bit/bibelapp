import { useCallback, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { VERSE_BY_ID } from '../data/verses'
import { haptic, sfx } from '../lib/audio'
import { useT } from '../lib/i18n'
import { recordRecall, recordWords, type Plan, type Step } from '../lib/session'
import { useStore } from '../lib/store'
import { burstAt, ring } from '../components/Sparkles'
import { Encounter } from '../components/exercises/Encounter'
import { Build } from '../components/exercises/Build'
import { Cloze } from '../components/exercises/Cloze'
import { WordRecall } from '../components/exercises/WordRecall'
import { Reference } from '../components/exercises/Reference'
import type { ExProps, ExResult } from '../components/exercises/types'
import { KbContext, type KbApi } from '../components/exercises/kb'
import { Keyboard } from '../components/Keyboard'

export interface SessionSummary {
  words: number
  correct: number
  ms: number
  newVids: string[]
  reviewed: string[]
  perfectVerses: number
  bestFlow: number
  free: boolean
}

const EX: Record<Step['kind'], (p: ExProps) => React.JSX.Element> = {
  encounter: Encounter,
  build: Build,
  cloze: Cloze,
  type: WordRecall,
  recall: WordRecall,
  reference: Reference,
}

export function Session({ plan, onExit, onFinish }: { plan: Plan; onExit: () => void; onFinish: (s: SessionSummary) => void }) {
  const t = useT()
  const lang = useStore((s) => s.lang)
  const [steps, setSteps] = useState<Step[]>(plan.steps)
  const [i, setI] = useState(0)
  const [flow, setFlow] = useState(0)
  const [confirmQuit, setConfirmQuit] = useState(false)
  const stats = useRef({ words: 0, correct: 0, ms: 0, perfect: 0, bestFlow: 0, reviewed: new Set<string>() })
  const flowRef = useRef(0)
  const keyFn = useRef<((k: string, el: HTMLElement | null) => void) | null>(null)
  const [kbWrong, setKbWrong] = useState<{ k: string; n: number } | null>(null)
  const [kbDisabled, setKbDisabled] = useState(false)
  const kbApi: KbApi = useMemo(
    () => ({
      bind: (fn) => {
        keyFn.current = fn
      },
      unbind: (fn) => {
        if (keyFn.current === fn) keyFn.current = null
      },
      setWrong: (k) => setKbWrong({ k, n: Date.now() }),
      setDisabled: setKbDisabled,
    }),
    [],
  )

  const step = steps[i]
  const verse = step ? VERSE_BY_ID[step.vid] : null

  const onCorrect = useCallback((el?: Element | null) => {
    flowRef.current += 1
    const f = flowRef.current
    setFlow(f)
    stats.current.bestFlow = Math.max(stats.current.bestFlow, f)
    const big = f > 0 && f % 10 === 0
    // the melody climbs with the streak and resolves into a chord every 10 in a row
    if (big) sfx.chord(Math.min(3, f / 10 - 1))
    else sfx.correct(Math.min(14, (f % 10) + Math.min(4, Math.floor(f / 10) * 2)))
    haptic(big ? 'success' : 'light')
    if (el) {
      burstAt(el, {
        count: big ? 26 : 9,
        speed: big ? 5 : 2.8,
        colors: big ? ['#FFE7A3', '#FFF6DE', '#9BE8B4', '#F7A6B9'] : ['#F7D488', '#FFF3D6', '#FFE7A3'],
        size: big ? 4.6 : 3.6,
      })
      if (big) {
        const r = el.getBoundingClientRect()
        ring(r.left + r.width / 2, r.top + r.height / 2)
      }
    }
  }, [])

  const onWrong = useCallback(() => {
    flowRef.current = 0
    setFlow(0)
    sfx.wrong()
    haptic('error')
  }, [])

  const onDone = (r: ExResult) => {
    if (!step) return
    stats.current.ms += r.ms
    if (r.words) {
      stats.current.words += r.words
      stats.current.correct += r.score
      recordWords(r.words, r.score, r.ms)
    }
    if (r.graded && r.score === r.words) stats.current.perfect++
    let nextSteps = steps
    if (step.kind === 'recall' && (step.final || step.review)) {
      const rating = recordRecall(step, { vid: step.vid, words: r.words, score: r.score, ms: r.ms })
      if (step.review) stats.current.reviewed.add(step.vid)
      // Retrieval failed: re-study with support a little later in this session (successive relearning).
      if (rating === 1 && !step.relearn) {
        const relearn: Step = { key: `${step.key}-rl`, kind: 'type', vid: step.vid, hint: 0.5, review: true, relearn: true }
        nextSteps = [...steps]
        nextSteps.splice(Math.min(steps.length, i + 2), 0, relearn)
        setSteps(nextSteps)
      }
    }
    if (i + 1 >= nextSteps.length) {
      onFinish({
        words: stats.current.words,
        correct: stats.current.correct,
        ms: stats.current.ms,
        newVids: plan.newVids,
        reviewed: [...stats.current.reviewed],
        perfectVerses: stats.current.perfect,
        bestFlow: stats.current.bestFlow,
        free: plan.free,
      })
    } else setI(i + 1)
  }

  if (!step || !verse) return null
  const Ex = EX[step.kind]
  const progress = i / steps.length
  const needsKb = step.kind === 'type' || step.kind === 'recall'
  const warmth = Math.min(1, flow / 20)

  return (
    <div className="screen session">
      {/* the screen warms up with the streak */}
      <div className="session-warmth" style={{ opacity: warmth }} />
      <div className="session-top">
        <button className="icon-btn" aria-label={t.close} onClick={() => setConfirmQuit(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
        <div className="pbar" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
          <motion.div className="pbar-fill" animate={{ width: `${Math.max(4, progress * 100)}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }}>
            <span className="pbar-shine" />
          </motion.div>
        </div>
        <FlowMeter flow={flow} />
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={step.key} className="step-label" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.14 }}>
          <span className={`dot ${step.review ? 'dot-review' : 'dot-new'}`} />
          {step.relearn ? t.relearn : step.review ? t.review : t.newVerse} · {t.sessionLabel[step.kind]}
        </motion.div>
      </AnimatePresence>
      <KbContext.Provider value={kbApi}>
        <div className="session-stage">
          <AnimatePresence initial={false}>
            <motion.div
              key={step.key}
              className="stage-inner"
              initial={{ opacity: 0, x: 36 }}
              animate={{ opacity: 1, x: 0, transition: { type: 'spring', stiffness: 420, damping: 36, delay: 0.05 } }}
              exit={{ opacity: 0, x: -36, transition: { duration: 0.16, ease: [0.4, 0, 1, 1] } }}
            >
              <Ex verse={verse} lang={lang} step={step} onDone={onDone} onCorrect={onCorrect} onWrong={onWrong} />
            </motion.div>
          </AnimatePresence>
        </div>
        <AnimatePresence initial={false}>
          {needsKb && (
            <motion.div className="kb-dock" initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }} transition={{ type: 'spring', stiffness: 420, damping: 38 }}>
              <Keyboard lang={lang} onKey={(k, el) => keyFn.current?.(k, el)} wrongKey={kbWrong} disabled={kbDisabled} />
            </motion.div>
          )}
        </AnimatePresence>
      </KbContext.Provider>

      <AnimatePresence>
        {confirmQuit && (
          <motion.div className="modal-back" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirmQuit(false)}>
            <motion.div className="modal" initial={{ y: 40, scale: 0.96 }} animate={{ y: 0, scale: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} onClick={(e) => e.stopPropagation()}>
              <h3>{t.quitTitle}</h3>
              <p>{t.quitBody}</p>
              <div className="col gap">
                <button className="btn btn-primary" onClick={() => setConfirmQuit(false)}>
                  {t.quitNo}
                </button>
                <button className="btn btn-ghost" onClick={onExit}>
                  {t.quitYes}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function FlowMeter({ flow }: { flow: number }) {
  const lvl = flow >= 20 ? 3 : flow >= 10 ? 2 : flow >= 3 ? 1 : 0
  return (
    <div className={`flow flow-${lvl}`} aria-label={`Flow ${flow}`}>
      <motion.svg width="22" height="22" viewBox="0 0 24 24" animate={{ scale: flow ? [1.25, 1] : 1 }} transition={{ duration: 0.25 }} key={flow}>
        <path d="M12 2c3 4 7 6.5 7 11.5A7 7 0 0 1 5 13.5C5 10 7 8 8.5 6.5c.3 2 1.2 3.2 2.5 3.8C11 7.5 11.3 4.5 12 2z" fill="currentColor" />
      </motion.svg>
      <span className="flow-n">{flow}</span>
    </div>
  )
}
