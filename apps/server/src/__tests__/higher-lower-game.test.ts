import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { HigherLowerDeckItem } from '@melee/protocol/deck'
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
import { MOST_A_ROUND_PAYS, MOST_THE_CLOCK_PAYS } from '@melee/protocol/scoring'
import {
  type PlayerServerMessage,
  type WallServerMessage,
  wallServerMessageSchema
} from '@melee/protocol/server-message'
import { PROTOCOL_VERSION } from '@melee/protocol/version'

import { startRoomHarness } from './node-room-harness'
import {
  answerShareOf,
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

const roundInPlay = async (settings: RoomSettings = HIGHER_LOWER) => {
  const { code, host, hostToken } = await harness.openRoom(settings)
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
      ask: { family: 'length.river', kind: 'bank' },
      left: { en: 'High0', fr: 'High0' },
      right: { en: 'Low0', fr: 'Low0' }
    })
    expect(round?.revealedPairs).toBeNull()
    expect(round?.revealedSheets).toBeNull()
    expect(round?.yourPicks).toBeNull()

    const console = hostView(host)?.currentContent

    expect(console?.kind === 'higherlower' && console.valuedPairs?.[0]).toEqual(
      {
        ask: { family: 'length.river', kind: 'bank' },
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

  it('[higherlower] pays a right pick alone in a room that does not pay for speed', async () => {
    const { host, lou, max, roundId, zoe } = await roundInPlay({
      ...HIGHER_LOWER,
      paysForSpeed: false
    })

    for (const seat of [zoe, max, lou]) {
      sendSheet({ picks: RIGHT, roundId, seat })
    }
    await waitFor(() => playerView(zoe)?.phase === 'revealed', 'the reveal')

    expect(
      hostView(host)?.round?.awards.map(({ points, speedBonus }) => ({
        points,
        speedBonus
      }))
    ).toEqual(Array(3).fill({ points: MOST_A_ROUND_PAYS, speedBonus: 0 }))
  })

  it('[higherlower] pays a right pick with the clock’s share, and reveals both values with every sheet', async () => {
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

    expect(basePointsFor({ playerId: idOf(zoe), view })).toBe(
      answerShareOf(MOST_A_ROUND_PAYS)
    )
    expect(awardOf(max)?.points ?? 0).toBe(0)
    expect(awardOf(lou)?.points ?? 0).toBe(0)
    expect(awardOf(zoe)?.verdict).toEqual({ kind: 'pairs', rightPairs: 1 })
    expect(awardOf(zoe)?.speedBonus).toBeGreaterThan(0)
    expect(awardOf(zoe)?.speedBonus).toBeLessThanOrEqual(MOST_THE_CLOCK_PAYS)

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

/** Distinctive enough that a raw frame carrying either can only be carrying the deck's answer. */
const COMMUTES = { hugo: 8_642_013, lea: 3_141_592 }

const FAMILY_PAIRS: RoomSettings = {
  ...HIGHER_LOWER,
  lineUp: [DEFAULT_HIGHER_LOWER_SETTINGS],
  lineUpAt: 0
}

const familyRoom = async (items: HigherLowerDeckItem[]) => {
  const { code, host } = await harness.openRoom(FAMILY_PAIRS)
  const zoe = await harness.seat({ code, nickname: 'Zoe' })

  await harness.seat({ code, nickname: 'Max' })
  host.send({ decks: [{ game: 'higherlower', items }], type: 'host.setDecks' })

  return { host, zoe }
}

const COMMUTE_PAIR: HigherLowerDeckItem = {
  left: { name: 'Léa', value: COMMUTES.lea },
  prompt: 'Who drives further to work in a year?',
  right: { name: 'Hugo', value: COMMUTES.hugo },
  unit: 'm'
}

describe('a higher-or-lower deck', () => {
  it('[higherlower] deals the deck first, its values withheld until the reveal, then the bank', async () => {
    const { host, zoe } = await familyRoom([COMMUTE_PAIR])

    await waitFor(
      () => hostView(host)?.deckSummaries[0] != null,
      'the deck to load'
    )
    host.send({ type: 'host.startRound' })
    await waitFor(() => playerView(zoe)?.phase === 'playing', 'the pair')

    const dealt = pairsRound(playerView(zoe))?.pairs[0]

    expect(dealt?.ask).toEqual({
      kind: 'own',
      prompt: 'Who drives further to work in a year?',
      unit: 'm'
    })
    expect([dealt?.left.fr, dealt?.right.fr].toSorted()).toEqual([
      'Hugo',
      'Léa'
    ])

    const transcript = transcriptOf(zoe.frames)

    expect(transcript).not.toContain(String(COMMUTES.lea))
    expect(transcript).not.toContain(String(COMMUTES.hugo))

    const roundId = playerView(zoe)?.round?.id ?? ''

    host.send({ roundId, type: 'host.reveal' })
    await waitFor(() => playerView(zoe)?.phase === 'revealed', 'the reveal')

    const revealed = pairsRound(playerView(zoe))?.revealedPairs?.[0]

    expect(
      revealed?.left.fr === 'Hugo' ? revealed.leftValue : revealed?.rightValue
    ).toBe(COMMUTES.hugo)

    host.send({ type: 'host.nextRound' })
    await waitFor(
      () =>
        playerView(zoe)?.phase === 'playing' &&
        playerView(zoe)?.round?.id !== roundId,
      'the bank to take over'
    )

    expect(pairsRound(playerView(zoe))?.pairs[0]?.ask).toEqual({
      family: 'length.river',
      kind: 'bank'
    })
  })

  it('[higherlower] refuses a deck holding a near tie', async () => {
    const { host } = await familyRoom([
      COMMUTE_PAIR,
      { ...COMMUTE_PAIR, right: { name: 'Hugo', value: COMMUTES.lea + 1 } }
    ])

    await waitFor(
      () => errorsIn(host).some(({ code }) => code === 'invalid_message'),
      'the near tie to be refused'
    )
    expect(hostView(host)?.deckSummaries).toEqual([null])
  })
})
