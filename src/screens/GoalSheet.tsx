import { useState } from 'react'
import { motion } from 'motion/react'
import { useT } from '../lib/i18n'
import { getState, setState, type Goal } from '../lib/store'
import { sfx, haptic } from '../lib/audio'

/** Daily goal + implementation intention ("when/where" anchor, Gollwitzer). */
export function GoalSheet({ onClose }: { onClose: () => void }) {
  const t = useT()
  const [goal, setGoal] = useState<Goal>(getState().goal)
  const [moment, setMoment] = useState<string | null>(getState().moment)
  const opts: { id: Goal; name: string; sub: string; lvl: number }[] = [
    { id: 'light', name: t.goalLight, sub: t.goalLightSub, lvl: 1 },
    { id: 'normal', name: t.goalNormal, sub: t.goalNormalSub, lvl: 2 },
    { id: 'deep', name: t.goalDeep, sub: t.goalDeepSub, lvl: 3 },
  ]

  const save = () => {
    setState({ goal, moment, goalChosen: true })
    sfx.complete(true)
    haptic('success')
    onClose()
  }

  return (
    <motion.div className="sheet-back" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="sheet tall" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 360, damping: 36 }}>
        <div className="sheet-grip" />
        <h2>{t.goalTitle}</h2>
        <p className="sheet-sub">{t.goalSub}</p>
        <div className="goal-opts">
          {opts.map((o) => (
            <button
              key={o.id}
              className={`goal-opt ${goal === o.id ? 'on' : ''}`}
              onClick={() => {
                setGoal(o.id)
                sfx.correct(o.lvl * 2)
                haptic('light')
              }}
            >
              <span className="goal-bars">
                {[1, 2, 3].map((b) => (
                  <span key={b} className={b <= o.lvl ? 'bar on' : 'bar'} style={{ height: 6 + b * 5 }} />
                ))}
              </span>
              <span className="goal-txt">
                <span className="goal-name">{o.name}</span>
                <span className="goal-sub">{o.sub}</span>
              </span>
              <span className="goal-check">{goal === o.id ? '✓' : ''}</span>
            </button>
          ))}
        </div>
        <h3 className="moment-title">{t.momentTitle}</h3>
        <p className="sheet-sub">{t.momentSub}</p>
        <div className="moment-opts">
          {t.moments.map((m) => (
            <button
              key={m}
              className={`chip-btn ${moment === m ? 'on' : ''}`}
              onClick={() => {
                setMoment(moment === m ? null : m)
                sfx.tap()
              }}
            >
              {m}
            </button>
          ))}
        </div>
        <button className="btn btn-primary btn-xl" onClick={save}>
          {t.save}
        </button>
      </motion.div>
    </motion.div>
  )
}
