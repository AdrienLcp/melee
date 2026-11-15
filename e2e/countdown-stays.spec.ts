import { expect, test } from '@playwright/test'

import { hostConsole } from './support/locators'

/**
 * Not a journey. The countdown a console's *Next round* opens is centred in
 * the box its header and footer leave, so anything in either still moving as
 * it lands slides it: the round's index reopening from no height, and a
 * folded refusal note handing back the height the reveal's footer had left it,
 * dropped the token 13px in its first 350ms. A claim about the painted frames,
 * which no socket test can make.
 */

/** A sub-pixel step is the layout rounding, not a move anyone sees. */
const MOST_DRIFT_PX = 1

/** The second tick lands a second after the token, so this is a frame budget, not a wait. */
const LONGEST_COUNT_MS = 4000

test('[e2e] the countdown Next round opens lands where it stays', async ({
  browser
}) => {
  const consoleMachine = await browser.newContext({
    viewport: { height: 900, width: 1440 }
  })
  const bigScreen = await consoleMachine.newPage()
  await bigScreen.goto('/en')
  // The room opened as the buzzer's own door opens it, its token filed where
  // the console looks for it — undated, which only makes it the first pruned.
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

  const host = hostConsole(bigScreen)
  await host.startGame.click()
  await host.reveal.click()
  await expect(host.nextRound).toBeVisible()

  const drift = bigScreen.evaluate(
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
  await host.nextRound.click()

  expect(await drift).toBeLessThanOrEqual(MOST_DRIFT_PX)
})
