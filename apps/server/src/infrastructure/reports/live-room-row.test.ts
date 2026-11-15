import { describe, expect, it } from 'vitest'

import { DEFAULT_ROOM_SETTINGS } from '@melee/protocol/room'

import { newRoom } from '@/domain/room/new-room'

import {
  LIVE_ROOM_TOUCH_MS,
  type LiveRoomFacts,
  liveRoomRowToWrite
} from './live-room-row'

const OPENED_AT = 1_000_000

const room = {
  ...newRoom({
    code: 'ABCD',
    games: [],
    hostToken: 'host-token-of-thirty-two-chars-xx',
    locale: 'fr',
    now: OPENED_AT
  }),
  settings: DEFAULT_ROOM_SETTINGS
}

const FACTS: LiveRoomFacts = {
  game: 'quiz',
  phase: 'lobby',
  roundIndex: null,
  seatCount: 2,
  wallCount: 0
}

describe('liveRoomRowToWrite', () => {
  it('[live-rooms] writes the first row, opened when the room was', () => {
    expect(
      liveRoomRowToWrite({ facts: FACTS, last: null, now: OPENED_AT + 5, room })
    ).toEqual({
      ...FACTS,
      closedAt: null,
      code: 'ABCD',
      openedAt: OPENED_AT,
      updatedAt: OPENED_AT + 5
    })
  })

  it('[live-rooms] skips a commit that changes nothing the page shows', () => {
    expect(
      liveRoomRowToWrite({
        facts: FACTS,
        last: { at: OPENED_AT, facts: FACTS },
        now: OPENED_AT + LIVE_ROOM_TOUCH_MS - 1,
        room
      })
    ).toBeNull()
  })

  it('[live-rooms] writes again on a change, or once the touch falls due', () => {
    const last = { at: OPENED_AT, facts: FACTS }

    expect(
      liveRoomRowToWrite({
        facts: { ...FACTS, seatCount: 3 },
        last,
        now: OPENED_AT + 1,
        room
      })?.seatCount
    ).toBe(3)
    expect(
      liveRoomRowToWrite({
        facts: FACTS,
        last,
        now: OPENED_AT + LIVE_ROOM_TOUCH_MS,
        room
      })?.updatedAt
    ).toBe(OPENED_AT + LIVE_ROOM_TOUCH_MS)
  })
})
