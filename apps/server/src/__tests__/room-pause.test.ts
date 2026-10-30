import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_BLINDTEST_SETTINGS } from '@melee/protocol/game'
import type { RoomSettings } from '@melee/protocol/room'
import { hostServerMessageSchema } from '@melee/protocol/server-message'
import { PROTOCOL_VERSION } from '@melee/protocol/version'

import { startRoomHarness } from './node-room-harness'
import {
  errorsIn,
  FAST_GAME,
  hostView,
  playerView,
  type RoomHarness,
  sessionIdOf,
  sleep,
  waitFor
} from './room-harness'

vi.mock('@/infrastructure/music/deezer-client', async () => {
  const { deezerClientStub } = await import('./room-harness')

  return deezerClientStub()
})

const LONG_CLIP: RoomSettings = {
  ...FAST_GAME,
  game: { ...DEFAULT_BLINDTEST_SETTINGS, roundDurationMs: 30_000 }
}

/** Long enough that a clock still running under the pause would show. */
const PAUSED_FOR_MS = 400

const PLAYED_FOR_MS = 300

describe('a host who pauses the room', () => {
  let harness: RoomHarness

  beforeEach(async () => {
    harness = await startRoomHarness()
  })

  afterEach(async () => {
    await harness.stop()
  })

  const playingRoom = async (settings: RoomSettings = LONG_CLIP) => {
    const { code, host } = await harness.openRoom(settings)
    const player = await harness.seat({ code, nickname: 'Zoe' })

    host.send({ type: 'host.startRound' })
    await waitFor(
      () => playerView(player)?.phase === 'playing',
      'the clip to start'
    )

    return { code, host, player, roundId: hostView(host)?.round?.id ?? '' }
  }

  it('[pause] tells every screen, and spends none of the pause on the round', async () => {
    const { host, player, roundId } = await playingRoom()

    await sleep(PLAYED_FOR_MS)
    host.send({ isPaused: true, roundId, type: 'host.pause' })
    await waitFor(
      () => playerView(player)?.isPaused === true,
      'the room to hear the pause'
    )
    await sleep(PAUSED_FOR_MS)
    host.send({ isPaused: false, roundId, type: 'host.pause' })
    await waitFor(
      () => playerView(player)?.isPaused === false,
      'the room to hear the pause end'
    )

    const elapsed = playerView(player)?.roundElapsedMs ?? 0

    expect(hostView(host)?.isPaused).toBe(false)
    expect(playerView(player)?.phase).toBe('playing')
    expect(elapsed).toBeGreaterThanOrEqual(PLAYED_FOR_MS * 0.8)
    expect(elapsed).toBeLessThan(PLAYED_FOR_MS + PAUSED_FOR_MS / 2)
  })

  it('[pause] holds a round past the end of its clock', async () => {
    const { host, player, roundId } = await playingRoom({
      ...FAST_GAME,
      game: { ...DEFAULT_BLINDTEST_SETTINGS, roundDurationMs: 5_000 }
    })

    host.send({ isPaused: true, roundId, type: 'host.pause' })
    await waitFor(() => playerView(player)?.isPaused === true, 'the pause')
    await sleep(5_200)

    expect(playerView(player)?.phase).toBe('playing')
  }, 8_000)

  it('[pause] refuses the floor with a code of its own', async () => {
    const { host, player, roundId } = await playingRoom()

    host.send({ isPaused: true, roundId, type: 'host.pause' })
    await waitFor(() => playerView(player)?.isPaused === true, 'the pause')
    player.send({ roundId, type: 'player.buzz' })
    await waitFor(() => errorsIn(player).length === 1, 'the refusal')

    expect(errorsIn(player).at(0)?.code).toBe('room_paused')
    expect(playerView(player)?.phase).toBe('playing')
  })

  it('[pause] refuses the host a verdict, which would put the clock back on', async () => {
    const { host, player, roundId } = await playingRoom()

    player.send({ roundId, type: 'player.buzz' })
    await waitFor(() => hostView(host)?.phase === 'buzzed', 'the buzz')
    host.send({ isPaused: true, roundId, type: 'host.pause' })
    await waitFor(() => hostView(host)?.isPaused === true, 'the pause')
    host.send({
      playerId: playerView(player)?.youId ?? '',
      roundId,
      type: 'host.judge',
      verdict: { artistCorrect: false, kind: 'halves', titleCorrect: false }
    })
    await waitFor(() => errorsIn(host).length === 1, 'the refusal')

    expect(errorsIn(host).at(0)?.code).toBe('room_paused')
    expect(hostView(host)?.phase).toBe('buzzed')
  })

  it('[pause] gives the countdown back rather than resuming it late', async () => {
    const { code, host } = await harness.openRoom({
      ...LONG_CLIP,
      countdownMs: 400
    })
    const player = await harness.seat({ code, nickname: 'Zoe' })

    host.send({ type: 'host.startRound' })
    await waitFor(
      () => playerView(player)?.phase === 'countdown',
      'the countdown to open'
    )

    const round = hostView(host)?.round
    const firstStart = round?.startsAt ?? 0

    host.send({ isPaused: true, roundId: round?.id ?? '', type: 'host.pause' })
    await sleep(PAUSED_FOR_MS + 200)

    expect(playerView(player)?.phase).toBe('countdown')

    host.send({ isPaused: false, roundId: round?.id ?? '', type: 'host.pause' })
    await waitFor(
      () => (playerView(player)?.round?.startsAt ?? 0) > firstStart,
      'the countdown to be given back'
    )
  })

  it('[pause] stays paused across the console reloading', async () => {
    const { code, host, player, roundId } = await playingRoom()

    host.send({ isPaused: true, roundId, type: 'host.pause' })
    await waitFor(() => playerView(player)?.isPaused === true, 'the pause')

    const elapsedAtPause = playerView(player)?.roundElapsedMs

    host.close()
    await waitFor(
      () => playerView(player)?.isHostConnected === false,
      'the room to hear the host leave'
    )

    const returned = await harness.connect(code, hostServerMessageSchema)

    returned.send({
      protocolVersion: PROTOCOL_VERSION,
      role: 'host',
      sessionId: sessionIdOf(host),
      type: 'hello'
    })
    await waitFor(
      () => hostView(returned)?.isHostConnected === true,
      'the host to reclaim the room'
    )
    await sleep(PAUSED_FOR_MS)

    expect(hostView(returned)?.isPaused).toBe(true)
    expect(hostView(returned)?.roundElapsedMs).toBe(elapsedAtPause)
  })

  it('[pause] refuses a pause with no round on screen', async () => {
    const { host } = await harness.openRoom(LONG_CLIP)

    host.send({ isPaused: true, roundId: 'nothing', type: 'host.pause' })
    await waitFor(() => errorsIn(host).length === 1, 'the refusal')

    expect(errorsIn(host).at(0)?.code).toBe('wrong_phase')
  })

  it('[pause] refuses a player pausing the room', async () => {
    const { player, roundId } = await playingRoom()

    player.send({ isPaused: true, roundId, type: 'host.pause' })
    await waitFor(() => errorsIn(player).length === 1, 'the refusal')

    expect(errorsIn(player).at(0)?.code).toBe('host_only_action')
    expect(playerView(player)?.isPaused).toBe(false)
  })
})
