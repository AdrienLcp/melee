import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  DEFAULT_BLINDTEST_SETTINGS,
  DEFAULT_BUZZER_SETTINGS,
  DEFAULT_CHALLENGE_SETTINGS,
  type GameSettings
} from '@melee/protocol/game'
import { createRoomResponseSchema } from '@melee/protocol/http'
import type { RoomSettings } from '@melee/protocol/room'
import { API_ROUTES } from '@melee/protocol/routes'
import { hostServerMessageSchema } from '@melee/protocol/server-message'
import { PROTOCOL_VERSION } from '@melee/protocol/version'

import { startRoomHarness } from './node-room-harness'
import {
  errorsIn,
  FAST_GAME,
  halves,
  hostView,
  playerView,
  type RoomHarness,
  waitFor
} from './room-harness'

vi.mock('@/infrastructure/music/deezer-client', async () => {
  const { deezerClientStub } = await import('./room-harness')

  return deezerClientStub()
})

const EVENING: RoomSettings = {
  ...FAST_GAME,
  lineUp: [...FAST_GAME.lineUp, DEFAULT_BUZZER_SETTINGS],
  roundCount: 6
}

const ON_THE_BUZZER: RoomSettings = {
  ...EVENING,
  game: DEFAULT_BUZZER_SETTINGS,
  lineUpAt: 1
}

const ON_THE_CHARTS: GameSettings = {
  ...DEFAULT_BLINDTEST_SETTINGS,
  roundDurationMs: 5_000
}

const FILM_SCORES: GameSettings = { ...ON_THE_CHARTS, source: { kind: 'film' } }

const TWO_BLIND_TESTS: RoomSettings = {
  ...FAST_GAME,
  game: ON_THE_CHARTS,
  lineUp: [ON_THE_CHARTS, ON_THE_CHARTS],
  roundCount: 6
}

