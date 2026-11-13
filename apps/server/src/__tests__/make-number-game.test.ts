import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  DEFAULT_MAKE_NUMBER_SETTINGS,
  type MakeNumberSettings
} from '@melee/protocol/game'
import type { HostToken } from '@melee/protocol/identifiers'
import type { Calculation } from '@melee/protocol/make-number'
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

import { calculationValue } from '@melee/core/makenumber/calculation-check'
import { pointsForCalculation } from '@melee/core/makenumber/calculation-pay'

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

/** The draw the mocked dealer deals every round, solved by the real solver: its shortest solution takes four tiles. */
const TILES = [75, 25, 7, 3, 10, 10]

const TARGET = 703

vi.mock('@melee/core/makenumber/playable-draw', async (importOriginal) => {
  const dealer =
    await importOriginal<
      typeof import('@melee/core/makenumber/playable-draw')
    >()

  return {
    ...dealer,
    drawPlayableNumbers: () =>
      dealer.drawPlayableNumbers({
        draw: () => ({ target: TARGET, tiles: TILES })
      })
  }
})

/** (75 + 25) × 7 + 3: the target itself. */
const EXACT: Calculation = [
  { left: 0, operator: 'add', right: 1 },
  { left: 6, operator: 'multiply', right: 2 },
  { left: 7, operator: 'add', right: 3 }
]

/** (75 + 25) × 7: three short. */
const SEVEN_HUNDRED: Calculation = [
  { left: 0, operator: 'add', right: 1 },
  { left: 6, operator: 'multiply', right: 2 }
]

/** 7 × 10 × 10: seven hundred another way, as far off. */
const SEVEN_HUNDRED_AGAIN: Calculation = [
  { left: 2, operator: 'multiply', right: 4 },
  { left: 6, operator: 'multiply', right: 5 }
]

/** (75 + 25) × 7 + 10: seven over. */
const SEVEN_TEN: Calculation = [
  { left: 0, operator: 'add', right: 1 },
  { left: 6, operator: 'multiply', right: 2 },
  { left: 7, operator: 'add', right: 4 }
]

/** 75 × 10: forty-seven over, paid nothing. */
const SEVEN_FIFTY: Calculation = [{ left: 0, operator: 'multiply', right: 4 }]

const GAME: MakeNumberSettings = {
  ...DEFAULT_MAKE_NUMBER_SETTINGS,
  roundDurationMs: 60_000
}

const MAKE_NUMBER: RoomSettings = {
  ...DEFAULT_ROOM_SETTINGS,
  countdownMs: 20,
  game: GAME,
  lineUp: [GAME],
  lineUpAt: 0,
  mode: DEFAULT_MODE_SETTINGS.calculation,
  roundCount: 3
}

