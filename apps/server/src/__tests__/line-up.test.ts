import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_BUZZER_SETTINGS } from '@melee/protocol/game'
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
  lineUp: ['blindtest', 'buzzer'],
  roundCount: 6
}

const ON_THE_BUZZER: RoomSettings = {
  ...EVENING,
  game: DEFAULT_BUZZER_SETTINGS
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
      settings: { ...ON_THE_BUZZER, lineUp: ['blindtest'] },
      type: 'host.updateSettings'
    })
    await waitFor(() => errorsIn(host).length > 0, 'the refusal')

    expect(errorsIn(host)[0]?.code).toBe('invalid_message')
    expect(hostView(host)?.settings.lineUp).toEqual(['blindtest', 'buzzer'])
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

  it('[line-up] opens a room on a preset’s games, length, teams and track', async () => {
    const response = await fetch(
      `http://${harness.origin}${API_ROUTES.rooms}`,
      {
        body: JSON.stringify({
          preset: {
            board: {
              catchUp: false,
              kind: 'track',
              length: 24,
              strategy: 'onePointOneCase'
            },
            lineUp: ['quiz', 'blindtest', 'buzzer'],
            roundCount: 12,
            teams: { count: 3, kind: 'drawn' }
          }
        }),
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
      board: { kind: 'track', length: 24 },
      game: { kind: 'quiz' },
      lineUp: ['quiz', 'blindtest', 'buzzer'],
      roundCount: 12,
      teams: { count: 3, kind: 'drawn' }
    })
    expect(hostView(host)?.teams).toHaveLength(3)
  })

  it('[line-up] refuses a preset of one game, which the console would take for that game’s own door', async () => {
    const response = await fetch(
      `http://${harness.origin}${API_ROUTES.rooms}`,
      {
        body: JSON.stringify({
          preset: {
            board: {
              catchUp: false,
              kind: 'track',
              length: 24,
              strategy: 'onePointOneCase'
            },
            lineUp: ['quiz'],
            roundCount: 12,
            teams: { count: 3, kind: 'drawn' }
          }
        }),
        headers: { 'content-type': 'application/json' },
        method: 'POST'
      }
    )

    expect(response.status).toBe(400)
  })
})
