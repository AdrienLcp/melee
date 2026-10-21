import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_QUIZ_SETTINGS } from '@melee/protocol/game'
import type { HostToken } from '@melee/protocol/identifiers'
import {
  DEFAULT_MODE_SETTINGS,
  DEFAULT_ROOM_SETTINGS,
  type PlayStyle,
  type RoomSettings
} from '@melee/protocol/room'
import {
  type HostServerMessage,
  type PlayerServerMessage,
  type WallServerMessage,
  wallServerMessageSchema
} from '@melee/protocol/server-message'
import { PROTOCOL_VERSION } from '@melee/protocol/version'

import { startRoomHarness } from './node-room-harness'
import {
  errorsIn,
  FAST_GAME,
  hostQuestion,
  hostView,
  type Peer,
  playerView,
  type RoomHarness,
  waitFor
} from './room-harness'

vi.mock('@/infrastructure/questions/question-bank', async () => {
  const { questionBankStub } = await import('./room-harness')

  return questionBankStub()
})

vi.mock('@/infrastructure/music/deezer-client', async () => {
  const { deezerClientStub } = await import('./room-harness')

  return deezerClientStub()
})

const QUIZ_IN_THREE_TEAMS: RoomSettings = {
  ...DEFAULT_ROOM_SETTINGS,
  countdownMs: 20,
  game: { ...DEFAULT_QUIZ_SETTINGS, roundDurationMs: 5_000 },
  mode: DEFAULT_MODE_SETTINGS.typed,
  roundCount: 2,
  teams: { count: 3, kind: 'drawn' }
}

/** The stub bank holds three questions: two turns and one round after them. */
const QUIZ_IN_TWO_TEAMS: RoomSettings = {
  ...QUIZ_IN_THREE_TEAMS,
  teams: { count: 2, kind: 'drawn' }
}

const idOf = (player: Peer<PlayerServerMessage>): string =>
  playerView(player)?.youId ?? ''

const wallView = (wall: Peer<WallServerMessage>) => {
  for (const { message } of wall.frames.toReversed()) {
    if (message.type === 'room.updated' || message.type === 'welcome') {
      return message.view
    }
  }

  return null
}

