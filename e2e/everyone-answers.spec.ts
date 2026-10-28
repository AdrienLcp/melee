import { expect, test } from '@playwright/test'

import { homePage, hostConsole, playerScreen } from './support/locators'

/**
 * The buzzer journey covers one player taking the floor. This one covers the
 * opposite shape — two players guessing over the same clip, each of them free to
 * keep firing, and the reveal saying what each of them last wrote.
 *
 * It earns its place against a socket suite because none of that is a rule: it
 * is two browsers, two forms and a screen that has to end up showing both
 * answers. The rules are tested where they live.
 */
test('[e2e] two players type over the same clip, and the reveal says what they said', async ({
  browser
}) => {
  const consoleMachine = await browser.newContext()
  const bigScreen = await consoleMachine.newPage()
  const firstScreen = await (await browser.newContext()).newPage()
  const secondScreen = await (await browser.newContext()).newPage()

  const host = hostConsole(bigScreen)

  // From the blind test's spine, so the room opens already set to it.
  // `full-game.spec.ts` presses the home tray, which opens one with
  // nothing chosen — the two are different rooms and the difference shows up
  // much later, at a launch that stays greyed out.
  await bigScreen.goto('/en')
  await homePage(bigScreen).blindTest.click()
  await expect(bigScreen).toHaveURL(/\/host\/[A-Z0-9]{4}$/)

  const joinUrl = await host.joinUrl.innerText()

  for (const [screen, nickname] of [
    [firstScreen, 'Zoe'],
    [secondScreen, 'Max']
  ] as const) {
    const player = playerScreen(screen)

    await screen.goto(joinUrl)
    await player.nickname.fill(nickname)
    await player.join.click()
    await expect(host.rowFor(nickname)).toBeVisible()
  }

  // A blind test opens on four choices, so typing is picked.
  await host.openGamesTab.click()
  await host.openBlindTestRound.click()
  await host.typedMode.click()

  // The room's own screen, opened the way the console's link opens it: a tab
  // beside the console, which is what holds the host token it gets in with.
  // Beside it the console lays out flat as the podium the reveal is read on.
  const roomCode = new URL(bigScreen.url()).pathname.split('/').at(-1)
  const wall = await consoleMachine.newPage()

  await wall.goto(`/wall/${roomCode}`)
  await expect(host.startGame).toBeEnabled()
  await host.startGame.click()

  const zoe = playerScreen(firstScreen)
  const max = playerScreen(secondScreen)

  await zoe.answerGuess.fill('a wild guess')
  await zoe.sendAnswer.click()

  // A guess that lands nothing costs the round nothing: the field empties and
  // is ready for the next one, which is the whole point of one field.
  await expect(zoe.answerGuess).toHaveValue('')
  await expect(zoe.answerGuess).toBeEditable()

  await zoe.answerGuess.fill('and another')
  await zoe.sendAnswer.click()
  await expect(zoe.answerGuess).toHaveValue('')

  // One player guessing does not take the floor: the other can still write.
  await max.answerGuess.fill('another one')
  await max.sendAnswer.click()

  // Nobody found anything, so nothing closes this round by itself.
  await host.reveal.click()

  // On the podium the press that goes on leaves the round for the card naming
  // the next one, and the players' column ranks the room in the standings'
  // place.
  await expect(host.nextRoundCard).toContainText('Round 2: Blind test')
  await expect(
    host.nextRoundCard.getByRole('button', { exact: true, name: 'Next round' })
  ).toBeVisible()
  await expect(host.standings).toHaveCount(0)

  // Their latest miss, not their first: a name on the reveal with nothing
  // beside it reads as a bug rather than as a player who tried.
  await expect(host.revealedAnswer('and another')).toBeVisible()
  await expect(host.revealedAnswer('another one')).toBeVisible()
  await expect(firstScreen.getByText('It was')).toBeVisible()
})
