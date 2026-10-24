import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_GUESS_NINE_SETTINGS } from '@melee/protocol/game'
import type { HostToken } from '@melee/protocol/identifiers'
import {
  DEFAULT_MODE_SETTINGS,
  DEFAULT_ROOM_SETTINGS,
  type RoomSettings,
  type RoundContent,
  type RoundView
} from '@melee/protocol/room'
import { POINT } from '@melee/protocol/scoring'
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

const THEME = {
  answers: ANSWER_NAMES.map(named),
  blackWord: {
    ...named('Pluto'),
    why: { en: 'A dwarf planet since 2006', fr: 'Dwarf planet, in French' }
  },
  id: 'planets',
  labels: { en: 'The planets', fr: 'The planets, in French' }
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

vi.mock('@/infrastructure/questions/guess-nine-bank', () => ({
  drawGuessNineTheme: ({ playedIds }: { playedIds: ReadonlySet<string> }) =>
    playedIds.has('guessnine:planets') ? null : THEME,
  playedGuessNineThemeId: (id: string) => `guessnine:${id}`
}))

const GUESS_NINE: RoomSettings = {
  ...DEFAULT_ROOM_SETTINGS,
  countdownMs: 20,
  game: DEFAULT_GUESS_NINE_SETTINGS,
  mode: DEFAULT_MODE_SETTINGS.typed,
  roundCount: 3
}

const guessNineRound = (
  view: { round: RoundView | null } | null
): Extract<RoundContent, { kind: 'guessnine' }> | null => {
  const content = view?.round?.content

  return content?.kind === 'guessnine' ? content : null
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

const roundInPlay = async (hostNickname?: string) => {
  const { code, host, hostToken } = await harness.openRoom(
    GUESS_NINE,
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

describe('a guess-nine round through the seam', () => {
  it('[guessnine] shows the theme everywhere, and the nine with their tiers to the console alone', async () => {
    const { host, wall, zoe } = await roundInPlay()

    expect(guessNineRound(playerView(zoe))).toEqual({
      foundCellCount: 0,
      kind: 'guessnine',
      revealed: null,
      theme: THEME.labels
    })
    expect(wallView(wall)?.currentContent).toEqual({ kind: 'guessnine' })

    const console = hostView(host)?.currentContent
    const grid = console?.kind === 'guessnine' ? console.grid : null

    expect(
      grid?.answers.map(({ labels, tier }) => `${labels.en} ${tier}`)
    ).toEqual([
      'Mercury 1',
      'Venus 1',
      'Earth 1',
      'Mars 2',
      'Jupiter 2',
      'Saturn 2',
      'Uranus 3',
      'Neptune 3',
      'Ceres 3'
    ])
    expect(grid?.blackWord.why).toEqual(THEME.blackWord.why)
    expect(JSON.stringify(console)).not.toContain('planet"')
  })

  it('[guessnine] lights a hit on its own seat alone, and keeps the round going', async () => {
    const { max, type, zoe } = await roundInPlay()

    type(zoe, 'jupiter')
    type(zoe, 'La Ceres')
    await waitFor(
      () => guessNineRound(playerView(max))?.foundCellCount === 2,
      'two cells found'
    )

    expect(playerView(zoe)?.yourVerdict).toEqual({
      foundCells: [4, 8],
      hitBlackWord: false,
      kind: 'cells'
    })
    expect(playerView(max)?.yourVerdict).toBeNull()
    expect(playerView(zoe)?.phase).toBe('playing')
  })

  it('[guessnine] closes and voids a sheet on the black word', async () => {
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
    expect(awardOf(maxId)).toMatchObject({ points: POINT, speedBonus: 0 })
  })

  it('[guessnine] pays each cell its tier, with no speed bonus', async () => {
    const { host, roundId, type, zoe } = await roundInPlay()

    for (const name of ['Mercury', 'Mars', 'Uranus', 'Neptune']) {
      type(zoe, name)
    }
    await waitFor(
      () => guessNineRound(playerView(zoe))?.foundCellCount === 4,
      'four cells found'
    )
    host.send({ roundId, type: 'host.reveal' })
    await waitFor(() => hostView(host)?.phase === 'revealed', 'the reveal')

    expect(
      hostView(host)?.round?.awards.find(
        (award) => award.playerId === playerView(zoe)?.youId
      )
    ).toMatchObject({ points: 9 * POINT, speedBonus: 0 })
  })

  it('[guessnine] tells a player and the wall no answer the seat never typed, then reveals the grid', async () => {
    const { host, max, roundId, type, wall, zoe } = await roundInPlay()

    type(zoe, 'Venus')
    type(max, 'Saturn planet')
    type(max, 'Not a planet at all')
    await waitFor(
      () => guessNineRound(playerView(zoe))?.foundCellCount === 2,
      'two cells found'
    )

    expect(leakedIn({ peer: zoe, typed: ['Venus'] })).toEqual([])
    expect(leakedIn({ peer: max, typed: ['Saturn planet'] })).toEqual([])
    expect(leakedIn({ peer: wall, typed: [] })).toEqual([])

    host.send({ roundId, type: 'host.reveal' })
    await waitFor(() => playerView(zoe)?.phase === 'revealed', 'the reveal')

    const revealed = guessNineRound(playerView(zoe))?.revealed

    expect(revealed?.answers[1]?.foundBy).toEqual([playerView(zoe)?.youId])
    expect(revealed?.answers[5]?.foundBy).toEqual([playerView(max)?.youId])
    expect(revealed?.answers[0]?.foundBy).toEqual([])
    expect(revealed?.blackWord).toEqual({
      hitBy: [],
      labels: THEME.blackWord.labels,
      why: THEME.blackWord.why
    })
  })

  it('[guessnine] hands a seated console no grid until the reveal', async () => {
    const { host } = await roundInPlay('Marina')

    expect(hostView(host)?.youId).not.toBeNull()
    expect(hostView(host)?.currentContent).toEqual({
      grid: null,
      kind: 'guessnine'
    })
    expect(leakedIn({ peer: host, typed: [] })).toEqual([])
  })

  it('[guessnine] says so when every theme has been dealt', async () => {
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
