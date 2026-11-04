import { expect, type Page, test } from '@playwright/test'

/**
 * Not a journey: the one screen that may never scroll, measured. A question and
 * its four choices are all visible at once on every viewport, at every ratio,
 * for the worst content the bank holds — and a geometry claim only a browser
 * can check.
 *
 * The room is a stub. The socket is answered in the page with a snapshot built
 * here, so the question on screen is the one under test rather than whichever
 * the server deals, and nothing waits on a countdown.
 */

// Every page arrives on `page-enter`, 8px low for 260ms, and the first viewport
// is measured inside that window: a slow runner caught the page a pixel or two
// under the fold. The geometry under test is the settled one.
test.use({ reducedMotion: 'reduce' })

const VIEWPORTS = [
  [320, 568],
  [360, 640],
  [390, 844],
  [430, 932],
  [568, 320],
  [667, 375],
  [812, 375],
  [768, 1024],
  [1024, 768],
  [900, 900],
  [1280, 720],
  [1440, 900],
  [1920, 1080],
  [2560, 1080],
  [3440, 1440],
  [1080, 1920]
] as const

/**
 * A 4K panel either way up, beside every viewport above. Only the screen the
 * room reads is held to it: nobody holds a phone with that many pixels.
 */
const ROOM_VIEWPORTS = [...VIEWPORTS, [3840, 2160], [2160, 3840]] as const

/**
 * The wall is a television, a monitor or a tablet hung up for the evening: it
 * is held to every room viewport whose short side is at least 720px.
 */
const WALL_VIEWPORTS = ROOM_VIEWPORTS.filter(
  ([width, height]) => Math.min(width, height) >= 720
)

type Question = {
  category: string
  choices: [string, string, string, string]
  id: string
  prompt: string
}

/**
 * The bank rows the redesign was measured against, verbatim. The bank's one
 * 275-character choice is not here: it was repaired to 123 in
 * `question-repairs.json`, because no screen could hold it at the floor.
 */
const LONGEST_PROMPT: Question = {
  // The longest French prompt: 192 characters.
  category: 'geography',
  choices: ['France', 'Portugal', 'République populaire de Chine', 'Brésil'],
  id: 'mintaka-8db29866',
  prompt:
    'Quel pays nous a donné la Statue de la Liberté en mille huit cent soixante-seize, pour marquer le centenaire de la Déclaration d’indépendance des États-Unis de mille sept cent soixante-seize ?'
}

const WORST_CASES: Question[] = [
  LONGEST_PROMPT,
  {
    // Four long choices at once, up to 160 characters each.
    category: 'arts',
    choices: [
      'Ils ont prononcé leurs vœux et sont devenus partenaires de vie.',
      "Ils se sont dit qu'il vaudrait mieux qu'ils arrêtent de se voir pendant un moment car Céleste doit aider le Grand Esprit.",
      'Ils se sont disputés.',
      "Rocher lui a dit que, avant il était amoureux d'une autre éléphante et que Céleste lui ressemblait, c'est pour ça qu'elle l'attirait, alors elle s'est fâchée."
    ],
    id: 'vikidia-bravelands-13',
    prompt:
      "Qu'ont fait Rocher et Céleste à la mare sacré où l'a emmené Rocher ?"
  },
  {
    // The most choice text in one row: 382 characters over four tiles.
    category: 'everyday',
    choices: [
      'Les verbes du 2e groupes sont ceux qui se terminent par -ir et qui font -issons au présent, par exemple nous finissons.',
      'Les verbes du 2e groupes sont ceux qui se terminent par -issons',
      'Les verbes du 2e groupes sont ceux qui se terminent par -ir et qui font -irons au présent, par exemple nous irons.',
      'Les verbes du 2e groupes sont ceux qui se terminent par -re, par exemple nous prenons.'
    ],
    id: 'vikidia-conjugaison-4',
    prompt: 'Quels sont les verbes du 2e groupe?'
  },
  {
    // A long question over long choices, which no other row beats on both.
    category: 'arts',
    choices: [
      "Il doit porter une vieille dame jusqu'au Camp Jupiter ; la vieille dame est Junon",
      'Il doit aider un vieux monsieur à traverser la route ; le monsieur est Neptune',
      'Il doit aller dans le tunnel et ouvrir un portail car une jeune fille le lui a demandé ; cette jeune fille est Diane',
      'Il doit protéger un homme qui est saoul ; cet homme est Bacchus'
    ],
    id: 'vikidia-heros-de-l-olympe-1',
    prompt:
      "Quand Percy arrive à l'entrée du Camp Jupiter, une personne lui demande quelque chose. Que doit il faire et qui est cette personne ?"
  }
]

const ROOM_CODE = 'KWRH'

/**
 * The stub's whole notion of time: the client only ever draws the server's
 * deadline, and a frozen one keeps the round's clock where it was dealt.
 */
const SERVER_TIME = 1_800_000_000_000

const players = [
  {
    board: null,
    colour: 1,
    id: 'p1',
    isConnected: true,
    isReady: false,
    nickname: 'Wolfgangamadeusmozar',
    score: 11
  },
  {
    board: null,
    colour: 2,
    id: 'p2',
    isConnected: true,
    isReady: false,
    nickname: 'Mamie Jo',
    score: 14
  },
  {
    board: null,
    colour: 3,
    id: 'p3',
    isConnected: true,
    isReady: false,
    nickname: 'Théo',
    score: 8
  }
]

const choosingView = (question: Question) => ({
  code: ROOM_CODE,
  isHostConnected: true,
  isPaused: false,
  isWallConnected: false,
  phase: 'playing',
  players,
  round: {
    activeBuzz: null,
    advancesAt: null,
    answers: [],
    awards: [],
    content: {
      choices: question.choices,
      kind: 'quiz',
      prompt: {
        category: question.category,
        flag: null,
        id: question.id,
        prompt: question.prompt,
        rebus: null,
        silhouette: null
      },
      revealedQuestion: null
    },
    duel: null,
    id: 'r4',
    index: 4,
    isReadyHold: false,
    joinedAfterStart: false,
    lineUpAt: 0,
    lockedOutPlayerIds: [],
    openedWithPlayerIds: null,
    revealedAnswers: [],
    startsAt: SERVER_TIME - 2_000
  },
  roundElapsedMs: 2_000,
  settings: {
    autoAdvanceMs: null,
    board: { kind: 'off' },
    countdownMs: 3_000,
    game: {
      categories: [],
      kind: 'quiz',
      language: 'fr',
      roundDurationMs: 30_000,
      wellKnownOnly: false
    },
    hasJudge: false,
    lineUp: [
      {
        categories: [],
        kind: 'quiz',
        language: 'fr',
        roundDurationMs: 30_000,
        wellKnownOnly: false
      }
    ],
    lineUpAt: 0,
    mode: { kind: 'choice' },
    roundCount: 10,
    runningOrder: [],
    teamScoring: 'balanced',
    teams: { kind: 'off' }
  },
  teams: [],
  youId: 'p1',
  yourVerdict: null
})

/**
 * The same round on a console whose host took the first seat. It is withheld
 * the answer the way a player is. No wall is paired: beside one the console is
 * the podium, whose columns scroll by design, so the screen held to the
 * viewport is the console standing alone.
 */
const seatedHostView = (question: Question) => ({
  ...choosingView(question),
  challengeHand: [],
  currentContent: { kind: 'quiz', question: null },
  isSpeaker: true,
  isWallConnected: false,
  lineUpPlayed: [],
  remainingPoolSize: 40,
  silentClip: null,
  volume: null,
  wallCount: 0,
  walls: []
})

const table = [
  'Wolfgangamadeusmozar',
  'Mamie Jo',
  'Théo',
  'Zoé',
  'Bertrand',
  'Inès',
  'Anne-Charlotte',
  'Marc'
].map((nickname, seat) => ({
  board: null,
  colour: (seat % 12) + 1,
  id: `p${seat + 1}`,
  isConnected: true,
  isReady: false,
  nickname,
  score: seat * 3
}))

/**
 * The same round on a console nobody sat down at, which is the screen the room
 * reads: the four tiles printed, a full table of pawns, three of them in. It
 * has a header and a footer the other two do not, and the same rule.
 */
const consoleView = (question: Question) => {
  const view = seatedHostView(question)

  return {
    ...view,
    players: table,
    round: {
      ...view.round,
      answers: ['p2', 'p3', 'p6'].map((playerId) => ({
        atServerTime: SERVER_TIME - 1_000,
        playerId
      }))
    },
    youId: null
  }
}

/**
 * The same round on the screen of a seat outside its duel, which reads it over
 * a duellist's shoulder: the question and the four tiles, printed.
 */
const duelWatchedView = (question: Question) => {
  const view = choosingView(question)
  const duellists = ['p2', 'p3']

  return {
    ...view,
    round: {
      ...view.round,
      duel: { seatIds: duellists, teamIds: ['team-1', 'team-2'] },
      openedWithPlayerIds: duellists
    },
    settings: { ...view.settings, teams: { count: 2, kind: 'drawn' } },
    teams: [['p1', 'p2'], ['p3']].map((seatIds, team) => ({
      board: null,
      colour: team + 1,
      gain: 0,
      id: `team-${team + 1}`,
      name: null,
      score: 0,
      seatIds
    }))
  }
}

type Seat = {
  /** What the test is titled by. */
  name: string
  /** The route the screen is opened on. */
  path: string
  role: 'host' | 'player' | 'room'
  view: (question: Question) => object
}

const SEATS: Seat[] = [
  {
    name: 'player',
    path: `/play/${ROOM_CODE}`,
    role: 'player',
    view: choosingView
  },
  {
    name: 'player watching a duel',
    path: `/play/${ROOM_CODE}`,
    role: 'player',
    view: duelWatchedView
  },
  {
    name: 'host',
    path: `/host/${ROOM_CODE}`,
    role: 'host',
    view: seatedHostView
  },
  { name: 'room', path: `/host/${ROOM_CODE}`, role: 'room', view: consoleView }
]

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

/**
 * Stamps the round with the answer mode and the duration the settings carry,
 * the way the server does as a round opens — so a fixture written against the
 * settings draws the round it describes. A round that names its own wins.
 */
const withStampedRound = (view: object): object => {
  if (
    !('round' in view && isRecord(view.round)) ||
    !('settings' in view && isRecord(view.settings))
  ) {
    return view
  }

  const { game, mode } = view.settings

  return {
    ...view,
    round: {
      answerMode: isRecord(mode) ? mode.kind : null,
      durationMs: isRecord(game) ? (game.roundDurationMs ?? null) : null,
      ...view.round
    }
  }
}

/**
 * Answers the screen's socket the way the room would: a welcome carrying the
 * snapshot to the hello, a pong to every ping. The protocol version is echoed
 * from the hello, so a bump never strands this check on a stale number.
 */
/**
 * A resize returns before the page has answered it: React swaps the host's
 * panel on a media query, and a size read in that window measures the layout
 * of the previous viewport. Two frames is the swap committed and laid out.
 */
const resizeTo = async ({
  height,
  page,
  width
}: {
  height: number
  page: Page
  width: number
}): Promise<void> => {
  await page.setViewportSize({ height, width })
  await page.evaluate(async () => {
    await document.fonts.ready
    await new Promise((resolve) => requestAnimationFrame(resolve))
    await new Promise((resolve) => requestAnimationFrame(resolve))
  })
}

const serveRoom = async ({ page, view }: { page: Page; view: object }) => {
  await page.routeWebSocket(/\/ws\/rooms\//, (socket) => {
    socket.onMessage((raw) => {
      const message = JSON.parse(String(raw))

      if (message.type === 'hello') {
        socket.send(
          JSON.stringify({
            protocolVersion: message.protocolVersion,
            serverTime: SERVER_TIME,
            sessionId: message.sessionId,
            type: 'welcome',
            view: withStampedRound(view)
          })
        )
      }

      if (message.type === 'time.ping') {
        socket.send(
          JSON.stringify({
            clientSentAt: message.clientSentAt,
            serverTime: SERVER_TIME,
            type: 'time.pong'
          })
        )
      }
    })
  })
}

/** The legibility floor: no word of the question or a choice is drawn smaller. */
const FLOOR_PX = 14

type Overflow = {
  /** The smallest type any word of the question or the choices is set in. */
  floor: number
  /** What reaches furthest past the viewport, when anything does. */
  furthest: string | null
  page: number
  /** Every tile or card whose words run past its own box. */
  spills: string[]
  /** Every tile or card whose box runs past the viewport. */
  strays: string[]
}

const measure = (): Overflow => {
  // A line set tighter than the face's own ascent and descent reaches past its
  // box by a sliver of an em, which no eye sees and which grows with the type:
  // a pixel at 1080p is three at 4K, where the same words are twice the size.
  const slackFor = (piece: HTMLElement): number =>
    Math.max(
      1,
      0.05 *
        Math.max(
          ...[piece, ...piece.querySelectorAll('*')].map((element) =>
            Number.parseFloat(getComputedStyle(element).fontSize)
          )
        )
    )
  const root = document.scrollingElement ?? document.documentElement
  const pieces = [
    ...document.querySelectorAll<HTMLElement>(
      '.answer-tile, .asked-question, .round-card'
    )
  ]

  // A folded panel keeps its contents laid out under `content-visibility:
  // hidden`, which still reports a box; nobody can see it, so it reaches
  // nowhere.
  // The host's panel scrolls inside its own box, so nothing in it reaches
  // past the screen.
  const furthest = [...document.body.querySelectorAll<HTMLElement>('*')]
    .filter(
      (element) =>
        element.checkVisibility() && element.closest('.panel-screen') === null
    )
    .map((element) => ({
      bottom: element.getBoundingClientRect().bottom,
      element
    }))
    .filter(({ bottom }) => bottom > innerHeight + 0.5)
    .toSorted((a, b) => b.bottom - a.bottom)[0]

  const words = [
    ...document.querySelectorAll<HTMLElement>(
      '.answer-tile .title, .answer-tile .subtitle, .asked-question .prompt'
    )
  ]

  return {
    floor: Math.min(
      ...words.map((word) => Number.parseFloat(getComputedStyle(word).fontSize))
    ),
    furthest:
      furthest === undefined
        ? null
        : `${furthest.element.tagName.toLowerCase()}.${furthest.element.className} @${Math.round(furthest.bottom)}`,
    page: Math.max(
      root.scrollHeight - innerHeight,
      root.scrollWidth - innerWidth,
      0
    ),
    spills: pieces
      .filter(
        (piece) =>
          piece.scrollHeight > piece.clientHeight + slackFor(piece) ||
          piece.scrollWidth > piece.clientWidth + slackFor(piece)
      )
      .map((piece) => piece.textContent?.slice(0, 24) ?? ''),
    strays: pieces
      .filter((piece) => {
        const box = piece.getBoundingClientRect()

        return (
          box.top < 0 ||
          box.left < 0 ||
          box.bottom > innerHeight + 0.5 ||
          box.right > innerWidth + 0.5
        )
      })
      .map((piece) => piece.textContent?.slice(0, 24) ?? '')
  }
}

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    localStorage.setItem('melee:volume', '0')
    localStorage.setItem('melee:nickname', 'Wolfgangamadeusmozar')
  })
})

