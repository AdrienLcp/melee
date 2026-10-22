import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_QUIZ_SETTINGS } from '@melee/protocol/game'
import {
  DEFAULT_MODE_SETTINGS,
  DEFAULT_ROOM_SETTINGS,
  type RoomSettings
} from '@melee/protocol/room'
import type {
  HostServerMessage,
  PlayerServerMessage
} from '@melee/protocol/server-message'

import { startRoomHarness } from './node-room-harness'
import {
  errorsIn,
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

/** The stub bank holds three questions, one per round. */
const QUIZ_IN_TWO_TEAMS: RoomSettings = {
  ...DEFAULT_ROOM_SETTINGS,
  countdownMs: 20,
  game: { ...DEFAULT_QUIZ_SETTINGS, roundDurationMs: 5_000 },
  mode: DEFAULT_MODE_SETTINGS.typed,
  roundCount: 3,
  teams: { count: 2, kind: 'drawn' }
}

const idOf = (player: Peer<PlayerServerMessage>): string =>
  playerView(player)?.youId ?? ''

const scoreOf = (host: Peer<HostServerMessage>, name: string) =>
  hostView(host)?.players.find((player) => player.nickname === name)?.score ?? 0

describe('a duel', () => {
  let harness: RoomHarness

  beforeEach(async () => {
    harness = await startRoomHarness()
  })

  afterEach(async () => {
    await harness.stop()
  })

  /** Anna and Ben are the first team, Carl and Dora the second. */
  const openTeams = async (settings: RoomSettings) => {
    const { code, host } = await harness.openRoom(settings)
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
      assignment: [
        [idOf(anna), idOf(ben)],
        [idOf(carl), idOf(dora)]
      ],
      type: 'host.drawTeams'
    })
    await waitFor(
      () => hostView(host)?.teams[0]?.seatIds.length === 2,
      'the deal'
    )

    return { anna, ben, carl, dora, host }
  }

  const roundOpens = async (host: Peer<HostServerMessage>, index: number) => {
    await waitFor(
      () =>
        hostView(host)?.phase === 'playing' &&
        hostView(host)?.round?.index === index &&
        hostQuestion(host) !== null,
      `round ${index} to open`
    )

    return {
      answer: hostQuestion(host)?.answer ?? '',
      roundId: hostView(host)?.round?.id ?? ''
    }
  }

  const reveal = async (host: Peer<HostServerMessage>, roundId: string) => {
    host.send({ roundId, type: 'host.reveal' })
    await waitFor(() => hostView(host)?.phase === 'revealed', 'the reveal')
  }

  it('[duels] sets two seats of two teams head to head for the one round asked', async () => {
    const { anna, ben, carl, dora, host } = await openTeams(QUIZ_IN_TWO_TEAMS)

    host.send({ type: 'host.startRound' })

    const opening = await roundOpens(host, 1)

    expect(hostView(host)?.round?.duel).toBeNull()

    await reveal(host, opening.roundId)
    host.send({ isDuel: true, type: 'host.nextRound' })

    const duel = await roundOpens(host, 2)

    expect(hostView(host)?.round?.duel).toEqual({
      seatIds: [idOf(anna), idOf(carl)],
      teamIds: ['team-1', 'team-2']
    })
    expect(playerView(dora)?.round?.duel?.seatIds).toEqual([
      idOf(anna),
      idOf(carl)
    ])

    ben.send({
      answer: { guess: duel.answer, kind: 'typed' },
      roundId: duel.roundId,
      type: 'player.answer'
    })
    await waitFor(() => errorsIn(ben).length > 0, 'Ben to be refused')

    expect(errorsIn(ben)[0]?.code).toBe('not_your_turn')

    anna.send({
      answer: { guess: duel.answer, kind: 'typed' },
      roundId: duel.roundId,
      type: 'player.answer'
    })
    carl.send({
      answer: { guess: 'Nowhere at all', kind: 'typed' },
      roundId: duel.roundId,
      type: 'player.answer'
    })
    await waitFor(
      () => (hostView(host)?.round?.answers.length ?? 0) >= 2,
      'both duellists to answer'
    )
    await reveal(host, duel.roundId)

    expect(scoreOf(host, 'Anna')).toBeGreaterThan(0)
    expect(scoreOf(host, 'Ben')).toBe(0)
    expect(scoreOf(host, 'Carl')).toBe(0)

    host.send({ type: 'host.nextRound' })
    await roundOpens(host, 3)

    expect(hostView(host)?.round?.duel).toBeNull()
  })

  it('[duels] refuses a duel in a race, where the floor is decided between players', async () => {
    const { host } = await openTeams({
      ...QUIZ_IN_TWO_TEAMS,
      mode: DEFAULT_MODE_SETTINGS.buzzer
    })

    host.send({ type: 'host.startRound' })

    const { roundId } = await roundOpens(host, 1)

    await reveal(host, roundId)
    host.send({ isDuel: true, type: 'host.nextRound' })
    await waitFor(() => errorsIn(host).length > 0, 'the duel to be refused')

    expect(errorsIn(host)[0]?.code).toBe('invalid_message')
    expect(hostView(host)?.phase).toBe('revealed')
  })
})
