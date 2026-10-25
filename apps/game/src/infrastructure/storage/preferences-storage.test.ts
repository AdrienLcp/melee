import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  DEFAULT_BOARD_SETTINGS,
  DEFAULT_TRACK_SETTINGS
} from '@melee/protocol/board'
import {
  DEFAULT_BLINDTEST_SETTINGS,
  DEFAULT_QUIZ_SETTINGS
} from '@melee/protocol/game'
import { DEFAULT_ROOM_SETTINGS } from '@melee/protocol/room'

import {
  HOST_SETUP_KEY,
  LINE_UP_GAMES_KEY,
  PANEL_SIDE_KEY,
  readStoredHostPreferences,
  readStoredLineUpGames,
  readStoredPanelFolded,
  readStoredPanelSide,
  readStoredSavedEvenings,
  SAVED_EVENINGS_KEY,
  writeStoredPanelFolded,
  writeStoredPanelSide
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

  it('[host-setup] reads a setup left on a screen per team as one without teams, keeping the rest', () => {
    store.set(
      HOST_SETUP_KEY,
      JSON.stringify({
        games: {},
        room: {
          ...DEFAULT_ROOM_SETTINGS,
          hasJudge: true,
          teams: { kind: 'teamsOnly' }
        }
      })
    )

    const stored = readStoredHostPreferences()

    expect(stored.status === 'success' && stored.data?.room).toMatchObject({
      hasJudge: true,
      teams: { kind: 'off' }
    })
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

describe('readStoredPanelFolded', () => {
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

  it('[panel] opens a panel never folded, on the right', () => {
    expect(readStoredPanelFolded()).toEqual({ data: false, status: 'success' })
    expect(readStoredPanelSide()).toEqual({ data: 'right', status: 'success' })
  })

  it('[panel] reads back the fold and the side the host left', () => {
    writeStoredPanelFolded(true)
    writeStoredPanelSide('left')

    expect(readStoredPanelFolded()).toEqual({ data: true, status: 'success' })
    expect(readStoredPanelSide()).toEqual({ data: 'left', status: 'success' })
  })

  it('[panel] refuses a side it never writes', () => {
    store.set(PANEL_SIDE_KEY, 'top')

    expect(readStoredPanelSide().status).toBe('failure')
  })
})

describe('readStoredLineUpGames', () => {
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

  it('[line-up] opens on no game before any evening was played', () => {
    expect(readStoredLineUpGames()).toEqual({ data: [], status: 'success' })
  })

  it('[line-up] keeps the shelved games in their order and drops the rest', () => {
    store.set(
      LINE_UP_GAMES_KEY,
      JSON.stringify(['quiz', 'chess', 'blindtest', 'quiz'])
    )

    expect(readStoredLineUpGames()).toEqual({
      data: ['quiz', 'blindtest'],
      status: 'success'
    })
  })
})

describe('readStoredSavedEvenings', () => {
  const store = new Map<string, string>()

  beforeEach(() => {
    store.clear()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      removeItem: (key: string) => store.delete(key),
      setItem: (key: string, value: string) => store.set(key, value)
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const gameNight = {
    lineUp: [DEFAULT_QUIZ_SETTINGS, DEFAULT_BLINDTEST_SETTINGS],
    name: 'Game night',
    roundCount: 8,
    runningOrder: [1, 0]
  }

  it('[saved-evening] keeps none before any evening was saved', () => {
    expect(readStoredSavedEvenings()).toEqual({ data: [], status: 'success' })
  })

  it('[saved-evening] keeps the game of an entry whose settings changed shape', () => {
    store.set(
      SAVED_EVENINGS_KEY,
      JSON.stringify([
        {
          ...gameNight,
          lineUp: [
            { ...DEFAULT_QUIZ_SETTINGS, roundDurationMs: 'long' },
            gameNight.lineUp[1]
          ]
        }
      ])
    )

    expect(readStoredSavedEvenings()).toEqual({
      data: [{ ...gameNight, lineUp: ['quiz', DEFAULT_BLINDTEST_SETTINGS] }],
      status: 'success'
    })
  })

  it('[saved-evening] reads back an entry kept as its game alone, as it was written', () => {
    const kept = { ...gameNight, lineUp: ['quiz', DEFAULT_BLINDTEST_SETTINGS] }

    store.set(SAVED_EVENINGS_KEY, JSON.stringify([kept]))

    expect(readStoredSavedEvenings()).toEqual({
      data: [kept],
      status: 'success'
    })
  })

  it('[saved-evening] drops a game this build does not serve and has the room deal the order', () => {
    store.set(
      SAVED_EVENINGS_KEY,
      JSON.stringify([
        { ...gameNight, lineUp: [{ kind: 'chess' }, ...gameNight.lineUp] },
        { ...gameNight, lineUp: [{ kind: 'chess' }], name: 'Gone' },
        { name: 'Broken' }
      ])
    )

    expect(readStoredSavedEvenings()).toEqual({
      data: [{ ...gameNight, runningOrder: [] }],
      status: 'success'
    })
  })
})