for (const seat of SEATS) {
  for (const question of WORST_CASES) {
    test(`[layout] ${seat.name}, ${question.id}: the question and its four choices never scroll`, async ({
      page
    }) => {
      await serveRoom({ page, view: seat.view(question) })
      await page.setViewportSize({ height: 844, width: 390 })
      await page.goto(seat.path)
      await expect(page.locator('.answer-tile')).toHaveCount(4)
      await page.evaluate(() => document.fonts.ready.then(() => {}))

      const faults: string[] = []

      for (const [width, height] of seat.role === 'room'
        ? ROOM_VIEWPORTS
        : VIEWPORTS) {
        await resizeTo({ height, page, width })

        const overflow = await page.evaluate(measure)

        if (
          overflow.floor < FLOOR_PX ||
          overflow.furthest !== null ||
          overflow.page > 0 ||
          overflow.spills.length > 0 ||
          overflow.strays.length > 0
        ) {
          faults.push(`${width}×${height} ${JSON.stringify(overflow)}`)
        }
      }

      expect(faults).toEqual([])
      // The sweep outlasts the close of the socket StrictMode tore down, which
      // once overwrote the live one and greyed every control out.
      await expect(page.locator('.alert[role=status]')).toHaveText('')
    })
  }
}

const ATLAS_NAME_GAME = {
  direction: 'name',
  kind: 'atlas',
  places: ['countries'],
  roundDurationMs: 30_000
}

/**
 * The same seats on Atlas's `name` round, where the map is the question card's
 * picture: it asks for a share of the height a quiz prompt never did, beside
 * the longest four country names the map deals.
 */
const asNameRound = (view: object): object => {
  if (
    !('round' in view && isRecord(view.round)) ||
    !('settings' in view && isRecord(view.settings))
  ) {
    return view
  }

  return {
    ...view,
    ...('currentContent' in view ? { currentContent: null } : {}),
    round: {
      ...view.round,
      content: {
        choices: [
          {
            en: 'Democratic Republic of the Congo',
            fr: 'République démocratique du Congo'
          },
          { en: 'Central African Republic', fr: 'République centrafricaine' },
          { en: 'Republic of the Congo', fr: 'République du Congo' },
          { en: 'South Sudan', fr: 'Soudan du Sud' }
        ],
        direction: 'name',
        kind: 'atlas',
        revealedPlacements: null,
        shown: { kind: 'country', point: { latitude: -2.9, longitude: 23.6 } },
        target: null
      }
    },
    settings: {
      ...view.settings,
      game: ATLAS_NAME_GAME,
      lineUp: [ATLAS_NAME_GAME]
    }
  }
}

/** The map's presses, by name, that its frame cuts or hides. */
const pressesOutsideTheMap = (): string[] => {
  const map = document.querySelector('.map-question .world-map')

  if (map === null) {
    return []
  }

  const frame = map.getBoundingClientRect()

  return [...map.querySelectorAll<HTMLElement>('.controls .button')]
    .filter((press) => {
      const box = press.getBoundingClientRect()

      return (
        box.top < frame.top - 0.5 ||
        box.left < frame.left - 0.5 ||
        box.bottom > frame.bottom + 0.5 ||
        box.right > frame.right + 0.5
      )
    })
    .map((press) => press.getAttribute('aria-label') ?? press.className)
}

for (const seat of SEATS) {
  test(`[layout] ${seat.name}, atlas name round: the map and its four choices never scroll`, async ({
    page
  }) => {
    await serveRoom({ page, view: asNameRound(seat.view(LONGEST_PROMPT)) })
    // French runs longer, and its shorter prompt once narrowed the map.
    await page.addInitScript(() => {
      localStorage.setItem('melee:locale', 'fr')
    })
    await page.setViewportSize({ height: 844, width: 390 })
    await page.goto(seat.path)
    await expect(page.locator('.answer-tile')).toHaveCount(4)
    await expect(page.locator('.map-question .world-map')).toBeVisible()
    await page.evaluate(() => document.fonts.ready.then(() => {}))

    const faults: string[] = []

    for (const [width, height] of seat.role === 'room'
      ? ROOM_VIEWPORTS
      : VIEWPORTS) {
      await resizeTo({ height, page, width })

      const overflow = await page.evaluate(measure)
      const cutPresses = await page.evaluate(pressesOutsideTheMap)

      if (
        overflow.floor < FLOOR_PX ||
        overflow.furthest !== null ||
        overflow.page > 0 ||
        overflow.spills.length > 0 ||
        overflow.strays.length > 0 ||
        cutPresses.length > 0
      ) {
        faults.push(
          `${width}×${height} ${JSON.stringify({ ...overflow, cutPresses })}`
        )
      }
    }

    expect(faults).toEqual([])
  })
}

/**
 * The reveal on the screen the room reads: the answer, what the table said, the
 * standings and the hold bar, all inside the viewport at once — above the split
 * side by side, below it under a one-line score track, with a chip per distinct
 * answer.
 */
const said = [
  'France',
  'République populaire de Chine',
  'France',
  'Portugal',
  'France',
  'Brésil',
  'France',
  'Portugal'
]

const revealedView = (content: object) => {
  const view = consoleView(LONGEST_PROMPT)
  const revealedAnswers = table.map(({ id }, seat) => ({
    atServerTime: SERVER_TIME - 1_000,
    isCorrect: said[seat] === 'France',
    playerId: id,
    said: said[seat]
  }))

  return {
    ...view,
    phase: 'revealed',
    round: {
      ...view.round,
      advancesAt: SERVER_TIME + 20_000,
      awards: revealedAnswers
        .filter((answer) => answer.isCorrect)
        .map(({ playerId }, order) => ({
          isUnsent: false,
          playerId,
          points: 3 + Math.max(0, 3 - order),
          speedBonus: Math.max(0, 3 - order),
          verdict: { isCorrect: true, kind: 'single' }
        })),
      content,
      isReadyHold: false,
      revealedAnswers
    },
    settings: { ...view.settings, autoAdvanceMs: 25_000 }
  }
}

const QUIZ_WITH_A_NOTE = {
  choices: LONGEST_PROMPT.choices,
  kind: 'quiz',
  prompt: {
    category: LONGEST_PROMPT.category,
    flag: null,
    id: LONGEST_PROMPT.id,
    prompt: LONGEST_PROMPT.prompt,
    rebus: null,
    silhouette: null
  },
  revealedQuestion: {
    answer: 'France',
    note: 'Offerte par la France pour le centenaire de la Déclaration d’indépendance, elle fut inaugurée à New York en 1886, dix ans après la date prévue.'
  }
}

const REVEALS = [
  {
    content: QUIZ_WITH_A_NOTE,
    name: 'quiz with a note'
  },
  {
    content: {
      asksForAFilm: false,
      choices: [],
      kind: 'blindtest',
      revealedTrack: {
        artist: 'Jean-Jacques Goldman',
        coverUrl: null,
        film: null,
        id: 't1',
        title: '...Baby One More Time (Radio Edit)'
      }
    },
    name: 'blind test'
  }
]

type RevealOverflow = {
  furthest: string | null
  page: number
  /**
   * Every row drawn past the bottom of the list that holds it, or whose own
   * contents run past its sides.
   */
  spills: string[]
}

const measureReveal = (): RevealOverflow => {
  const root = document.scrollingElement ?? document.documentElement
  // The narrow final board hides whichever of its standings and score track
  // does not fit with `visibility`, which a bare `checkVisibility()` ignores.
  const isDrawn = (element: Element) =>
    element.checkVisibility({ visibilityProperty: true })
  const rows = [
    ...document.querySelectorAll<HTMLElement>(
      '.stage.revealed .reveal-panel li, .stage:is(.revealed, .finished, .slate-correcting) .standings li, .slate-correcting .groups li, .slate-writing :is(.items, .progress) li'
    )
  ].filter(isDrawn)
  // The host's panel scrolls inside its own box, so nothing in it reaches
  // past the screen.
  const furthest = [...document.body.querySelectorAll<HTMLElement>('*')]
    .filter(
      (element) => isDrawn(element) && element.closest('.panel-screen') === null
    )
    .map((element) => ({
      bottom: element.getBoundingClientRect().bottom,
      element
    }))
    .filter(({ bottom }) => bottom > innerHeight + 0.5)
    .toSorted((a, b) => b.bottom - a.bottom)[0]

  return {
    furthest:
      furthest === undefined
        ? null
        : `${furthest.element.tagName.toLowerCase()}.${furthest.element.className} @${Math.round(furthest.bottom)}`,
    page: Math.max(
      root.scrollHeight - innerHeight,
      root.scrollWidth - innerWidth,
      0
    ),
    spills: rows
      .filter(
        (row) =>
          row.getBoundingClientRect().bottom >
            (row.parentElement?.getBoundingClientRect().bottom ?? 0) + 0.5 ||
          row.scrollWidth > row.clientWidth + 1
      )
      .map((row) => row.textContent?.slice(0, 24) ?? '')
  }
}

for (const reveal of REVEALS) {
  test(`[layout] room, ${reveal.name}: the reveal and the standings never scroll`, async ({
    page
  }) => {
    await serveRoom({ page, view: revealedView(reveal.content) })
    // French runs longer, on the footer's controls most of all.
    await page.addInitScript(() => {
      localStorage.setItem('melee:locale', 'fr')
    })
    await page.setViewportSize({ height: 720, width: 1280 })
    await page.goto(`/host/${ROOM_CODE}`)
    await expect(page.locator('.reveal-panel .round-podium')).toBeVisible()

    const faults: string[] = []

    for (const [width, height] of ROOM_VIEWPORTS) {
      await resizeTo({ height, page, width })

      const overflow = await page.evaluate(measureReveal)

      if (
        overflow.furthest !== null ||
        overflow.page > 0 ||
        overflow.spills.length > 0
      ) {
        faults.push(`${width}×${height} ${JSON.stringify(overflow)}`)
      }
    }

    expect(faults).toEqual([])
  })
}

const blindTestRound = (phase: 'buzzed' | 'countdown') => {
  const view = consoleView(LONGEST_PROMPT)
  const track = {
    artist: 'Jean-Jacques Goldman',
    coverUrl: null,
    film: null,
    id: 't1',
    previewUrl: 'https://example.com/clip.mp3',
    title: 'Quand la musique est bonne'
  }

  return {
    ...view,
    currentContent: {
      audioUrl: null,
      kind: 'blindtest',
      playback: { isPaused: false, restarts: 0 },
      track
    },
    phase,
    round: {
      ...view.round,
      activeBuzz:
        phase === 'buzzed'
          ? {
              atServerTime: SERVER_TIME,
              expiresAt: SERVER_TIME + 10_000,
              playerId: 'p7'
            }
          : null,
      content: {
        asksForAFilm: false,
        choices: [],
        kind: 'blindtest',
        revealedTrack: null
      },
      startsAt:
        phase === 'countdown' ? SERVER_TIME + 3_000 : view.round.startsAt
    },
    settings: {
      ...view.settings,
      game: {
        difficulty: 'mixed',
        kind: 'blindtest',
        roundDurationMs: 30_000,
        source: {
          charts: [],
          decades: null,
          hasFilmScores: false,
          kind: 'catalogue'
        }
      },
      lineUp: [
        {
          difficulty: 'mixed',
          kind: 'blindtest',
          roundDurationMs: 30_000,
          source: {
            charts: [],
            decades: null,
            hasFilmScores: false,
            kind: 'catalogue'
          }
        }
      ],
      lineUpAt: 0,
      mode: { answerWindowMs: 10_000, kind: 'buzzer' }
    }
  }
}

const FLOOR_SCREENS = [
  {
    name: 'countdown',
    ready: '.stage.solo .countdown',
    view: blindTestRound('countdown')
  },
  {
    name: 'verdict',
    ready: '.verdict-panel .choice',
    view: blindTestRound('buzzed')
  }
]

for (const screen of FLOOR_SCREENS) {
  test(`[layout] room, ${screen.name}: the stage never scrolls`, async ({
    page
  }) => {
    await serveRoom({ page, view: screen.view })
    await page.addInitScript(() => {
      localStorage.setItem('melee:locale', 'fr')
    })
    await page.setViewportSize({ height: 720, width: 1280 })
    await page.goto(`/host/${ROOM_CODE}`)
    await expect(page.locator(screen.ready).first()).toBeVisible()

    const faults: string[] = []

    for (const [width, height] of ROOM_VIEWPORTS) {
      await resizeTo({ height, page, width })

      const overflow = await page.evaluate(measureReveal)

      if (overflow.furthest !== null || overflow.page > 0) {
        faults.push(`${width}×${height} ${JSON.stringify(overflow)}`)
      }
    }

    expect(faults).toEqual([])
  })
}

/**
 * The final board on the screen the room reads: the winner's pawn and name
 * beside the standings, with the two exits under them. The longest legal
 * nickname winning alone, and three sharing first place.
 */
const finishedView = (scores: number[]) => {
  const view = consoleView(LONGEST_PROMPT)

  return {
    ...view,
    phase: 'finished',
    players: table.map((player, seat) => ({
      ...player,
      score: scores[seat] ?? 0
    })),
    round: null
  }
}

const LONG_NAME_WINNING = [30, 3, 6, 9, 12, 15, 18, 21]

const FINALS = [
  { name: 'a long name winning', scores: LONG_NAME_WINNING },
  { name: 'a three-way tie', scores: [21, 21, 6, 9, 12, 15, 21, 0] }
]

for (const final of FINALS) {
  test(`[layout] room, final board with ${final.name}: never scrolls`, async ({
    page
  }) => {
    await serveRoom({ page, view: finishedView(final.scores) })
    await page.addInitScript(() => {
      localStorage.setItem('melee:locale', 'fr')
    })
    await page.setViewportSize({ height: 720, width: 1280 })
    await page.goto(`/host/${ROOM_CODE}`)
    await expect(page.locator('.final-board .standings li')).toHaveCount(8)

    const faults: string[] = []

    for (const [width, height] of ROOM_VIEWPORTS) {
      await resizeTo({ height, page, width })

      const overflow = await page.evaluate(measureReveal)

      if (
        overflow.furthest !== null ||
        overflow.page > 0 ||
        overflow.spills.length > 0
      ) {
        faults.push(`${width}×${height} ${JSON.stringify(overflow)}`)
      }
    }

    expect(faults).toEqual([])
  })
}

