import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_INNERCLOCK_SETTINGS } from '@melee/protocol/game'
import {
  DEFAULT_MODE_SETTINGS,
  DEFAULT_ROOM_SETTINGS,
  type RoomSettings
} from '@melee/protocol/room'

import {
  MAX_DRAWN_TARGET_SECONDS,
  MIN_DRAWN_TARGET_SECONDS
} from '@melee/core/innerclock/target'

import { nowMs } from '@/infrastructure/clock'

import { startRoomHarness } from './node-room-harness'
import {
  errorsIn,
  hostView,
  innerclockRound,
  playerView,
  type RoomHarness,
  sleep,
  waitFor
} from './room-harness'

vi.mock('@/infrastructure/music/deezer-client', async () => {
  const { deezerClientStub } = await import('./room-harness')

  return deezerClientStub()
})

/**
 * A count of ten seconds is the shortest the wire takes, and eight suites of
 * them is minutes of waiting. Each one is played twenty times faster: the
 * pay and the cap read the count as if every real millisecond were twenty.
 */
const TIME_WARP = 20

vi.mock('@melee/core/innerclock/gap-pay', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@melee/core/innerclock/gap-pay')>()

  return {
    ...actual,
    innerclockRoundDurationMs: (targetMs: number) =>
      actual.innerclockRoundDurationMs(targetMs) / TIME_WARP,
    pointsForGap: ({
      countedMs,
      targetMs
    }: {
      countedMs: number
      targetMs: number
    }) => actual.pointsForGap({ countedMs: countedMs * TIME_WARP, targetMs })
  }
})

const TARGET_SECONDS = 10
const TARGET_REAL_MS = (TARGET_SECONDS * 1_000) / TIME_WARP

/**
 * Not on the shelf until its screens are, so the harness reaches it through
 * `host.updateSettings` like every game served before it was drawn.
 */
const INNERCLOCK_GAME: RoomSettings = {
  ...DEFAULT_ROOM_SETTINGS,
  countdownMs: 20,
  game: DEFAULT_INNERCLOCK_SETTINGS,
  mode: DEFAULT_MODE_SETTINGS.buzzer,
  roundCount: null
}

let room: RoomHarness

beforeEach(async () => {
  room = await startRoomHarness()
})

afterEach(async () => {
  await room.stop()
})

const openCountingRound = async (
  targetSeconds: number | null = TARGET_SECONDS
) => {
  const { code, host } = await room.openRoom(INNERCLOCK_GAME)
  const alice = await room.seat({ code, nickname: 'Alice' })
  const bob = await room.seat({ code, nickname: 'Bob' })

  host.send({
    innerclockTargetSeconds: targetSeconds ?? undefined,
    type: 'host.startRound'
  })
  await waitFor(() => hostView(host)?.phase === 'playing', 'the count to start')

  const round = hostView(host)?.round

  if (round == null || round.startsAt === null) {
    throw new Error('The round vanished as it opened')
  }

  return {
    alice,
    aliceId: playerView(alice)?.youId ?? '',
    bob,
    bobId: playerView(bob)?.youId ?? '',
    host,
    round,
    startsAt: round.startsAt
  }
}

/** Sleeps until this much of the warped count has gone by since the start. */
const untilCounted = (startsAt: number, realMs: number) =>
  sleep(Math.max(0, startsAt + realMs - nowMs()))

const scoreOf = (
  host: Awaited<ReturnType<RoomHarness['openRoom']>>['host'],
  nickname: string
) =>
  hostView(host)?.players.find((player) => player.nickname === nickname)?.score

