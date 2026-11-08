import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_BLACK_SQUARE_SETTINGS } from '@melee/protocol/game'
import type { HostToken } from '@melee/protocol/identifiers'
import {
  DEFAULT_MODE_SETTINGS,
  DEFAULT_ROOM_SETTINGS,
  type RoomSettings,
  type RoundContent,
  type RoundView
} from '@melee/protocol/room'
import { MOST_A_ROUND_PAYS } from '@melee/protocol/scoring'
import {
  type WallServerMessage,
  wallServerMessageSchema
} from '@melee/protocol/server-message'
import { PROTOCOL_VERSION } from '@melee/protocol/version'

import { startRoomHarness } from './node-room-harness'
import {
  errorsIn,
  hostView,
  type Peer,
  playerView,
  type RoomHarness,
  waitFor
} from './room-harness'

const ANSWER_NAMES = [
  'Mercury',
  'Venus',
  'Earth',
  'Mars',
  'Jupiter',
  'Saturn',
  'Uranus',
  'Neptune',
  'Ceres'
]

const named = (name: string) => ({
  aliases: { en: [`${name} planet`], fr: [`La ${name}`] },
  labels: { en: name, fr: `${name} fr` }
})

/** Nine answers dealt nine at a time: two obvious, five between, two rare. */
const TIERS = [
  'easy',
  'easy',
  'medium',
  'medium',
  'medium',
  'medium',
  'medium',
  'hard',
  'hard'
] as const

const THEME = {
  answers: ANSWER_NAMES.map((name, index) => ({
    ...named(name),
    tier: TIERS[index] ?? 'medium'
  })),
  blackWord: {
    ...named('Pluto'),
    why: { en: 'A dwarf planet since 2006', fr: 'Dwarf planet, in French' }
  },
  id: 'planets',
  labels: { en: 'The planets', fr: 'The planets, in French' },
  tier: 'easy'
}

/** Every name a seat could be handed by mistake, the black word's and its `why` included. */
const SECRETS = [
  ...[...THEME.answers, THEME.blackWord].flatMap(({ aliases, labels }) => [
    labels.en,
    labels.fr,
    ...aliases.en,
    ...aliases.fr
  ]),
  THEME.blackWord.why.en
]

vi.mock('@melee/core/helpers/random', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@melee/core/helpers/random')>()),
  shuffled: <TItem>(items: readonly TItem[]): TItem[] => [...items]
}))

vi.mock('@/infrastructure/questions/black-square-bank', () => ({
  drawBlackSquareTheme: ({ playedIds }: { playedIds: ReadonlySet<string> }) =>
    playedIds.has('blacksquare:planets') ? null : THEME,
  playedBlackSquareThemeId: (id: string) => `blacksquare:${id}`
}))

/** The nine dealt by tier, a rare answer weighing three times an obvious one: 2 × 1 + 5 × 2 + 2 × 3. */
const FULL_SHEET_WEIGHT = 18

/** What a sheet holding `found` of the weight `outOf` is paid: its share of the round. */
const sheetPays = ({
  found,
  outOf = FULL_SHEET_WEIGHT
}: {
  found: number
  outOf?: number
}) => Math.round((MOST_A_ROUND_PAYS * found) / outOf)

const BLACK_SQUARE: RoomSettings = {
  ...DEFAULT_ROOM_SETTINGS,
  countdownMs: 20,
  game: { ...DEFAULT_BLACK_SQUARE_SETTINGS, answerCount: 9 },
  mode: DEFAULT_MODE_SETTINGS.typed,
  roundCount: 3
}

const blackSquareRound = (
  view: { round: RoundView | null } | null
): Extract<RoundContent, { kind: 'blacksquare' }> | null => {
  const content = view?.round?.content

  return content?.kind === 'blacksquare' ? content : null
}

const transcriptOf = (peer: { frames: { raw: string }[] }): string =>
  peer.frames.map(({ raw }) => raw).join('')