const SLATE_ITEMS = 26

const slateItemStates = Array.from({ length: SLATE_ITEMS }, (_, index) =>
  index < 3 ? 'marked' : index < 5 ? 'closed' : 'open'
)

/**
 * A chip tasting on the screen the room reads: twenty-six cups, three marked,
 * two waiting on the wall, the rest still being written on eight sheets.
 */
const slateView = ({
  currentItemIndex
}: {
  currentItemIndex: number | null
}) => {
  const view = consoleView(LONGEST_PROMPT)

  return {
    ...view,
    currentContent: {
      correction:
        currentItemIndex === null
          ? null
          : {
              blankPlayerIds: ['p8'],
              groups: [
                {
                  isCorrect: true,
                  key: 'paprika',
                  playerIds: ['p1', 'p3', 'p5'],
                  text: 'Paprika'
                },
                {
                  isCorrect: null,
                  key: 'barbecue',
                  playerIds: ['p2', 'p4'],
                  text: 'Barbecue'
                },
                {
                  isCorrect: false,
                  key: 'poulet thym citron',
                  playerIds: ['p6'],
                  text: 'Poulet rôti, thym et citron de Menton'
                },
                {
                  isCorrect: null,
                  key: 'sel vinaigre',
                  playerIds: ['p7'],
                  text: 'Sel et vinaigre'
                }
              ]
            },
      filledCounts: slateItemStates.map((_, index) => (index * 5) % 9),
      keys: slateItemStates.map((_, index) =>
        index === 3 ? 'Paprika fumé' : null
      ),
      kind: 'slate',
      progress: table.map(({ id }, seat) => ({
        filledCount: (seat * 7) % 27,
        playerId: id
      }))
    },
    round: {
      ...view.round,
      answers: [],
      content: {
        currentItemIndex,
        itemCount: SLATE_ITEMS,
        itemStates: slateItemStates,
        kind: 'slate',
        revealedKeys: slateItemStates.map((_, index) =>
          index === 3 ? 'Paprika fumé' : null
        ),
        yourSheet: null
      }
    },
    settings: {
      ...view.settings,
      game: { itemCount: SLATE_ITEMS, kind: 'slate', labels: [] },
      lineUp: [{ itemCount: SLATE_ITEMS, kind: 'slate', labels: [] }],
      lineUpAt: 0,
      mode: { kind: 'typed' }
    }
  }
}

const SLATE_SCREENS = [
  {
    name: 'the sheets being written',
    ready: '.slate-writing .items li',
    view: slateView({ currentItemIndex: null })
  },
  {
    name: 'an item marked on the wall',
    ready: '.slate-correcting .groups li',
    view: slateView({ currentItemIndex: 3 })
  }
]

for (const screen of SLATE_SCREENS) {
  test(`[layout] room, slate, ${screen.name}: never scrolls`, async ({
    page
  }) => {
    await serveRoom({ page, view: screen.view })
    await page.addInitScript(() => {
      localStorage.setItem('melee:locale', 'fr')
    })
    await page.setViewportSize({ height: 720, width: 1280 })
    await page.goto(`/host/${ROOM_CODE}`)
    await expect(page.locator(screen.ready).first()).toBeVisible()

    const faults: string[] = []

    for (const [width, height] of ROOM_VIEWPORTS) {
      await resizeTo({ height, page, width })

      const overflow = await page.evaluate(measureReveal)

      if (
        overflow.furthest !== null ||
        overflow.page > 0 ||
        overflow.spills.length > 0
      ) {
        faults.push(`${width}×${height} ${JSON.stringify(overflow)}`)
      }
    }

    expect(faults).toEqual([])
  })
}

/**
 * The reflex race on the screen the room stares at: the wait, the flip with six
 * presses in, and the heat's finishing order with two false starts under them.
 */
const reflexView = (phase: 'playing' | 'revealed', flipsAt: number) => {
  const view = consoleView(LONGEST_PROMPT)
  const presses =
    flipsAt < SERVER_TIME
      ? ['p3', 'p6', 'p1', 'p8', 'p2', 'p4'].map((playerId, order) => ({
          atServerTime: flipsAt + 212 + order * 37,
          playerId
        }))
      : []

  return {
    ...view,
    currentContent: { kind: 'reflex' },
    phase,
    round: {
      ...view.round,
      advancesAt: phase === 'revealed' ? SERVER_TIME + 20_000 : null,
      answers: [],
      awards:
        phase === 'revealed'
          ? [
              {
                isUnsent: false,
                playerId: 'p3',
                points: 1,
                speedBonus: 0,
                verdict: { isCorrect: true, kind: 'single' }
              }
            ]
          : [],
      content: { flipsAt, kind: 'reflex', presses },
      isReadyHold: false,
      lockedOutPlayerIds: phase === 'revealed' ? ['p5', 'p7'] : []
    },
    settings: {
      ...view.settings,
      autoAdvanceMs: phase === 'revealed' ? 25_000 : null,
      game: { kind: 'reflex' },
      lineUp: [{ kind: 'reflex' }],
      lineUpAt: 0,
      mode: { answerWindowMs: 10_000, kind: 'buzzer' }
    }
  }
}

const REFLEX_SCREENS = [
  {
    name: 'the wait',
    ready: '.reflex-stage .waiting',
    // Past any clock this run can hold, so the screen never flips under it.
    view: reflexView('playing', SERVER_TIME * 2)
  },
  {
    name: 'the flip',
    ready: '.reflex-stage .signal',
    view: reflexView('playing', 0)
  },
  {
    name: 'the finishing order',
    ready: '.stage.revealed .standings li',
    view: reflexView('revealed', SERVER_TIME - 5_000)
  }
]

for (const screen of REFLEX_SCREENS) {
  test(`[layout] room, reflex, ${screen.name}: never scrolls`, async ({
    page
  }) => {
    await serveRoom({ page, view: screen.view })
    await page.addInitScript(() => {
      localStorage.setItem('melee:locale', 'fr')
    })
    await page.setViewportSize({ height: 720, width: 1280 })
    await page.goto(`/host/${ROOM_CODE}`)
    await expect(page.locator(screen.ready).first()).toBeVisible()

    const faults: string[] = []

    for (const [width, height] of ROOM_VIEWPORTS) {
      await resizeTo({ height, page, width })

      const overflow = await page.evaluate(measureReveal)

      if (
        overflow.furthest !== null ||
        overflow.page > 0 ||
        overflow.spills.length > 0
      ) {
        faults.push(`${width}×${height} ${JSON.stringify(overflow)}`)
      }
    }

    expect(faults).toEqual([])
  })
}

/**
 * The player's buzzer, held to the viewport the way the four tiles are: the
 * question card over it, or the floor's pawn and clock in its place, or the
 * reflex race's three outcomes, with the line under each.
 */
const buzzerView = ({
  activeBuzz = null,
  content,
  game,
  lockedOutPlayerIds = [],
  phase = 'playing'
}: {
  activeBuzz?: object | null
  content: object
  game: { kind: string }
  lockedOutPlayerIds?: string[]
  phase?: 'buzzed' | 'playing'
}) => {
  const view = choosingView(LONGEST_PROMPT)

  return {
    ...view,
    phase,
    round: { ...view.round, activeBuzz, content, lockedOutPlayerIds },
    settings: {
      ...view.settings,
      game,
      lineUp: [game],
      lineUpAt: 0,
      mode: { answerWindowMs: 10_000, kind: 'buzzer' }
    }
  }
}

const quizRound = choosingView(LONGEST_PROMPT).round.content
const quizGame = choosingView(LONGEST_PROMPT).settings.game
const reflexGame = { kind: 'reflex' }

const PLAYER_BUZZER_SCREENS = [
  {
    name: 'the longest question over the buzzer',
    ready: '.buzzer',
    view: buzzerView({ content: quizRound, game: quizGame })
  },
  {
    name: 'the floor taken under the longest question',
    ready: '.taken-floor',
    view: buzzerView({
      activeBuzz: {
        atServerTime: SERVER_TIME,
        expiresAt: SERVER_TIME + 10_000,
        playerId: 'p1'
      },
      content: quizRound,
      game: quizGame,
      phase: 'buzzed'
    })
  },
  {
    name: 'the reflex wait',
    ready: '.buzzer.armed',
    view: buzzerView({
      content: { flipsAt: SERVER_TIME + 60_000, kind: 'reflex', presses: [] },
      game: reflexGame
    })
  },
  {
    name: 'the reflex time',
    ready: '.reaction',
    view: buzzerView({
      content: {
        flipsAt: SERVER_TIME - 2_000,
        kind: 'reflex',
        presses: [{ atServerTime: SERVER_TIME - 1_766, playerId: 'p1' }]
      },
      game: reflexGame
    })
  },
  {
    name: 'the false start',
    ready: '.false-start',
    view: buzzerView({
      content: { flipsAt: SERVER_TIME + 60_000, kind: 'reflex', presses: [] },
      game: reflexGame,
      lockedOutPlayerIds: ['p1']
    })
  }
]

const measurePress = (): Overflow => {
  const root = document.scrollingElement ?? document.documentElement
  const pieces = [
    ...document.querySelectorAll<HTMLElement>(
      '.asked-question, .buzzer, .taken-floor, .reaction, .false-start, .press > p'
    )
  ]
  const prompts = [
    ...document.querySelectorAll<HTMLElement>('.asked-question .prompt')
  ]

  return {
    floor: Math.min(
      ...prompts.map((prompt) =>
        Number.parseFloat(getComputedStyle(prompt).fontSize)
      )
    ),
    furthest: null,
    page: Math.max(
      root.scrollHeight - innerHeight,
      root.scrollWidth - innerWidth,
      0
    ),
    spills: pieces
      .filter(
        (piece) =>
          piece.scrollHeight > piece.clientHeight + 1 ||
          piece.scrollWidth > piece.clientWidth + 1
      )
      .map(
        (piece) =>
          `${piece.className} ${piece.scrollWidth}/${piece.clientWidth}×${piece.scrollHeight}/${piece.clientHeight}`
      ),
    strays: pieces
      .filter((piece) => {
        const box = piece.getBoundingClientRect()

        return (
          box.top < 0 ||
          box.left < 0 ||
          box.bottom > innerHeight + 0.5 ||
          box.right > innerWidth + 0.5
        )
      })
      .map((piece) => piece.className)
  }
}

for (const screen of PLAYER_BUZZER_SCREENS) {
  test(`[layout] player, ${screen.name}: never scrolls`, async ({ page }) => {
    await serveRoom({ page, view: screen.view })
    await page.setViewportSize({ height: 844, width: 390 })
    await page.goto(`/play/${ROOM_CODE}`)
    await expect(page.locator(screen.ready)).toBeVisible()

    const faults: string[] = []

    for (const [width, height] of VIEWPORTS) {
      await resizeTo({ height, page, width })

      const overflow = await page.evaluate(measurePress)

      if (
        overflow.floor < FLOOR_PX ||
        overflow.page > 0 ||
        overflow.spills.length > 0 ||
        overflow.strays.length > 0
      ) {
        faults.push(`${width}×${height} ${JSON.stringify(overflow)}`)
      }
    }

    expect(faults).toEqual([])
  })
}

const typedChoosing = choosingView(LONGEST_PROMPT)

const fullTableReveal = {
  ...revealedView(QUIZ_WITH_A_NOTE),
  youId: 'p1',
  yourVerdict: null
}

const SLATE_SAID = [
  'Paprika',
  null,
  'Poulet rôti, thym et citron de Menton',
  'Barbecue fumé au bois de hêtre'
]

/**
 * The same tasting on one sheet: the first line right, the second left blank,
 * the third passed, the fourth on the wall — and every later line written or
 * not by turns, so the grid shows both papers.
 */
const playerSlateView = ({ isAllCollected }: { isAllCollected: boolean }) => {
  const itemStates = isAllCollected
    ? slateItemStates.map((state) => (state === 'open' ? 'closed' : state))
    : slateItemStates

  return {
    ...typedChoosing,
    round: {
      ...typedChoosing.round,
      content: {
        currentItemIndex: 3,
        itemCount: SLATE_ITEMS,
        itemStates,
        kind: 'slate',
        revealedKeys: itemStates.map((_, index) =>
          index === 0 || (isAllCollected && index === 3) ? 'Paprika fumé' : null
        ),
        yourSheet: itemStates.map((_, index) => ({
          answer:
            index < SLATE_SAID.length
              ? (SLATE_SAID[index] ?? null)
              : index % 3 === 0
                ? null
                : `Chips n°${index + 1}`,
          closedBeforeYou: false,
          verdict:
            index === 0 || (isAllCollected && index === 3)
              ? true
              : index === 2
                ? false
                : null
        }))
      }
    },
    settings: {
      ...typedChoosing.settings,
      game: { itemCount: SLATE_ITEMS, kind: 'slate', labels: [] },
      lineUp: [{ itemCount: SLATE_ITEMS, kind: 'slate', labels: [] }],
      lineUpAt: 0,
      mode: { kind: 'typed' }
    }
  }
}

/**
 * The player's screens outside the framed rounds may scroll down — a lobby's
 * invitation and table are taller than a phone — but never sideways, and no
 * piece is drawn narrower than its own contents.
 */
const PLAYER_PAGE_SCREENS = [
  {
    name: 'the lobby',
    ready: '.up-next',
    view: { ...typedChoosing, phase: 'lobby', round: null }
  },
  {
    name: 'the typed round under the longest question',
    ready: '.typed-round .asked-question',
    view: {
      ...typedChoosing,
      settings: { ...typedChoosing.settings, mode: { kind: 'typed' } }
    }
  },
  {
    name: 'a typed duel between two other seats',
    ready: '.typed-round .asked-question',
    view: {
      ...duelWatchedView(LONGEST_PROMPT),
      settings: {
        ...duelWatchedView(LONGEST_PROMPT).settings,
        mode: { kind: 'typed' }
      }
    }
  },
  {
    name: 'the reveal of a full table',
    ready: '.overall',
    view: fullTableReveal
  },
  {
    name: 'the slate sheet under the item on the wall',
    ready: '.slate-sheet .tile',
    view: playerSlateView({ isAllCollected: false })
  },
  {
    name: 'the slate item on the wall once the sheet is collected',
    ready: '.slate-on-the-wall .said',
    view: playerSlateView({ isAllCollected: true })
  },
  {
    name: 'the final board of a full table',
    ready: '.your-placing',
    view: { ...finishedView(LONG_NAME_WINNING), youId: 'p1', yourVerdict: null }
  }
]

