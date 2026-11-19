import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_LIGHTS_SETTINGS } from '@melee/protocol/game'
import type { LightsRoundContent } from '@melee/protocol/lights'
import {
  DEFAULT_MODE_SETTINGS,
  DEFAULT_ROOM_SETTINGS,
  MAX_PLAYERS_PER_ROOM,
  type RoomSettings,
  type RoundContent,
  type RoundView
} from '@melee/protocol/room'
import { MOST_A_ROUND_PAYS } from '@melee/protocol/scoring'

import {
  HIT_FLOOR_MS,
  LATE_TAP_GRACE_MS,
  lightsRunLengthOf
} from '@melee/core/lights/counted-tap'
import { type LightsStep, lightsRunOf } from '@melee/core/lights/lights-run'

import { nowMs } from '@/infrastructure/clock'

import { startRoomHarness } from './node-room-harness'
import {
  errorsIn,
  hostView,
  type Peer,
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
 * Twenty seconds a round is the game and a minute of waiting a suite. The
 * window is pinned shorter and the seed to one whose first light carries a
 * trap; the floor and the grace are not, because they are the rules under test.
 */
const pinned = vi.hoisted(() => ({ seed: 0, windowMs: 1_200 }))

vi.mock('@/domain/round/lights-round', async (importOriginal) => {
  const original =
    await importOriginal<typeof import('@/domain/round/lights-round')>()
  const { lightsRunOf: runOf } = await import('@melee/core/lights/lights-run')
  const { lightsRunLengthOf: lengthOf } = await import(
    '@melee/core/lights/counted-tap'
  )

  return {
    ...original,
    lightsContent: (
      settings: Parameters<typeof original.lightsContent>[0]
    ) => ({
      ...original.lightsContent(settings),
      run: runOf({
        hasTraps: settings.hasTraps,
        length: lengthOf(pinned.windowMs),
        seed: pinned.seed
      }),
      seed: pinned.seed,
      windowMs: pinned.windowMs
    })
  }
})

const runFor = ({ closesAt, hasTraps, opensAt, seed }: LightsRoundContent) =>
  lightsRunOf({ hasTraps, length: lightsRunLengthOf(closesAt - opensAt), seed })

const firstTrappedSeed = (): number => {
  let seed = 0

  while (lightsRunOf({ hasTraps: true, length: 1, seed }).at(0)?.trap == null) {
    seed += 1
  }

  return seed
}

pinned.seed = firstTrappedSeed()

/** Not on the shelf yet: the harness reaches it through `host.updateSettings`. */
const LIGHTS_GAME: RoomSettings = {
  ...DEFAULT_ROOM_SETTINGS,
  countdownMs: 300,
  game: DEFAULT_LIGHTS_SETTINGS,
  mode: DEFAULT_MODE_SETTINGS.tap,
  roundCount: null
}

const lightsRound = (
  view: { round: RoundView | null } | null
): Extract<RoundContent, { kind: 'lights' }> | null => {
  const content = view?.round?.content

  return content?.kind === 'lights' ? content : null
}

let room: RoomHarness

beforeEach(async () => {
  room = await startRoomHarness()
})

afterEach(async () => {
  await room.stop()
})

type Host = Awaited<ReturnType<RoomHarness['openRoom']>>['host']

const openCountdown = async () => {
  const { code, host } = await room.openRoom(LIGHTS_GAME)
  const alice = await room.seat({ code, nickname: 'Alice' })
  const bob = await room.seat({ code, nickname: 'Bob' })
  const carol = await room.seat({ code, nickname: 'Carol' })

  host.send({ type: 'host.startRound' })
  await waitFor(() => lightsRound(hostView(host)) !== null, 'the countdown')

  const content = lightsRound(hostView(host))

  if (content === null) {
    throw new Error('The round vanished as it opened')
  }

  return {
    alice,
    aliceId: playerView(alice)?.youId ?? '',
    bob,
    bobId: playerView(bob)?.youId ?? '',
    carol,
    carolId: playerView(carol)?.youId ?? '',
    code,
    host,
    roundId: hostView(host)?.round?.id ?? '',
    run: runFor(content)
  }
}

const openPlayingRound = async () => {
  const opened = await openCountdown()

  await waitFor(
    () => hostView(opened.host)?.phase === 'playing',
    'the board to light'
  )

  return opened
}

/** The window as the host reads it now, which a pause moves on. */
const windowOf = (host: Host) => {
  const content = lightsRound(hostView(host))

  if (content === null) {
    throw new Error('The round is not a race of lights')
  }

  return content
}

/** Sleeps until hit `hits + 1` lands on the honest side of the floor. */
const untilFloorOf = async (host: Host, hits: number) => {
  const { opensAt } = windowOf(host)

  await sleep(Math.max(0, opensAt + (hits + 1) * HIT_FLOOR_MS + 15 - nowMs()))
}

const tap = ({
  cell,
  peer,
  roundId,
  step
}: {
  cell: number
  peer: Peer<unknown>
  roundId: string
  step: number
}) => peer.send({ cell, roundId, step, type: 'lights.tap' })

const hitOn = ({
  peer,
  roundId,
  run,
  step
}: {
  peer: Peer<unknown>
  roundId: string
  run: LightsStep[]
  step: number
}) => tap({ cell: run[step]?.target ?? 0, peer, roundId, step })

const countOf = (host: Host, playerId: string) =>
  windowOf(host).seats.find((seat) => seat.playerId === playerId)

const awardOf = (host: Host, playerId: string) =>
  hostView(host)?.round?.awards.find((award) => award.playerId === playerId)

const untilRevealed = (host: Host) =>
  waitFor(
    () => hostView(host)?.phase === 'revealed',
    'the window to close',
    pinned.windowMs + LATE_TAP_GRACE_MS + 2_000
  )

describe('a race of lights counted by the server', () => {
  it('[lights] opens on a settings frame, the seed and the window on every screen from the countdown', async () => {
    const { alice, host } = await openCountdown()

    const seen = lightsRound(playerView(alice))

    expect(hostView(host)?.phase).toBe('countdown')
    expect(seen?.seed).toBe(pinned.seed)
    expect(seen?.closesAt).toBe((seen?.opensAt ?? 0) + pinned.windowMs)
    expect(hostView(host)?.round?.answerMode).toBe('tap')
  })

  it('[lights] counts nothing before the board lights, a trap included', async () => {
    const { alice, aliceId, bob, bobId, host, roundId, run } =
      await openCountdown()

    tap({ cell: run[0]?.trap ?? 0, peer: alice, roundId, step: 0 })
    hitOn({ peer: alice, roundId, run, step: 0 })
    await waitFor(() => hostView(host)?.phase === 'playing', 'the board')
    await untilFloorOf(host, 0)
    hitOn({ peer: bob, roundId, run, step: 0 })
    await waitFor(() => countOf(host, bobId)?.hits === 1, "Bob's hit")

    expect(countOf(host, aliceId)).toEqual({
      hits: 0,
      playerId: aliceId,
      traps: 0
    })
  })

  it('[lights] counts no hit under the floor', async () => {
    const { alice, aliceId, bob, bobId, host, roundId, run } =
      await openPlayingRound()

    hitOn({ peer: alice, roundId, run, step: 0 })
    await untilFloorOf(host, 0)
    hitOn({ peer: bob, roundId, run, step: 0 })
    await waitFor(() => countOf(host, bobId)?.hits === 1, "Bob's hit")

    expect(countOf(host, aliceId)?.hits).toBe(0)
  })

  it('[lights] counts no tap on a step that is not the seat’s next', async () => {
    const { alice, aliceId, host, roundId, run } = await openPlayingRound()

    await untilFloorOf(host, 1)
    hitOn({ peer: alice, roundId, run, step: 1 })
    hitOn({ peer: alice, roundId, run, step: 0 })
    await waitFor(() => (countOf(host, aliceId)?.hits ?? 0) > 0, "Alice's hit")
    await sleep(400)

    expect(countOf(host, aliceId)?.hits).toBe(1)
  })

  it('[lights] records a trap, and the run waits on the same light', async () => {
    const { alice, aliceId, host, roundId, run } = await openPlayingRound()
    const trap = run[0]?.trap

    expect(trap).not.toBeNull()

    await untilFloorOf(host, 0)
    tap({ cell: trap ?? 0, peer: alice, roundId, step: 0 })
    await waitFor(() => countOf(host, aliceId)?.traps === 1, "Alice's trap")

    expect(countOf(host, aliceId)?.hits).toBe(0)

    hitOn({ peer: alice, roundId, run, step: 0 })
    await waitFor(() => countOf(host, aliceId)?.hits === 1, "Alice's hit")

    expect(countOf(host, aliceId)).toEqual({
      hits: 1,
      playerId: aliceId,
      traps: 1
    })
  })

  it('[lights] counts a tap still in the air past the window, and none past the grace', async () => {
    const { alice, aliceId, host, roundId, run } = await openPlayingRound()
    const { closesAt } = windowOf(host)

    await sleep(Math.max(0, closesAt + LATE_TAP_GRACE_MS / 4 - nowMs()))
    hitOn({ peer: alice, roundId, run, step: 0 })
    await untilRevealed(host)

    expect(awardOf(host, aliceId)?.verdict).toEqual({
      bestHits: 1,
      hits: 1,
      kind: 'count'
    })

    hitOn({ peer: alice, roundId, run, step: 1 })
    await sleep(400)

    expect(countOf(host, aliceId)?.hits).toBe(1)
  })

  it('[lights] pays each seat its hits over the round’s best, and nothing for none', async () => {
    const { alice, aliceId, bob, bobId, carolId, host, roundId, run } =
      await openPlayingRound()

    for (const step of [0, 1]) {
      await untilFloorOf(host, step)
      hitOn({ peer: alice, roundId, run, step })
    }

    hitOn({ peer: bob, roundId, run, step: 0 })
    await untilRevealed(host)

    expect(awardOf(host, aliceId)?.points).toBe(MOST_A_ROUND_PAYS)
    expect(awardOf(host, bobId)?.points).toBe(MOST_A_ROUND_PAYS / 2)
    expect(awardOf(host, bobId)?.speedBonus).toBe(0)
    expect(awardOf(host, carolId)?.points).toBe(0)
  })

  it('[lights] refuses a seat that arrived after the board lit', async () => {
    const { code, host, roundId, run } = await openPlayingRound()
    const dan = await room.seat({ code, nickname: 'Dan' })

    await untilFloorOf(host, 0)
    hitOn({ peer: dan, roundId, run, step: 0 })
    await waitFor(() => errorsIn(dan).length > 0, "Dan's refusal")

    expect(errorsIn(dan).map((error) => error.code)).toEqual([
      'joined_mid_round'
    ])
  })

  it('[lights] holds the window through a pause and gives back what it had left', async () => {
    const { alice, aliceId, host, roundId, run } = await openPlayingRound()
    const before = windowOf(host)

    host.send({ isPaused: true, roundId, type: 'host.pause' })
    await waitFor(() => hostView(host)?.isPaused === true, 'the pause')
    await sleep(pinned.windowMs + LATE_TAP_GRACE_MS)
    host.send({ isPaused: false, roundId, type: 'host.pause' })
    await waitFor(() => hostView(host)?.isPaused === false, 'the resume')

    const after = windowOf(host)

    expect(hostView(host)?.phase).toBe('playing')
    expect(after.opensAt - before.opensAt).toBeGreaterThanOrEqual(
      pinned.windowMs
    )
    expect(after.closesAt - after.opensAt).toBe(pinned.windowMs)

    await untilFloorOf(host, 0)
    hitOn({ peer: alice, roundId, run, step: 0 })
    await waitFor(() => countOf(host, aliceId)?.hits === 1, "Alice's hit")
  })

  it('[lights] counts no tap once the round is revealed, however early it stopped', async () => {
    const { alice, aliceId, host, roundId, run } = await openPlayingRound()

    await untilFloorOf(host, 0)
    host.send({ roundId, type: 'host.reveal' })
    await untilRevealed(host)
    hitOn({ peer: alice, roundId, run, step: 0 })
    alice.send({ isReady: true, type: 'player.ready' })
    await waitFor(
      () => hostView(host)?.players.some((seat) => seat.isReady) === true,
      "Alice's ready, sent after her tap"
    )

    expect(countOf(host, aliceId)?.hits).toBe(0)
  })
})

describe('a race of lights under load', () => {
  it('[lights] publishes a full room tapping five times a second on the tick, not on every tap', async () => {
    const { code, host } = await room.openRoom(LIGHTS_GAME)
    const seats = await Promise.all(
      Array.from({ length: MAX_PLAYERS_PER_ROOM }, (_, index) =>
        room.seat({ code, nickname: `Seat ${index}` })
      )
    )

    host.send({ type: 'host.startRound' })
    await waitFor(() => hostView(host)?.phase === 'playing', 'the board', 5_000)

    const roundId = hostView(host)?.round?.id ?? ''
    const run = runFor(windowOf(host))
    const { opensAt } = windowOf(host)
    const framesBefore = host.frames.length
    const tapsPerSeat = 5

    for (let step = 0; step < tapsPerSeat; step++) {
      await sleep(Math.max(0, opensAt + (step + 1) * 200 - nowMs()))

      for (const seat of seats) {
        hitOn({ peer: seat, roundId, run, step })
      }
    }

    await waitFor(
      () => windowOf(host).seats.every((seat) => seat.hits === tapsPerSeat),
      'every tap to be counted'
    )

    const published = host.frames
      .slice(framesBefore)
      .filter(({ message }) => message.type === 'room.updated').length

    expect(published).toBeGreaterThanOrEqual(2)
    expect(published).toBeLessThanOrEqual(8)
  })
})