const leakedIn = ({
  peer,
  typed
}: {
  peer: { frames: { raw: string }[] }
  typed: readonly string[]
}): string[] => {
  const transcript = transcriptOf(peer)

  return SECRETS.filter(
    (secret) =>
      !typed.some((line) => secret.includes(line)) &&
      transcript.includes(`"${secret}"`)
  )
}

const wallView = (wall: Peer<WallServerMessage>) => {
  for (const { message } of wall.frames.toReversed()) {
    if (message.type === 'room.updated' || message.type === 'welcome') {
      return message.view
    }
  }

  return null
}

let harness: RoomHarness

beforeEach(async () => {
  harness = await startRoomHarness()
})

afterEach(async () => {
  await harness.stop()
})

const pairedWall = async ({
  code,
  hostToken
}: {
  code: string
  hostToken: HostToken
}): Promise<Peer<WallServerMessage>> => {
  const wall = await harness.connect(code, wallServerMessageSchema)

  wall.send({
    hostToken,
    protocolVersion: PROTOCOL_VERSION,
    role: 'wall',
    type: 'hello'
  })
  await waitFor(() => wallView(wall) !== null, 'the wall to be welcomed')

  return wall
}

const roundInPlay = async ({
  hostNickname,
  settings = BLACK_SQUARE
}: {
  /** Seats the console under this name. */
  hostNickname?: string
  settings?: RoomSettings
} = {}) => {
  const { code, host, hostToken } = await harness.openRoom(
    settings,
    hostNickname
  )
  const wall = await pairedWall({ code, hostToken })
  const zoe = await harness.seat({ code, nickname: 'Zoe' })
  const max = await harness.seat({ code, nickname: 'Max' })

  host.send({ type: 'host.startRound' })
  await waitFor(() => playerView(zoe)?.phase === 'playing', 'the theme')

  const roundId = playerView(zoe)?.round?.id ?? ''
  const type = (seat: typeof zoe, guess: string) =>
    seat.send({
      answer: { guess, kind: 'typed' },
      roundId,
      type: 'player.answer'
    })

  return { host, max, roundId, type, wall, zoe }
}

