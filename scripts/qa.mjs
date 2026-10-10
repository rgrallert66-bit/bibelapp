// Automated walkthrough + screenshots on a phone viewport.
//   node scripts/qa.mjs [--base http://localhost:4173] [--out screenshots] [--lang de] [--mistakes]
// Requires the app to be served (npm run build && npm run preview) and Playwright available.
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'

const require = createRequire(import.meta.url)
let chromium
try {
  ;({ chromium } = require('playwright'))
} catch {
  ;({ chromium } = require('/opt/node-tools/node_modules/playwright'))
}

const arg = (k, d) => {
  const i = process.argv.indexOf('--' + k)
  return i > 0 ? process.argv[i + 1] : d
}
const BASE = arg('base', 'http://localhost:4173')
const OUT = arg('out', 'screenshots')
const LANG = arg('lang', 'de')
const MISTAKES = process.argv.includes('--mistakes')
const ONLY_TREES = process.argv.includes('--trees')
fs.mkdirSync(OUT, { recursive: true })

const errors = []
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: LANG === 'de' ? 'de-DE' : 'en-US' })
const page = await ctx.newPage()
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
page.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text()))

let n = 0
const shot = async (name) => {
  const f = path.join(OUT, `${String(++n).padStart(2, '0')}-${name}.png`)
  await page.screenshot({ path: f })
  console.log('📸', f)
}
const wait = (ms) => page.waitForTimeout(ms)

async function verses() {
  return page.evaluate(() => window.__rooted.verses)
}

/** Drive one exercise step. Returns false when no exercise is visible. */
async function playStep(shotName) {
  const V = await verses()
  const kind = await page.evaluate(() => {
    const el = document.querySelector('.ex')
    return el ? [...el.classList].find((c) => c.startsWith('ex-')) : null
  })
  if (!kind) return false
  const ref = await page.locator('.ref-chip').first().textContent().catch(() => null)
  const verse = Object.values(V).find((v) => v.ref[LANG] === ref)

  if (kind === 'ex-encounter') {
    for (let i = 0; i < 12; i++) {
      if (await page.locator('.enc-done').count()) break
      await page.locator('.ex-encounter .verse-scroll').click()
      await wait(220)
      if (i === 1 && shotName) await shot(shotName + '-reading')
    }
    await wait(500)
    if (shotName) await shot(shotName)
    await page.locator('.enc-done .btn-primary').click()
  } else if (kind === 'ex-build') {
    const full = verse.text[LANG]
    let first = true
    for (let i = 0; i < 40; i++) {
      if (await page.locator('.result-banner').count()) break
      const placed = ((await page.locator('.build-target').textContent()) || '').replace(/\s+/g, ' ').trim()
      const rest = full.slice(placed.length).trim()
      const tiles = page.locator('button.tile')
      const texts = await tiles.allTextContents()
      let idx = texts.map((t, j) => [t, j]).filter(([t]) => rest.startsWith(t)).sort((a, b) => b[0].length - a[0].length)[0]?.[1]
      if (MISTAKES && first && texts.length > 1) {
        const wrong = texts.findIndex((t) => !rest.startsWith(t))
        if (wrong >= 0) {
          await tiles.nth(wrong).dispatchEvent('pointerdown')
          await wait(150)
        }
      }
      if (idx == null) break
      await tiles.nth(idx).dispatchEvent('pointerdown')
      await wait(first ? 450 : 260)
      if (first && shotName) await shot(shotName)
      first = false
    }
    await wait(500)
    if (shotName) await shot(shotName + '-done')
  } else if (kind === 'ex-cloze') {
    let first = true
    for (let i = 0; i < 10; i++) {
      if (await page.locator('.result-banner').count()) break
      const word = await page.locator('.blank.w-current').textContent().catch(() => null)
      if (!word) break
      await wait(250)
      if (first && shotName) await shot(shotName)
      first = false
      await page.locator('button.option', { hasText: new RegExp(`^${word}$`) }).first().dispatchEvent('pointerdown')
      await wait(350)
    }
    await wait(400)
  } else if (kind === 'ex-recall') {
    let k = 0
    for (let i = 0; i < 120; i++) {
      if (await page.locator('.result-banner').count()) break
      const word = await page.locator('.w-current').first().textContent().catch(() => null)
      if (!word) break
      const letter = word.normalize('NFD').replace(/[̀-ͯ]/g, '').match(/[\p{L}\p{N}]/u)[0].toLowerCase()
      if (MISTAKES && k === 3) {
        await page.keyboard.press(letter === 'x' ? 'q' : 'x')
        await wait(200)
        if (shotName) await shot(shotName + '-mistake')
      }
      await page.keyboard.press(letter)
      k++
      await wait(110)
      if (k === 5 && shotName) await shot(shotName)
    }
    await wait(350)
    if (shotName) await shot(shotName + '-done')
  } else if (kind === 'ex-ref') {
    if (shotName) await shot(shotName)
    const q = ((await page.locator('.quote').textContent()) || '').replace(/^„|“$/g, '').replace(' …', '')
    const v = Object.values(V).find((x) => x.text[LANG].startsWith(q.trim()))
    await page.locator('button.option', { hasText: v.ref[LANG] }).first().dispatchEvent('pointerdown')
  }
  await wait(1700)
  return true
}

