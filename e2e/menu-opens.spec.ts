import { expect, test } from '@playwright/test'

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