const measurePage = (): { page: number; spills: string[] } => {
  const root = document.scrollingElement ?? document.documentElement
  const pieces = [
    ...document.querySelectorAll<HTMLElement>(
      '.round-chrome, .up-next, .room-invitation, .seats li, .asked-question, .answer-form, .answer-card, .your-round, .round-podium li, .your-placing, .scoreboard li, .scoreboard .nickname, .slate-sheet .writing, .slate-sheet .tile, .slate-on-the-wall .said, .slate-on-the-wall .key, .slate-whole-sheet li'
    )
  ]

  return {
    page: root.scrollWidth - innerWidth,
    spills: pieces
      .filter((piece) => {
        const box = piece.getBoundingClientRect()

        return (
          box.left < -0.5 ||
          box.right > innerWidth + 0.5 ||
          piece.scrollWidth > piece.clientWidth + 1
        )
      })
      .map(
        (piece) =>
          `${piece.className} ${piece.scrollWidth}/${piece.clientWidth}`
      )
  }
}

for (const screen of PLAYER_PAGE_SCREENS) {
  test(`[layout] player, ${screen.name}: never runs off the side`, async ({
    page
  }) => {
    await serveRoom({ page, view: screen.view })
    await page.setViewportSize({ height: 844, width: 390 })
    await page.goto(`/play/${ROOM_CODE}`)
    await expect(page.locator(screen.ready).first()).toBeVisible()

    const faults: string[] = []

    for (const [width, height] of VIEWPORTS) {
      await resizeTo({ height, page, width })

      const overflow = await page.evaluate(measurePage)

      if (overflow.page > 0 || overflow.spills.length > 0) {
        faults.push(`${width}×${height} ${JSON.stringify(overflow)}`)
      }
    }

    expect(faults).toEqual([])
  })
}

/**
 * The room's own screen, on the evening's views: a table of three teams racing
 * on a track. The wall draws the console's stage with no control and no answer,
 * so the same views decode for it with the answer stripped.
 */
const evening = (view: ReturnType<typeof consoleView>) => ({
  ...view,
  settings: {
    ...view.settings,
    board: {
      catchUp: false,
      kind: 'track',
      length: 30,
      strategy: 'onePointOneCase'
    },
    teams: { count: 3, kind: 'drawn' }
  },
  teams: [0, 1, 2].map((team) => ({
    board: { case: [12, 7, 21][team] ?? 0, move: 0 },
    colour: team + 1,
    gain: 0,
    id: `team-${team + 1}`,
    name: null,
    score: [12, 7, 21][team] ?? 0,
    seatIds: table
      .filter((_, seat) => seat % 3 === team)
      .map((player) => player.id)
  })),
  wallCount: 1,
  wallNumber: 1
})

const eveningRound = evening(consoleView(LONGEST_PROMPT))

const duellists = eveningRound.teams
  .slice(0, 2)
  .flatMap((team) => team.seatIds.slice(0, 1))

const WALL_SCREENS = [
  {
    name: 'lobby',
    ready: '.stage.table-lobby',
    view: { ...eveningRound, phase: 'lobby', round: null }
  },
  { name: 'round', ready: '.answer-tile', view: eveningRound },
  {
    name: 'duel',
    ready: '.duel-badge',
    view: {
      ...eveningRound,
      round: {
        ...eveningRound.round,
        duel: { seatIds: duellists, teamIds: ['team-1', 'team-2'] },
        openedWithPlayerIds: duellists
      }
    }
  },
  {
    name: 'map',
    ready: '.stage.playing',
    view: {
      ...eveningRound,
      round: {
        ...eveningRound.round,
        content: {
          choices: [],
          direction: 'place',
          kind: 'atlas',
          revealedPlacements: null,
          shown: null,
          target: { countryCode: 'PER', kind: 'country' }
        }
      },
      settings: {
        ...eveningRound.settings,
        game: {
          direction: 'place',
          kind: 'atlas',
          places: ['countries'],
          roundDurationMs: 30_000
        },
        lineUp: [
          {
            direction: 'place',
            kind: 'atlas',
            places: ['countries'],
            roundDurationMs: 30_000
          }
        ],
        lineUpAt: 0,
        mode: { kind: 'point' }
      }
    }
  },
  {
    name: 'board',
    ready: '.stage.finished',
    view: {
      ...finishedView(LONG_NAME_WINNING),
      ...evening(consoleView(LONGEST_PROMPT)),
      phase: 'finished',
      round: null
    }
  }
]

/** The largest type on the stage, which is what is read from across a room. */
const largestType = (): number =>
  Math.max(
    ...[...document.querySelectorAll<HTMLElement>('main *')].map((element) =>
      Number.parseFloat(getComputedStyle(element).fontSize)
    )
  )

for (const screen of WALL_SCREENS) {
  test(`[layout] wall, ${screen.name}: never scrolls, from 720p to 4K`, async ({
    page
  }) => {
    await serveRoom({ page, view: screen.view })
    await page.addInitScript(() => {
      localStorage.setItem('melee:locale', 'fr')
      localStorage.setItem('melee:volume', '0')
    })
    await page.setViewportSize({ height: 1080, width: 1920 })
    await page.goto(`/wall/${ROOM_CODE}`)
    await expect(page.locator(screen.ready).first()).toBeVisible()

    const faults: string[] = []

    for (const [width, height] of WALL_VIEWPORTS) {
      await resizeTo({ height, page, width })

      const overflow = await page.evaluate(measureReveal)

      if (overflow.furthest !== null || overflow.page > 0) {
        faults.push(`${width}×${height} ${JSON.stringify(overflow)}`)
      }
    }

    expect(faults).toEqual([])
  })
}

test('[scale] wall: a 4K panel draws the stage a 1080p one does, twice as large', async ({
  page
}) => {
  await serveRoom({ page, view: eveningRound })
  await page.addInitScript(() => {
    localStorage.setItem('melee:locale', 'fr')
    localStorage.setItem('melee:volume', '0')
  })
  await page.setViewportSize({ height: 1080, width: 1920 })
  await page.goto(`/wall/${ROOM_CODE}`)
  await expect(page.locator('.answer-tile')).toHaveCount(4)

  const atFullHd = await page.evaluate(largestType)

  await resizeTo({ height: 2160, page, width: 3840 })
  const atFourK = await page.evaluate(largestType)

  expect(atFourK / atFullHd).toBeCloseTo(2, 1)
})

const FULL_TABLE_NAMES = [
  'Wolfgangamadeusmozar',
  'Anne-Charlotte Vidal',
  'Marie-Hélène Fabre',
  'Barthélemy Gauthier'
]

const fullTable = Array.from({ length: 24 }, (_, seat) => ({
  board: null,
  colour: (seat % 12) + 1,
  id: `p${seat + 1}`,
  isConnected: true,
  isReady: seat % 2 === 0,
  nickname: `${FULL_TABLE_NAMES[seat % FULL_TABLE_NAMES.length]?.slice(0, 17)} ${seat + 1}`,
  score: (24 - seat) * 100
}))

/**
 * The console the room reads, with no wall: the track rings it, so the stage
 * is what the ring leaves, and three trays of eight seats are taller than it.
 */
const fullEveningOnTheConsole = (view: ReturnType<typeof consoleView>) => {
  const { wallNumber: _, ...onTheWall } = evening(view)

  return {
    ...onTheWall,
    players: fullTable,
    teams: onTheWall.teams.map((team, at) => ({
      ...team,
      seatIds: fullTable
        .filter((_, seat) => seat % 3 === at)
        .map((player) => player.id)
    })),
    wallCount: 0
  }
}

/** Whatever is drawn past the stage, outside a box made to scroll. */
const strayFromTheStage = (): string[] => {
  const stage = document.querySelector<HTMLElement>(
    '.stage:is(.revealed, .finished)'
  )

  if (stage === null) {
    return ['no stage']
  }

  const box = stage.getBoundingClientRect()

  const isInsideAScrollingBox = (element: HTMLElement) => {
    for (
      let ancestor = element.parentElement;
      ancestor !== null && ancestor !== stage;
      ancestor = ancestor.parentElement
    ) {
      if (getComputedStyle(ancestor).overflowY !== 'visible') {
        return true
      }
    }

    return false
  }

  return [...stage.querySelectorAll<HTMLElement>('*')]
    .filter(
      (element) => element.checkVisibility() && !isInsideAScrollingBox(element)
    )
    .filter((element) => {
      const { bottom, right } = element.getBoundingClientRect()

      return bottom > box.bottom + 1 || right > box.right + 1
    })
    .map((element) => `${element.tagName.toLowerCase()}.${element.className}`)
}

const revealedOnTheTrack = () => {
  const revealed = revealedView(QUIZ_WITH_A_NOTE)
  const onTheTrack = fullEveningOnTheConsole(consoleView(LONGEST_PROMPT))

  return {
    ...onTheTrack,
    phase: revealed.phase,
    round: revealed.round,
    settings: {
      ...onTheTrack.settings,
      autoAdvanceMs: revealed.settings.autoAdvanceMs
    }
  }
}

const CONSOLE_OVER_A_TRACK = [
  {
    name: 'reveal',
    ready: '.stage.revealed',
    view: revealedOnTheTrack()
  },
  {
    name: 'final board',
    ready: '.stage.finished',
    view: {
      ...fullEveningOnTheConsole(consoleView(LONGEST_PROMPT)),
      phase: 'finished',
      round: null
    }
  }
]

for (const screen of CONSOLE_OVER_A_TRACK) {
  test(`[layout] room, ${screen.name} inside a track with a full table: nothing leaves the stage`, async ({
    page
  }) => {
    await serveRoom({ page, view: screen.view })
    await page.addInitScript(() => {
      localStorage.setItem('melee:locale', 'fr')
      localStorage.setItem('melee:volume', '0')
    })
    await page.setViewportSize({ height: 800, width: 1280 })
    await page.goto(`/host/${ROOM_CODE}`)
    await expect(page.locator(screen.ready)).toBeVisible()
    await expect(page.locator('.board-track')).toBeVisible()

    const faults: string[] = []

    for (const [width, height] of ROOM_VIEWPORTS) {
      if (width < 900 || width <= height) {
        continue
      }

      await resizeTo({ height, page, width })

      const strays = await page.evaluate(strayFromTheStage)

      if (strays.length > 0) {
        faults.push(`${width}×${height} ${strays.slice(0, 3).join(', ')}`)
      }
    }

    expect(faults).toEqual([])
  })
}

/**
 * A box on the stage whose content runs past it, scrolled or clipped, and the
 * standings drawn over the answer.
 */
const scrollingBoxes = (): string[] => {
  const panel = document.querySelector('.reveal-panel')?.getBoundingClientRect()
  const overlaps =
    panel !== undefined &&
    [...document.querySelectorAll('.standings li')].some((row) => {
      const box = row.getBoundingClientRect()

      return (
        panel.bottom > box.top + 1 &&
        panel.right > box.left + 1 &&
        box.bottom > panel.top + 1 &&
        box.right > panel.left + 1
      )
    })

  return [
    ...(overlaps ? ['standings over the panel'] : []),
    ...[...document.querySelectorAll<HTMLElement>('main *')]
      .filter((element) => {
        const { overflowY } = getComputedStyle(element)

        return (
          element.checkVisibility() &&
          (overflowY === 'auto' || overflowY === 'scroll') &&
          element.scrollHeight > element.clientHeight + 1
        )
      })
      .map((element) => `${element.tagName.toLowerCase()}.${element.className}`)
  ]
}

/** Twenty-four seats who each said something of their own. */
const wallRevealOfAFullTable = () => {
  const view = consoleView(LONGEST_PROMPT)
  const revealedAnswers = fullTable.map(({ id }, seat) => ({
    atServerTime: SERVER_TIME - 1_000,
    isCorrect: seat < 5,
    playerId: id,
    said: seat < 5 ? 'France' : `${said[seat % said.length]} ${seat}`
  }))

  return {
    ...view,
    phase: 'revealed',
    players: fullTable,
    round: {
      ...view.round,
      advancesAt: SERVER_TIME + 20_000,
      awards: fullTable.slice(0, 5).map(({ id }, order) => ({
        isUnsent: false,
        playerId: id,
        points: (5 - order) * 300,
        speedBonus: (5 - order) * 100,
        verdict: { isCorrect: true, kind: 'single' }
      })),
      content: QUIZ_WITH_A_NOTE,
      isReadyHold: false,
      revealedAnswers
    },
    settings: { ...view.settings, autoAdvanceMs: 25_000 },
    wallCount: 1,
    wallNumber: 1
  }
}

test('[layout] wall, the reveal of a full table: nothing scrolls, from 720p to 4K', async ({
  page
}) => {
  await serveRoom({ page, view: wallRevealOfAFullTable() })
  await page.addInitScript(() => {
    localStorage.setItem('melee:locale', 'fr')
    localStorage.setItem('melee:volume', '0')
  })
  await page.setViewportSize({ height: 1080, width: 1920 })
  await page.goto(`/wall/${ROOM_CODE}`)
  await expect(page.locator('.reveal-panel .round-podium')).toBeVisible()

  const faults: string[] = []

  for (const [width, height] of WALL_VIEWPORTS) {
    await resizeTo({ height, page, width })

    const overflow = await page.evaluate(measureReveal)
    const scrolling = await page.evaluate(scrollingBoxes)

    if (
      overflow.furthest !== null ||
      overflow.page > 0 ||
      scrolling.length > 0
    ) {
      faults.push(
        `${width}×${height} ${JSON.stringify({ ...overflow, scrolling })}`
      )
    }
  }

  expect(faults).toEqual([])
})

/**
 * Every piece of the console's reveal drawn over another, or past the panel
 * that holds it — a size container keeps that overflow off the page, so no
 * scroll check sees the answer under the hold bar and the next-round press —
 * and each of what the room reads that the first screen leaves out.
 */
const collisionsOnTheConsole = (): string[] => {
  const shown = (selector: string) =>
    [...document.querySelectorAll<HTMLElement>(selector)].filter(
      (element) =>
        element.checkVisibility() && element.getBoundingClientRect().height > 0
    )
  const nameOf = (element: Element) =>
    `${element.tagName.toLowerCase()}.${String(element.className).replaceAll(' ', '.')}`
  const panel = document.querySelector('.reveal-panel')?.getBoundingClientRect()
  const panelPieces = shown('.reveal-panel > *')
  const pieces = [
    ...shown('.score-track'),
    ...panelPieces,
    ...shown('.stage.revealed > :not(.reveal-panel)'),
    ...shown('main > footer :is(button, a)')
  ]
  const crossings = pieces.flatMap((piece, at) =>
    pieces.slice(at + 1).flatMap((other) => {
      const a = piece.getBoundingClientRect()
      const b = other.getBoundingClientRect()
      const across = Math.min(a.right, b.right) - Math.max(a.left, b.left)
      const down = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)

      return across > 1 && down > 1
        ? [`${nameOf(piece)} over ${nameOf(other)}`]
        : []
    })
  )
  const pastThePanel =
    panel === undefined
      ? ['no panel']
      : panelPieces
          .filter(
            (piece) => piece.getBoundingClientRect().bottom > panel.bottom + 1
          )
          .map((piece) => `${nameOf(piece)} past the panel`)
  const firstScreen = [
    '.reveal-panel > .head',
    ':is(.score-track, .standings > .section-heading)',
    'main > footer .reveal-actions > :first-child'
  ].filter((selector) => {
    const box = shown(selector)[0]?.getBoundingClientRect()

    return box === undefined || box.top < 0 || box.bottom > innerHeight + 0.5
  })

  return [
    ...crossings,
    ...pastThePanel,
    ...firstScreen.map((selector) => `${selector} off the first screen`)
  ]
}