describe('a black-square round through the seam', () => {
  it('[blacksquare] shows the theme everywhere, and the nine with their tiers to the console alone', async () => {
    const { host, wall, zoe } = await roundInPlay()

    expect(blackSquareRound(playerView(zoe))).toEqual({
      cellTiers: [1, 1, 2, 2, 2, 2, 2, 3, 3],
      foundCellCount: 0,
      kind: 'blacksquare',
      revealed: null,
      spoken: null,
      theme: THEME.labels,
      yourLines: []
    })
    expect(wallView(wall)?.currentContent).toEqual({ kind: 'blacksquare' })

    const console = hostView(host)?.currentContent
    const grid = console?.kind === 'blacksquare' ? console.grid : null

    expect(
      grid?.answers.map(({ labels, tier }) => `${labels.en} ${tier}`)
    ).toEqual([
      'Mercury 1',
      'Venus 1',
      'Earth 2',
      'Mars 2',
      'Jupiter 2',
      'Saturn 2',
      'Uranus 2',
      'Neptune 3',
      'Ceres 3'
    ])
    expect(grid?.blackWord.why).toEqual(THEME.blackWord.why)
    expect(JSON.stringify(console)).not.toContain('planet"')
  })

  it('[blacksquare] lights a hit on its own seat alone, and keeps the round going', async () => {
    const { max, type, zoe } = await roundInPlay()

    type(zoe, 'jupiter')
    type(zoe, 'La Ceres')
    await waitFor(
      () => blackSquareRound(playerView(max))?.foundCellCount === 2,
      'two cells found'
    )

    expect(playerView(zoe)?.yourVerdict).toEqual({
      cellTiers: [1, 1, 2, 2, 2, 2, 2, 3, 3],
      foundCells: [4, 8],
      hitBlackWord: false,
      kind: 'cells'
    })
    expect(playerView(max)?.yourVerdict).toBeNull()
    expect(playerView(zoe)?.phase).toBe('playing')
  })

  it('[blacksquare] reads a seat its own lines back, a miss giving way to the next', async () => {
    const { max, type, zoe } = await roundInPlay()

    type(zoe, 'Not a planet')
    type(zoe, 'jupiter')
    type(zoe, 'Still not one')
    type(zoe, 'Nor this')
    type(max, 'Venus')
    await waitFor(
      () => blackSquareRound(playerView(zoe))?.foundCellCount === 2,
      'two cells found'
    )
    await waitFor(
      () =>
        blackSquareRound(playerView(zoe))?.yourLines?.at(-1)?.line ===
        'Nor this',
      'the last miss read back'
    )

    expect(blackSquareRound(playerView(zoe))?.yourLines).toEqual([
      { cells: [4], hitBlackWord: false, line: 'jupiter' },
      { cells: [], hitBlackWord: false, line: 'Nor this' }
    ])
    expect(blackSquareRound(playerView(max))?.yourLines).toEqual([
      { cells: [1], hitBlackWord: false, line: 'Venus' }
    ])
  })

  it('[blacksquare] closes and voids a sheet on the black word', async () => {
    const { host, max, roundId, type, zoe } = await roundInPlay()

    type(zoe, 'Neptune')
    type(zoe, 'pluto')
    await waitFor(() => {
      const sheet = playerView(zoe)?.yourVerdict

      return sheet?.kind === 'cells' && sheet.hitBlackWord
    }, 'the black word')
    type(zoe, 'Mars')
    await waitFor(() => errorsIn(zoe).length === 1, 'the line refused')
    type(max, 'Earth')
    await waitFor(
      () => playerView(max)?.yourVerdict?.kind === 'cells',
      'a hit for Max'
    )
    host.send({ roundId, type: 'host.reveal' })
    await waitFor(() => hostView(host)?.phase === 'revealed', 'the reveal')

    const view = hostView(host)
    const zoeId = playerView(zoe)?.youId
    const maxId = playerView(max)?.youId
    const awardOf = (playerId: string | undefined) =>
      view?.round?.awards.find((award) => award.playerId === playerId)

    expect(errorsIn(zoe).map(({ code }) => code)).toEqual(['already_buzzed'])
    expect(awardOf(zoeId)?.points).toBe(0)
    expect(awardOf(maxId)).toMatchObject({
      points: sheetPays({ found: 2 }),
      speedBonus: 0
    })
  })

  it('[blacksquare] deals five mixed in tier when the host asks for five, and closes the sheet on them', async () => {
    const { host, max, type, wall, zoe } = await roundInPlay({
      settings: {
        ...BLACK_SQUARE,
        game: { ...DEFAULT_BLACK_SQUARE_SETTINGS, answerCount: 5 }
      }
    })

    const console = hostView(host)?.currentContent
    const grid = console?.kind === 'blacksquare' ? console.grid : null

    expect(blackSquareRound(playerView(zoe))?.cellTiers).toEqual([
      1, 2, 2, 2, 3
    ])
    expect(
      grid?.answers.map(({ labels, tier }) => `${labels.en} ${tier}`)
    ).toEqual(['Mercury 1', 'Earth 2', 'Mars 2', 'Jupiter 2', 'Neptune 3'])

    type(zoe, 'Ceres')
    for (const name of ['Mercury', 'Earth', 'Mars', 'Jupiter', 'Neptune']) {
      type(zoe, name)
    }
    type(max, 'Pluto')
    await waitFor(() => hostView(host)?.phase === 'revealed', 'the reveal')

    expect(playerView(zoe)?.yourVerdict).toMatchObject({
      cellTiers: [1, 2, 2, 2, 3],
      foundCells: [0, 1, 2, 3, 4]
    })
    expect(transcriptOf(wall)).not.toContain('"Saturn"')
    expect(transcriptOf(host)).not.toContain('"Saturn"')
  })

  it('[blacksquare] pays each cell its tier, with no speed bonus', async () => {
    const { host, roundId, type, zoe } = await roundInPlay()

    for (const name of ['Mercury', 'Mars', 'Uranus', 'Neptune']) {
      type(zoe, name)
    }
    await waitFor(
      () => blackSquareRound(playerView(zoe))?.foundCellCount === 4,
      'four cells found'
    )
    host.send({ roundId, type: 'host.reveal' })
    await waitFor(() => hostView(host)?.phase === 'revealed', 'the reveal')

    expect(
      hostView(host)?.round?.awards.find(
        (award) => award.playerId === playerView(zoe)?.youId
      )
    ).toMatchObject({
      points: sheetPays({ found: 1 + 2 + 2 + 3 }),
      speedBonus: 0
    })
  })

  it('[blacksquare] pays double a cell one seat alone found, when the room plays nobody else had it', async () => {
    const { host, max, roundId, type, zoe } = await roundInPlay({
      settings: {
        ...BLACK_SQUARE,
        game: {
          ...DEFAULT_BLACK_SQUARE_SETTINGS,
          answerCount: 9,
          doublesLoneFinds: true
        }
      }
    })

    type(zoe, 'Mercury')
    type(zoe, 'Neptune')
    type(max, 'Mercury')
    await waitFor(
      () =>
        blackSquareRound(playerView(zoe))?.foundCellCount === 2 &&
        blackSquareRound(playerView(max))?.yourLines?.length === 1,
      'both sheets banked'
    )
    host.send({ roundId, type: 'host.reveal' })
    await waitFor(() => hostView(host)?.phase === 'revealed', 'the reveal')

    const pointsOf = (seat: typeof zoe) =>
      hostView(host)?.round?.awards.find(
        (award) => award.playerId === playerView(seat)?.youId
      )?.points

    // Neptune, found by Zoe alone, weighs double on her sheet, found and
    // whole alike; Max's sheet, which never held it, is a share of the plain
    // weight. Mercury, which both found, weighs single for both.
    expect(pointsOf(zoe)).toBe(
      sheetPays({ found: 1 + 2 * 3, outOf: FULL_SHEET_WEIGHT + 3 })
    )
    expect(pointsOf(max)).toBe(
      sheetPays({ found: 1, outOf: FULL_SHEET_WEIGHT })
    )
    expect(blackSquareRound(hostView(host))?.revealed?.doublesLoneFinds).toBe(
      true
    )
  })

  it('[blacksquare] tells a player and the wall no answer the seat never typed, then reveals the grid', async () => {
    const { host, max, roundId, type, wall, zoe } = await roundInPlay()

    type(zoe, 'Venus')
    type(max, 'Saturn planet')
    type(max, 'Not a planet at all')
    await waitFor(
      () => blackSquareRound(playerView(zoe))?.foundCellCount === 2,
      'two cells found'
    )

    expect(leakedIn({ peer: zoe, typed: ['Venus'] })).toEqual([])
    expect(leakedIn({ peer: max, typed: ['Saturn planet'] })).toEqual([])
    expect(leakedIn({ peer: wall, typed: [] })).toEqual([])

    host.send({ roundId, type: 'host.reveal' })
    await waitFor(() => playerView(zoe)?.phase === 'revealed', 'the reveal')

    const revealed = blackSquareRound(playerView(zoe))?.revealed

    expect(revealed?.answers[1]?.foundBy).toEqual([playerView(zoe)?.youId])
    expect(revealed?.answers[5]?.foundBy).toEqual([playerView(max)?.youId])
    expect(revealed?.answers[0]?.foundBy).toEqual([])
    expect(revealed?.blackWord).toEqual({
      hitBy: [],
      labels: THEME.blackWord.labels,
      why: THEME.blackWord.why
    })
  })

  it('[blacksquare] hands a seated console no grid until the reveal', async () => {
    const { host } = await roundInPlay({ hostNickname: 'Marina' })

    expect(hostView(host)?.youId).not.toBeNull()
    expect(hostView(host)?.currentContent).toEqual({
      grid: null,
      kind: 'blacksquare'
    })
    expect(leakedIn({ peer: host, typed: [] })).toEqual([])
  })

  it('[blacksquare] says so when every theme has been dealt', async () => {
    const { host, roundId } = await roundInPlay()

    host.send({ roundId, type: 'host.reveal' })
    await waitFor(() => hostView(host)?.phase === 'revealed', 'the reveal')
    host.send({ type: 'host.nextRound' })
    await waitFor(() => errorsIn(host).length > 0, 'the spent bank')

    expect(errorsIn(host).map(({ code }) => code)).toContain(
      'no_content_available'
    )
  })
})

