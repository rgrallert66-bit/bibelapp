import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { TreeScene, type Fruit } from '../components/TreeScene'
import { VERSE_BY_ID } from '../data/verses'
import { sfx, haptic, unlockAudio } from '../lib/audio'
import { dayKey, now, weekDays } from '../lib/date'
import { MILESTONES, useT } from '../lib/i18n'
import { planSession } from '../lib/session'
import { cardsFor, getState, recallNow, setState, stageOf, todayLog, useStore } from '../lib/store'
import { burst } from '../components/Sparkles'
import { DropIcon } from './Complete'
import { hourOverride } from '../lib/debug'

export function useHour() {
  const [h, setH] = useState(() => hourOverride() ?? new Date(now()).getHours() + new Date(now()).getMinutes() / 60)
  useEffect(() => {
    if (hourOverride() != null) return
    const id = setInterval(() => setH(new Date(now()).getHours() + new Date(now()).getMinutes() / 60), 60000)
    return () => clearInterval(id)
  }, [])
  return h
}

export function useFruits(): Fruit[] {
  const cards = useStore((s) => s.cards)
  const lang = useStore((s) => s.lang)
  return useMemo(() => {
    const today = dayKey()
    return cardsFor(getState(), lang)
      .sort((a, b) => (a.learned < b.learned ? -1 : a.learned > b.learned ? 1 : 0))
      .map((c) => ({ vid: c.vid, stage: stageOf(c), thirsty: c.due <= today && recallNow(c, today) < 0.86 }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards, lang])
}

interface Props {
  onStart: () => void
  onPractice: () => void
  onVerse: (vid: string) => void
  onGoalSetup: () => void
  fresh: string | null
}

export function Home({ onStart, onPractice, onVerse, onGoalSetup, fresh }: Props) {
  const t = useT()
  const st = useStore((s) => s)
  const hour = useHour()
  const fruits = useFruits()
  const plan = useMemo(() => planSession(st), [st])
  const today = dayKey()
  const done = todayLog(st, today).goal
  const week = weekDays(today)

  // growth animation: from the last value the user has seen to the current one
  const [g, setG] = useState(st.growthShown)
  const [watering, setWatering] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [milestone, setMilestone] = useState<number | null>(null)
  const animating = useRef(false)

  useEffect(() => {
    if (animating.current) return
    if (st.growthShown >= st.growth) {
      setG(st.growth)
      return
    }
    animating.current = true
    const from = st.growthShown
    const to = st.growth
    setWatering(true)
    sfx.grow()
    haptic('success')
    const drops = [0, 180, 320, 470, 610, 760]
    drops.forEach((d) => setTimeout(() => sfx.drop(), 500 + d))
    const startAt = performance.now() + 1100
    let raf = 0
    const tick = (n: number) => {
      const k = Math.min(1, Math.max(0, (n - startAt) / 2600))
      const e = 1 - Math.pow(1 - k, 3)
      setG(from + (to - from) * e)
      if (k < 1) raf = requestAnimationFrame(tick)
      else {
        setWatering(false)
        animating.current = false
        burst(window.innerWidth / 2, window.innerHeight * 0.35, { count: 26, speed: 4, colors: ['#9BE8B4', '#FFF3D6', '#FFE7A3'], kinds: ['leaf', 'dot', 'star'], up: 2.5 })
        setToast(t.growthToast(to))
        setTimeout(() => setToast(null), 2600)
        const crossed = MILESTONES.filter((m) => m > from && m <= to && !st.milestonesShown.includes(m))
        setState((s) => ({ growthShown: to, milestonesShown: [...s.milestonesShown, ...crossed] }))
        if (crossed.length) setTimeout(() => setMilestone(crossed[crossed.length - 1]), 900)
        else if (!getState().goalChosen) setTimeout(onGoalSetup, 1400)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st.growth])

  const greeting = hour < 5 ? t.greetingNight : hour < 11 ? t.greetingMorning : hour < 17.5 ? t.greetingDay : hour < 22 ? t.greetingEvening : t.greetingNight
  const nextM = MILESTONES.find((m) => m > st.growth)
  const versesCount = fruits.length

  return (
    <div className="screen home">
      <div className="scene-wrap">
        <TreeScene className="scene" seed={st.seed} growth={g} fruits={fruits} hour={hour} level={Math.floor(g + 0.001)} onFruit={(vid) => { sfx.tap(); onVerse(vid) }} fresh={fresh} />
        <AnimatePresence>{watering && <Rain />}</AnimatePresence>
      </div>

      <header className="home-head">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="greet">{greeting}</div>
          <div className="home-chips">
            <span className="chip">
              <RootIcon /> {t.roots}: {t.rootsDays(st.growth)}
            </span>
            <span className="chip">
              <span className="mini-bud" /> {t.versesInHeart(versesCount)}
            </span>
          </div>
        </motion.div>
        <div className="week" aria-label={t.week}>
          {week.map((d) => {
            const met = st.days[d]?.goal
            const isToday = d === today
            return (
              <div key={d} className={`wday ${met ? 'wday-met' : ''} ${isToday ? 'wday-today' : ''}`}>
                <span className="wday-l">{new Date(d + 'T12:00').toLocaleDateString(st.lang === 'de' ? 'de-DE' : 'en-US', { weekday: 'narrow' })}</span>
                <span className="wday-dot">{met && <LeafMini />}</span>
              </div>
            )
          })}
        </div>
      </header>

      <AnimatePresence>
        {toast && (
          <motion.div className="toast" initial={{ y: -30, opacity: 0, scale: 0.9 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: -20, opacity: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 26 }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.section className="panel" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 28, delay: 0.15 }}>
        {!done ? (
          <>
            <div className="panel-kicker">{t.todaySession}</div>
            <div className="panel-title">
              {plan.newVids[0] ? VERSE_BY_ID[plan.newVids[0]].ref[st.lang] : plan.topUp ? t.topUp : t.reviewTitle}
            </div>
            <div className="pills">
              {plan.reviewVids.length > 0 && !plan.topUp && <span className="pill pill-review">{t.reviews(plan.reviewVids.length)}</span>}
              {plan.newVids.length > 0 && <span className="pill pill-new">{t.newVerses(plan.newVids.length)}</span>}
              <span className="pill">{t.minutes(plan.minutes)}</span>
            </div>
            <button
              className="btn btn-primary btn-xl breathe"
              disabled={!plan.steps.length}
              onClick={() => {
                unlockAudio()
                sfx.tap()
                haptic('light')
                onStart()
              }}
            >
              {t.start}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
            {st.moment && <div className="panel-foot">{t.yourMoment}: {st.moment}</div>}
          </>
        ) : (
          <>
            <div className="done-row">
              <span className="done-badge">
                <DropIcon />
              </span>
              <div>
                <div className="panel-title sm">{t.watered}</div>
                <div className="panel-sub">{t.wateredSub}</div>
              </div>
            </div>
            {nextM && <div className="panel-foot gift">✦ {t.nextGift(nextM - st.growth)}</div>}
            <button
              className="btn btn-ghost"
              disabled={!versesCount}
              onClick={() => {
                unlockAudio()
                sfx.tap()
                onPractice()
              }}
            >
              {t.practiceMore}
            </button>
          </>
        )}
      </motion.section>

      <AnimatePresence>
        {milestone && (
          <motion.div className="modal-back" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMilestone(null)}>
            <motion.div className="modal milestone" initial={{ scale: 0.7, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} onClick={(e) => e.stopPropagation()}>
              <div className="milestone-kicker">{t.milestoneTitle}</div>
              <div className="milestone-badge">✦</div>
              <h3>{t.milestones[milestone][0]}</h3>
              <p>{t.milestones[milestone][1]}</p>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setMilestone(null)
                  if (!getState().goalChosen) setTimeout(onGoalSetup, 400)
                }}
              >
                {t.continue}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Rain() {
  const drops = useMemo(() => Array.from({ length: 22 }, (_, i) => ({ x: 30 + Math.random() * 40, d: Math.random() * 0.9, s: 0.7 + Math.random() * 0.6, i })), [])
  return (
    <motion.div className="rain" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
      {drops.map((d) => (
        <span key={d.i} className="drop" style={{ left: `${d.x}%`, animationDelay: `${0.35 + d.d}s`, transform: `scale(${d.s})` }} />
      ))}
    </motion.div>
  )
}

export function RootIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M12 3v9M12 12c-2 2-5 3-7 7M12 12c2 2 5 3 7 7M12 12v9M12 15c-1 1-2.5 2-3 4M12 15c1 1 2.5 2 3 4" />
    </svg>
  )
}

function LeafMini() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden>
      <path d="M4 20C4 10 10 4 20 4c0 10-6 16-16 16z" fill="currentColor" />
    </svg>
  )
}
