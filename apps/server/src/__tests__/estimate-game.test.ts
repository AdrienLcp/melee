import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_ESTIMATE_SETTINGS } from '@melee/protocol/game'
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
  type PlayerServerMessage,
  type WallServerMessage,
  wallServerMessageSchema
} from '@melee/protocol/server-message'
import { PROTOCOL_VERSION } from '@melee/protocol/version'

import { startRoomHarness } from './node-room-harness'
import {
  basePointsFor,
  errorsIn,
  hostView,
  type Peer,
  playerView,
  type RoomHarness,
  waitFor
} from './room-harness'

/** Distinctive enough that a raw frame carrying it can only be carrying the answer. */
const TRUTH = 123_456_789

const NAMES = { en: 'Atlantis', fr: 'Atlantis' }

vi.mock('@/infrastructure/questions/quantity-bank', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/infrastructure/questions/quantity-bank')
  >()),
  drawQuantity: () => ({
    entity: 'Q0',
    family: 'population.country',
    isWellKnown: true,
    names: NAMES,
    value: TRUTH
  })
}))

const ESTIMATE: RoomSettings = {
  ...DEFAULT_ROOM_SETTINGS,
  countdownMs: 20,
  game: DEFAULT_ESTIMATE_SETTINGS,
  mode: DEFAULT_MODE_SETTINGS.number,
  roundCount: 3
}

const estimateRound = (
  view: { round: RoundView | null } | null
): Extract<RoundContent, { kind: 'estimate' }> | null => {
  const content = view?.round?.content

  return content?.kind === 'estimate' ? content : null
}

const transcriptOf = (frames: { raw: string }[]): string =>
  frames.map(({ raw }) => raw).join('')

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

const roundInPlay = async () => {
  const { code, host, hostToken } = await harness.openRoom(ESTIMATE)
  const wall = await pairedWall({ code, hostToken })
  const zoe = await harness.seat({ code, nickname: 'Zoe' })
  const max = await harness.seat({ code, nickname: 'Max' })
  const lou = await harness.seat({ code, nickname: 'Lou' })

  host.send({ type: 'host.startRound' })
  await waitFor(
    () => playerView(zoe)?.phase === 'playing',
    'the question to go up'
  )

  return {
    host,
    lou,
    max,
    roundId: playerView(zoe)?.round?.id ?? '',
    wall,
    zoe
  }
}

const guess = ({
  roundId,
  seat,
  value
}: {
  roundId: string
  seat: Peer<PlayerServerMessage>
  value: number
}) =>
  seat.send({
    answer: { guess: value, kind: 'number' },
    roundId,
    type: 'player.answer'
  })

describe('an estimate round through the seam', () => {
  it('[estimate] asks every seat the question and hands the value to the console alone', async () => {
    const { host, wall, zoe } = await roundInPlay()
    const round = estimateRound(playerView(zoe))

    expect(round?.question).toEqual({
      family: 'population.country',
      names: NAMES
    })
    expect(round?.value).toBeNull()
    expect(round?.revealedGuesses).toBeNull()
    expect(round?.yourGuess).toBeNull()
    expect(hostView(host)?.currentContent).toEqual({
      kind: 'estimate',
      value: TRUTH
    })
    expect(wallView(wall)?.currentContent).toEqual({ kind: 'estimate' })
  })

  it('[estimate] sends no frame carrying the value or another seat’s guess before the reveal, to a seat or the wall', async () => {
    const { lou, max, roundId, wall, zoe } = await roundInPlay()

    guess({ roundId, seat: max, value: 777_000_001 })
    await waitFor(
      () => estimateRound(playerView(max))?.yourGuess === 777_000_001,
      'the guess to land'
    )

    for (const seat of [zoe, lou]) {
      expect(transcriptOf(seat.frames)).not.toContain(String(TRUTH))
      expect(transcriptOf(seat.frames)).not.toContain('777000001')
    }
    expect(transcriptOf(max.frames)).not.toContain(String(TRUTH))
    expect(transcriptOf(wall.frames)).not.toContain(String(TRUTH))
    expect(transcriptOf(wall.frames)).not.toContain('777000001')
  })

  it('[estimate] refuses a second guess and a guess of nought', async () => {
    const { roundId, zoe } = await roundInPlay()

    guess({ roundId, seat: zoe, value: 0 })
    await waitFor(() => errorsIn(zoe).length === 1, 'nought refused')
    guess({ roundId, seat: zoe, value: 100 })
    await waitFor(
      () => estimateRound(playerView(zoe))?.yourGuess === 100,
      'the guess to land'
    )
    guess({ roundId, seat: zoe, value: 200 })
    await waitFor(() => errorsIn(zoe).length === 2, 'the second guess refused')

    expect(errorsIn(zoe).map(({ code }) => code)).toEqual([
      'invalid_message',
      'already_buzzed'
    ])
    expect(estimateRound(playerView(zoe))?.yourGuess).toBe(100)
  })

  it('[estimate] pays the closest three by place with no speed bonus, and nothing ten times off even with a place free', async () => {
    const { host, lou, max, roundId, zoe } = await roundInPlay()

    guess({ roundId, seat: zoe, value: TRUTH * 1.01 })
    guess({ roundId, seat: max, value: TRUTH / 2 })
    guess({ roundId, seat: lou, value: TRUTH * 11 })
    await waitFor(() => playerView(zoe)?.phase === 'revealed', 'the reveal')

    const view = hostView(host)
    const idOf = (seat: Peer<PlayerServerMessage>) =>
      playerView(seat)?.youId ?? null
    const awardOf = (seat: Peer<PlayerServerMessage>) =>
      view?.round?.awards.find((award) => award.playerId === idOf(seat))

    expect(basePointsFor({ playerId: idOf(zoe), view })).toBe(3 * POINT)
    expect(basePointsFor({ playerId: idOf(max), view })).toBe(2 * POINT)
    expect(basePointsFor({ playerId: idOf(lou), view })).toBe(0)
    expect(awardOf(zoe)?.verdict).toMatchObject({
      kind: 'number',
      placesFromBest: 0
    })
    expect(awardOf(lou)?.verdict).toMatchObject({ placesFromBest: null })
    expect([zoe, max, lou].map((seat) => awardOf(seat)?.speedBonus)).toEqual([
      0, 0, 0
    ])

    const revealed = estimateRound(playerView(lou))

    expect(revealed?.value).toBe(TRUTH)
    expect(
      revealed?.revealedGuesses?.map(({ guess }) => guess).toSorted()
    ).toEqual([TRUTH * 1.01, TRUTH / 2, TRUTH * 11].toSorted())
  })
})