for (const youId of [null, 'p3']) {
  test(`[layout] room, the reveal of a full table with no wall, ${youId === null ? 'nobody seated' : 'the host seated'}: nothing drawn over the round, every press on the first screen`, async ({
    page
  }) => {
    const { wallCount: _, wallNumber: __, ...reveal } = wallRevealOfAFullTable()

    await serveRoom({ page, view: { ...reveal, wallCount: 0, youId } })
    await page.addInitScript(() => {
      localStorage.setItem('melee:locale', 'fr')
      localStorage.setItem('melee:volume', '0')
    })
    await page.setViewportSize({ height: 568, width: 320 })
    await page.goto(`/host/${ROOM_CODE}`)
    await expect(page.locator('.stage.revealed')).toBeVisible()

    const faults: string[] = []

    for (const [width, height] of ROOM_VIEWPORTS) {
      await resizeTo({ height, page, width })

      const collisions = await page.evaluate(collisionsOnTheConsole)

      if (collisions.length > 0) {
        faults.push(`${width}×${height} ${collisions.join(', ')}`)
      }
    }

    expect(faults).toEqual([])
  })
}

/** Every answering screen with the room at its largest, each seat named long. */
for (const seat of SEATS) {
  test(`[layout] ${seat.name}, a full table: the question and its four choices never scroll`, async ({
    page
  }) => {
    const view = seat.view(LONGEST_PROMPT)

    await serveRoom({
      page,
      view: {
        ...view,
        players: fullTable.map((player) => ({ ...player, isReady: false }))
      }
    })
    await page.setViewportSize({ height: 844, width: 390 })
    await page.goto(seat.path)
    await expect(page.locator('.answer-tile')).toHaveCount(4)

    const faults: string[] = []

    for (const [width, height] of seat.role === 'room'
      ? ROOM_VIEWPORTS
      : VIEWPORTS) {
      await resizeTo({ height, page, width })

      const overflow = await page.evaluate(measure)

      if (
        overflow.floor < FLOOR_PX ||
        overflow.furthest !== null ||
        overflow.page > 0 ||
        overflow.spills.length > 0 ||
        overflow.strays.length > 0
      ) {
        faults.push(`${width}×${height} ${JSON.stringify(overflow)}`)
      }
    }

    expect(faults).toEqual([])
  })
}

/**
 * Serves every stylesheet with its `text-box` guard never met, which is how a
 * browser without `text-box` reads it: the trimmed figures fall back to
 * `line-height: 1`, and the rows they sit in grow.
 */
const forceTextBoxFallback = async (page: Page): Promise<void> => {
  await page.route(/\.(sass|css)(\?.*)?$/, async (route) => {
    const response = await route.fetch()
    const body = (await response.text()).replaceAll(
      '@supports (text-box: trim-both cap alphabetic)',
      '@supports (text-box-unsupported: none)'
    )

    await route.fulfill({ body, response })
  })
}

/**
 * The room at its largest on one seat's screen, in the middle of the board:
 * five seats paid, the case each pawn stands on when the room plays a track.
 */
const playerRevealOfAFullTable = ({
  isEveryoneReady,
  isOnATrack
}: {
  isEveryoneReady: boolean
  isOnATrack: boolean
}) => {
  const { wallCount: _, wallNumber: __, ...reveal } = wallRevealOfAFullTable()

  return {
    ...reveal,
    players: fullTable.map((player, seat) => ({
      ...player,
      board: isOnATrack ? { case: 24 - seat, move: 1 } : null,
      isReady: isEveryoneReady || player.isReady
    })),
    settings: isOnATrack
      ? {
          ...reveal.settings,
          board: evening(consoleView(LONGEST_PROMPT)).settings.board
        }
      : reveal.settings,
    youId: 'p7',
    yourVerdict: null
  }
}

const PLAYER_REVEALS = [
  { isEveryoneReady: false, isOnATrack: false, name: 'half the table ready' },
  { isEveryoneReady: true, isOnATrack: false, name: 'every seat ready' },
  { isEveryoneReady: false, isOnATrack: true, name: 'on a track' }
]

/**
 * Below this height a screen lying down holds a phone's chrome and the answer
 * and little else, so it owes the press only once scrolled to.
 */
const FIRST_SCREEN_MIN_HEIGHT = 568

type PlayerReveal = {
  /** Each of the round's pieces the first screen leaves out. */
  belowTheFold: string[]
  /** Every standings row the press or the hold is drawn over. */
  covered: string[]
  /** How far the page runs sideways. */
  sideways: number
}

const measurePlayerReveal = (): PlayerReveal => {
  const root = document.scrollingElement ?? document.documentElement
  const firstScreen = [
    '.answer-card',
    '.outcome > .section-heading',
    '.your-round',
    '.hold',
    '.back-at-the-table'
  ]
  const boxOf = (selector: string) =>
    document.querySelector(selector)?.getBoundingClientRect() ?? null
  const presses = ['.hold', '.back-at-the-table']
    .map(boxOf)
    .filter((box) => box !== null)

  return {
    belowTheFold: firstScreen.filter((selector) => {
      const box = boxOf(selector)

      return box === null || box.top < 0 || box.bottom > innerHeight + 0.5
    }),
    covered: [...document.querySelectorAll<HTMLElement>('.overall li')]
      .filter((row) => {
        const box = row.getBoundingClientRect()

        return presses.some(
          (press) =>
            Math.min(box.right, press.right) - Math.max(box.left, press.left) >
              0.5 &&
            Math.min(box.bottom, press.bottom) - Math.max(box.top, press.top) >
              0.5
        )
      })
      .map((row) => row.textContent ?? ''),
    sideways: root.scrollWidth - innerWidth
  }
}

/** Scrolled to the bottom, whether the last row is on screen and drawn on top. */
const readLastRow = (): string | null => {
  const root = document.scrollingElement ?? document.documentElement

  root.scrollTop = root.scrollHeight

  const rows = [...document.querySelectorAll<HTMLElement>('.overall li')]
  const last = rows.at(-1)

  if (last === undefined) {
    return 'no standings'
  }

  const box = last.getBoundingClientRect()
  const hit = document.elementFromPoint(
    box.left + box.width / 2,
    box.top + box.height / 2
  )

  if (box.top < 0 || box.bottom > innerHeight + 0.5) {
    return `${last.textContent} ends ${Math.round(box.bottom - innerHeight)}px under the screen`
  }

  return hit !== null && last.contains(hit)
    ? null
    : `${last.textContent} is hidden under ${hit?.className ?? 'nothing'}`
}

/**
 * Every column of the standings whose case cells do not share one left and one
 * right edge: a row is its own grid, so a cell as wide as its own text puts a
 * one-figure case beside a two-figure one at another place.
 */
const findRaggedCaseColumns = (): string[] => {
  const columns: { cases: DOMRect[]; left: number; right: number }[] = []

  for (const row of document.querySelectorAll<HTMLElement>('.overall li')) {
    const cell = row.querySelector('.case')

    if (cell === null) {
      continue
    }

    const box = row.getBoundingClientRect()
    const column = columns.find(
      ({ left, right }) => box.left < right && box.right > left
    )

    if (column === undefined) {
      columns.push({
        cases: [cell.getBoundingClientRect()],
        left: box.left,
        right: box.right
      })
    } else {
      column.cases.push(cell.getBoundingClientRect())
    }
  }

  const spread = (edges: number[]) =>
    Math.round(Math.max(...edges) - Math.min(...edges))

  return columns
    .map(({ cases }) => ({
      lefts: spread(cases.map(({ left }) => left)),
      rights: spread(cases.map(({ right }) => right))
    }))
    .filter(({ lefts, rights }) => lefts > 0 || rights > 0)
    .map(
      ({ lefts, rights }) =>
        `left edges ${lefts}px apart, right edges ${rights}px apart`
    )
}

/**
 * The player's reveal at the room's largest: the answer, the round's block,
 * the hold and the press inside the first screen, then the game's standings,
 * which the page scrolls to the last of — and the press never drawn over a
 * row. Through the `text-box` fallback too, where taller rows once spilled
 * from a board fitted to the screen and slid under the press.
 */
for (const reveal of PLAYER_REVEALS) {
  for (const isWithoutTextBox of [false, true]) {
    test(`[layout] player, the reveal of a full table, ${reveal.name}${isWithoutTextBox ? ', without text-box' : ''}: the round and the press first, every row scrolled to and never covered`, async ({
      page
    }) => {
      if (isWithoutTextBox) {
        await forceTextBoxFallback(page)
      }

      await serveRoom({ page, view: playerRevealOfAFullTable(reveal) })
      await page.addInitScript(() => {
        localStorage.setItem('melee:locale', 'fr')
        localStorage.setItem('melee:volume', '0')
      })
      await page.setViewportSize({ height: 844, width: 390 })
      await page.goto(`/play/${ROOM_CODE}`)
      await expect(page.locator('.overall li')).toHaveCount(24)
      await expect(
        page.getByRole('heading', { name: 'Cette manche' })
      ).toBeVisible()
      expect(
        await page.evaluate(() =>
          getComputedStyle(
            document.querySelector('.overall .score') ?? document.body
          ).getPropertyValue('text-box-trim')
        )
      ).toBe(isWithoutTextBox ? 'none' : 'trim-both')

      const faults: string[] = []

      for (const [width, height] of VIEWPORTS) {
        await resizeTo({ height, page, width })
        await page.evaluate(() => {
          scrollTo(0, 0)
        })

        const measured = await page.evaluate(measurePlayerReveal)
        const lastRow = await page.evaluate(readLastRow)
        const raggedCases = await page.evaluate(findRaggedCaseColumns)
        const belowTheFold =
          height < FIRST_SCREEN_MIN_HEIGHT ? [] : measured.belowTheFold

        if (
          belowTheFold.length > 0 ||
          measured.covered.length > 0 ||
          measured.sideways > 0 ||
          lastRow !== null ||
          raggedCases.length > 0
        ) {
          faults.push(
            `${width}×${height} ${JSON.stringify({ ...measured, belowTheFold, lastRow, raggedCases })}`
          )
        }
      }

      expect(faults).toEqual([])
    })
  }
}

/**
 * Every answering screen on the shelf, held to a phone: a full table of long
 * names, in French, at the seven shapes a phone is held in.
 */
const PHONE_VIEWPORTS = VIEWPORTS.filter(
  ([width, height]) => Math.min(width, height) <= 430
)

const fullSeats = fullTable.map((player) => ({ ...player, isReady: false }))

const inBothLocales = (fr: string, en: string = fr) => ({ en, fr })

/** A round of any game on the first seat's screen, the table full and the round two seconds in. */
const answeringView = ({
  activeBuzz = null,
  content,
  game,
  mode,
  phase = 'playing',
  teams = [],
  teamsSettings = { kind: 'off' }
}: {
  activeBuzz?: object | null
  content: object
  game: object
  mode: object
  phase?: 'buzzed' | 'countdown' | 'playing'
  teams?: object[]
  teamsSettings?: object
}) => {
  const view = choosingView(LONGEST_PROMPT)
  const isCountingIn = phase === 'countdown'

  return {
    ...view,
    phase,
    players: fullSeats,
    round: {
      ...view.round,
      activeBuzz,
      content,
      openedWithPlayerIds: isCountingIn ? null : fullSeats.map(({ id }) => id),
      startsAt: isCountingIn ? SERVER_TIME + 3_000 : view.round.startsAt
    },
    roundElapsedMs: isCountingIn ? 0 : view.roundElapsedMs,
    settings: {
      ...view.settings,
      game,
      lineUp: [game],
      lineUpAt: 0,
      mode,
      teams: teamsSettings
    },
    teams,
    youId: 'p1'
  }
}

/** The same round on a console whose host took the first seat, no wall paired. */
const seatedOn = ({
  currentContent,
  view
}: {
  currentContent: object
  view: object
}) => ({ ...seatedHostView(LONGEST_PROMPT), ...view, currentContent })

const BUZZER_MODE = { answerWindowMs: 10_000, kind: 'buzzer' }

const BLINDTEST_GAME = {
  difficulty: 'mixed',
  kind: 'blindtest',
  roundDurationMs: 30_000,
  source: {
    charts: [],
    decades: null,
    hasFilmScores: false,
    kind: 'catalogue'
  }
}

const SEATED_BLINDTEST = {
  audioUrl: null,
  kind: 'blindtest',
  playback: { isPaused: false, restarts: 0 },
  track: null
}

const LONG_TRACK_CHOICES = [
  {
    artist: 'Ennio Morricone',
    title: 'Il était une fois dans l’Ouest (Bande originale du film)'
  },
  { artist: 'Jean-Jacques Goldman', title: 'Quand la musique est bonne' },
  { artist: 'Daniel Balavoine', title: 'Le chanteur (Remasterisé en 2009)' },
  { artist: 'Michel Sardou', title: 'Les Lacs du Connemara' }
].map((track, at) => ({ ...track, coverUrl: null, film: null, id: `t${at}` }))

const blindTestScreen = ({
  activeBuzz = null,
  choices = [],
  mode,
  phase = 'playing'
}: {
  activeBuzz?: object | null
  choices?: object[]
  mode: object
  phase?: 'buzzed' | 'countdown' | 'playing'
}) =>
  answeringView({
    activeBuzz,
    content: {
      asksForAFilm: false,
      choices,
      kind: 'blindtest',
      revealedTrack: null
    },
    game: BLINDTEST_GAME,
    mode,
    phase
  })

const floorOf = (playerId: string) => ({
  atServerTime: SERVER_TIME - 1_000,
  expiresAt: SERVER_TIME + 9_000,
  playerId
})

const BARE_BUZZER_GAME = { kind: 'buzzer', locksOutOnMiss: true }