describe('an evening of several games', () => {
  let harness: RoomHarness

  beforeEach(async () => {
    harness = await startRoomHarness()
  })

  afterEach(async () => {
    await harness.stop()
  })

  it('[line-up] carries every seat’s score across a change of game between two rounds', async () => {
    const { code, host } = await harness.openRoom(EVENING)
    const anna = await harness.seat({ code, nickname: 'Anna' })
    const annaId = playerView(anna)?.youId ?? ''

    host.send({ type: 'host.startRound' })
    await waitFor(() => hostView(host)?.phase === 'playing', 'the clip')

    const roundId = hostView(host)?.round?.id ?? ''

    anna.send({ roundId, type: 'player.buzz' })
    await waitFor(() => hostView(host)?.phase === 'buzzed', 'the buzz')
    host.send({
      playerId: annaId,
      roundId,
      type: 'host.judge',
      verdict: halves(true, true)
    })
    await waitFor(() => hostView(host)?.phase === 'revealed', 'the reveal')

    const paid = hostView(host)?.players[0]?.score ?? 0

    host.send({ settings: ON_THE_BUZZER, type: 'host.updateSettings' })
    await waitFor(
      () => hostView(host)?.settings.game?.kind === 'buzzer',
      'the switch'
    )
    host.send({ type: 'host.nextRound' })
    await waitFor(
      () => hostView(host)?.round?.content.kind === 'buzzer',
      'a round of the next game'
    )

    expect(paid).toBeGreaterThan(0)
    expect(hostView(host)?.players[0]?.score).toBe(paid)
  })

  it('[line-up] refuses a game the line-up does not tick', async () => {
    const { host } = await harness.openRoom(EVENING)

    host.send({
      settings: { ...ON_THE_BUZZER, lineUpAt: 0 },
      type: 'host.updateSettings'
    })
    await waitFor(() => errorsIn(host).length > 0, 'the refusal')

    expect(errorsIn(host)[0]?.code).toBe('invalid_message')
    expect(hostView(host)?.settings.lineUpAt).toBe(0)
    expect(hostView(host)?.settings.game?.kind).toBe('blindtest')
  })

  it('[running-order] keeps the order a host put the evening in', async () => {
    const { host } = await harness.openRoom(EVENING)

    host.send({
      settings: { ...EVENING, runningOrder: [1, null, 0] },
      type: 'host.updateSettings'
    })
    await waitFor(
      () => hostView(host)?.settings.runningOrder !== null,
      'the order'
    )

    expect(hostView(host)?.settings.runningOrder).toEqual([1, null, 0])
  })

  it('[running-order] refuses an order pointing past the line-up', async () => {
    const { host } = await harness.openRoom(EVENING)

    host.send({
      settings: { ...EVENING, runningOrder: [0, 2] },
      type: 'host.updateSettings'
    })
    await waitFor(() => errorsIn(host).length > 0, 'the refusal')

    expect(errorsIn(host)[0]?.code).toBe('invalid_message')
    expect(hostView(host)?.settings.runningOrder).toBeNull()
  })

  it('[line-up] writes the game back into its entry, so a variant keeps its own source', async () => {
    const { host } = await harness.openRoom(TWO_BLIND_TESTS)

    host.send({
      settings: { ...TWO_BLIND_TESTS, game: FILM_SCORES, lineUpAt: 1 },
      type: 'host.updateSettings'
    })
    await waitFor(
      () => hostView(host)?.settings.lineUpAt === 1,
      'the move to the second blind test'
    )

    const settings = hostView(host)?.settings ?? TWO_BLIND_TESTS

    host.send({
      settings: {
        ...settings,
        game: ON_THE_CHARTS,
        lineUpAt: 0
      },
      type: 'host.updateSettings'
    })
    await waitFor(
      () => hostView(host)?.settings.lineUpAt === 0,
      'the move back to the first'
    )

    expect(hostView(host)?.settings.lineUp).toEqual([
      ON_THE_CHARTS,
      FILM_SCORES
    ])
    expect(hostView(host)?.settings.game).toEqual(ON_THE_CHARTS)
  })

  it('[line-up] keeps on the round the variant it was opened from, when the settings move to another', async () => {
    const { code, host } = await harness.openRoom(TWO_BLIND_TESTS)
    await harness.seat({ code, nickname: 'Anna' })

    host.send({ type: 'host.startRound' })
    await waitFor(() => hostView(host)?.phase === 'playing', 'the clip')

    host.send({
      settings: { ...TWO_BLIND_TESTS, game: FILM_SCORES, lineUpAt: 1 },
      type: 'host.updateSettings'
    })
    await waitFor(
      () => hostView(host)?.settings.lineUpAt === 1,
      'the move to the second blind test'
    )

    expect(hostView(host)?.round?.lineUpAt).toBe(0)
  })

  it('[line-up] counts each round towards its entry, until the table plays again', async () => {
    const { code, host } = await harness.openRoom(EVENING)
    await harness.seat({ code, nickname: 'Anna' })

    expect(hostView(host)?.lineUpPlayed).toEqual([0, 0])

    host.send({ type: 'host.startRound' })
    await waitFor(() => hostView(host)?.phase === 'playing', 'the clip')

    expect(hostView(host)?.lineUpPlayed).toEqual([1, 0])

    host.send({ type: 'host.endGame' })
    await waitFor(() => hostView(host)?.phase === 'finished', 'the board')
    host.send({ type: 'host.playAgain' })
    await waitFor(() => hostView(host)?.phase === 'lobby', 'the new game')

    expect(hostView(host)?.lineUpPlayed).toEqual([0, 0])
  })

  it('[line-up] ends an evening once every host-brought entry is played', async () => {
    const hostBrought: RoomSettings = {
      ...FAST_GAME,
      game: DEFAULT_BUZZER_SETTINGS,
      lineUp: [DEFAULT_BUZZER_SETTINGS, DEFAULT_CHALLENGE_SETTINGS],
      lineUpAt: 0,
      roundCount: 6
    }
    const { code, host } = await harness.openRoom(hostBrought)
    await harness.seat({ code, nickname: 'Anna' })

    host.send({ type: 'host.startRound' })
    await waitFor(() => hostView(host)?.phase === 'playing', 'the buzzer')
    host.send({ roundId: hostView(host)?.round?.id ?? '', type: 'host.reveal' })
    await waitFor(() => hostView(host)?.phase === 'revealed', 'its reveal')
    host.send({
      settings: {
        ...hostBrought,
        game: DEFAULT_CHALLENGE_SETTINGS,
        lineUpAt: 1
      },
      type: 'host.updateSettings'
    })
    await waitFor(() => hostView(host)?.settings.lineUpAt === 1, 'the draw')
    host.send({ challengeText: 'Mime a film', type: 'host.nextRound' })
    await waitFor(
      () => hostView(host)?.round?.content.kind === 'challenge',
      'the challenge'
    )
    await waitFor(() => hostView(host)?.phase === 'playing', 'its line')
    host.send({ roundId: hostView(host)?.round?.id ?? '', type: 'host.reveal' })
    await waitFor(() => hostView(host)?.phase === 'revealed', 'its reveal')
    host.send({ type: 'host.nextRound' })
    await waitFor(() => hostView(host)?.phase === 'finished', 'the board')

    expect(hostView(host)?.round).toBeNull()
  })

  it('[ready] shows a seat back at the table to every screen, until the round opens', async () => {
    const { code, host } = await harness.openRoom(EVENING)
    const anna = await harness.seat({ code, nickname: 'Anna' })

    expect(hostView(host)?.players[0]?.isReady).toBe(false)

    anna.send({ isReady: true, type: 'player.ready' })
    await waitFor(
      () => hostView(host)?.players[0]?.isReady === true,
      'the ready to reach the console'
    )
    host.send({ type: 'host.startRound' })
    await waitFor(() => hostView(host)?.phase === 'playing', 'the clip')

    expect(hostView(host)?.players[0]?.isReady).toBe(false)
  })

  it('[ready] refuses a ready while the round is under way', async () => {
    const { code, host } = await harness.openRoom(EVENING)
    const anna = await harness.seat({ code, nickname: 'Anna' })

    host.send({ type: 'host.startRound' })
    await waitFor(() => hostView(host)?.phase === 'playing', 'the clip')
    anna.send({ isReady: true, type: 'player.ready' })
    await waitFor(() => errorsIn(anna).length > 0, 'the refusal')

    expect(errorsIn(anna)[0]?.code).toBe('wrong_phase')
  })

  it('[line-up] opens a room on the games ticked, four rounds a game', async () => {
    const response = await fetch(
      `http://${harness.origin}${API_ROUTES.rooms}`,
      {
        body: JSON.stringify({ games: ['quiz', 'blindtest', 'buzzer'] }),
        headers: { 'content-type': 'application/json' },
        method: 'POST'
      }
    )
    const { code, hostToken } = createRoomResponseSchema.parse(
      await response.json()
    )
    const host = await harness.connect(code, hostServerMessageSchema)

    host.send({
      hostToken,
      protocolVersion: PROTOCOL_VERSION,
      role: 'host',
      type: 'hello'
    })
    await waitFor(() => hostView(host) !== null, 'the host to be seated')

    expect(hostView(host)?.settings).toMatchObject({
      board: { kind: 'off' },
      game: { kind: 'quiz' },
      lineUp: [{ kind: 'quiz' }, { kind: 'blindtest' }, { kind: 'buzzer' }],
      lineUpAt: 0,
      roundCount: 12,
      teams: { kind: 'off' }
    })
  })

  it('[line-up] refuses a game ticked twice at the door', async () => {
    const response = await fetch(
      `http://${harness.origin}${API_ROUTES.rooms}`,
      {
        body: JSON.stringify({ games: ['quiz', 'quiz'] }),
        headers: { 'content-type': 'application/json' },
        method: 'POST'
      }
    )

    expect(response.status).toBe(400)
  })
})
