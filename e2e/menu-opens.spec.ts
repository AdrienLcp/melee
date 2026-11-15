import { globSync } from 'node:fs'
import { basename, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import { expect, test } from '@playwright/test'

const GAME_ROOT = fileURLToPath(new URL('../apps/game', import.meta.url))

/**
 * Not a journey. A phone has no hover, so the menu's chunk has to be in hand
 * before the press that opens it: fetched once a hand has touched the page,
 * and read without suspending once it has landed. `React.lazy` suspends even
 * on a landed chunk, and React then holds the panel 300ms behind an empty
 * fallback — the first open a player read as "it loads on the first press".
 */

/** The press lands in a click handler, and its render commits before the next frame paints. */
const MOST_FRAMES_TO_DRAW = 2

test('[e2e] the menu opens on the frame after its first press, fetching nothing', async ({
  page
}) => {
  await page.goto('/en')

  let isMenuFetched = false
  page.on('response', (response) => {
    isMenuFetched ||= /app-menu-leaflet/.test(response.url())
  })
  // Pressed again until it lands: a key before the app has mounted reaches
  // no listener, and the served page is drawn before it is live.
  await expect(async () => {
    await page.keyboard.press('Shift')
    expect(isMenuFetched).toBe(true)
  }).toPass({ intervals: [500] })
  await page.waitForLoadState('networkidle')

  const fetchedOnOpen: string[] = []
  page.on('request', (request) => {
    if (['script', 'stylesheet'].includes(request.resourceType())) {
      fetchedOnOpen.push(request.url())
    }
  })

  const framesToDraw = await page.evaluate(async (mostFrames) => {
    const nextFrame = () =>
      new Promise((resolve) => requestAnimationFrame(resolve))

    document.querySelector<HTMLElement>('.app-menu .trigger')?.click()

    for (let frame = 1; frame <= mostFrames * 10; frame += 1) {
      await nextFrame()

      if (document.querySelector('.app-menu-leaflet') !== null) {
        return frame
      }
    }

    return Number.POSITIVE_INFINITY
  }, MOST_FRAMES_TO_DRAW)

  await expect(page.getByRole('dialog')).toBeVisible()
  expect(framesToDraw).toBeLessThanOrEqual(MOST_FRAMES_TO_DRAW)
  expect(fetchedOnOpen).toEqual([])
})

/** The seat's rows, its exits and its preferences, with the pawn picker still folded away undrawn. */
const MOST_ELEMENTS_IN_A_SEATED_MENU = 200

test('[e2e] a seated player opens the menu again without drawing what it folds away', async ({
  page,
  request
}) => {
  const { code } = await (await request.post('/api/rooms', { data: {} })).json()
  await page.addInitScript(() => {
    localStorage.setItem('melee:volume', '0')
    localStorage.setItem('melee:nickname', 'Menu probe')
  })
  await page.goto(`/play/${code}`)

  const trigger = page.locator('.app-menu .trigger')
  await trigger.click()
  await expect(page.locator('.app-menu-leaflet .menu-pawn')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden()

  await trigger.click()
  await expect(page.locator('.app-menu-leaflet .menu-pawn')).toBeVisible()
  const elementCount = await page
    .locator('.app-menu-leaflet')
    .evaluate((menu) => menu.querySelectorAll('*').length)

  expect(elementCount).toBeLessThan(MOST_ELEMENTS_IN_A_SEATED_MENU)
})

/**
 * Every stylesheet the app owns, partials aside — they reach the page only
 * through the sheets that `@use` them. A room's screens load theirs with their
 * route, so reading the front door's `document.styleSheets` left every rule
 * of the console, the player and the wall unchecked.
 */
const STYLESHEETS = globSync('src/**/*.{sass,css}', {
  cwd: GAME_ROOT
})
  .filter((path) => !basename(path).startsWith('_'))
  .map((path) => path.split(sep).join('/'))

test('[e2e] no rule keyed on the root reaches past it through :has()', async ({
  page,
  request
}) => {
  await page.goto('/en')

  // Compiled by the dev server exactly as a page would get it.
  const sheets = await Promise.all(
    STYLESHEETS.map(async (path) => {
      const served = await request.get(`/${path}?direct`)

      expect(served.ok(), path).toBe(true)

      return { css: await served.text(), path }
    })
  )

  // Chromium answers a `:root:has(…) .descendant` rule by restyling the whole
  // document on every change anywhere in it: the menu's corner was written so
  // and every open of it restyled a console five times over. Sass writes a
  // list of them as `:is(:root:has(…), :root:has(…))`, so that is read too.
  const offenders = await page.evaluate((stylesheets) => {
    const ROOT_HAS = /^\s*(?:(?::is|:where)\(\s*)?(?::root|html):has\(/

    const afterRootHas = (selector: string): string | null => {
      const match = ROOT_HAS.exec(selector)

      if (match === null) {
        return null
      }

      let depth = match[0].split('(').length - 1
      let index = match[0].length

      while (index < selector.length && depth > 0) {
        depth += selector[index] === '(' ? 1 : selector[index] === ')' ? -1 : 0
        index += 1
      }

      return selector.slice(index).trimEnd()
    }

    const hasTopLevelCombinator = (rest: string): boolean => {
      let depth = 0

      for (const character of rest) {
        depth += character === '(' ? 1 : character === ')' ? -1 : 0

        if (depth === 0 && /[\s>~+]/.test(character)) {
          return true
        }
      }

      return false
    }

    const splitTopLevel = (list: string): string[] => {
      const parts: string[] = []
      let depth = 0
      let start = 0

      for (const [index, character] of [...list].entries()) {
        depth += character === '(' ? 1 : character === ')' ? -1 : 0

        if (character === ',' && depth === 0) {
          parts.push(list.slice(start, index))
          start = index + 1
        }
      }

      return [...parts, list.slice(start)]
    }

    const found: string[] = []

    const visit = (path: string, rules: CSSRuleList): void => {
      for (const rule of rules) {
        if (rule instanceof CSSStyleRule) {
          for (const selector of splitTopLevel(rule.selectorText)) {
            const rest = afterRootHas(selector)

            if (rest !== null && hasTopLevelCombinator(rest)) {
              found.push(`${path}: ${selector.trim()}`)
            }
          }
        }

        if ('cssRules' in rule && rule.cssRules instanceof CSSRuleList) {
          visit(path, rule.cssRules)
        }
      }
    }

    for (const { css, path } of stylesheets) {
      const sheet = new CSSStyleSheet()

      sheet.replaceSync(css)
      visit(path, sheet.cssRules)
    }

    for (const sheet of document.styleSheets) {
      visit('the front door', sheet.cssRules)
    }

    return found
  }, sheets)

  expect(sheets.length).toBeGreaterThan(100)
  expect(offenders).toEqual([])
})
