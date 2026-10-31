import { expect, type Page, test } from '@playwright/test'

import { homePage } from './support/locators'

/**
 * Not a journey, and the only spec here that is not. It plays nothing: it opens
 * one room, walks every game and both locales, and measures the shape of every
 * choice strip on the console.
 *
 * A socket test cannot stand in for it — the defect is a row of segments that
 * are the wrong width, which only a browser holds an opinion about. The check
 * exists because the widths in the stylesheets are **measured numbers**: a
 * dictionary edit lengthens a label, the row stops fitting, and the strip goes
 * back to wrapping while looking entirely deliberate. Nothing else would say so.
 */

/**
 * A geometry check reads the boxes, so it reaches for classes where the rest of
 * the suite reaches for roles. `ToggleGroup` is a toolbar and `SegmentedControl`
 * a radiogroup, so no single role finds both, and no accessible name survives
 * being asked in two locales. The two of them together are every strip there
 * is, which is why the selector below is spelled out inside each browser
 * function rather than shared — nothing in this file's scope reaches in there.
 * Both read the host's panel alone: below the split the stage is hidden behind
 * whichever tab is open, and a hidden strip would read as a collapsed one.
 */
const PANEL_SCREEN = '.host-panel .panel-screen'

/** No phone is narrower, so no strip is ever handed less than it gets here. */
const NARROWEST_SCREEN = 320

/**
 * Wrap points are at least a segment apart — sixty-odd pixels — so this is three
 * times finer than the narrowest band that can exist.
 */
const STEP_PX = 4

/**
 * Above this every strip on the console is on one row with room to spare. A
 * strip's sweep ends at its first single row, so this bound only ends one that
 * never reaches it.
 */
const WIDEST_PX = 1_400

/**
 * The number of distinct strips the sweep must have seen. A check that silently
 * stopped finding controls — a renamed class, a fold that no longer opens —
 * reports exactly what a console with nothing wrong on it reports, and this is
 * the difference. Raise it when a game brings a strip of its own.
 */
const STRIPS_EXPECTED = 16

/**
 * The faces are `font-display: swap`, so a page measured the moment it is
 * visible can still be drawn in the fallback. On a Linux runner that is DejaVu,
 * wide enough to wrap every strip, and a measure racing the font failed CI
 * without ever failing on Windows, whose fallback is narrow.
 *
 * Settled again after every viewport change, not once per page: a failing
 * run's trace shows the face re-requested around each resize, which re-sizes
 * the `vmin` labels, and a sweep taken before it settles reads the fallback.
 */
const loadEveryFace = () =>
  Promise.all([...document.fonts].map((face) => face.load()))
    .then(() => document.fonts.ready)
    .then(() => {})

type Fault = {
  /** The width of the strip's own layout box, in CSS pixels. */
  at: number
  /** The width the sweep started from, read on the narrowest screen. */
  from: number
  label: string
  /** `3+2+1` — how many segments each row holds, top to bottom. */
  shape: string
}

/**
 * The width every strip's box is handed on the narrowest screen there is. It is
 * the floor of what the layout can actually produce, and the reason the sweep
 * below does not report strips that only break at widths no room can reach.
 *
 * It is also the one reading that can catch a **collapsed** container, which the
 * sweep cannot: the sweep writes a width onto that box, so a strip the page
 * gives nothing is measured at every width but its own. Zero is what
 * `container-type: inline-size` resolves to wherever the box is shrink-to-fit —
 * the containment lays it out as though it held nothing — and a strip whose
 * container reads zero has every query it owns already firing.
 */
const readFloors = () => {
  const floors: Record<string, number> = {}

  for (const strip of document.querySelectorAll(
    '.host-panel :is(.segmented-control, .toggle-group)'
  )) {
    const label = strip.querySelector('.react-aria-Label')?.textContent ?? ''
    let box: Element = strip

    for (
      let el: Element | null = strip;
      el !== null && el !== document.body;
      el = el.parentElement
    ) {
      if (getComputedStyle(el).containerType === 'inline-size') {
        box = el
        break
      }
    }

    floors[label] = Math.round(box.getBoundingClientRect().width)
  }

  return floors
}

/**
 * Widens each strip's own box a step at a time and reads the shape it takes.
 * The box is the nearest container ancestor rather than the strip itself,
 * because the two grids in the playlist picker take their column count from the
 * picker's width and not from their own — but never `body`, the page's own
 * container, whose width no strip is handed.
 */