const quizContent = ({
  category,
  choices,
  flag = null,
  id,
  prompt,
  rebus = null,
  silhouette = null
}: {
  category: string
  choices: string[]
  flag?: string | null
  id: string
  prompt: string
  rebus?: string | null
  silhouette?: string | null
}) => ({
  choices,
  kind: 'quiz',
  prompt: { category, flag, id, prompt, rebus, silhouette },
  revealedQuestion: null
})

/** The flags bank's row dealing the longest name. */
const FLAG_ROUND = quizContent({
  category: 'flags',
  choices: ['Burundi', 'République démocratique du Congo', 'Angola', 'Rwanda'],
  flag: 'dc00ea48b215.svg',
  id: 'flag-COD',
  prompt: 'À qui est ce drapeau ?'
})

/** The rebus bank's widest row, six emojis. */
const REBUS_ROUND = quizContent({
  category: 'rebus',
  choices: [
    'Back in Black',
    'Highway to Hell',
    'Born to Be Wild',
    'Smoke on the Water'
  ],
  id: 'rebus-fr-highway-to-hell',
  prompt: 'Quelle chanson ?',
  rebus: '🛣️ ➡️ 😈🔥'
})

/** The capitals bank's four longest names, under its longest country. */
const CAPITAL_ROUND = quizContent({
  category: 'capitals',
  choices: [
    'Bandar Seri Begawan',
    'Sri Jayawardenapura',
    'Andorre-la-Vieille',
    'Ciudad de la Paz'
  ],
  id: 'capital-KNA',
  prompt: 'Quelle est la capitale de Saint-Christophe-et-Niévès ?'
})

const SILHOUETTE_ROUND = quizContent({
  category: 'silhouettes',
  choices: ['Congo', 'République démocratique du Congo', 'Burundi', 'Rwanda'],
  id: 'silhouette-COD',
  prompt: 'Quel pays a cette forme ?',
  silhouette: '0ca305eca97b.svg'
})

const SEATED_QUIZ = { kind: 'quiz', question: null }

const quizScreen = ({
  content,
  mode = { kind: 'choice' }
}: {
  content: object
  mode?: object
}) => answeringView({ content, game: quizGame, mode })

const reflexScreen = (flipsAt: number) =>
  answeringView({
    content: {
      flipsAt,
      kind: 'reflex',
      presses:
        flipsAt < SERVER_TIME
          ? [{ atServerTime: flipsAt + 234, playerId: 'p1' }]
          : []
    },
    game: reflexGame,
    mode: BUZZER_MODE
  })

const SLATE_SHEET_ITEMS = 10

const SLATE_GAME = { itemCount: SLATE_SHEET_ITEMS, kind: 'slate', labels: [] }

const slateScreen = (stateOf: (item: number) => string) => {
  const itemStates = Array.from({ length: SLATE_SHEET_ITEMS }, (_, item) =>
    stateOf(item)
  )
  const onTheWall = itemStates.findLastIndex((state) => state !== 'open')

  return answeringView({
    content: {
      currentItemIndex: onTheWall === -1 ? null : onTheWall,
      itemCount: SLATE_SHEET_ITEMS,
      itemStates,
      kind: 'slate',
      revealedKeys: itemStates.map((state) =>
        state === 'marked' ? 'Paprika fumé au bois de hêtre' : null
      ),
      yourSheet: itemStates.map((state, item) => ({
        answer:
          item % 4 === 3
            ? null
            : 'Poulet rôti, thym et citron de Menton, un soupçon de sel',
        closedBeforeYou: false,
        verdict: state === 'marked' ? item % 2 === 0 : null
      }))
    },
    game: SLATE_GAME,
    mode: { kind: 'typed' }
  })
}

const atlasPlaceScreen = () =>
  answeringView({
    content: {
      choices: [],
      direction: 'place',
      kind: 'atlas',
      revealedPlacements: null,
      shown: null,
      target: { countryCode: 'COD', kind: 'country' }
    },
    game: {
      direction: 'place',
      kind: 'atlas',
      places: ['countries'],
      roundDurationMs: 30_000
    },
    mode: { kind: 'point' }
  })

/** The host's own line at its longest, the same text in every locale. */
const LONGEST_CHALLENGE = inBothLocales(
  'Le premier qui rapporte à la table un objet rouge, une cuillère et une chaussette dépareillée, sans courir dans l’escalier, gagne la manche'
)

const innerclockScreen = (phase: 'countdown' | 'playing') =>
  answeringView({
    content: {
      hasPressed: false,
      kind: 'innerclock',
      revealedPresses: null,
      targetSeconds: 180
    },
    game: { kind: 'innerclock' },
    mode: BUZZER_MODE,
    phase
  })

/** The widest equation the deal writes: single digits either side, a two-digit sum. */
const EQUATION = { glyphs: '9+8=16', goal: 'equation' }
const NUMBER = { glyphs: '8085', goal: 'biggest' }

const matchsticksScreen = ({
  activeBuzz = null,
  mode,
  phase = 'playing',
  puzzle
}: {
  activeBuzz?: object | null
  mode: object
  phase?: 'buzzed' | 'playing'
  puzzle: object
}) =>
  answeringView({
    activeBuzz,
    content: {
      kind: 'matchsticks',
      puzzle,
      revealedMoves: null,
      revealedSolution: null,
      yourMove: null
    },
    game: {
      goals: ['equation', 'biggest', 'smallest'],
      kind: 'matchsticks',
      roundDurationMs: 60_000
    },
    mode,
    phase
  })

/** The timeline bank's five longest French labels. */
const LONG_TIMELINE_EVENTS = [
  [
    'toy-story',
    'Toy Story, premier long métrage en images de synthèse',
    'Toy Story, the first computer-animated feature'
  ],
  [
    'zidane-headbutt',
    'Coup de tête de Zidane en finale de Coupe du monde',
    'Zidane’s headbutt in the World Cup final'
  ],
  [
    'jesse-owens',
    'Jesse Owens gagne quatre médailles d’or à Berlin',
    'Jesse Owens wins four golds in Berlin'
  ],
  [
    'lumiere-screening',
    'Première projection publique des frères Lumière',
    'The Lumière brothers’ first public screening'
  ],
  [
    'beethoven-ninth',
    'Création de la Neuvième Symphonie de Beethoven',
    'Premiere of Beethoven’s Ninth Symphony'
  ]
].map(([id = '', fr = '', en = '']) => ({ id, labels: inBothLocales(fr, en) }))

const timelineScreen = () =>
  answeringView({
    content: {
      events: LONG_TIMELINE_EVENTS,
      kind: 'timeline',
      revealedEvents: null
    },
    game: { kind: 'timeline', roundDurationMs: 45_000 },
    mode: { kind: 'order' }
  })

/** The black square bank's longest theme. */
const LONGEST_THEME = inBothLocales(
  'Les films lauréats du Golden Globe du meilleur film dramatique',
  'Winners of the Golden Globe for Best Drama Film'
)

/** The bank's list with the longest answers, as its keeper is sent it. */
const TURNER_LIST = {
  answers: [
    'Pluie, Vapeur et Vitesse',
    'Le Dernier Voyage du Téméraire',
    'Tempête de neige - Bateau à vapeur au large de l’embouchure d’un port',
    'Le Négrier',
    'Didon construisant Carthage ou l’Ascension de l’Empire carthaginois',
    'Hannibal traversant les Alpes',
    'Pêcheurs en mer',
    'L’Incendie de la Chambre des Lords et des Communes, le 16 octobre 1834',
    'La Bataille de Trafalgar'
  ].map((fr, at) => ({ labels: inBothLocales(fr), tier: (at % 3) + 1 })),
  blackWord: {
    labels: inBothLocales('Impression, Soleil levant', 'Impression, Sunrise'),
    why: inBothLocales(
      'Un tableau de Claude Monet',
      'A painting by Claude Monet'
    )
  }
}

/** Two teams of twelve: the odd seats guessing aloud, the first seat in the other. */
const SPOKEN_TEAMS = [1, 0].map((parity, team) => ({
  board: null,
  colour: team + 1,
  gain: 0,
  id: `team-${team + 1}`,
  name: null,
  score: 0,
  seatIds: fullSeats
    .filter((_, seat) => seat % 2 === parity)
    .map(({ id }) => id)
}))

const blackSquareScreen = ({
  answerCount,
  keeper = null
}: {
  answerCount: number
  /** Who keeps the list of a round said aloud, and `null` in a typed one. */
  keeper?: 'you' | 'another seat' | null
}) =>
  answeringView({
    content: {
      answerCount,
      foundCellCount: 2,
      kind: 'blacksquare',
      revealed: null,
      spoken:
        keeper === null
          ? null
          : {
              guessingTeamId: 'team-1',
              keeperId: keeper === 'you' ? 'p1' : 'p3',
              list: keeper === 'you' ? TURNER_LIST : null,
              tickedCells: [1, 4]
            },
      theme: LONGEST_THEME,
      yourLines:
        keeper === null
          ? [{ cells: [0], hitBlackWord: false, line: 'Titanic' }]
          : null
    },
    game: {
      answerCount,
      doublesLoneFinds: false,
      kind: 'blacksquare',
      roundDurationMs: 60_000
    },
    mode: { kind: keeper === null ? 'typed' : 'spoken' },
    ...(keeper === null
      ? {}
      : { teams: SPOKEN_TEAMS, teamsSettings: { count: 2, kind: 'drawn' } })
  })

const SEATED_BLACK_SQUARE = { grid: null, kind: 'blacksquare' }

/** Ten categories, the most a sheet holds: the bank's longest names and two of the host's own. */
const PETIT_BAC_CATEGORIES = [
  { key: 'cartoonCharacter', kind: 'bank' },
  { key: 'lateExcuse', kind: 'bank' },
  { key: 'fictionalCharacter', kind: 'bank' },
  { key: 'instrument', kind: 'bank' },
  { key: 'singer', kind: 'bank' },
  { key: 'personalityTrait', kind: 'bank' },
  { key: 'fruitOrVegetable', kind: 'bank' },
  { key: 'bodyPart', kind: 'bank' },
  { kind: 'own', label: 'Chose qu’on oublie en partant en voyage' },
  { kind: 'own', label: 'Mot qu’on dit à sa belle-mère au repas' }
]

const YOUR_PETIT_BAC_SHEET = [
  'Bourriquet',
  'Mon bus est tombé en panne au beau milieu du boulevard',
  '',
  'Basson',
  'Bénabar',
  'Bienveillant',
  'Betterave',
  '',
  'Brosse à dents',
  'Bonjour madame, votre blanquette est délicieuse'
]

const PETIT_BAC_VOTED_EXCUSES = [
  'Mon bus est tombé en panne au beau milieu du boulevard',
  'Bouchons',
  'Ma belle-sœur a garé sa voiture devant le portail du garage',
  'Brouillard',
  'Batterie du réveil à plat après la coupure de courant',
  'Baby-sitter en retard',
  'Bagarre de chats dans la cage d’escalier ce matin',
  'Bateau-mouche',
  'Billet de train composté au mauvais quai de la gare',
  'Bisou',
  'Bébé malade',
  'Barrage filtrant sur la nationale'
]

const petitBacScreen = ({
  isVoting = false,
  stoppedBy = null
}: {
  isVoting?: boolean
  stoppedBy?: string | null
}) =>
  answeringView({
    content: {
      barredStopperIds: [],
      categories: PETIT_BAC_CATEGORIES,
      categoryStates: PETIT_BAC_CATEGORIES.map((_, at) =>
        !isVoting ? 'open' : at === 0 ? 'settled' : at === 1 ? 'voting' : 'open'
      ),
      kind: 'petitbac',
      letter: 'B',
      lines: PETIT_BAC_CATEGORIES.map((_, at) =>
        isVoting && at === 0
          ? fullSeats.map(({ id }, seat) => ({
              isStruck: false,
              outcome: seat % 4 === 0 ? 'unique' : 'shared',
              playerId: id,
              text: seat % 4 === 0 ? `Bugs Bunny ${seat}` : 'Bourriquet'
            }))
          : null
      ),
      rows: isVoting
        ? PETIT_BAC_VOTED_EXCUSES.map((text, at) => ({
            authors: fullSeats
              .filter((_, seat) => seat % PETIT_BAC_VOTED_EXCUSES.length === at)
              .map(({ id }) => id),
            isStruck: false,
            key: text.toLowerCase(),
            refusals: at % 3,
            refused: false,
            text
          }))
        : null,
      sheetsClosed: isVoting,
      stopClosesAtElapsedMs: stoppedBy === null ? null : 6_000,
      stoppedBy,
      stopsWhenFull: true,
      votesDone: [],
      yourRefusals: [],
      yourSheet: YOUR_PETIT_BAC_SHEET
    },
    game: {
      categories: PETIT_BAC_CATEGORIES,
      categoryCount: PETIT_BAC_CATEGORIES.length,
      excludedLetters: ['K', 'Q', 'W', 'X', 'Y', 'Z'],
      kind: 'petitbac',
      roundDurationMs: 120_000,
      stopsWhenFull: true
    },
    mode: { kind: 'typed' }
  })

const SEATED_PETIT_BAC = {
  canCancelStop: false,
  kind: 'petitbac',
  progress: fullSeats.map(({ id }, seat) => ({
    filled: seat % 11,
    playerId: id
  }))
}

const swatchScreen = ({ isShown }: { isShown: boolean }) =>
  answeringView({
    content: {
      colour: isShown ? '#3a7bd5' : null,
      hidesAt: isShown ? SERVER_TIME + 60_000 : SERVER_TIME - 1_000,
      kind: 'swatch',
      revealedColours: null,
      yourColour: null
    },
    game: { kind: 'swatch', roundDurationMs: 20_000, showMs: 5_000 },
    mode: { kind: 'colour' }
  })

const mostLikelyScreen = () =>
  answeringView({
    content: {
      kind: 'mostlikely',
      // The bank's longest line.
      labels: inBothLocales(
        'Qui a le plus de chances de finir de monter un meuble avec des vis en trop ?',
        'Who is most likely to finish building furniture with screws left over?'
      ),
      tally: null,
      yourBallot: null
    },
    game: { kind: 'mostlikely', roundDurationMs: 30_000 },
    mode: { kind: 'vote' }
  })

const estimateScreen = () =>
  answeringView({
    content: {
      kind: 'estimate',
      // The quantity bank's longest name.
      question: {
        family: 'height.building',
        names: inBothLocales(
          'tour centrale de radio-télédiffusion de Pékin',
          'Central Radio & TV Tower'
        )
      },
      revealedGuesses: null,
      value: null,
      yourGuess: null
    },
    game: { kind: 'estimate', roundDurationMs: 30_000 },
    mode: { kind: 'number' }
  })

