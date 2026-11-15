import { type Browser, expect, type Page, test } from '@playwright/test'

import { hostConsole } from './support/locators'

/**
 * Not a journey. A countdown is centred in the box the screen's header and
 * footer leave, so anything in either still moving as it lands slides it: the
 * round's index reopening from no height, and a folded refusal note handing
 * back the height the reveal's footer had left it, dropped the token 13px in
 * its first 350ms after *Next round*; the round's index and the way in opening
 * in the header the lobby left empty dropped the first countdown 9px on a
 * console and 13 to 15px on a wall and the console beside it. A claim about
 * the painted frames, which no socket test can make.
 */

/** A sub-pixel step is the layout rounding, not a move anyone sees. */
const MOST_DRIFT_PX = 1

/** The second tick lands a second after the token, so this is a frame budget, not a wait. */
const LONGEST_COUNT_MS = 4000

const DESK = { height: 900, width: 1440 }

/** Below the desk, where the host's panel takes turns with the stage. */
const LAPTOP = { height: 768, width: 1024 }

/**
 * A buzzer room opened the way its own door opens it, its token filed where
 * the console looks for it — undated, which only makes it the first pruned —
 * and one player seated, so the console's launch is pressable.
 */
const openBuzzerRoom = async (
  browser: Browser,
  viewport: typeof DESK
): Promise<{ bigScreen: Page; roomCode: string }> => {
  const consoleMachine = await browser.newContext({ viewport })
  const bigScreen = await consoleMachine.newPage()
  await bigScreen.goto('/en')
  const roomCode = await bigScreen.evaluate(async (): Promise<string> => {
    const response = await fetch('/api/rooms', {
      body: JSON.stringify({ games: ['buzzer'], locale: 'en' }),
      headers: { 'content-type': 'application/json' },
      method: 'POST'
    })
    const { code, hostToken } = await response.json()
    localStorage.setItem(
      'melee:host-tokens',
      JSON.stringify([{ at: 0, hostToken, roomCode: code }])
    )

    return code
  })
  await bigScreen.goto(`/host/${roomCode}`)

  const playerMachine = await browser.newContext()
  await playerMachine.addInitScript(() => {
    localStorage.setItem('melee:nickname', 'Bertrand')
  })
  await (await playerMachine.newPage()).goto(`/play/${roomCode}`)

  return { bigScreen, roomCode }
}

/**
 * The token's top on every frame from the first frame it is drawn to the
 * second tick, reduced to how far it travelled. Armed before the press, so it
 * reads from the frame the countdown lands.
 */
const countdownDrift = (screen: Page): Promise<number> =>
  screen.evaluate(
    ({ longestMs }) =>
      new Promise<number>((resolve) => {
        const tops: number[] = []
        const startedAt = performance.now()
        let firstSecond: string | null = null

        const frame = () => {
          const token = document.querySelector('.stage > .countdown')
          const second =
            token?.querySelector('.numeral:not([data-leaving])')?.textContent ??
            null

          if (token !== null && second !== null) {
            firstSecond ??= second
            if (second !== firstSecond) {
              resolve(Math.max(...tops) - Math.min(...tops))
              return
            }
            tops.push(token.getBoundingClientRect().top)
          }

          if (performance.now() - startedAt > longestMs) {
            resolve(Number.POSITIVE_INFINITY)
            return
          }

          requestAnimationFrame(frame)
        }

        requestAnimationFrame(frame)
      }),
    { longestMs: LONGEST_COUNT_MS }
  )

test('[e2e] the countdown Next round opens lands where it stays', async ({
  browser
}) => {
  const { bigScreen } = await openBuzzerRoom(browser, DESK)
  const host = hostConsole(bigScreen)
  await host.startGame.click()
  await host.reveal.click()
  await expect(host.nextRound).toBeVisible()

  const drift = countdownDrift(bigScreen)
  await host.nextRound.click()

  expect(await drift).toBeLessThanOrEqual(MOST_DRIFT_PX)
})

for (const [shape, viewport] of [
  ['laptop', LAPTOP],
  ['desk', DESK]
] as const) {
  test(`[e2e] the first countdown lands where it stays on a ${shape} console`, async ({
    browser
  }) => {
    const { bigScreen } = await openBuzzerRoom(browser, viewport)
    const host = hostConsole(bigScreen)
    await expect(host.startGame).toBeEnabled()

    const drift = countdownDrift(bigScreen)
    await host.startGame.click()

    expect(await drift).toBeLessThanOrEqual(MOST_DRIFT_PX)
  })
}

test('[e2e] the first countdown lands where it stays on a wall and the console beside it', async ({
  browser
}) => {
  const { bigScreen, roomCode } = await openBuzzerRoom(browser, DESK)
  const host = hostConsole(bigScreen)
  // A tab beside the console, which holds the token the wall gets in with.
  const wall = await bigScreen.context().newPage()
  await wall.goto(`/wall/${roomCode}`)
  await expect(host.startGame).toBeEnabled()
  await expect(wall.locator('.stage.lobby')).toBeVisible()

  const drifts = Promise.all([countdownDrift(bigScreen), countdownDrift(wall)])
  await host.startGame.click()

  const [consoleDrift, wallDrift] = await drifts
  expect(consoleDrift).toBeLessThanOrEqual(MOST_DRIFT_PX)
  expect(wallDrift).toBeLessThanOrEqual(MOST_DRIFT_PX)
})
