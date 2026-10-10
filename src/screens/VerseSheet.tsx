import { motion } from 'motion/react'
import { VERSE_BY_ID } from '../data/verses'
import { useT } from '../lib/i18n'
import { dayKey, daysBetween } from '../lib/date'
import { cardKey, recallNow, setState, stageOf, useStore } from '../lib/store'
import { sfx, haptic, speak } from '../lib/audio'
import { StageIcon } from './Library'
import { IconSpeaker } from '../components/exercises/Encounter'

export function VerseSheet({ vid, onClose, onPractice }: { vid: string; onClose: () => void; onPractice: (vid: string) => void }) {
  const t = useT()
  const lang = useStore((s) => s.lang)
  const card = useStore((s) => s.cards[cardKey(s.lang, vid)])
  const next = useStore((s) => s.next)
  const v = VERSE_BY_ID[vid]
  const today = dayKey()
  const stage = card ? stageOf(card) : null
  const r = card ? recallNow(card, today) : 0
  const dueIn = card ? daysBetween(today, card.due) : 0
  const queued = next[0] === vid

  return (
    <motion.div className="sheet-back" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        className="sheet"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 36 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 90 || info.velocity.y > 600) onClose()
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-grip" />
        <div className="sheet-ref">{v.ref[lang]}</div>
        <p className="sheet-verse">{v.text[lang]}</p>
        <div className="core small">
          <span className="core-mark">✦</span> {v.core[lang]}
        </div>

        {card ? (
          <div className="memory">
            <div className="memory-row">
              <StageIcon stage={stage} size={26} />
              <div>
                <div className="memory-stage">{t.stage[stage!]}</div>
                <div className="memory-hint">{t.stageHint[stage!]}</div>
              </div>
            </div>
            <div className="meter">
              <div className="meter-l">
                <span>{t.memoryStrength}</span>
                <span>{Math.round(r * 100)}%</span>
              </div>
              <div className="meter-bar">
                <motion.div className="meter-fill" initial={{ width: 0 }} animate={{ width: `${r * 100}%` }} transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }} />
              </div>
              <div className="meter-sub">
                {t.nextReview}: {dueIn <= 0 ? t.todayWord : dueIn === 1 ? t.tomorrow : t.inDays(dueIn)}
              </div>
            </div>
          </div>
        ) : (
          <div className="memory muted">{t.notStarted}</div>
        )}

        <div className="row gap">
          <button className="btn btn-ghost" onClick={() => speak(v.text[lang], lang)} aria-label={t.listen}>
            <IconSpeaker />
          </button>
          {card ? (
            <button
              className="btn btn-primary grow"
              onClick={() => {
                sfx.tap()
                onPractice(vid)
              }}
            >
              {t.practiceNow}
            </button>
          ) : (
            <button
              className={`btn grow ${queued ? 'btn-ghost' : 'btn-primary'}`}
              disabled={queued}
              onClick={() => {
                sfx.correct(4)
                haptic('light')
                setState((s) => ({ next: [vid, ...s.next.filter((x) => x !== vid)] }))
              }}
            >
              {queued ? `✓ ${t.queued}` : t.learnNext}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

