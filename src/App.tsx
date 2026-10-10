import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Sparkles } from './components/Sparkles'
import { Onboarding } from './screens/Onboarding'
import { Home } from './screens/Home'
import { Library } from './screens/Library'
import { Me } from './screens/Me'
import { Session, type SessionSummary } from './screens/Session'
import { Complete } from './screens/Complete'
import { VerseSheet } from './screens/VerseSheet'
import { GoalSheet } from './screens/GoalSheet'
import { useStore } from './lib/store'
import { completeSession, planSession, practiceCandidates, type Plan } from './lib/session'
import { useT } from './lib/i18n'
import { sfx, unlockAudio } from './lib/audio'

type Tab = 'home' | 'library' | 'me'
type View = { name: 'tabs' } | { name: 'session'; plan: Plan } | { name: 'complete'; summary: SessionSummary; grew: boolean }

export default function App() {
  const onboarded = useStore((s) => s.onboarded)
  const [view, setView] = useState<View>({ name: 'tabs' })
  const [tab, setTab] = useState<Tab>('home')
  const [sheet, setSheet] = useState<string | null>(null)
  const [goalOpen, setGoalOpen] = useState(false)
  const [fresh, setFresh] = useState<string | null>(null)

  const startSession = (practiceIds?: string[]) => {
    unlockAudio()
    const plan = planSession(undefined, practiceIds)
    if (!plan.steps.length) return
    setSheet(null)
    setView({ name: 'session', plan })
  }

  const finish = (summary: SessionSummary) => {
    const grew = completeSession(summary.perfectVerses, summary.bestFlow, summary.free)
    setView({ name: 'complete', summary, grew })
  }

  let content: React.ReactNode
  let key: string
  if (!onboarded && view.name === 'tabs') {
    key = 'onboarding'
    content = <Onboarding onStart={() => startSession()} />
  } else if (view.name === 'session') {
    key = 'session'
    content = <Session plan={view.plan} onExit={() => setView({ name: 'tabs' })} onFinish={finish} />
  } else if (view.name === 'complete') {
    key = 'complete'
    const v = view
    content = (
      <Complete
        summary={v.summary}
        grew={v.grew}
        onContinue={() => {
          setFresh(v.summary.newVids[0] ?? null)
          setTab('home')
          setView({ name: 'tabs' })
        }}
      />
    )
  } else {
    key = 'tab-' + tab
    content =
      tab === 'home' ? (
        <Home onStart={() => startSession()} onPractice={() => startSession(practiceCandidates())} onVerse={setSheet} onGoalSetup={() => setGoalOpen(true)} fresh={fresh} />
      ) : tab === 'library' ? (
        <Library onVerse={setSheet} />
      ) : (
        <Me onGoal={() => setGoalOpen(true)} />
      )
  }

  const showTabs = onboarded && view.name === 'tabs'

  return (
    <div className="app">
      {/* cross-fade between screens: never a blank frame */}
      <AnimatePresence initial={false}>
        <motion.div
          key={key}
          className="view"
          initial={{ opacity: 0, y: key.startsWith('tab') ? 0 : 18, scale: key === 'complete' ? 0.97 : 1 }}
          animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.34, ease: [0.2, 0.8, 0.2, 1] } }}
          exit={{ opacity: 0, transition: { duration: 0.22 } }}
        >
          {content}
        </motion.div>
      </AnimatePresence>
      {showTabs && <TabBar tab={tab} onTab={(t) => { sfx.tap(); setTab(t) }} />}
      <AnimatePresence>{sheet && <VerseSheet key={sheet} vid={sheet} onClose={() => setSheet(null)} onPractice={(vid) => startSession([vid])} />}</AnimatePresence>
      <AnimatePresence>{goalOpen && <GoalSheet onClose={() => setGoalOpen(false)} />}</AnimatePresence>
      <Sparkles />
    </div>
  )
}


function TabBar({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  const t = useT()
  const items: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'home',
      label: t.tabTree,
      icon: <path d="M12 21v-6M12 15c-4 0-7-2.5-7-6.5S8.5 2 12 2s7 2.5 7 6.5S16 15 12 15z" />,
    },
    {
      id: 'library',
      label: t.tabVerses,
      icon: <path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5v-13zM13 4h5.5c.8 0 1.5.7 1.5 1.5v13c0 .8-.7 1.5-1.5 1.5H13V4z" />,
    },
    {
      id: 'me',
      label: t.tabMe,
      icon: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20.5c1-3.8 4-5.5 7.5-5.5s6.5 1.7 7.5 5.5" />,
    },
  ]
  return (
    <nav className={`tabbar ${tab !== 'home' ? 'tabbar-fade' : ''}`}>
      {items.map((it) => (
        <button key={it.id} className={`tab ${tab === it.id ? 'on' : ''}`} onClick={() => onTab(it.id)} aria-current={tab === it.id}>
          {tab === it.id && <motion.span layoutId="tab-pill" className="tab-pill" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            {it.icon}
          </svg>
          <span>{it.label}</span>
        </button>
      ))}
    </nav>
  )
}