const sweepShapes = ({
  floors,
  step,
  widest
}: {
  floors: Record<string, number>
  step: number
  widest: number
}) => {
  const faults: Fault[] = []
  const seen: string[] = []
  const withoutFloor: string[] = []

  for (const strip of document.querySelectorAll(
    '.host-panel :is(.segmented-control, .toggle-group)'
  )) {
    const label = strip.querySelector('.react-aria-Label')?.textContent ?? ''
    let styled = strip instanceof HTMLElement ? strip : null

    for (
      let el: Element | null = strip;
      el !== null && el !== document.body;
      el = el.parentElement
    ) {
      if (
        el instanceof HTMLElement &&
        getComputedStyle(el).containerType === 'inline-size'
      ) {
        styled = el
        break
      }
    }

    seen.push(label)

    const floor = floors[label]

    if (floor === undefined) {
      withoutFloor.push(label)
      continue
    }

    if (styled === null) {
      continue
    }

    const restore = styled.style.width

    for (let width = floor; width <= widest; width += step) {
      styled.style.width = `${width}px`

      const rows = new Map<number, number>()

      for (const segment of strip.querySelectorAll('.segment')) {
        const top = Math.round(segment.getBoundingClientRect().top)

        rows.set(top, (rows.get(top) ?? 0) + 1)
      }

      const counts = [...rows.entries()]
        .sort(([a], [b]) => a - b)
        .map(([, held]) => held)
      // A grid's last row may run short, since its cells still stand in the
      // columns above: eleven subjects divide by nothing. A wrap's may not.
      const isGrid =
        getComputedStyle(strip.querySelector('.segments') ?? strip).display ===
        'grid'
      const fullRows = isGrid ? counts.slice(0, -1) : counts
      const lastRow = counts.at(-1) ?? 0
      const isRagged =
        new Set(fullRows).size > 1 ||
        (isGrid && fullRows.length > 0 && lastRow > (fullRows[0] ?? 0))

      if (isRagged) {
        faults.push({
          at: Math.round(strip.getBoundingClientRect().width),
          from: floor,
          label,
          shape: counts.join('+')
        })

        break
      }

      // One row is where every strip ends up, and no wider box breaks it again:
      // a wrap only happens for want of room, the strip mixins stack or tile
      // *below* a width, and the picker's grids gain columns as they widen.
      // Every step past it lays the whole page out to learn nothing — nine in
      // ten of the sweep's steps were spent there, and on a loaded machine they
      // were what ran this spec past its timeout.
      if (counts.length === 1) {
        break
      }
    }

    styled.style.width = restore
  }

  return { faults, seen, withoutFloor }
}

/** One of the panel's tabs, found by its key since its name is a locale's. */
const panelTab = (page: Page, key: string) =>
  page.locator(`.panel-tabs .panel-tab[data-key='${key}']`)

/**
 * The panel is a column beside the stage on the wide screen and a tab bar on
 * the narrow one, and the resize returns before React swaps them: the bar's
 * first tab, the game itself, exists below the split alone, so waiting on it is
 * waiting for the face this width draws.
 */
const resizeTo = async ({
  page,
  width
}: {
  page: Page
  width: number
}): Promise<void> => {
  await page.setViewportSize({ height: 900, width })
  await expect(panelTab(page, 'stage')).toHaveCount(
    width === NARROWEST_SCREEN ? 1 : 0
  )
}

const openTab = async (page: Page, key: string): Promise<void> => {
  const tab = panelTab(page, key)

  if ((await tab.getAttribute('aria-selected')) !== 'true') {
    await tab.click()
  }

  await expect(tab).toHaveAttribute('aria-selected', 'true')
}

/**
 * The game's own strips are on its round's page, which takes the planned
 * games' place on the games tab. A room of one game has one round to open; a
 * resize that mounted the tab afresh is back on the list, so it opens again.
 */
const openTheRound = async (page: Page): Promise<void> => {
  await openTab(page, 'game')

  const round = page.locator(
    `${PANEL_SCREEN} .evening-rounds li:not(.add) .round`
  )
  const roundPage = page.locator(`${PANEL_SCREEN} .evening-page`)

  // A resize that remounted the tab has not drawn its rounds yet: counting
  // them there read nothing, and the floors were taken off the shelf instead.
  await expect(roundPage.or(round.first())).toBeVisible()

  if (await roundPage.isHidden()) {
    await round.first().click()
    await expect(roundPage).toBeVisible()
  }
}

/**
 * Moves the room onto one game of the shelf. A room with no game yet picks it
 * from the games tab itself; otherwise it is added as a second entry and the
 * first taken out, since the last entry of an evening cannot be.
 */
