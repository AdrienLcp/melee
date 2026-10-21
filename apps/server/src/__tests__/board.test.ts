import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { BoardSettings } from '@melee/protocol/board'
import type {
  HostServerMessage,
  PlayerServerMessage
} from '@melee/protocol/server-message'

import { startRoomHarness } from './node-room-harness'
import {
  errorsIn,
  FAST_GAME,
  halves,
  hostView,
  type Peer,
  playerView,
  type RoomHarness,
  waitFor
} from './room-harness'

vi.mock('@/infrastructure/music/deezer-client', async () => {
  const { deezerClientStub } = await import('./room-harness')

  return deezerClientStub()
})

const TRACK: BoardSettings = {
  catchUp: false,
  kind: 'track',
  length: 10,
  strategy: 'onePointOneCase'
}

const ON_A_TRACK = {
  ...FAST_GAME,
  board: TRACK,
  teams: { count: 2, kind: 'drawn' as const }
}

const idOf = (player: Peer<PlayerServerMessage>): string =>
  playerView(player)?.youId ?? ''

describe('a room racing on a track', () => {
  let harness: RoomHarness

  beforeEach(async () => {
    harness = await startRoomHarness()
  })

  afterEach(async () => {
    await harness.stop()
  })

  const openTwoTeams = async (board: BoardSettings = TRACK) => {
    const { code, host } = await harness.openRoom({ ...ON_A_TRACK, board })
    const anna = await harness.seat({ code, nickname: 'Anna' })
    const ben = await harness.seat({ code, nickname: 'Ben' })

    host.send({
      assignment: [[idOf(anna)], [idOf(ben)]],
      type: 'host.drawTeams'
    })

    return { anna, ben, host }
  }

  const awaitClip = async (host: Peer<HostServerMessage>) => {
    await waitFor(() => hostView(host)?.phase === 'playing', 'the clip')
  }

  const revealAnnaRight = async ({
    anna,
    host
  }: Awaited<ReturnType<typeof openTwoTeams>>) => {
    await awaitClip(host)

    const roundId = hostView(host)?.round?.id ?? ''

    anna.send({ roundId, type: 'player.buzz' })
    await waitFor(() => hostView(host)?.phase === 'buzzed', 'the buzz')
    host.send({
      playerId: idOf(anna),
      roundId,
      type: 'host.judge',
      verdict: halves(true, true)
    })
    await waitFor(() => hostView(host)?.phase === 'revealed', 'the reveal')
  }

  it('[board] walks a team a case per point at the reveal, and banks it', async () => {
    const room = await openTwoTeams()

    room.host.send({ type: 'host.startRound' })
    await awaitClip(room.host)

    expect(hostView(room.host)?.teams.map((team) => team.board)).toEqual([
      { case: 0, move: 0 },
      { case: 0, move: 0 }
    ])

    await revealAnnaRight(room)

    expect(playerView(room.ben)?.teams.map((team) => team.board)).toEqual([
      { case: 2, move: 2 },
      { case: 0, move: 0 }
    ])

    room.host.send({ type: 'host.nextRound' })
    await waitFor(
      () => hostView(room.host)?.phase === 'playing',
      'the next clip'
    )

    expect(hostView(room.host)?.teams[0]?.board).toEqual({ case: 2, move: 0 })
  })

  it('[board] walks the best team of the round three cases on a ranked track', async () => {
    const room = await openTwoTeams({ ...TRACK, strategy: 'rank' })

    room.host.send({ type: 'host.startRound' })
    await revealAnnaRight(room)

    expect(hostView(room.host)?.teams.map((team) => team.board)).toEqual([
      { case: 3, move: 3 },
      { case: 0, move: 0 }
    ])
  })

  it('[board] lets the host correct a move under the reveal', async () => {
    const room = await openTwoTeams()

    room.host.send({ type: 'host.startRound' })
    await revealAnnaRight(room)
    room.host.send({
      points: -1_000,
      target: { kind: 'team', teamId: 'team-1' },
      type: 'host.adjustScore'
    })
    await waitFor(
      () => hostView(room.host)?.teams[0]?.board?.case === 1,
      'the correction'
    )

    expect(hostView(room.host)?.teams[0]).toMatchObject({
      board: { case: 1, move: 2 },
      score: 1_000
    })
  })

  it('[board] ends the evening on the reveal a pawn reaches the last case', async () => {
    const room = await openTwoTeams()

    room.host.send({
      points: 9_000,
      target: { kind: 'team', teamId: 'team-1' },
      type: 'host.adjustScore'
    })
    room.host.send({ type: 'host.startRound' })
    await revealAnnaRight(room)

    expect(hostView(room.host)?.teams[0]?.board).toEqual({
      case: 10,
      move: 1
    })

    room.host.send({ type: 'host.nextRound' })
    await waitFor(
      () => hostView(room.host)?.phase === 'finished',
      'the final board'
    )
  })

  it('[board] refuses a new track once the game is under way', async () => {
    const room = await openTwoTeams()

    room.host.send({ type: 'host.startRound' })
    await awaitClip(room.host)
    room.host.send({
      settings: { ...ON_A_TRACK, board: { ...TRACK, length: 20 } },
      type: 'host.updateSettings'
    })
    await waitFor(() => errorsIn(room.host).length > 0, 'the refusal')

    expect(errorsIn(room.host)[0]?.code).toBe('wrong_phase')
  })
})
