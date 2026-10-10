import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { TreeScene, type Fruit } from '../components/TreeScene'
import { VERSE_BY_ID } from '../data/verses'
import { sfx, haptic, unlockAudio } from '../lib/audio'
import { dayKey, now, weekDays } from '../lib/date'
import { MILESTONES, useT } from '../lib/i18n'
import { planSession } from '../lib/session'
import { cardsFor, getState, recallNow, setState, stageOf, todayLog, useStore } from '../lib/store'
import { burst, ring } from '../components/Sparkles'
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

  // Watering: after a completed session the user holds the watering button and the tree grows in real time.
  const pending = st.growthShown < st.growth
  const [g, setG] = useState(st.growthShown)
  const [holding, setHolding] = useState(false)
  const [waterP, setWaterP] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [milestone, setMilestone] = useState<number | null>(null)
  const raf = useRef(0)
  const pRef = useRef(0)
  const lastTick = useRef(-1)
  const from = st.growthShown
  const to = st.growth

  useEffect(() => {
    if (!pending) setG(st.growth)
  }, [pending, st.growth])
  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  // goal + moment are asked on the second visit, not stacked onto the first-day celebration
  useEffect(() => {
    if (!pending && st.growth >= 1 && !st.goalChosen && !done) {
      const id = setTimeout(onGoalSetup, 700)
      return () => clearTimeout(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const finishWatering = () => {
    setHolding(false)
    sfx.celebrate()
    haptic('success')
    const fruitEl = fresh ? document.querySelector(`[data-vid="${fresh}"]`) : null
    const r = fruitEl?.getBoundingClientRect()
    const x = r ? r.left + r.width / 2 : window.innerWidth / 2
    const y = r ? r.top + r.height / 2 : window.innerHeight * 0.35
    burst(x, y, { count: 34, speed: 5, size: 4.5, colors: ['#9BE8B4', '#FFF3D6', '#FFE7A3', '#F7A6B9'], kinds: ['leaf', 'dot', 'star'], up: 2.2 })
    ring(x, y, 'rgba(155,232,180,0.9)')
    setToast(t.growthToast(to))
    setTimeout(() => setToast(null), 2600)
    const crossed = MILESTONES.filter((m) => m > from && m <= to && !st.milestonesShown.includes(m))
    setState((s) => ({ growthShown: to, milestonesShown: [...s.milestonesShown, ...crossed] }))
    if (crossed.length) setTimeout(() => setMilestone(crossed[crossed.length - 1]), 1400)
  }

  const startWater = () => {
    if (!pending) return
    unlockAudio()
    setHolding(true)
    let last = performance.now()
    const tick = (now: number) => {
      const dt = now - last
      last = now
      pRef.current = Math.min(1, pRef.current + dt / 1700)
      const p = pRef.current
      setWaterP(p)
      const e = 1 - Math.pow(1 - p, 2.2)
      setG(from + (to - from) * e)
      const step = Math.floor(p * 10)
      if (step !== lastTick.current) {
        lastTick.current = step
        sfx.correct(step + 2)
        if (step % 2 === 0) sfx.drop()
        haptic('light')
      }
      if (p >= 1) {
        finishWatering()
        return
      }
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
  }
  const stopWater = () => {
    if (pRef.current >= 1) return
    cancelAnimationFrame(raf.current)
    setHolding(false)
  }

  const greeting = hour < 5 ? t.greetingNight : hour < 11 ? t.greetingMorning : hour < 17.5 ? t.greetingDay : hour < 22 ? t.greetingEvening : t.greetingNight
  const nextM = MILESTONES.find((m) => m > st.growth)
  const versesCount = fruits.length

  return (
    <div className="screen home">
      <div className={`scene-wrap ${holding ? 'scene-focus' : ''}`}>
        <TreeScene className="scene" seed={st.seed} growth={g} fruits={fruits} hour={hour} level={Math.floor(g + 0.001)} onFruit={(vid) => { sfx.tap(); onVerse(vid) }} fresh={pending ? null : fresh} />
        <AnimatePresence>{holding && <Rain />}</AnimatePresence>
      </div>
      <div className="head-fade" />

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
        {pending ? (
          <div className="water-panel">
            <div>
              <div className="panel-kicker">{t.waterKicker}</div>
              <div className="panel-title sm">{t.waterTitle}</div>
              <div className="panel-sub">{t.waterSub}</div>
            </div>
            <WaterButton p={waterP} holding={holding} onDown={startWater} onUp={stopWater} label={t.waterTree} />
          </div>
        ) : !done ? (
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
  const drops = useMemo(
    () => Array.from({ length: 26 }, (_, i) => ({ x: 28 + Math.random() * 44, end: 38 + Math.random() * 30, d: Math.random() * 0.8, s: 0.7 + Math.random() * 0.6, i })),
    [],
  )
  return (
    <motion.div className="rain" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
      {drops.map((d) => (
        <span key={d.i} className="drop" style={{ left: `${d.x}%`, animationDelay: `${d.d}s`, '--end': `${d.end}%`, '--s': d.s } as React.CSSProperties} />
      ))}
    </motion.div>
  )
}

function WaterButton({ p, holding, onDown, onUp, label }: { p: number; holding: boolean; onDown: () => void; onUp: () => void; label: string }) {
  const C = 2 * Math.PI * 34
  return (
    <button
      className={`water-btn ${holding ? 'holding' : ''}`}
      aria-label={label}
      onPointerDown={(e) => {
        e.preventDefault()
        ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
        onDown()
      }}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      <svg viewBox="0 0 80 80" width="80" height="80" aria-hidden>
        <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(159,216,255,.16)" strokeWidth="5" />
        <circle cx="40" cy="40" r="34" fill="none" stroke="#9fd8ff" strokeWidth="5" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - p)} transform="rotate(-90 40 40)" />
      </svg>
      <span className="water-core">
        <DropIcon />
      </span>
    </button>
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
