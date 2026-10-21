import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  DEFAULT_BOARD_SETTINGS,
  DEFAULT_TRACK_SETTINGS
} from '@melee/protocol/board'
import { DEFAULT_ROOM_SETTINGS } from '@melee/protocol/room'

import {
  HOST_SETUP_KEY,
  ROOM_SCREEN_KEY,
  readStoredHostPreferences,
  readStoredRoomScreen,
  writeStoredRoomScreen
} from './preferences-storage'

const storedBeforeTheBoard = (teams: object) => {
  const { board: _board, ...room } = {
    ...DEFAULT_ROOM_SETTINGS,
    teams
  }

  return JSON.stringify({ games: {}, room })
}

describe('readStoredHostPreferences', () => {
  let store: Map<string, string>

  beforeEach(() => {
    store = new Map()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      removeItem: (key: string) => store.delete(key),
      setItem: (key: string, value: string) => store.set(key, value)
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('[host-setup] reads a setup in teams stored before the board as one raced on the track', () => {
    store.set(HOST_SETUP_KEY, storedBeforeTheBoard({ count: 3, kind: 'drawn' }))

    const stored = readStoredHostPreferences()

    expect(stored.status === 'success' && stored.data?.room.board).toEqual(
      DEFAULT_TRACK_SETTINGS
    )
  })

  it('[host-setup] reads a setup without teams stored before the board as one with no track', () => {
    store.set(HOST_SETUP_KEY, storedBeforeTheBoard({ kind: 'off' }))

    const stored = readStoredHostPreferences()

    expect(stored.status === 'success' && stored.data?.room.board).toEqual(
      DEFAULT_BOARD_SETTINGS
    )
  })

  it('[host-setup] keeps a track stored before the catch-up, with it off', () => {
    store.set(
      HOST_SETUP_KEY,
      JSON.stringify({
        games: {},
        room: {
          ...DEFAULT_ROOM_SETTINGS,
          board: { kind: 'track', length: 40, strategy: 'onePointOneCase' },
          teams: { count: 3, kind: 'drawn' }
        }
      })
    )

    const stored = readStoredHostPreferences()

    expect(stored.status === 'success' && stored.data?.room.board).toEqual({
      ...DEFAULT_TRACK_SETTINGS,
      length: 40
    })
  })
})

describe('readStoredRoomScreen', () => {
  let store: Map<string, string>

  beforeEach(() => {
    store = new Map()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      removeItem: (key: string) => store.delete(key),
      setItem: (key: string, value: string) => store.set(key, value)
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('[room-screen] reads a machine never said to be the room’s as the host’s own', () => {
    expect(readStoredRoomScreen()).toEqual({ data: false, status: 'success' })
  })

  it('[room-screen] reads back what the switch wrote, both ways', () => {
    writeStoredRoomScreen(true)
    expect(readStoredRoomScreen()).toEqual({ data: true, status: 'success' })

    writeStoredRoomScreen(false)
    expect(readStoredRoomScreen()).toEqual({ data: false, status: 'success' })
  })

  it('[room-screen] refuses a value it never writes', () => {
    store.set(ROOM_SCREEN_KEY, 'yes')

    expect(readStoredRoomScreen().status).toBe('failure')
  })
})
