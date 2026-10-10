import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/fraunces'
import '@fontsource-variable/plus-jakarta-sans'
import './styles/app.css'
import App from './App'
import { applyDebugParams } from './lib/debug'
import { getState } from './lib/store'
import { VERSE_BY_ID } from './data/verses'

applyDebugParams()

// read-only hooks for automated UI tests (scripts/qa.mjs)
;(window as unknown as { __rooted: unknown }).__rooted = { state: getState, verses: VERSE_BY_ID }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if (import.meta.env.PROD && 'serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}))
}