const switchGame = async ({
  index,
  page
}: {
  index: number
  page: Page
}): Promise<void> => {
  await openTab(page, 'game')

  const panel = page.locator(PANEL_SCREEN)
  const back = panel.locator('.evening-page .back')

  if (await back.isVisible()) {
    await back.click()
  }

  const games = panel.locator('.game-pick-list .pick')
  const add = panel.locator('.evening-rounds .add .round')

  await expect(games.first().or(add)).toBeVisible()

  if (await games.first().isVisible()) {
    await games.nth(index).click()
    await expect(panel.locator('.evening-page')).toBeVisible()

    return
  }

  await add.click()
  await games.nth(index).click()
  await expect(panel.locator('.evening-page')).toBeVisible()
  await back.click()

  const previous = panel.locator("[data-entry-at='0'] .action-menu-trigger")

  await previous.first().click()
  await page.locator('.action-menu-item[data-destructive]').click()
  // The panel for this game renders in the same commit that drops the previous
  // entry, so waiting on it is what stops the reads that follow from finding
  // the previous game's strips.
  await expect(panel.locator("[data-entry-at='1']")).toHaveCount(0)
}

/** The table's strips — the teams and the evening's length. */
const openTheTable = (page: Page): Promise<void> => openTab(page, 'table')

/** The room's strips — the hold and the countdown. */
const openTheRoom = (page: Page): Promise<void> => openTab(page, 'room')

test('[layout] no strip on the console ever holds rows of two different lengths', async ({
  page
}) => {
  // The sweep is every game, in both locales, at every width: it grows with
  // the shelf. Sixteen games take two to three minutes on an idle machine,
  // which left `test.slow()`'s 180 s no headroom for a loaded one.
  test.setTimeout(360_000)

  const collapsed: string[] = []
  const faults: string[] = []
  const withoutFloor: string[] = []
  const measured = new Set<string>()

  await page.goto('/')
  await homePage(page).createRoom.click()
  await expect(page).toHaveURL(/\/host\/[A-Z0-9]{4}$/)

  const games = page.locator(`${PANEL_SCREEN} .game-pick-list .pick`)

  await expect(games.first()).toBeVisible()

  const gameCount = await games.count()

  for (const locale of ['en', 'fr']) {
    await page.evaluate((chosen) => {
      localStorage.setItem('melee:locale', chosen)
    }, locale)
    await page.reload()
    await expect(panelTab(page, 'game')).toBeVisible()
    await page.evaluate(loadEveryFace)

    for (let index = 0; index < gameCount; index++) {
      await switchGame({ index, page })
      await openTheRound(page)

      // Two strips only exist once another strip has been pressed: the decade
      // grid, and the window a buzz has to be answered in. `decade` is second
      // among the sources and `buzzer` first among the modes — both assert what
      // they revealed, so a reordering fails here instead of quietly halving
      // what this spec covers.
      const source = page.locator('.track-source .segment')

      if ((await source.count()) > 0) {
        await source.nth(1).click()
        await expect(page.locator('.decades')).toBeVisible()
      }

      const modes = page.locator('.answer-mode .segment')

      // The answer window renders off the server's echo, not the press: a slow
      // runner read the floors before it landed and swept a strip it never had.
      if ((await modes.count()) > 0) {
        await modes.first().click()
        await expect(modes.first()).toHaveAttribute('data-selected')
      }

      // The round's own page first, then the two tabs of the room's settings.
      for (const open of [openTheRound, openTheTable, openTheRoom]) {
        await resizeTo({ page, width: NARROWEST_SCREEN })
        await open(page)
        await page.evaluate(loadEveryFace)

        const floors = await page.evaluate(readFloors)

        for (const [label, floor] of Object.entries(floors)) {
          if (floor === 0) {
            collapsed.push(`${locale} · ${label}`)
          }
        }

        await resizeTo({ page, width: WIDEST_PX })
        await open(page)
        await page.evaluate(loadEveryFace)

        const {
          faults: found,
          seen,
          withoutFloor: unread
        } = await page.evaluate(sweepShapes, {
          floors,
          step: STEP_PX,
          widest: WIDEST_PX
        })

        for (const label of seen) {
          measured.add(label)
        }

        for (const label of unread) {
          withoutFloor.push(`${locale} · ${label}`)
        }

        for (const fault of found) {
          faults.push(
            `${locale} · ${fault.label} · ${fault.shape} at ${fault.at}px, swept from ${fault.from}px`
          )
        }
      }
    }
  }

  expect(collapsed).toEqual([])
  expect(withoutFloor).toEqual([])
  expect(faults).toEqual([])
  expect(measured.size).toBeGreaterThanOrEqual(STRIPS_EXPECTED)
})