const higherLowerScreen = () =>
  answeringView({
    content: {
      kind: 'higherlower',
      // The quantity bank's two longest rivers.
      pairs: [
        {
          family: 'length.river',
          left: inBothLocales(
            'Saryozen (rivière du bassin Volga-Oural)',
            'Maly Uzen'
          ),
          right: inBothLocales('Vichera (oblast de Novgorod)', 'Vishera')
        }
      ],
      revealedPairs: null,
      revealedSheets: null,
      yourPicks: null
    },
    game: { kind: 'higherlower', roundDurationMs: 10_000 },
    mode: { kind: 'pairs' }
  })

type AnsweringScreen = {
  /** `<game> <mode>`, then the moment when the game draws more than one. */
  name: string
  /** What the seat's screen draws once the snapshot has landed. */
  ready: string
  /**
   * The same round on a console that took the first seat, and what it draws
   * once landed — `null` where the seat sits the round out to judge it.
   */
  seated: { currentContent: object; ready: string } | null
  view: object
}

const ANSWERING_SCREENS: AnsweringScreen[] = [
  {
    name: 'blind test, the countdown',
    ready: '.countdown',
    seated: { currentContent: SEATED_BLINDTEST, ready: '.stage .countdown' },
    view: blindTestScreen({
      choices: LONG_TRACK_CHOICES,
      mode: { kind: 'choice' },
      phase: 'countdown'
    })
  },
  {
    name: 'blind test choice',
    ready: '.answer-tile',
    seated: { currentContent: SEATED_BLINDTEST, ready: '.answer-tile' },
    view: blindTestScreen({
      choices: LONG_TRACK_CHOICES,
      mode: { kind: 'choice' }
    })
  },
  {
    name: 'blind test typed',
    ready: '.answer-form.typed',
    seated: { currentContent: SEATED_BLINDTEST, ready: '.answer-form.typed' },
    view: blindTestScreen({ mode: { kind: 'typed' } })
  },
  {
    // The longest stamp a half prints: a film score's composer found.
    name: 'blind test typed, one half banked',
    ready: '.answer-form.typed .half',
    seated: {
      currentContent: SEATED_BLINDTEST,
      ready: '.answer-form.typed .half'
    },
    view: (() => {
      const view = blindTestScreen({ mode: { kind: 'typed' } })

      return {
        ...view,
        round: {
          ...view.round,
          content: { ...view.round.content, asksForAFilm: true }
        },
        yourVerdict: {
          artistCorrect: true,
          kind: 'halves',
          titleCorrect: false
        }
      }
    })()
  },
  {
    name: 'blind test buzzer',
    ready: '.buzzer',
    seated: null,
    view: blindTestScreen({ mode: BUZZER_MODE })
  },
  {
    name: 'blind test buzzer, the floor taken by another seat',
    ready: '.taken-floor',
    seated: null,
    view: blindTestScreen({
      activeBuzz: floorOf('p7'),
      mode: BUZZER_MODE,
      phase: 'buzzed'
    })
  },
  {
    name: 'blind test buzzer, the floor yours',
    ready: '.taken-floor',
    seated: null,
    view: blindTestScreen({
      activeBuzz: floorOf('p1'),
      mode: BUZZER_MODE,
      phase: 'buzzed'
    })
  },
  {
    name: 'buzzer buzzer',
    ready: '.buzzer',
    seated: null,
    view: answeringView({
      content: { kind: 'buzzer' },
      game: BARE_BUZZER_GAME,
      mode: BUZZER_MODE
    })
  },
  {
    name: 'buzzer buzzer, the floor taken',
    ready: '.taken-floor',
    seated: null,
    view: answeringView({
      activeBuzz: floorOf('p7'),
      content: { kind: 'buzzer' },
      game: BARE_BUZZER_GAME,
      mode: BUZZER_MODE,
      phase: 'buzzed'
    })
  },
  {
    name: 'quiz typed, the longest question',
    ready: '.answer-form.typed',
    seated: { currentContent: SEATED_QUIZ, ready: '.answer-form.typed' },
    view: quizScreen({ content: quizRound, mode: { kind: 'typed' } })
  },
  {
    name: 'quiz typed, the longest question after a miss',
    ready: '.answer-form.typed .missed',
    seated: {
      currentContent: SEATED_QUIZ,
      ready: '.answer-form.typed .missed'
    },
    view: {
      ...quizScreen({ content: quizRound, mode: { kind: 'typed' } }),
      yourVerdict: { isCorrect: false, kind: 'single' }
    }
  },
  ...[
    { content: FLAG_ROUND, rubric: 'flags' },
    { content: REBUS_ROUND, rubric: 'emoji rebus' },
    { content: CAPITAL_ROUND, rubric: 'capitals' },
    { content: SILHOUETTE_ROUND, rubric: 'silhouettes' }
  ].map(({ content, rubric }) => ({
    name: `quiz choice, ${rubric}`,
    ready: '.answer-tile',
    seated: { currentContent: SEATED_QUIZ, ready: '.answer-tile' },
    view: quizScreen({ content })
  })),
  {
    name: 'reflex buzzer, the wait',
    ready: '.buzzer.armed',
    seated: { currentContent: { kind: 'reflex' }, ready: '.reflex-stage' },
    view: reflexScreen(SERVER_TIME + 60_000)
  },
  {
    name: 'reflex buzzer, after the flip',
    ready: '.reaction',
    seated: { currentContent: { kind: 'reflex' }, ready: '.reflex-stage' },
    view: reflexScreen(SERVER_TIME - 2_000)
  },
  {
    name: 'slate typed, the sheet being written',
    ready: '.slate-sheet',
    seated: null,
    view: slateScreen(() => 'open')
  },
  {
    name: 'slate typed, an item closed on the wall',
    ready: '.slate-sheet',
    seated: null,
    view: slateScreen((item) =>
      item < 2 ? 'marked' : item === 2 ? 'closed' : 'open'
    )
  },
  {
    name: 'slate typed, every item marked but the last',
    ready: '.slate-on-the-wall',
    seated: null,
    view: slateScreen((item) =>
      item < SLATE_SHEET_ITEMS - 1 ? 'marked' : 'closed'
    )
  },
  {
    name: 'atlas point',
    ready: '.world-map .controls',
    seated: {
      currentContent: { answer: null, kind: 'atlas' },
      ready: '.world-map .controls'
    },
    view: atlasPlaceScreen()
  },
  {
    name: 'challenge buzzer, the table playing',
    ready: '.player-round.notice',
    seated: null,
    view: answeringView({
      content: { kind: 'challenge', labels: LONGEST_CHALLENGE },
      game: { kind: 'challenge' },
      mode: BUZZER_MODE
    })
  },
  {
    name: 'inner clock buzzer, the countdown',
    ready: '.countdown',
    seated: {
      currentContent: { kind: 'innerclock' },
      ready: '.stage.counting-in'
    },
    view: innerclockScreen('countdown')
  },
  {
    name: 'inner clock buzzer, counting',
    ready: '.innerclock-press',
    seated: { currentContent: { kind: 'innerclock' }, ready: '.stage.solo' },
    view: innerclockScreen('playing')
  },
  ...[
    { puzzle: EQUATION, shape: 'equation' },
    { puzzle: NUMBER, shape: 'number' }
  ].flatMap(({ puzzle, shape }) => [
    {
      name: `matchsticks move, ${shape}`,
      ready: '.matchsticks-move',
      seated: {
        currentContent: { kind: 'matchsticks', solutions: null },
        ready: '.matchsticks-move'
      },
      view: matchsticksScreen({ mode: { kind: 'move' }, puzzle })
    },
    {
      name: `matchsticks buzzer, ${shape} said aloud`,
      ready: '.buzzer',
      seated: null,
      view: matchsticksScreen({ mode: BUZZER_MODE, puzzle })
    }
  ]),
  {
    name: 'matchsticks buzzer, the floor taken',
    ready: '.taken-floor',
    seated: null,
    view: matchsticksScreen({
      activeBuzz: floorOf('p7'),
      mode: BUZZER_MODE,
      phase: 'buzzed',
      puzzle: EQUATION
    })
  },
  {
    name: 'timeline order',
    ready: '.timeline-answer',
    seated: {
      currentContent: { datedEvents: null, kind: 'timeline' },
      ready: '.timeline-answer'
    },
    view: timelineScreen()
  },
  ...[3, 9].map((answerCount) => ({
    name: `black square typed, ${answerCount} answers`,
    ready: '.black-square-answer',
    seated: {
      currentContent: SEATED_BLACK_SQUARE,
      ready: '.black-square-answer'
    },
    view: blackSquareScreen({ answerCount })
  })),
  ...(['you', 'another seat'] as const).map((keeper) => ({
    name: `black square spoken, ${keeper === 'you' ? 'the keeper' : 'a seat guessing'}`,
    ready: '.black-square-round',
    seated: { currentContent: SEATED_BLACK_SQUARE, ready: '.stage.playing' },
    view: blackSquareScreen({ answerCount: 9, keeper })
  })),
  ...[
    { moment: 'the sheet at ten categories', view: petitBacScreen({}) },
    {
      moment: 'the sheet after a stop',
      view: petitBacScreen({ stoppedBy: 'p7' })
    },
    { moment: 'the vote', view: petitBacScreen({ isVoting: true }) }
  ].map(({ moment, view }) => ({
    name: `petit bac typed, ${moment}`,
    ready: '.petit-bac-round',
    seated: { currentContent: SEATED_PETIT_BAC, ready: '.petit-bac-seat' },
    view
  })),
  ...[true, false].map((isShown) => ({
    name: `shades colour, ${isShown ? 'the colour shown' : 'the picker'}`,
    ready: isShown ? '.swatch-round' : '.swatch-answer',
    seated: {
      currentContent: { kind: 'swatch' },
      ready: isShown ? '.stage.playing' : '.swatch-answer'
    },
    view: swatchScreen({ isShown })
  })),
  {
    name: 'most likely vote',
    ready: '.most-likely-ballot',
    seated: {
      currentContent: { kind: 'mostlikely' },
      ready: '.most-likely-ballot'
    },
    view: mostLikelyScreen()
  },
  {
    name: 'le juste chiffre number',
    ready: '.estimate-answer',
    seated: {
      currentContent: { kind: 'estimate', value: null },
      ready: '.estimate-answer'
    },
    view: estimateScreen()
  },
  {
    name: 'plus ou moins pairs',
    ready: '.higher-lower-answer',
    seated: {
      currentContent: { kind: 'higherlower', valuedPairs: null },
      ready: '.higher-lower-answer'
    },
    view: higherLowerScreen()
  }
]

/** The short side a press is reported under: Apple's and WCAG's touch target. */
const TOUCH_TARGET_PX = 44

type AnsweringOverflow = {
  /** Every word drawn under the floor, by the element that sets it. */
  belowTheFloor: string[]
  /** Every press drawn under another piece at its centre. */
  covered: string[]
  /** What reaches furthest past the viewport, outside a box made to scroll. */
  furthest: string | null
  /** Every press not wholly on screen: past the viewport, or cut by a box around it. */
  hidden: string[]
  /** Every press whose short side is under the touch target — reported, never asserted. */
  narrow: string[]
  page: number
  /** Every box that scrolls on its own — reported, never asserted: a press it hides is `hidden`. */
  scrolling: string[]
  /** Every piece of text whose words run past its own box. */
  spills: string[]
  /** Every painted box — a card, a tile, a field — whose contents run past it. */
  spilledCards: string[]
  /** Every word or round clock the corner menu is drawn over. */
  underTheMenu: string[]
}

