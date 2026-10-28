import type { Page } from '@playwright/test'

/**
 * Roles and accessible names, in one place rather than inline in a spec — a
 * renamed button then breaks one line instead of five. Two locators reach for a
 * class because the text they point at is prose with no role of its own; that
 * is the exception, not a licence to add test ids.
 */
export const homePage = (page: Page) => ({
  /** The blind test's spine on the shelf: a press opens a room set to it. */
  blindTest: page.getByRole('link', { name: /^Blind test/ }),
  /** The press on home: a room with nothing chosen yet. */
  createRoom: page.getByRole('button', { name: 'Open a table' })
})

export const hostConsole = (page: Page) => ({
  /** The track under the buzzer, on the host screen only. */
  answer: page.locator('.verdict-panel .title'),
  /**
   * Picked rather than assumed: a blind test opens on four choices, and this
   * journey is the buzzer's.
   *
   * The label rather than the radio it names — react-aria hides the `<input>`
   * under a `<label>` that takes the pointer, so the accessible name is what
   * finds it and the label is what can be clicked. Its text runs on into the
   * *Host judges* stamp under it, so the match is anchored, not exact.
   */
  buzzerMode: page.getByText(/^First to buzz/),
  /** What the QR code encodes. Following it is what scanning it does. */
  joinUrl: page.locator('.join-url'),
  /**
   * On the podium, the card under the reveal naming the round that comes next
   * and holding the press that opens it.
   */
  nextRoundCard: page
    .getByRole('heading', { name: /^Round \d+: / })
    .locator('xpath=ancestor::section[1]'),
  /**
   * The blind test's row in the panel's list of planned games, which opens its
   * page — the answer mode among its settings. Its name runs on into the row's
   * detail and stamp.
   */
  openBlindTestRound: page
    .getByRole('list', { name: 'Planned games' })
    .getByRole('button', { name: /^Blind test/ }),
  /** The panel's games tab, where the planned games are. */
  openGamesTab: page.getByRole('tab', { name: 'Games' }),
  /**
   * The blind test in the games tab's pick list, shown while the room has no
   * game. A press plans it and opens its page. Its name runs on into the
   * tagline.
   */
  pickBlindTest: page
    .getByRole('list', { name: 'What we’re playing' })
    .getByRole('button', { name: /^Blind test/ }),
  refusal: page.getByRole('heading', {
    name: 'No table under that code.'
  }),
  /** Ends a simultaneous round the room is not going to finish on its own. */
  reveal: page.getByRole('button', { name: 'Give it away' }),
  /** What a player wrote, published on the reveal and not before. */
  revealedAnswer: (said: string) =>
    page.getByRole('listitem').filter({ hasText: said }),
  /**
   * The roster in the lobby, and at the reveal the round's own line — which is
   * beside the standings there rather than instead of them, so the reveal panel
   * is what the search is scoped to. What the round paid and where the game
   * stands are two facts, and a bare row search finds a name in both.
   */
  rowFor: (nickname: string) =>
    page
      .locator('.reveal-panel, .stage.lobby')
      .getByRole('listitem')
      .filter({ hasText: nickname }),
  /** The board under the reveal — beside a wall, the players' column ranks them instead. */
  standings: page.getByRole('region', { name: 'Standings' }),
  startGame: page.getByRole('button', { name: 'Gather round' }),
  theyBuzzed: (nickname: string) =>
    page.getByRole('heading', { name: `${nickname} buzzed` }),
  /** The typed journey's pick, found the same way as `buzzerMode`. */
  typedMode: page.getByText('Type it', { exact: true }),
  verdictBoth: page.getByRole('button', { name: 'Title + artist' }),
  wayOut: page.getByRole('link', { name: 'Back to the games' })
})

export const playerScreen = (page: Page) => ({
  /** One field for either half — the server decides which one a guess was. */
  answerGuess: page.getByRole('textbox', { name: 'Your answer' }),
  buzz: page.getByRole('button', { name: 'Buzz' }),
  join: page.getByRole('button', { exact: true, name: 'Join' }),
  nickname: page.getByRole('textbox', { name: 'Nickname' }),
  scored: (points: number) => page.getByText(`+${points}`),
  sendAnswer: page.getByRole('button', { name: 'Send it' })
})
