import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { type BoardSettings, POINTS_PER_CASE } from '@melee/protocol/board'
import { MOST_A_ROUND_PAYS } from '@melee/protocol/scoring'
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

/** First home wins: a track and no round count, the finish ending the evening. */
const ON_A_TRACK = {
  ...FAST_GAME,
  board: TRACK,
  roundCount: null,
  teams: { count: 2, kind: 'drawn' as const }
}

/** A right answer judged on the buzzer pays the whole round, which walks this many cases. */
const A_RIGHT_ANSWER_WALKS = Math.floor(MOST_A_ROUND_PAYS / POINTS_PER_CASE)

/** What the host adds by hand to put a pawn this many cases up the track. */
const pointsForCases = (cases: number) => cases * POINTS_PER_CASE

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

  const openTwoTeams = async ({
    board = TRACK,
    endsAtFinish = true,
    roundCount = null
  }: {
    board?: BoardSettings
    endsAtFinish?: boolean
    roundCount?: number | null
  } = {}) => {
    const { code, host } = await harness.openRoom({
      ...ON_A_TRACK,
      board,
      endsAtFinish,
      roundCount
    })
    const anna = await harness.seat({ code, nickname: 'Anna' })
    const ben = await harness.seat({ code, nickname: 'Ben' })
    const carl = await harness.seat({ code, nickname: 'Carl' })

    host.send({
      assignment: [[idOf(anna)], [idOf(ben), idOf(carl)]],
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

  it('[board] walks a team a case per thirty points at the reveal, and banks it', async () => {
    const room = await openTwoTeams()

    room.host.send({ type: 'host.startRound' })
    await awaitClip(room.host)

    expect(hostView(room.host)?.teams.map((team) => team.board)).toEqual([
      { case: 0, move: 0 },
      { case: 0, move: 0 }
    ])

    await revealAnnaRight(room)

    expect(playerView(room.ben)?.teams.map((team) => team.board)).toEqual([
      { case: A_RIGHT_ANSWER_WALKS, move: A_RIGHT_ANSWER_WALKS },
      { case: 0, move: 0 }
    ])
    expect(playerView(room.ben)?.players.map((player) => player.board)).toEqual(
      [null, null, null]
    )

    room.host.send({ type: 'host.nextRound' })
    await waitFor(
      () => hostView(room.host)?.phase === 'playing',
      'the next clip'
    )

    expect(hostView(room.host)?.teams[0]?.board).toEqual({
      case: A_RIGHT_ANSWER_WALKS,
      move: 0
    })
  })

  it('[board] walks the best team of the round three cases on a ranked track', async () => {
    const room = await openTwoTeams({ board: { ...TRACK, strategy: 'rank' } })

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
      points: -pointsForCases(1),
      target: { kind: 'team', teamId: 'team-1' },
      type: 'host.adjustScore'
    })
    await waitFor(
      () =>
        hostView(room.host)?.teams[0]?.board?.case === A_RIGHT_ANSWER_WALKS - 1,
      'the correction'
    )

    expect(hostView(room.host)?.teams[0]).toMatchObject({
      board: { case: A_RIGHT_ANSWER_WALKS - 1, move: A_RIGHT_ANSWER_WALKS },
      score: MOST_A_ROUND_PAYS - pointsForCases(1)
    })
  })

  it('[board] ends the evening on the reveal a pawn reaches the last case', async () => {
    const room = await openTwoTeams()

    room.host.send({
      points: pointsForCases(TRACK.length - 1),
      target: { kind: 'team', teamId: 'team-1' },
      type: 'host.adjustScore'
    })
    room.host.send({ type: 'host.startRound' })
    await revealAnnaRight(room)

    expect(hostView(room.host)?.teams[0]?.board).toEqual({
      case: TRACK.length,
      move: 1
    })

    room.host.send({ type: 'host.nextRound' })
    await waitFor(
      () => hostView(room.host)?.phase === 'finished',
      'the final board'
    )
  })

  it('[board] tells a seat the reveal a pawn gets home on is the last', async () => {
    const room = await openTwoTeams()

    room.host.send({
      points: pointsForCases(TRACK.length - A_RIGHT_ANSWER_WALKS - 1),
      target: { kind: 'team', teamId: 'team-1' },
      type: 'host.adjustScore'
    })
    room.host.send({ type: 'host.startRound' })
    await revealAnnaRight(room)
    await waitFor(
      () => playerView(room.anna)?.phase === 'revealed',
      'the reveal on a seat'
    )

    expect(playerView(room.anna)?.round?.isFinal).toBe(false)

    room.host.send({ type: 'host.nextRound' })
    await revealAnnaRight(room)
    await waitFor(
      () => playerView(room.anna)?.round?.isFinal === true,
      'the last reveal on a seat'
    )
  })

  it('[board] keeps the last round of a count unmarked until its reveal', async () => {
    const room = await openTwoTeams({ endsAtFinish: false, roundCount: 1 })

    room.host.send({ type: 'host.startRound' })
    await awaitClip(room.host)
    await waitFor(
      () => playerView(room.anna)?.phase === 'playing',
      'the clip on a seat'
    )

    expect(playerView(room.anna)?.round?.isFinal).toBe(false)

    await revealAnnaRight(room)
    await waitFor(
      () => playerView(room.anna)?.round?.isFinal === true,
      'the last reveal on a seat'
    )
  })

  const sendATeamHome = async (
    room: Awaited<ReturnType<typeof openTwoTeams>>
  ) => {
    room.host.send({
      points: pointsForCases(TRACK.length - 1),
      target: { kind: 'team', teamId: 'team-1' },
      type: 'host.adjustScore'
    })
    room.host.send({ type: 'host.startRound' })
    await revealAnnaRight(room)
    room.host.send({ type: 'host.nextRound' })
    await waitFor(
      () => hostView(room.host)?.round?.index === 2,
      'the next round'
    )
  }

  it('[board] plays a counted evening on past a pawn home', async () => {
    const room = await openTwoTeams({ roundCount: 3 })

    await sendATeamHome(room)

    expect(hostView(room.host)?.teams[0]?.board?.case).toBe(TRACK.length)
  })

  it('[board] plays an endless evening on past a pawn home', async () => {
    const room = await openTwoTeams({ endsAtFinish: false })

    await sendATeamHome(room)

    expect(hostView(room.host)?.phase).not.toBe('finished')
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

describe('a room racing every seat on a track', () => {
  let harness: RoomHarness

  beforeEach(async () => {
    harness = await startRoomHarness()
  })

  afterEach(async () => {
    await harness.stop()
  })

  const openTwoSeats = async () => {
    const { code, host } = await harness.openRoom({
      ...FAST_GAME,
      board: TRACK,
      roundCount: null
    })
    const anna = await harness.seat({ code, nickname: 'Anna' })
    const ben = await harness.seat({ code, nickname: 'Ben' })

    return { anna, ben, code, host }
  }

  const boardsOf = (host: Peer<HostServerMessage>) =>
    Object.fromEntries(
      (hostView(host)?.players ?? []).map((player) => [
        player.nickname,
        player.board
      ])
    )

  const revealRight = async ({
    host,
    player
  }: {
    host: Peer<HostServerMessage>
    player: Peer<PlayerServerMessage>
  }) => {
    await waitFor(() => hostView(host)?.phase === 'playing', 'the clip')

    const roundId = hostView(host)?.round?.id ?? ''

    player.send({ roundId, type: 'player.buzz' })
    await waitFor(() => hostView(host)?.phase === 'buzzed', 'the buzz')
    host.send({
      playerId: idOf(player),
      roundId,
      type: 'host.judge',
      verdict: halves(true, true)
    })
    await waitFor(() => hostView(host)?.phase === 'revealed', 'the reveal')
  }

  it('[board] walks the seat a judged buzz paid, a pawn per seat', async () => {
    const { anna, ben, host } = await openTwoSeats()

    host.send({ type: 'host.startRound' })
    await revealRight({ host, player: anna })

    expect(hostView(host)?.teams).toEqual([])
    expect(boardsOf(host)).toEqual({
      Anna: { case: A_RIGHT_ANSWER_WALKS, move: A_RIGHT_ANSWER_WALKS },
      Ben: { case: 0, move: 0 }
    })
    expect(playerView(ben)?.players.map((player) => player.board)).toEqual([
      { case: A_RIGHT_ANSWER_WALKS, move: A_RIGHT_ANSWER_WALKS },
      { case: 0, move: 0 }
    ])

    host.send({ type: 'host.nextRound' })
    await waitFor(() => hostView(host)?.phase === 'playing', 'the next clip')

    expect(boardsOf(host).Anna).toEqual({ case: A_RIGHT_ANSWER_WALKS, move: 0 })
  })

  it('[board] starts a seat that arrives mid-round on the start', async () => {
    const { anna, code, host } = await openTwoSeats()

    host.send({ type: 'host.startRound' })
    await waitFor(() => hostView(host)?.phase === 'playing', 'the clip')
    await harness.seat({ code, nickname: 'Carl' })
    await revealRight({ host, player: anna })

    expect(boardsOf(host).Carl).toEqual({ case: 0, move: 0 })
  })

  it('[board] takes a pawn off the track with the seat that leaves', async () => {
    const { anna, ben, host } = await openTwoSeats()

    host.send({ type: 'host.startRound' })
    await revealRight({ host, player: anna })
    ben.send({ type: 'player.leave' })
    await waitFor(
      () => hostView(host)?.players.length === 1,
      "Ben's seat to go"
    )

    expect(boardsOf(host)).toEqual({
      Anna: { case: A_RIGHT_ANSWER_WALKS, move: A_RIGHT_ANSWER_WALKS }
    })
  })

  it('[board] lets the host move a seat, and puts every pawn back on the start to play again', async () => {
    const { anna, host } = await openTwoSeats()

    host.send({
      points: pointsForCases(3),
      target: { kind: 'seat', playerId: idOf(anna) },
      type: 'host.adjustScore'
    })
    await waitFor(
      () => boardsOf(host).Anna?.case === 3,
      'the correction to move the pawn'
    )
    host.send({ type: 'host.startRound' })
    await waitFor(() => hostView(host)?.phase === 'playing', 'the clip')
    host.send({ type: 'host.endGame' })
    await waitFor(() => hostView(host)?.phase === 'finished', 'the board')

    expect(boardsOf(host).Anna).toEqual({ case: 3, move: 0 })

    host.send({ type: 'host.playAgain' })
    await waitFor(() => hostView(host)?.phase === 'lobby', 'the lobby')

    expect(boardsOf(host).Anna).toEqual({ case: 0, move: 0 })
  })

  it('[board] ends the game on the reveal a seat reaches the last case', async () => {
    const { anna, host } = await openTwoSeats()

    host.send({
      points: pointsForCases(TRACK.length - 1),
      target: { kind: 'seat', playerId: idOf(anna) },
      type: 'host.adjustScore'
    })
    host.send({ type: 'host.startRound' })
    await revealRight({ host, player: anna })
    host.send({ type: 'host.nextRound' })
    await waitFor(() => hostView(host)?.phase === 'finished', 'the final board')
  })
})
