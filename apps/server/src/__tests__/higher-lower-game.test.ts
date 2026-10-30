import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_HIGHER_LOWER_SETTINGS } from '@melee/protocol/game'
import type {
  HigherLowerPicks,
  HigherLowerSide
} from '@melee/protocol/higher-lower'
import type { HostToken } from '@melee/protocol/identifiers'
import {
  DEFAULT_MODE_SETTINGS,
  DEFAULT_ROOM_SETTINGS,
  type RoomSettings,
  type RoundContent,
  type RoundView
} from '@melee/protocol/room'
import { MOST_A_SPEED_BONUS_PAYS, POINT } from '@melee/protocol/scoring'
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

/** Distinctive enough that a raw frame carrying one can only be carrying an answer. */
const VALUES = [111_111_111]

/** The higher side of each pair, as the mocked deal puts it. */
const RIGHT: HigherLowerPicks = ['left']

const sideRow = (name: string, value: number) => ({
  entity: name,
  family: 'length.river' as const,
  isWellKnown: true,
  names: { en: name, fr: name },
  value
})

vi.mock('@/infrastructure/questions/quantity-bank', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/infrastructure/questions/quantity-bank')
  >()),
  drawPairs: () =>
    VALUES.map((value, index) => {
      const higher = sideRow(`High${index}`, value)
      const lower = sideRow(`Low${index}`, value / 2 + 7)

      return RIGHT[index] === 'left'
        ? { left: higher, right: lower }
        : { left: lower, right: higher }
    })
}))

const HIGHER_LOWER: RoomSettings = {
  ...DEFAULT_ROOM_SETTINGS,
  countdownMs: 20,
  game: DEFAULT_HIGHER_LOWER_SETTINGS,
  mode: DEFAULT_MODE_SETTINGS.pairs,
  roundCount: 3
}

const pairsRound = (
  view: { round: RoundView | null } | null
): Extract<RoundContent, { kind: 'higherlower' }> | null => {
  const content = view?.round?.content

  return content?.kind === 'higherlower' ? content : null
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
  const { code, host, hostToken } = await harness.openRoom(HIGHER_LOWER)
  const wall = await pairedWall({ code, hostToken })
  const zoe = await harness.seat({ code, nickname: 'Zoe' })
  const max = await harness.seat({ code, nickname: 'Max' })
  const lou = await harness.seat({ code, nickname: 'Lou' })

  host.send({ type: 'host.startRound' })
  await waitFor(
    () => playerView(zoe)?.phase === 'playing',
    'the pairs to go up'
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

const sendSheet = ({
  picks,
  roundId,
  seat
}: {
  picks: HigherLowerSide[]
  roundId: string
  seat: Peer<PlayerServerMessage>
}) =>
  seat.send({
    answer: { kind: 'pairs', picks },
    roundId,
    type: 'player.answer'
  })

const flipped = (picks: HigherLowerPicks): HigherLowerPicks =>
  picks.map((side) => (side === 'left' ? 'right' : 'left'))

describe('a higher-or-lower round through the seam', () => {
  it('[higherlower] deals every seat its pair without a value, and hands the values to the console alone', async () => {
    const { host, wall, zoe } = await roundInPlay()
    const round = pairsRound(playerView(zoe))

    expect(round?.pairs).toHaveLength(1)
    expect(round?.pairs[0]).toEqual({
      family: 'length.river',
      left: { en: 'High0', fr: 'High0' },
      right: { en: 'Low0', fr: 'Low0' }
    })
    expect(round?.revealedPairs).toBeNull()
    expect(round?.revealedSheets).toBeNull()
    expect(round?.yourPicks).toBeNull()

    const console = hostView(host)?.currentContent

    expect(console?.kind === 'higherlower' && console.valuedPairs?.[0]).toEqual(
      {
        family: 'length.river',
        left: { en: 'High0', fr: 'High0' },
        leftValue: VALUES[0],
        right: { en: 'Low0', fr: 'Low0' },
        rightValue: (VALUES[0] ?? 0) / 2 + 7
      }
    )
    expect(wallView(wall)?.currentContent).toEqual({ kind: 'higherlower' })
  })

  it('[higherlower] sends no frame carrying a value, another seat’s picks or a verdict before the reveal, to a seat or the wall', async () => {
    const { lou, max, roundId, wall, zoe } = await roundInPlay()

    sendSheet({ picks: RIGHT, roundId, seat: max })
    await waitFor(
      () => pairsRound(playerView(max))?.yourPicks !== null,
      'the sheet to land'
    )

    for (const seat of [zoe, lou, max, wall]) {
      for (const value of VALUES) {
        expect(transcriptOf(seat.frames)).not.toContain(String(value))
      }
    }
    for (const seat of [zoe, lou]) {
      expect(transcriptOf(seat.frames)).not.toContain('picks')
    }
    expect(playerView(max)?.yourVerdict ?? null).toBeNull()
  })

  it('[higherlower] refuses a pick too many, and a second sheet', async () => {
    const { roundId, zoe } = await roundInPlay()

    sendSheet({ picks: [...RIGHT, ...RIGHT], roundId, seat: zoe })
    await waitFor(() => errorsIn(zoe).length === 1, 'two picks refused')
    sendSheet({ picks: RIGHT, roundId, seat: zoe })
    await waitFor(
      () => pairsRound(playerView(zoe))?.yourPicks !== null,
      'the sheet to land'
    )
    sendSheet({ picks: flipped(RIGHT), roundId, seat: zoe })
    await waitFor(() => errorsIn(zoe).length === 2, 'the second sheet refused')

    expect(errorsIn(zoe).map(({ code }) => code)).toEqual([
      'invalid_message',
      'already_buzzed'
    ])
    expect(pairsRound(playerView(zoe))?.yourPicks).toEqual(RIGHT)
  })

  it('[higherlower] pays a right pick with the clock on top, and reveals both values with every sheet', async () => {
    const { host, lou, max, roundId, zoe } = await roundInPlay()

    sendSheet({ picks: RIGHT, roundId, seat: zoe })
    sendSheet({ picks: flipped(RIGHT), roundId, seat: max })
    sendSheet({ picks: flipped(RIGHT), roundId, seat: lou })
    await waitFor(() => playerView(zoe)?.phase === 'revealed', 'the reveal')

    const view = hostView(host)
    const idOf = (seat: Peer<PlayerServerMessage>) =>
      playerView(seat)?.youId ?? null
    const awardOf = (seat: Peer<PlayerServerMessage>) =>
      view?.round?.awards.find((award) => award.playerId === idOf(seat))

    expect(basePointsFor({ playerId: idOf(zoe), view })).toBe(POINT)
    expect(awardOf(max)?.points ?? 0).toBe(0)
    expect(awardOf(lou)?.points ?? 0).toBe(0)
    expect(awardOf(zoe)?.verdict).toEqual({ kind: 'pairs', rightPairs: 1 })
    expect(awardOf(zoe)?.speedBonus).toBeGreaterThan(0)
    expect(awardOf(zoe)?.speedBonus).toBeLessThanOrEqual(
      MOST_A_SPEED_BONUS_PAYS
    )

    const revealed = pairsRound(playerView(lou))

    expect(
      revealed?.revealedPairs?.map(({ leftValue }) => leftValue)
    ).toHaveLength(1)
    expect(
      revealed?.revealedSheets?.find(({ playerId }) => playerId === idOf(max))
        ?.picks
    ).toEqual(flipped(RIGHT))
  })
})
