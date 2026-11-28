import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { playerServerMessageSchema } from '@melee/protocol/server-message'
import { PROTOCOL_VERSION } from '@melee/protocol/version'

import { startRoomHarness } from './node-room-harness'
import {
  errorsIn,
  hostView,
  playerView,
  type RoomHarness,
  waitFor
} from './room-harness'

vi.mock('@melee/core/room/seat-presence', async () => {
  const { seatPresenceWithoutGrace } = await import('./room-harness')

  return seatPresenceWithoutGrace()
})

vi.mock('@/infrastructure/music/deezer-client', async () => {
  const { deezerClientStub } = await import('./room-harness')

  return deezerClientStub()
})

const ZOE_EARNED = 42_000

/**
 * A screen that lost its claim — the QR opened in a scanner's own browser,
 * then in the real one — comes back with a session nobody holds.
 */
const FRESH_SESSION = 'fresh-device-session-0001'

describe('a seat taken back by its name', () => {
  let harness: RoomHarness

  beforeEach(async () => {
    harness = await startRoomHarness()
  })

  afterEach(async () => {
    await harness.stop()
  })

  const tableWithZoeAway = async () => {
    const { code, host } = await harness.openRoom()
    const zoe = await harness.seat({ code, nickname: 'Zoe' })
    const max = await harness.seat({ code, nickname: 'Max' })
    const zoeId = playerView(zoe)?.youId ?? ''

    host.send({
      change: { kind: 'points', points: ZOE_EARNED },
      target: { kind: 'seat', playerId: zoeId },
      type: 'host.adjustScore'
    })
    await waitFor(
      () => playerView(max)?.players.some((seat) => seat.score > 0) === true,
      'Zoe’s points'
    )
    zoe.close()
    await waitFor(
      () =>
        playerView(max)?.players.find((seat) => seat.id === zoeId)
          ?.isConnected === false,
      'Zoe away'
    )

    return { code, host, max, zoeId }
  }

  const arrive = async ({
    code,
    takesBackAwaySeat
  }: {
    code: string
    takesBackAwaySeat?: true
  }) => {
    const peer = await harness.connect(code, playerServerMessageSchema)

    peer.send({
      nickname: 'zoe',
      protocolVersion: PROTOCOL_VERSION,
      role: 'player',
      sessionId: FRESH_SESSION,
      takesBackAwaySeat,
      type: 'hello'
    })

    return peer
  }

  it('[seat-back] offers the away seat to a screen arriving under its name', async () => {
    const { code } = await tableWithZoeAway()
    const arrival = await arrive({ code })

    await waitFor(() => errorsIn(arrival).length > 0, 'the refusal')

    expect(errorsIn(arrival).map(({ code }) => code)).toEqual([
      'nickname_of_away_seat'
    ])
  })

  it('[seat-back] hands the away seat over with its score', async () => {
    const { code, host, zoeId } = await tableWithZoeAway()
    const arrival = await arrive({ code, takesBackAwaySeat: true })

    await waitFor(() => playerView(arrival)?.youId != null, 'the seat')

    expect(playerView(arrival)?.youId).toBe(zoeId)
    expect(hostView(host)?.players).toHaveLength(2)
    expect(
      hostView(host)?.players.find((seat) => seat.id === zoeId)
    ).toMatchObject({ isConnected: true, nickname: 'Zoe', score: ZOE_EARNED })
  })

  it('[seat-back] never takes a seat whose screen is still there', async () => {
    const { code } = await harness.openRoom()

    await harness.seat({ code, nickname: 'Zoe' })

    const arrival = await arrive({ code, takesBackAwaySeat: true })

    await waitFor(() => errorsIn(arrival).length > 0, 'the refusal')

    expect(errorsIn(arrival).map(({ code }) => code)).toEqual([
      'nickname_taken'
    ])
  })
})