const SPOKEN: RoomSettings = {
  ...BLACK_SQUARE,
  mode: DEFAULT_MODE_SETTINGS.spoken,
  teams: { count: 2, kind: 'chosen' }
}

/** Anna and Ben guess for the first team; Carl, alone in the second, keeps the list. */
const spokenRoundInPlay = async ({
  answerCount = 9
}: {
  answerCount?: number
} = {}) => {
  const { code, host, hostToken } = await harness.openRoom({
    ...SPOKEN,
    game: { ...DEFAULT_BLACK_SQUARE_SETTINGS, answerCount }
  })
  const wall = await pairedWall({ code, hostToken })
  const anna = await harness.seat({ code, nickname: 'Anna' })
  const ben = await harness.seat({ code, nickname: 'Ben' })
  const carl = await harness.seat({ code, nickname: 'Carl' })

  anna.send({ teamId: 'team-1', type: 'player.chooseTeam' })
  ben.send({ teamId: 'team-1', type: 'player.chooseTeam' })
  carl.send({ teamId: 'team-2', type: 'player.chooseTeam' })
  await waitFor(
    () => hostView(host)?.teams[1]?.seatIds.length === 1,
    'the teams picked'
  )
  host.send({ type: 'host.startRound' })
  await waitFor(() => playerView(carl)?.phase === 'playing', 'the theme')

  const roundId = playerView(carl)?.round?.id ?? ''
  const tick = (
    seat: typeof carl,
    cell: number | 'blackWord',
    isTicked = true
  ) => seat.send({ cell, isTicked, roundId, type: 'blacksquare.tick' })

  return { anna, ben, carl, host, roundId, tick, wall }
}