describe('a count nobody judges', () => {
  it('[innerclock] opens on the count the host typed, with no clock on the round', async () => {
    const { alice, host } = await openCountingRound()

    expect(innerclockRound(playerView(alice))?.targetSeconds).toBe(
      TARGET_SECONDS
    )
    expect(hostView(host)?.currentContent).toEqual({ kind: 'innerclock' })
    expect(hostView(host)?.round?.durationMs).toBeNull()
    expect(playerView(alice)?.round?.durationMs).toBeNull()
  })

  it('[innerclock] draws a count when the press that opened it carried none', async () => {
    const { host } = await openCountingRound(null)
    const targetSeconds = innerclockRound(hostView(host))?.targetSeconds ?? 0

    expect(targetSeconds).toBeGreaterThanOrEqual(MIN_DRAWN_TARGET_SECONDS)
    expect(targetSeconds).toBeLessThanOrEqual(MAX_DRAWN_TARGET_SECONDS)
  })

  it('[innerclock] pays the closer count more, and closes once everyone stopped', async () => {
    const { alice, aliceId, bob, host, round, startsAt } =
      await openCountingRound()

    await untilCounted(startsAt, TARGET_REAL_MS * 0.8)
    bob.send({ roundId: round.id, type: 'player.buzz' })
    await untilCounted(startsAt, TARGET_REAL_MS)
    alice.send({ roundId: round.id, type: 'player.buzz' })
    await waitFor(() => hostView(host)?.phase === 'revealed', 'the reveal')

    expect(scoreOf(host, 'Alice')).toBeGreaterThan(scoreOf(host, 'Bob') ?? 0)
    expect(scoreOf(host, 'Bob')).toBeGreaterThan(0)
    expect(
      hostView(host)?.round?.awards.find((award) => award.playerId === aliceId)
    ).toMatchObject({ speedBonus: 0, verdict: { isCorrect: true } })
  })

  it('[innerclock] never takes a floor', async () => {
    const { alice, bob, host, round } = await openCountingRound()

    alice.send({ roundId: round.id, type: 'player.buzz' })
    bob.send({ roundId: round.id, type: 'player.buzz' })
    // Well inside the cap, so the round has to close on the presses.
    await waitFor(() => hostView(host)?.phase === 'revealed', 'the reveal', 300)

    expect(
      host.frames.every(
        ({ message }) =>
          message.type !== 'room.updated' || message.view.phase !== 'buzzed'
      )
    ).toBe(true)
  })

  it('[innerclock] refuses a second press from the same seat', async () => {
    const { alice, round } = await openCountingRound()

    alice.send({ roundId: round.id, type: 'player.buzz' })
    await waitFor(
      () => innerclockRound(playerView(alice))?.hasPressed === true,
      "Alice's press"
    )
    alice.send({ roundId: round.id, type: 'player.buzz' })
    await waitFor(() => errorsIn(alice).length > 0, 'the refusal')

    expect(errorsIn(alice)[0]?.code).toBe('already_buzzed')
  })

  it('[innerclock] closes on its own at the cap, paying nothing to a seat that never pressed', async () => {
    const { alice, bobId, host, round, startsAt } = await openCountingRound()

    await untilCounted(startsAt, TARGET_REAL_MS)
    alice.send({ roundId: round.id, type: 'player.buzz' })
    await waitFor(() => hostView(host)?.phase === 'revealed', 'the cap', 2_000)

    expect(scoreOf(host, 'Alice')).toBeGreaterThan(0)
    expect(scoreOf(host, 'Bob')).toBe(0)
    expect(
      hostView(host)?.round?.awards.some((award) => award.playerId === bobId)
    ).toBe(false)
  })
})

describe('nothing that tells the time', () => {
  // Every frame of the round rather than the last: a press seen once mid-count
  // is a cue, and a later frame hiding it again proves nothing.
  it('[innerclock] shows no press to any screen before the reveal, not even the presser its own time', async () => {
    const { alice, bob, host, round } = await openCountingRound()

    alice.send({ roundId: round.id, type: 'player.buzz' })
    await waitFor(
      () => innerclockRound(playerView(alice))?.hasPressed === true,
      "Alice's press"
    )
    await sleep(20)

    const countingFrames = [
      ...host.frames.map(({ message }) => message),
      ...alice.frames.map(({ message }) => message),
      ...bob.frames.map(({ message }) => message)
    ].flatMap((message) =>
      message.type === 'room.updated' && message.view.phase === 'playing'
        ? [message.view]
        : []
    )

    expect(countingFrames.length).toBeGreaterThan(0)

    for (const view of countingFrames) {
      expect(innerclockRound(view)?.revealedPresses).toBeNull()
      expect(view.round?.durationMs).toBeNull()
    }

    expect(innerclockRound(playerView(bob))?.hasPressed).toBe(false)
    expect(innerclockRound(hostView(host))?.hasPressed).toBe(false)
  })

  it('[innerclock] hands every press out at the reveal', async () => {
    const { alice, aliceId, bob, bobId, round } = await openCountingRound()

    alice.send({ roundId: round.id, type: 'player.buzz' })
    bob.send({ roundId: round.id, type: 'player.buzz' })
    await waitFor(
      () => playerView(bob)?.phase === 'revealed',
      'the reveal on a phone'
    )

    expect(
      innerclockRound(playerView(bob))
        ?.revealedPresses?.map((press) => press.playerId)
        .toSorted()
    ).toEqual([aliceId, bobId].toSorted())
  })
})

describe('the modes this game offers', () => {
  it('[innerclock] refuses a typed field over a count', async () => {
    const { host } = await room.openRoom(INNERCLOCK_GAME)

    host.send({
      settings: { ...INNERCLOCK_GAME, mode: DEFAULT_MODE_SETTINGS.typed },
      type: 'host.updateSettings'
    })
    await waitFor(() => errorsIn(host).length > 0, 'the refusal')

    expect(hostView(host)?.settings.mode.kind).toBe('buzzer')
  })

  it('[innerclock] refuses a count the wire does not take', async () => {
    const { host } = await room.openRoom(INNERCLOCK_GAME)

    host.send({ innerclockTargetSeconds: 5, type: 'host.startRound' })
    await waitFor(() => errorsIn(host).length > 0, 'the refusal')

    expect(hostView(host)?.phase).toBe('lobby')
  })
})