async function playSession(prefix) {
  for (let s = 0; s < 30; s++) {
    if (!(await page.locator('.session').count())) break
    const label = ((await page.locator('.step-label').textContent()) || '').toLowerCase().replace(/[^a-zäöü]+/g, '-')
    const ok = await playStep(`${prefix}-${s}-${label}`)
    if (!ok) break
  }
}

// ── 1. First run ────────────────────────────────────────────────
if (!ONLY_TREES) {
await page.goto(`${BASE}/?reset&lang=${LANG}&hour=19.5`)
await wait(1600)
await shot('onboarding-language')
await page.locator('.lang-card').nth(LANG === 'de' ? 0 : 1).click()
await wait(900)
await shot('onboarding-plant')
const box = await page.locator('.planter-svg').boundingBox()
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
await page.mouse.down()
await wait(600)
await shot('onboarding-holding')
await wait(900)
await page.mouse.up()
await wait(1800)
await shot('onboarding-planted')
await page.locator('.ob-after .btn-primary').click()
await wait(900)
await playSession('first')
await wait(1200)
await shot('complete')
await page.locator('.complete-cta .btn').click()
await wait(1500)
await shot('home-watering')
await wait(3200)
await shot('home-grown')
await wait(1500)
if (await page.locator('.milestone').count()) {
  await shot('milestone')
  await page.locator('.milestone .btn-primary').click()
  await wait(1200)
}
if (await page.locator('.goal-opts').count()) {
  await shot('goal-sheet')
  await page.locator('.goal-opt').nth(1).click()
  await page.locator('.chip-btn').first().click()
  await page.locator('.sheet .btn-primary').click()
  await wait(800)
}
await shot('home-done')

// ── 2. Next day: review + new verse ─────────────────────────────
await page.goto(`${BASE}/?day=1&hour=8`)
await wait(1500)
await shot('day2-home')
await page.locator('.panel .btn-primary').click()
await wait(900)
await playSession('day2')
await wait(1000)
await shot('day2-complete')
}

// ── 3. Mature trees at different times of day ───────────────────
for (const [g, h] of [
  [1, 19.5],
  [3, 10],
  [12, 7],
  [30, 13],
  [45, 19.2],
  [80, 22.5],
]) {
  await page.goto(`${BASE}/?demo=${g}&lang=${LANG}&hour=${h}`)
  await wait(1800)
  await shot(`tree-g${g}-h${h}`)
}
// verse sheet from a fruit
await page.locator('.fruit').first().click({ force: true })
await wait(900)
await shot('verse-sheet')
await page.mouse.click(195, 100)
await wait(600)

// ── 4. Library, profile ─────────────────────────────────────────
await page.locator('.tab').nth(1).click()
await wait(900)
await shot('library')
await page.locator('.path-head').nth(2).click()
await wait(700)
await shot('library-open')
await page.locator('.tab').nth(2).click()
await wait(900)
await shot('me')

console.log(errors.length ? '\n⚠️  errors:\n' + errors.join('\n') : '\n✅ no console errors')
await browser.close()