const draw = (
  view: { round: RoundView | null } | null
): Extract<RoundContent, { kind: 'makenumber' }> | null => {
  const content = view?.round?.content

  return content?.kind === 'makenumber' ? content : null
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

const roundInPlay = async ({
  hostNickname
}: {
  /** Seats the console under this name. */
  hostNickname?: string
} = {}) => {
  const { code, host, hostToken } = await harness.openRoom(
    MAKE_NUMBER,
    hostNickname
  )
  const wall = await pairedWall({ code, hostToken })
  const zoe = await harness.seat({ code, nickname: 'Zoe' })
  const max = await harness.seat({ code, nickname: 'Max' })
  const lou = await harness.seat({ code, nickname: 'Lou' })

  host.send({ type: 'host.startRound' })
  await waitFor(() => playerView(zoe)?.phase === 'playing', 'the tiles')

  return {
    host,
    lou,
    max,
    roundId: playerView(zoe)?.round?.id ?? '',
    wall,
    zoe
  }
}

const calculationsOf = (seat: Peer<PlayerServerMessage>): number =>
  draw(playerView(seat))?.yourCalculations?.length ?? 0

const sendCalculation = async ({
  roundId,
  seat,
  steps
}: {
  roundId: string
  seat: Peer<PlayerServerMessage>
  steps: Calculation
}): Promise<void> => {
  const before = calculationsOf(seat)
  const refusals = errorsIn(seat).length

  seat.send({
    answer: { kind: 'calculation', steps },
    roundId,
    type: 'player.answer'
  })
  await waitFor(
    () => calculationsOf(seat) > before || errorsIn(seat).length > refusals,
    'the calculation to land or be refused'
  )
}

const leanCalculation = ({
  roundId,
  seat,
  steps
}: {
  roundId: string
  seat: Peer<PlayerServerMessage>
  steps: Calculation
}): void => {
  seat.send({
    answer: { kind: 'calculation', steps },
    roundId,
    type: 'player.lean'
  })
}

/** A lean is answered with no frame, so a ping behind it on the same socket says it was read. */
const leansRead = async (
  seats: readonly Peer<PlayerServerMessage>[]
): Promise<void> => {
  for (const seat of seats) {
    seat.send({ clientSentAt: 1, type: 'time.ping' })
  }

  await waitFor(
    () =>
      seats.every((seat) =>
        seat.frames.some(({ message }) => message.type === 'time.pong')
      ),
    'the leans to be read'
  )
}

const idOf = (seat: Peer<PlayerServerMessage>) =>
  playerView(seat)?.youId ?? null

const seatValueIn = ({
  seat,
  view
}: {
  seat: Peer<PlayerServerMessage>
  view: { round: RoundView | null } | null
}) => draw(view)?.values.find(({ playerId }) => playerId === idOf(seat))?.value

describe('a make-the-number round through the seam', () => {
  it('[makenumber] shows every screen the tiles and the target, and the solution to a seatless console alone', async () => {
    const { host, wall, zoe } = await roundInPlay()

    expect(draw(playerView(zoe))).toEqual({
      kind: 'makenumber',
      revealedCalculations: null,
      solution: null,
      target: TARGET,
      tiles: TILES,
      values: [],
      yourCalculations: []
    })

    const console = hostView(host)?.currentContent
    const solution =
      console?.kind === 'makenumber' ? (console.solution ?? []) : []

    expect(solution).toHaveLength(3)
    expect(calculationValue({ steps: solution, tiles: TILES })).toBe(TARGET)
    expect(wallView(wall)?.currentContent).toEqual({ kind: 'makenumber' })
    expect(draw(wallView(wall))?.yourCalculations).toBeNull()
  })

  it('[makenumber] sends no seat’s steps to another seat, the wall or a seated console before the reveal, only its value', async () => {
    const { host, max, roundId, wall, zoe } = await roundInPlay({
      hostNickname: 'Marina'
    })

    await sendCalculation({ roundId, seat: zoe, steps: SEVEN_HUNDRED_AGAIN })
    await sendCalculation({ roundId, seat: max, steps: SEVEN_TEN })

    expect(draw(playerView(zoe))?.yourCalculations).toEqual([
      SEVEN_HUNDRED_AGAIN
    ])
    expect(seatValueIn({ seat: zoe, view: playerView(max) })).toBe(700)
    expect(seatValueIn({ seat: zoe, view: wallView(wall) })).toBe(700)
    expect(seatValueIn({ seat: zoe, view: hostView(host) })).toBe(700)
    expect(seatValueIn({ seat: max, view: playerView(zoe) })).toBe(710)
    expect(hostView(host)?.currentContent).toEqual({
      kind: 'makenumber',
      solution: null
    })
    expect(playerView(zoe)?.yourVerdict).toEqual({
      distance: 3,
      kind: 'calculation',
      value: 700
    })

    for (const peer of [wall, host]) {
      expect(transcriptOf(peer.frames)).not.toContain('"operator"')
    }
    expect(transcriptOf(max.frames)).not.toContain('"right":5')
    expect(transcriptOf(zoe.frames)).not.toContain('"right":1')

    host.send({ roundId, type: 'host.reveal' })
    await waitFor(() => playerView(max)?.phase === 'revealed', 'the reveal')

    const revealed = draw(playerView(max))

    expect(revealed?.revealedCalculations).toEqual(
      expect.arrayContaining([
        { playerId: idOf(zoe), steps: SEVEN_HUNDRED_AGAIN },
        { playerId: idOf(max), steps: SEVEN_TEN }
      ])
    )
    expect(
      calculationValue({ steps: revealed?.solution ?? [], tiles: TILES })
    ).toBe(TARGET)
  })

  it('[makenumber] refuses a tile used twice, a division with a remainder, a subtraction to zero and a result not reached, each at no cost', async () => {
    const { roundId, zoe } = await roundInPlay()

    for (const steps of [
      [{ left: 2, operator: 'add', right: 2 }],
      [{ left: 0, operator: 'divide', right: 2 }],
      [{ left: 4, operator: 'subtract', right: 5 }],
      [{ left: 6, operator: 'add', right: 1 }]
    ] satisfies Calculation[]) {
      await sendCalculation({ roundId, seat: zoe, steps })
    }

    expect(errorsIn(zoe).map(({ code }) => code)).toEqual([
      'invalid_calculation',
      'invalid_calculation',
      'invalid_calculation',
      'invalid_calculation'
    ])
    expect(draw(playerView(zoe))?.yourCalculations).toEqual([])

    await sendCalculation({ roundId, seat: zoe, steps: SEVEN_HUNDRED })

    expect(draw(playerView(zoe))?.yourCalculations).toEqual([SEVEN_HUNDRED])
    expect(errorsIn(zoe)).toHaveLength(4)
  })

  it('[makenumber] keeps a seat’s nearest calculation: a nearer one replaces it, one as far off does not', async () => {
    const { host, max, roundId, zoe } = await roundInPlay()

    for (const steps of [SEVEN_TEN, SEVEN_HUNDRED, SEVEN_HUNDRED_AGAIN]) {
      await sendCalculation({ roundId, seat: zoe, steps })
    }

    expect(draw(playerView(zoe))?.yourCalculations).toEqual([
      SEVEN_TEN,
      SEVEN_HUNDRED,
      SEVEN_HUNDRED_AGAIN
    ])
    expect(seatValueIn({ seat: zoe, view: playerView(max) })).toBe(700)

    host.send({ roundId, type: 'host.reveal' })
    await waitFor(() => playerView(zoe)?.phase === 'revealed', 'the reveal')

    expect(draw(playerView(zoe))?.revealedCalculations).toContainEqual({
      playerId: idOf(zoe),
      steps: SEVEN_HUNDRED
    })
    expect(
      hostView(host)?.round?.revealedAnswers.find(
        ({ playerId }) => playerId === idOf(zoe)
      )?.said
    ).toBe('75 + 25 = 100, 100 × 7 = 700')
  })

  it('[makenumber] pays the calculation left on a rack unsent at the close when nearer than what the seat sent, with no speed', async () => {
    const { host, lou, max, roundId, zoe } = await roundInPlay()

    await sendCalculation({ roundId, seat: zoe, steps: SEVEN_TEN })
    await sendCalculation({ roundId, seat: max, steps: SEVEN_HUNDRED })
    leanCalculation({ roundId, seat: zoe, steps: SEVEN_HUNDRED })
    leanCalculation({ roundId, seat: max, steps: SEVEN_HUNDRED_AGAIN })
    leanCalculation({ roundId, seat: lou, steps: EXACT })
    leanCalculation({
      roundId,
      seat: lou,
      steps: [{ left: 0, operator: 'add', right: 0 }]
    })
    leanCalculation({ roundId, seat: lou, steps: EXACT })
    await leansRead([zoe, max, lou])

    expect(errorsIn(lou).map(({ code }) => code)).toEqual([
      'invalid_calculation'
    ])
    expect(seatValueIn({ seat: zoe, view: playerView(max) })).toBe(710)
    expect(seatValueIn({ seat: lou, view: playerView(max) })).toBeUndefined()
    expect(playerView(zoe)?.phase).toBe('playing')

    host.send({ roundId, type: 'host.reveal' })
    await waitFor(() => playerView(zoe)?.phase === 'revealed', 'the reveal')

    const view = hostView(host)
    const awardOf = (seat: Peer<PlayerServerMessage>) =>
      view?.round?.awards.find((award) => award.playerId === idOf(seat))

    expect(awardOf(zoe)).toMatchObject({
      isUnsent: true,
      points: answerShareOf(pointsForCalculation({ distance: 3 })),
      speedBonus: 0,
      verdict: { distance: 3, value: 700 }
    })
    expect(awardOf(max)).toMatchObject({
      isUnsent: false,
      verdict: { distance: 3, value: 700 }
    })
    expect(awardOf(lou)).toMatchObject({
      isUnsent: true,
      points: answerShareOf(MOST_A_ROUND_PAYS),
      speedBonus: 0
    })
    expect(draw(playerView(zoe))?.revealedCalculations).toEqual(
      expect.arrayContaining([
        { playerId: idOf(zoe), steps: SEVEN_HUNDRED },
        { playerId: idOf(max), steps: SEVEN_HUNDRED },
        { playerId: idOf(lou), steps: EXACT }
      ])
    )
  })

  it('[makenumber] pays an exact hit the whole round, a near miss its share and a far one nothing', async () => {
    const { host, lou, max, roundId, zoe } = await roundInPlay()

    await sendCalculation({ roundId, seat: zoe, steps: EXACT })
    await sendCalculation({ roundId, seat: max, steps: SEVEN_HUNDRED })
    await sendCalculation({ roundId, seat: lou, steps: SEVEN_FIFTY })
    host.send({ roundId, type: 'host.reveal' })
    await waitFor(() => playerView(zoe)?.phase === 'revealed', 'the reveal')

    const view = hostView(host)
    const awardOf = (seat: Peer<PlayerServerMessage>) =>
      view?.round?.awards.find((award) => award.playerId === idOf(seat))

    expect(basePointsFor({ playerId: idOf(zoe), view })).toBe(
      answerShareOf(MOST_A_ROUND_PAYS)
    )
    expect(basePointsFor({ playerId: idOf(max), view })).toBe(
      answerShareOf(pointsForCalculation({ distance: 3 }))
    )
    expect(awardOf(zoe)?.speedBonus).toBeGreaterThan(0)
    expect(awardOf(max)?.speedBonus).toBe(0)
    expect(awardOf(lou)?.points).toBe(0)
    expect(awardOf(max)?.verdict).toEqual({
      distance: 3,
      kind: 'calculation',
      value: 700
    })
  })

  it('[makenumber] closes once every seat holds an exact hit, timing it when that calculation was sent', async () => {
    const waitedMs = 1_000
    const { host, lou, max, roundId, zoe } = await roundInPlay()

    await sendCalculation({ roundId, seat: zoe, steps: SEVEN_TEN })
    await new Promise((resolve) => setTimeout(resolve, waitedMs))
    await sendCalculation({ roundId, seat: zoe, steps: EXACT })
    await sendCalculation({ roundId, seat: max, steps: EXACT })

    expect(playerView(zoe)?.phase).toBe('playing')

    await sendCalculation({ roundId, seat: zoe, steps: SEVEN_HUNDRED })

    expect(errorsIn(zoe).map(({ code }) => code)).toEqual(['already_buzzed'])

    await sendCalculation({ roundId, seat: lou, steps: EXACT })
    await waitFor(() => playerView(zoe)?.phase === 'revealed', 'the reveal')

    const award = hostView(host)?.round?.awards.find(
      ({ playerId }) => playerId === idOf(zoe)
    )

    expect(award?.speedBonus).toBeGreaterThan(0)
    expect(award?.speedBonus).toBeLessThanOrEqual(
      Math.round(MOST_THE_CLOCK_PAYS * (1 - waitedMs / GAME.roundDurationMs))
    )
  })
})