describe('a set of team turns', () => {
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

  /**
   * Anna and Ben are the first team, Carl the second, Dora the third — or
   * Carl's teammate when there are two.
   */
  const openTeams = async (settings: RoomSettings) => {
    const { code, host, hostToken } = await harness.openRoom(settings)
    const wall = await pairedWall({ code, hostToken })
    const seats: Peer<PlayerServerMessage>[] = []

    for (const nickname of ['Anna', 'Ben', 'Carl', 'Dora']) {
      seats.push(await harness.seat({ code, nickname }))
    }

    const [anna, ben, carl, dora] = seats

    if (
      anna === undefined ||
      ben === undefined ||
      carl === undefined ||
      dora === undefined
    ) {
      throw new Error('Four seats were asked for')
    }

    host.send({
      assignment:
        settings.teams.kind === 'drawn' && settings.teams.count === 2
          ? [
              [idOf(anna), idOf(ben)],
              [idOf(carl), idOf(dora)]
            ]
          : [[idOf(anna), idOf(ben)], [idOf(carl)], [idOf(dora)]],
      type: 'host.drawTeams'
    })
    await waitFor(
      () => hostView(host)?.teams[0]?.seatIds.length === 2,
      'the deal'
    )

    return { anna, ben, carl, dora, host, wall }
  }

  const turnOpens = async (host: Peer<HostServerMessage>, index: number) => {
    await waitFor(
      () =>
        hostView(host)?.phase === 'playing' &&
        hostView(host)?.round?.turn?.index === index &&
        hostQuestion(host) !== null,
      `turn ${index + 1} to open`
    )

    return {
      answer: hostQuestion(host)?.answer ?? '',
      roundId: hostView(host)?.round?.id ?? ''
    }
  }

  const playThroughTwoTurns = async (
    host: Peer<HostServerMessage>,
    playStyle: PlayStyle | undefined
  ) => {
    for (const index of [0, 1]) {
      const { roundId } = await turnOpens(host, index)

      host.send({ roundId, type: 'host.reveal' })
      await waitFor(() => hostView(host)?.phase === 'revealed', 'the reveal')
      host.send({ playStyle, type: 'host.nextRound' })
    }
  }

  it('[team-turns] plays one round per team, each answered from its own screen', async () => {
    const { ben, carl, host, wall } = await openTeams(QUIZ_IN_THREE_TEAMS)

    host.send({ playStyle: 'byTeam', type: 'host.startRound' })

    const first = await turnOpens(host, 0)

    expect(hostView(host)?.round?.turn).toEqual({
      index: 0,
      of: 3,
      seatIds: null,
      style: 'byTeam',
      teamIds: ['team-1']
    })
    expect(hostView(host)?.round?.openedWithPlayerIds).toHaveLength(2)

    carl.send({
      answer: { guess: first.answer, kind: 'typed' },
      roundId: first.roundId,
      type: 'player.answer'
    })
    await waitFor(() => errorsIn(carl).length > 0, 'Carl to be told to wait')

    expect(errorsIn(carl)[0]?.code).toBe('not_your_turn')

    ben.send({
      answer: { guess: first.answer, kind: 'typed' },
      roundId: first.roundId,
      type: 'player.answer'
    })
    await waitFor(
      () => hostView(host)?.phase === 'revealed',
      'the first reveal'
    )

    host.send({ type: 'host.nextRound' })

    const second = await turnOpens(host, 1)

    carl.send({
      answer: { guess: second.answer, kind: 'typed' },
      roundId: second.roundId,
      type: 'player.answer'
    })
    await waitFor(
      () => hostView(host)?.phase === 'revealed',
      'the second reveal'
    )

    host.send({ type: 'host.nextRound' })

    const third = await turnOpens(host, 2)

    wall.send({
      answer: { guess: third.answer, kind: 'typed' },
      roundId: third.roundId,
      type: 'wall.answer'
    })
    await waitFor(
      () => hostView(host)?.phase === 'revealed',
      'the third reveal'
    )

    const view = hostView(host)
    const score = (name: string) =>
      view?.players.find((player) => player.nickname === name)?.score ?? 0

    expect(view?.round?.index).toBe(1)
    expect(score('Anna')).toBeGreaterThan(0)
    expect(score('Anna')).toBe(score('Ben'))
    expect(view?.teams[0]?.score).toBe(score('Anna'))
    expect(score('Carl')).toBeGreaterThan(0)
    expect(score('Dora')).toBeGreaterThan(0)
    expect(view?.teams.every((team) => team.score > 0)).toBe(true)
  })

  it('[team-turns] counts a set as one round and hands the next set to the next team', async () => {
    const { carl, host } = await openTeams(QUIZ_IN_TWO_TEAMS)

    host.send({ playStyle: 'byTeam', type: 'host.startRound' })
    await playThroughTwoTurns(host, undefined)
    await turnOpens(host, 0)

    expect(hostView(host)?.round?.index).toBe(2)
    expect(hostView(host)?.round?.turn?.teamIds).toEqual(['team-2'])

    expect(playerView(carl)?.round?.turn).toEqual({
      index: 0,
      of: 2,
      seatIds: null,
      style: 'byTeam',
      teamIds: ['team-2']
    })
  })

  it('[team-turns] finishes a set before the host’s word on the next round lands', async () => {
    const { host } = await openTeams(QUIZ_IN_TWO_TEAMS)

    host.send({ playStyle: 'byTeam', type: 'host.startRound' })
    await playThroughTwoTurns(host, 'together')
    await waitFor(
      () =>
        hostView(host)?.phase === 'playing' &&
        hostView(host)?.round?.index === 2,
      'the second round'
    )

    expect(hostView(host)?.round?.turn).toBeNull()
    expect(hostView(host)?.round?.openedWithPlayerIds).toHaveLength(4)
  })

  it('[team-turns] keeps the wall out of a round everyone plays', async () => {
    const { host, wall } = await openTeams(QUIZ_IN_THREE_TEAMS)

    host.send({ type: 'host.startRound' })
    await waitFor(() => hostView(host)?.phase === 'playing', 'the question')

    wall.send({
      answer: { guess: 'Paris', kind: 'typed' },
      roundId: hostView(host)?.round?.id ?? '',
      type: 'wall.answer'
    })
    await waitFor(() => errorsIn(wall).length > 0, 'the refusal')

    expect(errorsIn(wall)[0]?.code).toBe('wall_cannot_answer')
  })

  it('[team-turns] refuses a set the room cannot play', async () => {
    const { code, host } = await harness.openRoom(FAST_GAME)

    await harness.seat({ code, nickname: 'Anna' })
    host.send({ playStyle: 'byTeam', type: 'host.startRound' })
    await waitFor(() => errorsIn(host).length > 0, 'the refusal')

    expect(errorsIn(host)[0]?.code).toBe('invalid_message')
    expect(hostView(host)?.phase).toBe('lobby')
  })

  it('[team-turns] refuses the wall’s frame from a phone', async () => {
    const { anna, host } = await openTeams(QUIZ_IN_THREE_TEAMS)

    host.send({ playStyle: 'byTeam', type: 'host.startRound' })

    const first = await turnOpens(host, 0)

    anna.send({
      answer: { guess: first.answer, kind: 'typed' },
      roundId: first.roundId,
      type: 'wall.answer'
    })
    await waitFor(() => errorsIn(anna).length > 0, 'the refusal')

    expect(errorsIn(anna)[0]?.code).toBe('invalid_message')
  })
  const scoreOf = (host: Peer<HostServerMessage>, name: string) =>
    hostView(host)?.players.find((player) => player.nickname === name)?.score ??
    0

  it('[team-turns] hands a solo turn to one seat, the next one down every set', async () => {
    const { anna, ben, host, wall } = await openTeams(QUIZ_IN_TWO_TEAMS)

    host.send({ playStyle: 'solo', type: 'host.startRound' })

    const first = await turnOpens(host, 0)

    expect(hostView(host)?.round?.turn).toEqual({
      index: 0,
      of: 2,
      seatIds: [idOf(anna)],
      style: 'solo',
      teamIds: ['team-1']
    })

    for (const peer of [ben, wall]) {
      peer.send({
        answer: { guess: first.answer, kind: 'typed' },
        roundId: first.roundId,
        type: peer === wall ? 'wall.answer' : 'player.answer'
      })
    }
    await waitFor(
      () => errorsIn(ben).length > 0 && errorsIn(wall).length > 0,
      'Ben and the wall to be refused'
    )

    expect(errorsIn(ben)[0]?.code).toBe('not_your_turn')
    expect(errorsIn(wall)[0]?.code).toBe('wall_cannot_answer')

    anna.send({
      answer: { guess: first.answer, kind: 'typed' },
      roundId: first.roundId,
      type: 'player.answer'
    })
    await waitFor(() => hostView(host)?.phase === 'revealed', 'the reveal')

    expect(scoreOf(host, 'Anna')).toBeGreaterThan(0)
    expect(scoreOf(host, 'Ben')).toBe(0)

    host.send({ type: 'host.nextRound' })
    await turnOpens(host, 1)
    host.send({ roundId: hostView(host)?.round?.id ?? '', type: 'host.reveal' })
    await waitFor(() => hostView(host)?.phase === 'revealed', 'the reveal')
    host.send({ type: 'host.nextRound' })
    await turnOpens(host, 0)

    expect(hostView(host)?.round?.turn?.teamIds).toEqual(['team-2'])
    expect(hostView(host)?.round?.turn?.seatIds).toHaveLength(1)
    expect(hostView(host)?.round?.turn?.seatIds).not.toContain(
      hostView(host)?.players.find((player) => player.nickname === 'Carl')?.id
    )
  })

  it('[team-turns] sets two seats of two teams head to head in a duel', async () => {
    const { anna, ben, carl, dora, host } = await openTeams(QUIZ_IN_TWO_TEAMS)

    host.send({ playStyle: 'duel', type: 'host.startRound' })

    const first = await turnOpens(host, 0)

    expect(hostView(host)?.round?.turn).toEqual({
      index: 0,
      of: 1,
      seatIds: [idOf(anna), idOf(carl)],
      style: 'duel',
      teamIds: ['team-1', 'team-2']
    })

    ben.send({
      answer: { guess: first.answer, kind: 'typed' },
      roundId: first.roundId,
      type: 'player.answer'
    })
    await waitFor(() => errorsIn(ben).length > 0, 'Ben to be refused')

    expect(errorsIn(ben)[0]?.code).toBe('not_your_turn')

    anna.send({
      answer: { guess: first.answer, kind: 'typed' },
      roundId: first.roundId,
      type: 'player.answer'
    })
    carl.send({
      answer: { guess: 'Nowhere at all', kind: 'typed' },
      roundId: first.roundId,
      type: 'player.answer'
    })
    await waitFor(
      () => (hostView(host)?.round?.answers.length ?? 0) >= 2,
      'both duellists to answer'
    )
    host.send({ roundId: first.roundId, type: 'host.reveal' })
    await waitFor(() => hostView(host)?.phase === 'revealed', 'the reveal')

    expect(scoreOf(host, 'Anna')).toBeGreaterThan(0)
    expect(scoreOf(host, 'Carl')).toBe(0)
    expect(scoreOf(host, 'Dora')).toBe(0)

    host.send({ type: 'host.nextRound' })
    await waitFor(
      () =>
        hostView(host)?.phase === 'playing' &&
        hostView(host)?.round?.index === 2,
      'the second duel'
    )

    expect(hostView(host)?.round?.turn?.seatIds).toEqual([
      idOf(ben),
      idOf(dora)
    ])
  })
})
