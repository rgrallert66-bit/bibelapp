import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { TRANSLATION, type Lang } from '../data/verses'
import { useT } from '../lib/i18n'
import { cardsFor, getState, initialState, replaceState, setState, stageOf, useStore, type Goal, type Stage } from '../lib/store'
import { sfx } from '../lib/audio'
import { StageIcon } from './Library'

export function Me({ onGoal }: { onGoal: () => void }) {
  const t = useT()
  const s = useStore((x) => x)
  const [info, setInfo] = useState<null | 'how' | 'rights'>(null)
  const cards = cardsFor(s)
  const byStage = (st: Stage) => cards.filter((c) => stageOf(c) === st).length
  const goalName: Record<Goal, string> = { light: t.goalLight, normal: t.goalNormal, deep: t.goalDeep }

  return (
    <div className="screen me scroll">
      <header className="page-head">
        <h1>{t.meTitle}</h1>
      </header>

      <section className="card">
        <div className="card-kicker">{t.stats}</div>
        <div className="stage-grid">
          {(['bud', 'blossom', 'fruit', 'gold'] as Stage[]).map((st) => (
            <div key={st} className="stage-cell">
              <StageIcon stage={st} size={28} />
              <div className="stage-n">{byStage(st)}</div>
              <div className="stage-l">{t.stage[st]}</div>
            </div>
          ))}
        </div>
        <div className="kv">
          <span>{t.roots}</span>
          <b>{t.rootsDays(s.growth)}</b>
        </div>
        <div className="kv">
          <span>{t.totalWords}</span>
          <b>{Math.round(s.stats.words)}</b>
        </div>
        <div className="kv">
          <span>{t.sessions}</span>
          <b>{s.stats.sessions}</b>
        </div>
        <div className="kv">
          <span>{t.bestFlow}</span>
          <b>{s.stats.bestFlow}</b>
        </div>
      </section>

      <section className="card">
        <div className="card-kicker">{t.translation}</div>
        <div className="seg">
          {(['de', 'en'] as Lang[]).map((l) => (
            <button
              key={l}
              className={`seg-btn ${s.lang === l ? 'on' : ''}`}
              onClick={() => {
                sfx.tap()
                setState({ lang: l })
              }}
            >
              <span className="seg-main">{l === 'de' ? 'Deutsch' : 'English'}</span>
              <span className="seg-sub">{TRANSLATION[l].name}</span>
            </button>
          ))}
        </div>
        <button className="row-btn" onClick={onGoal}>
          <span>{t.dailyGoal}</span>
          <span className="row-val">
            {goalName[s.goal]}
            {s.moment ? ` · ${s.moment}` : ''} ›
          </span>
        </button>
        <Toggle label={t.sound} on={s.sound} onChange={(v) => setState({ sound: v })} />
        <Toggle label={t.haptics} on={s.haptics} onChange={(v) => setState({ haptics: v })} />
      </section>

      <section className="card">
        <button className="row-btn" onClick={() => setInfo('how')}>
          <span>{t.howItWorks}</span>
          <span className="row-val">›</span>
        </button>
        <button className="row-btn" onClick={() => setInfo('rights')}>
          <span>{t.rights}</span>
          <span className="row-val">›</span>
        </button>
        <button
          className="row-btn danger"
          onClick={() => {
            if (confirm(t.resetConfirm)) replaceState({ ...initialState(), lang: getState().lang })
          }}
        >
          <span>{t.reset}</span>
        </button>
      </section>
      <div className="tabbar-spacer" />

      <AnimatePresence>
        {info && (
          <motion.div className="sheet-back" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setInfo(null)}>
            <motion.div className="sheet tall" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 380, damping: 36 }} onClick={(e) => e.stopPropagation()}>
              <div className="sheet-grip" />
              {info === 'how' ? (
                <>
                  <h2>{t.howItWorks}</h2>
                  {t.howItWorksBody.map(([h, b], i) => (
                    <motion.div key={h} className="how" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}>
                      <div className="how-n">{i + 1}</div>
                      <div>
                        <div className="how-h">{h}</div>
                        <div className="how-b">{b}</div>
                      </div>
                    </motion.div>
                  ))}
                </>
              ) : (
                <>
                  <h2>{t.rights}</h2>
                  <p className="legal">{TRANSLATION.de.notice}</p>
                  <p className="legal">{TRANSLATION.en.notice}</p>
                  <p className="legal muted">
                    {s.lang === 'de'
                      ? 'Die Bibeltexte sind urheberrechtlich geschützt und werden hier nur in kleinem Umfang zitiert. Für eine öffentliche Veröffentlichung der App ist eine Lizenz der Rechteinhaber erforderlich.'
                      : 'The Bible texts are protected by copyright and are quoted here only in small amounts. A public release of this app requires a licence from the rights holders.'}
                  </p>
                </>
              )}
              <button className="btn btn-primary" onClick={() => setInfo(null)}>
                {t.close}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      className="row-btn"
      role="switch"
      aria-checked={on}
      onClick={() => {
        onChange(!on)
        sfx.tap()
      }}
    >
      <span>{label}</span>
      <span className={`switch ${on ? 'on' : ''}`}>
        <motion.span className="knob" layout transition={{ type: 'spring', stiffness: 700, damping: 35 }} />
      </span>
    </button>
  )
}