describe('a spoken black-square round through the seam', () => {
  it('[blacksquare] hands the list to the keeper alone, never to the guessing team', async () => {
    const { anna, ben, carl, wall } = await spokenRoundInPlay()

    const spoken = blackSquareRound(playerView(carl))?.spoken

    expect(spoken?.guessingTeamId).toBe('team-1')
    expect(spoken?.keeperId).toBe(playerView(carl)?.youId)
    expect(spoken?.list?.answers.map(({ labels }) => labels.en)).toEqual(
      ANSWER_NAMES
    )
    expect(spoken?.list?.blackWord.why).toEqual(THEME.blackWord.why)
    expect(blackSquareRound(playerView(anna))?.spoken?.list).toBeNull()
    expect(leakedIn({ peer: anna, typed: [] })).toEqual([])
    expect(leakedIn({ peer: ben, typed: [] })).toEqual([])
    expect(leakedIn({ peer: wall, typed: [] })).toEqual([])
  })

  it('[blacksquare] takes the list back from a keeper moved into the guessing team', async () => {
    const { carl, host, tick } = await spokenRoundInPlay()

    host.send({
      playerId: playerView(carl)?.youId ?? '',
      teamId: 'team-1',
      type: 'host.moveSeat'
    })
    await waitFor(
      () => blackSquareRound(playerView(carl))?.spoken?.list === null,
      'the list taken back'
    )
    tick(carl, 0)
    await waitFor(() => errorsIn(carl).length > 0, 'the tick refused')

    expect(errorsIn(carl).map(({ code }) => code)).toEqual(['not_your_turn'])
  })

  it('[blacksquare] lets the keeper alone tick, and pays the guessing team once at the reveal', async () => {
    const { anna, ben, carl, host, roundId, tick } = await spokenRoundInPlay()

    tick(anna, 0)
    anna.send({
      answer: { guess: 'Mercury', kind: 'typed' },
      roundId,
      type: 'player.answer'
    })
    await waitFor(() => errorsIn(anna).length === 2, 'both refused')
    tick(carl, 0)
    tick(carl, 3)
    tick(carl, 6)
    tick(carl, 1)
    tick(carl, 1, false)
    await waitFor(
      () =>
        blackSquareRound(playerView(anna))?.spoken?.tickedCells.join() ===
        '0,3,6',
      'three ticks seen by the guessers'
    )
    host.send({ roundId, type: 'host.reveal' })
    await waitFor(() => hostView(host)?.phase === 'revealed', 'the reveal')

    const view = hostView(host)
    const revealed = blackSquareRound(playerView(carl))?.revealed

    expect(errorsIn(anna).map(({ code }) => code)).toEqual([
      'not_your_turn',
      'invalid_message'
    ])
    expect(
      view?.round?.awards.map(({ playerId, points }) => [playerId, points])
    ).toEqual([
      [playerView(anna)?.youId, sheetPays({ found: 1 + 2 + 2 })],
      [playerView(ben)?.youId, sheetPays({ found: 1 + 2 + 2 })]
    ])
    expect(view?.teams.map(({ score }) => score)).toEqual([
      sheetPays({ found: 1 + 2 + 2 }),
      0
    ])
    expect(revealed?.answers[3]?.foundBy).toEqual([
      playerView(anna)?.youId,
      playerView(ben)?.youId
    ])
    expect(revealed?.answers[1]?.foundBy).toEqual([])
  })

  it('[blacksquare] refuses a tick past the answers the round dealt', async () => {
    const { carl, host, tick } = await spokenRoundInPlay({ answerCount: 3 })

    tick(carl, 5)
    await waitFor(() => errorsIn(carl).length > 0, 'the tick refused')
    tick(carl, 0)
    tick(carl, 1)
    tick(carl, 2)
    await waitFor(() => hostView(host)?.phase === 'revealed', 'the reveal')

    expect(errorsIn(carl).map(({ code }) => code)).toEqual(['invalid_message'])
    expect(hostView(host)?.teams.map(({ score }) => score)).toEqual([
      MOST_A_ROUND_PAYS,
      0
    ])
  })

  it('[blacksquare] ends and voids the round on the black word ticked', async () => {
    const { carl, host, tick } = await spokenRoundInPlay()

    tick(carl, 8)
    tick(carl, 'blackWord')
    await waitFor(() => hostView(host)?.phase === 'revealed', 'the reveal')

    expect(hostView(host)?.teams.map(({ score }) => score)).toEqual([0, 0])
    expect(
      blackSquareRound(playerView(carl))?.revealed?.blackWord.hitBy
    ).toHaveLength(2)
  })

  it('[blacksquare] refuses a spoken room without teams', async () => {
    const { host } = await harness.openRoom(BLACK_SQUARE)

    host.send({
      settings: { ...BLACK_SQUARE, mode: DEFAULT_MODE_SETTINGS.spoken },
      type: 'host.updateSettings'
    })
    await waitFor(() => errorsIn(host).length > 0, 'the refusal')

    expect(hostView(host)?.settings.mode.kind).toBe('typed')
  })

  it('[blacksquare] opens no spoken round while one team holds every seat', async () => {
    const { code, host } = await harness.openRoom(SPOKEN)
    const anna = await harness.seat({ code, nickname: 'Anna' })
    const ben = await harness.seat({ code, nickname: 'Ben' })

    anna.send({ teamId: 'team-1', type: 'player.chooseTeam' })
    ben.send({ teamId: 'team-1', type: 'player.chooseTeam' })
    await waitFor(
      () => hostView(host)?.teams[0]?.seatIds.length === 2,
      'one team holding both'
    )
    host.send({ type: 'host.startRound' })
    await waitFor(() => errorsIn(host).length > 0, 'the refusal')

    expect(errorsIn(host).map(({ code }) => code)).toEqual([
      'spoken_needs_two_teams'
    ])
    expect(hostView(host)?.phase).toBe('lobby')
  })
})