const measureAnswering = ({
  floorPx,
  touchTargetPx
}: {
  floorPx: number
  touchTargetPx: number
}): AnsweringOverflow => {
  const root = document.scrollingElement ?? document.documentElement
  const nameOf = (element: Element): string => {
    const classes = String(element.className).trim().split(/\s+/).join('.')

    return `${element.tagName.toLowerCase()}${classes === '' ? '' : `.${classes}`}`
  }
  const textOf = (element: Element): string =>
    (element.textContent ?? '').trim().replaceAll(/\s+/g, ' ').slice(0, 32)
  const isClipping = (element: Element): boolean => {
    const { overflowX, overflowY } = getComputedStyle(element)

    return overflowX !== 'visible' || overflowY !== 'visible'
  }
  // A label for assistive technology is a one-pixel box that clips its words.
  const isScreenReaderOnly = (element: Element): boolean => {
    for (
      let piece: Element | null = element;
      piece !== null && piece !== document.body;
      piece = piece.parentElement
    ) {
      const { height, width } = piece.getBoundingClientRect()

      if (Math.min(height, width) <= 1 && isClipping(piece)) {
        return true
      }
    }

    return false
  }
  // The host's side panel and the menu scroll inside their own box by design,
  // and the skip link waits above the viewport for a keyboard.
  const isOffstage = (element: Element): boolean =>
    element.closest('.panel-screen, [role=dialog], [role=menu], .skip-link') !==
    null
  const shown = [...document.body.querySelectorAll<HTMLElement>('*')].filter(
    (element) =>
      element.checkVisibility({ visibilityProperty: true }) &&
      !isOffstage(element) &&
      !isScreenReaderOnly(element)
  )
  const isScrolling = (element: Element): boolean => {
    const { overflowX, overflowY } = getComputedStyle(element)

    return [overflowX, overflowY].some(
      (overflow) => overflow === 'auto' || overflow === 'scroll'
    )
  }
  const scrollingAncestorOf = (element: Element): Element | null => {
    for (
      let ancestor = element.parentElement;
      ancestor !== null && ancestor !== document.body;
      ancestor = ancestor.parentElement
    ) {
      if (isScrolling(ancestor)) {
        return ancestor
      }
    }

    return null
  }
  const visibleBoxOf = (element: Element) => {
    const box = element.getBoundingClientRect()
    let { bottom, left, right, top } = box

    for (
      let ancestor = element.parentElement;
      ancestor !== null;
      ancestor = ancestor.parentElement
    ) {
      if (isClipping(ancestor)) {
        const clip = ancestor.getBoundingClientRect()

        top = Math.max(top, clip.top)
        left = Math.max(left, clip.left)
        bottom = Math.min(bottom, clip.bottom)
        right = Math.min(right, clip.right)
      }
    }

    return {
      bottom: Math.min(bottom, innerHeight),
      left: Math.max(left, 0),
      right: Math.min(right, innerWidth),
      top: Math.max(top, 0)
    }
  }
  // Petit Bac's sheet and its vote are the lists allowed to scroll inside
  // their own box (`screen-roles`): a press in one is in reach while the box
  // itself is wholly on screen.
  const reachOf = (press: Element): Element =>
    press.closest('.petit-bac-sheet .lines, .petit-bac-vote .rows') ?? press
  const hasOwnText = (element: Element): boolean =>
    [...element.childNodes].some(
      (node) =>
        node.nodeType === Node.TEXT_NODE &&
        (node.textContent ?? '').trim() !== ''
    )
  const texts = shown.filter(hasOwnText)
  const menu = document
    .querySelector('.app-menu .trigger')
    ?.getBoundingClientRect()
  const isUnderTheMenu = (box: DOMRect): boolean =>
    menu !== undefined &&
    box.width > 1 &&
    box.height > 1 &&
    box.left < menu.right - 1 &&
    box.right > menu.left + 1 &&
    box.top < menu.bottom - 1 &&
    box.bottom > menu.top + 1
  // A line's box runs the width of its column; its words are what the menu
  // must clear, so each text node is measured by the ink it lays out.
  const hasWordsUnderTheMenu = (element: Element): boolean =>
    [...element.childNodes].some((node) => {
      if (node.nodeType !== Node.TEXT_NODE) {
        return false
      }

      const range = document.createRange()
      range.selectNodeContents(node)

      return [...range.getClientRects()].some(isUnderTheMenu)
    })

  const furthest = shown
    .filter((element) => scrollingAncestorOf(element) === null)
    .map((element) => {
      const box = element.getBoundingClientRect()

      return {
        element,
        past: Math.max(
          box.bottom - innerHeight,
          box.right - innerWidth,
          -box.top,
          -box.left
        )
      }
    })
    .filter(({ element, past }) => {
      const box = element.getBoundingClientRect()

      return past > 0.5 && box.width > 1 && box.height > 1
    })
    .toSorted((a, b) => b.past - a.past)[0]

  const presses = shown.filter(
    (element) =>
      element.matches(
        'button, input:not([type=hidden]), textarea, select, a[href], [role=button], [role=radio], [role=checkbox], [role=switch], [role=slider], [role=tab], [role=option], [role=gridcell], [role=spinbutton]'
      ) &&
      element.getBoundingClientRect().width > 2 &&
      element.getBoundingClientRect().height > 2
  )
  const pressName = (press: Element): string => {
    const box = press.getBoundingClientRect()
    const label =
      press.getAttribute('aria-label') ?? (textOf(press) || nameOf(press))

    return `${nameOf(press)} "${label}" ${Math.round(box.width)}×${Math.round(box.height)}`
  }

  return {
    belowTheFloor: [
      ...new Set(
        texts
          .filter(
            (element) =>
              // The console's tab bar sets its labels under the glyphs, by design.
              element.closest('.panel-tabs, .panel-rail') === null &&
              Number.parseFloat(getComputedStyle(element).fontSize) < floorPx
          )
          .map(
            (element) =>
              `${nameOf(element)} ${Number.parseFloat(getComputedStyle(element).fontSize).toFixed(1)}px "${textOf(element)}"`
          )
      )
    ],
    covered: presses
      .filter((press) => {
        const box = visibleBoxOf(press)

        if (box.right - box.left < 1 || box.bottom - box.top < 1) {
          return false
        }

        const hit = document.elementFromPoint(
          (box.left + box.right) / 2,
          (box.top + box.bottom) / 2
        )

        return (
          hit !== null &&
          !press.contains(hit) &&
          !hit.contains(press) &&
          (press.closest('label') === null ||
            hit.closest('label') !== press.closest('label'))
        )
      })
      .map((press) => {
        const box = visibleBoxOf(press)
        const hit = document.elementFromPoint(
          (box.left + box.right) / 2,
          (box.top + box.bottom) / 2
        )

        return `${pressName(press)} under ${hit === null ? 'nothing' : nameOf(hit)}`
      }),
    furthest:
      furthest === undefined
        ? null
        : `${nameOf(furthest.element)} "${textOf(furthest.element)}" ${Math.round(furthest.past)}px past`,
    hidden: presses
      .filter((press) => {
        const box = reachOf(press).getBoundingClientRect()
        const visible = visibleBoxOf(reachOf(press))

        return (
          visible.top > box.top + 1 ||
          visible.left > box.left + 1 ||
          visible.bottom < box.bottom - 1 ||
          visible.right < box.right - 1
        )
      })
      .map((press) => {
        const box = reachOf(press).getBoundingClientRect()
        const visible = visibleBoxOf(reachOf(press))
        const shownHeight = Math.max(0, visible.bottom - visible.top)
        const shownWidth = Math.max(0, visible.right - visible.left)

        return `${pressName(press)} shown ${Math.round(shownWidth)}×${Math.round(shownHeight)} at ${Math.round(box.left)},${Math.round(box.top)}`
      }),
    narrow: presses
      .filter((press) => {
        const box = press.getBoundingClientRect()

        return Math.min(box.width, box.height) < touchTargetPx
      })
      .map(pressName),
    page: Math.max(
      root.scrollHeight - innerHeight,
      root.scrollWidth - innerWidth,
      0
    ),
    scrolling: shown
      .filter(
        (element) =>
          isScrolling(element) &&
          (element.scrollHeight > element.clientHeight + 1 ||
            element.scrollWidth > element.clientWidth + 1)
      )
      .map(
        (element) =>
          `${nameOf(element)} ${element.scrollWidth - element.clientWidth}×${element.scrollHeight - element.clientHeight}px`
      ),
    spilledCards: shown
      .filter((element) => {
        const style = getComputedStyle(element)
        const isPainted =
          style.backgroundImage !== 'none' ||
          style.backgroundColor !== 'rgba(0, 0, 0, 0)'
        const slack = Math.max(4, 0.25 * Number.parseFloat(style.fontSize))

        return (
          isPainted &&
          !isScrolling(element) &&
          element.getBoundingClientRect().height < innerHeight &&
          (element.textContent ?? '').trim() !== '' &&
          (element.scrollHeight > element.clientHeight + slack ||
            element.scrollWidth > element.clientWidth + slack)
        )
      })
      .map(
        (element) =>
          `${nameOf(element)} "${textOf(element)}" ${element.scrollWidth}/${element.clientWidth}×${element.scrollHeight}/${element.clientHeight}`
      ),
    spills: texts
      .filter((element) => {
        const style = getComputedStyle(element)

        if (style.display === 'inline' || style.display === 'contents') {
          return false
        }

        // 24 twenty-character names at 14px outrun a phone's height: a seat's
        // name is cut once it fills every line its row holds, by design.
        if (
          element.matches('.most-likely-ballot .seat-tile .nickname') &&
          Math.round(
            element.clientHeight / Number.parseFloat(style.lineHeight)
          ) >= Number(style.webkitLineClamp)
        ) {
          return false
        }

        const slack = Math.max(1, 0.05 * Number.parseFloat(style.fontSize))
        // Clipped across only, ink past the line box is drawn, never cut.
        const isCutDown = style.overflowY !== 'visible'

        return (
          element.scrollWidth > element.clientWidth + slack ||
          (isCutDown && element.scrollHeight > element.clientHeight + slack)
        )
      })
      .map(
        (element) =>
          `${nameOf(element)} "${textOf(element)}" ${element.scrollWidth}/${element.clientWidth}×${element.scrollHeight}/${element.clientHeight}`
      ),
    underTheMenu: shown
      .filter(
        (element) =>
          element.closest('.app-menu') === null &&
          (element.matches('.round-progress')
            ? isUnderTheMenu(element.getBoundingClientRect())
            : hasWordsUnderTheMenu(element))
      )
      .map((element) => `${nameOf(element)} "${textOf(element)}"`)
  }
}

const ANSWERING_ROLES = [
  { path: `/play/${ROOM_CODE}`, role: 'player' },
  { path: `/host/${ROOM_CODE}`, role: 'seated host' }
] as const

for (const screen of ANSWERING_SCREENS) {
  for (const { path, role } of ANSWERING_ROLES) {
    const seated = screen.seated

    if (role === 'seated host' && seated === null) {
      continue
    }

    test(`[layout] ${role}, ${screen.name}: never scrolls on a phone`, async ({
      page
    }) => {
      await serveRoom({
        page,
        view:
          seated === null || role === 'player'
            ? screen.view
            : seatedOn({
                currentContent: seated.currentContent,
                view: screen.view
              })
      })
      await page.addInitScript(() => {
        localStorage.setItem('melee:locale', 'fr')
      })
      await page.setViewportSize({ height: 844, width: 390 })
      await page.goto(path)
      await expect(
        page
          .locator(
            role === 'player' || seated === null ? screen.ready : seated.ready
          )
          .first()
      ).toBeVisible()

      const faults: string[] = []

      for (const [width, height] of PHONE_VIEWPORTS) {
        await resizeTo({ height, page, width })

        const { narrow, scrolling, ...overflow } = await page.evaluate(
          measureAnswering,
          {
            floorPx: FLOOR_PX,
            touchTargetPx: TOUCH_TARGET_PX
          }
        )

        if (narrow.length > 0 || scrolling.length > 0) {
          test.info().annotations.push({
            description: JSON.stringify({ narrow, scrolling }),
            type: `${width}×${height}`
          })
        }

        if (
          overflow.belowTheFloor.length > 0 ||
          overflow.covered.length > 0 ||
          overflow.furthest !== null ||
          overflow.hidden.length > 0 ||
          overflow.page > 0 ||
          overflow.spilledCards.length > 0 ||
          overflow.spills.length > 0 ||
          overflow.underTheMenu.length > 0
        ) {
          faults.push(`${width}×${height} ${JSON.stringify(overflow)}`)
        }
      }

      expect(faults).toEqual([])
    })
  }
}

/** A phone with its keyboard up: the shape the screen keeps above it. */
const KEYBOARD_UP_VIEWPORTS = [
  [320, 284],
  [360, 320],
  [390, 422]
] as const

const KEYBOARD_SCREENS = [
  {
    /** The field the keyboard rose for. */
    field: '.black-square-answer input',
    /** What must stay wholly in view above the keyboard, the field included. */
    inView: [
      '.black-square-theme',
      '.black-square-answer input',
      '.black-square-answer button[type=submit]'
    ],
    name: 'black square typed, 9 answers'
  },
  {
    field: '.slate-sheet .writing input',
    inView: [
      '.slate-sheet .writing .label',
      '.slate-sheet .writing input',
      '.slate-sheet .stepper button'
    ],
    name: 'slate typed, an item closed on the wall'
  },
  {
    // A line low on the sheet, which the list scrolls to inside its card.
    field: '.petit-bac-sheet .line:nth-child(8) input',
    inView: [
      '.petit-bac-sheet .letter-piece',
      '.petit-bac-sheet .line:nth-child(8) input',
      '.petit-bac-sheet .stop .button'
    ],
    name: 'petit bac typed, the sheet at ten categories'
  },
  ...[
    { inView: '.round-card', name: 'blind test typed' },
    { inView: '.round-card', name: 'blind test typed, one half banked' },
    { inView: '.round-card .prompt', name: 'quiz typed, the longest question' },
    {
      inView: '.round-card .prompt',
      name: 'quiz typed, the longest question after a miss'
    }
  ].map(({ inView, name }) => ({
    field: '.answer-form.typed input',
    inView: [
      inView,
      '.answer-form.typed input',
      '.answer-form.typed button[type=submit]'
    ],
    name
  })),
  {
    field: '.estimate-answer input',
    inView: [
      '.round-card .estimate-question',
      '.estimate-answer input',
      '.estimate-answer button[type=submit]'
    ],
    name: 'le juste chiffre number'
  }
]

const measureKeyboardUp = (inView: string[]) => {
  const root = document.scrollingElement ?? document.documentElement
  const outOfView = inView.flatMap((selector) => {
    const pieces = [...document.querySelectorAll(selector)].filter((piece) =>
      piece.checkVisibility({ visibilityProperty: true })
    )

    if (pieces.length === 0) {
      return [`${selector} not drawn`]
    }

    return pieces.flatMap((piece) => {
      const box = piece.getBoundingClientRect()
      let { bottom, left, right, top } = box

      for (
        let ancestor = piece.parentElement;
        ancestor !== null;
        ancestor = ancestor.parentElement
      ) {
        const { overflowX, overflowY } = getComputedStyle(ancestor)

        if (overflowX !== 'visible' || overflowY !== 'visible') {
          const clip = ancestor.getBoundingClientRect()

          top = Math.max(top, clip.top)
          left = Math.max(left, clip.left)
          bottom = Math.min(bottom, clip.bottom)
          right = Math.min(right, clip.right)
        }
      }

      const isWhole =
        top <= box.top + 1 &&
        left <= box.left + 1 &&
        bottom >= box.bottom - 1 &&
        right >= box.right - 1 &&
        box.top >= -1 &&
        box.left >= -1 &&
        box.bottom <= innerHeight + 1 &&
        box.right <= innerWidth + 1
      const hit = document.elementFromPoint(
        (box.left + box.right) / 2,
        (box.top + box.bottom) / 2
      )
      const isCovered =
        hit !== null && !piece.contains(hit) && !hit.contains(piece)

      if (isWhole && !isCovered) {
        return []
      }

      const where = isWhole
        ? `under ${hit?.tagName.toLowerCase()}.${String(hit?.className).split(' ').join('.')}`
        : `at ${Math.round(box.top)}–${Math.round(box.bottom)}`

      return [
        `${selector} "${(piece.textContent ?? '').trim().slice(0, 24)}" ${where}`
      ]
    })
  })

  return {
    outOfView,
    page: Math.max(
      root.scrollHeight - innerHeight,
      root.scrollWidth - innerWidth,
      0
    )
  }
}

for (const keyboard of KEYBOARD_SCREENS) {
  const screen = ANSWERING_SCREENS.find(({ name }) => name === keyboard.name)

  for (const { path, role } of ANSWERING_ROLES) {
    const seated = screen?.seated ?? null

    if (screen === undefined || (role === 'seated host' && seated === null)) {
      continue
    }

    test(`[layout] ${role}, ${screen.name}: with the keyboard up, the question, the field and the send press stay in view`, async ({
      page
    }) => {
      await serveRoom({
        page,
        view:
          seated === null || role === 'player'
            ? screen.view
            : seatedOn({
                currentContent: seated.currentContent,
                view: screen.view
              })
      })
      await page.addInitScript(() => {
        localStorage.setItem('melee:locale', 'fr')
      })
      await page.setViewportSize({ height: 844, width: 390 })
      await page.goto(path)
      await expect(page.locator(keyboard.field).first()).toBeVisible()

      const faults: string[] = []

      for (const [width, height] of KEYBOARD_UP_VIEWPORTS) {
        await resizeTo({ height, page, width })
        await page.locator(keyboard.field).first().focus()

        const { outOfView, page: scrolled } = await page.evaluate(
          measureKeyboardUp,
          keyboard.inView
        )

        if (outOfView.length > 0 || scrolled > 0) {
          faults.push(
            `${width}×${height} ${JSON.stringify({ outOfView, page: scrolled })}`
          )
        }
      }

      expect(faults).toEqual([])
    })
  }
}
