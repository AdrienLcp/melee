import { describe, expect, it } from 'vitest'

import { generateHostToken } from '@melee/core/room/host-token'
import { RECONNECT_GRACE_MS } from '@melee/core/room/seat-presence'

import { newRoom } from './new-room'
import { joinAsPlayer, markPlayerDisconnected } from './room-service'
import { toPlayerView } from './room-view'

const NOW = 1_786_215_000_000

const roomWithADroppedSeat = () => {
  const room = newRoom({
    code: 'ABCD',
    games: ['blindtest'],
    hostToken: generateHostToken(),
    locale: 'fr',
    now: NOW
  })
  const joined = joinAsPlayer({
    askedPiece: null,
    newPlayerId: 'player-zoe',
    nickname: 'Zoe',
    now: NOW,
    room,
    sessionId: 'session-zoe'
  })

  if (joined.status !== 'success') {
    throw new Error('the seat should have been taken')
  }

  markPlayerDisconnected(room, joined.data.id, NOW)

  return { playerId: joined.data.id, room }
}

const seatShownAt = ({
  now,
  playerId,
  room
}: ReturnType<typeof roomWithADroppedSeat> & { now: number }) =>
  toPlayerView({
    isHostConnected: true,
    isWallConnected: false,
    now,
    room,
    youId: playerId
  }).players.find((player) => player.id === playerId)

describe('a seat whose screen just went away', () => {
  it('[presence] is still shown connected while it may come straight back', () => {
    const dropped = roomWithADroppedSeat()

    expect(
      seatShownAt({ ...dropped, now: NOW + RECONNECT_GRACE_MS - 1 })
        ?.isConnected
    ).toBe(true)
  })

  it('[presence] is shown away once the grace has run out', () => {
    const dropped = roomWithADroppedSeat()

    expect(
      seatShownAt({ ...dropped, now: NOW + RECONNECT_GRACE_MS })?.isConnected
    ).toBe(false)
  })
})
