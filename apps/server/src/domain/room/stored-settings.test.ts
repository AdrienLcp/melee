import { describe, expect, it } from 'vitest'

import { DEFAULT_TRACK_SETTINGS } from '@melee/protocol/board'
import {
  DEFAULT_ATLAS_SETTINGS,
  DEFAULT_BLACK_SQUARE_SETTINGS,
  DEFAULT_BLINDTEST_SETTINGS,
  DEFAULT_GAME_SETTINGS,
  DEFAULT_QUIZ_SETTINGS
} from '@melee/protocol/game'
import { DEFAULT_ROOM_SETTINGS } from '@melee/protocol/room'
import { catalogueOf, EVERY_STRAND } from '@melee/protocol/track'

import { parseStoredGames } from './stored-settings'

/**
 * A room's games as a deploy before the draw stored them: no `lineUpDeals`, a
 * track with no catch-up, blind tests on the arms the catalogue replaced, a
 * map on one kind of place and a black square before its answer count.
 */
const storedBeforeTheDraw = {
  openedEntries: [
    { ...DEFAULT_BLINDTEST_SETTINGS, source: { kind: 'film' } },
    { doublesLoneFinds: false, kind: 'blacksquare', roundDurationMs: 60_000 }
  ],
  settings: {
    autoAdvanceMs: null,
    board: { kind: 'track', length: 40, strategy: 'rank' },
    countdownMs: 3_000,
    game: { ...DEFAULT_BLINDTEST_SETTINGS, source: { kind: 'all' } },
    lineUp: [
      { ...DEFAULT_BLINDTEST_SETTINGS, source: { kind: 'all' } },
      { kind: 'atlas', places: 'frenchCities', roundDurationMs: 30_000 },
      {
        ...DEFAULT_BLINDTEST_SETTINGS,
        source: { decades: ['1980s'], kind: 'decade' }
      }
    ],
    lineUpAt: 0,
    mode: { kind: 'typed' },
    roundCount: 10,
    runningOrder: [0, 1, 2],
    teamScoring: DEFAULT_ROOM_SETTINGS.teamScoring,
    teams: DEFAULT_ROOM_SETTINGS.teams
  }
}

describe('a room stored before a deploy', () => {
  it('[stored] reads its games through today’s schemas, defaults and old arms included', () => {
    const onEveryStrand = {
      ...DEFAULT_BLINDTEST_SETTINGS,
      source: EVERY_STRAND
    }

    expect(parseStoredGames(storedBeforeTheDraw)).toEqual({
      decks: [],
      openedEntries: [
        {
          ...DEFAULT_BLINDTEST_SETTINGS,
          source: catalogueOf({ hasFilmScores: true })
        },
        DEFAULT_BLACK_SQUARE_SETTINGS
      ],
      ownLines: { challenge: [], mostlikely: [] },
      refusals: [],
      settings: {
        ...DEFAULT_ROOM_SETTINGS,
        board: { ...DEFAULT_TRACK_SETTINGS, strategy: 'rank' },
        game: onEveryStrand,
        lineUp: [
          onEveryStrand,
          { ...DEFAULT_ATLAS_SETTINGS, places: ['frenchCities'] },
          {
            ...DEFAULT_BLINDTEST_SETTINGS,
            source: catalogueOf({ decades: ['1980s'] })
          }
        ],
        lineUpAt: 0,
        lineUpDeals: [],
        runningOrder: [0, 1, 2]
      }
    })
  })

  it('[stored] reads a current room unchanged', () => {
    const current = {
      decks: [
        { deck: { game: 'challenge' as const, items: ['Hum it'] }, id: 'd1' },
        null
      ],
      openedEntries: Object.values(DEFAULT_GAME_SETTINGS),
      ownLines: { challenge: ['Hum it'], mostlikely: ['Who sings?'] },
      settings: {
        ...DEFAULT_ROOM_SETTINGS,
        board: { ...DEFAULT_TRACK_SETTINGS, catchUp: true },
        game: DEFAULT_QUIZ_SETTINGS,
        lineUp: [DEFAULT_QUIZ_SETTINGS, DEFAULT_ATLAS_SETTINGS],
        lineUpAt: 0,
        lineUpDeals: ['both' as const, 'chance' as const],
        runningOrder: [0, 0, 1]
      }
    }

    expect(parseStoredGames(current)).toEqual({ ...current, refusals: [] })
  })

  it('[stored] puts settings a deploy tightened back on the defaults, and says where', () => {
    const restored = parseStoredGames({
      openedEntries: [],
      settings: {
        ...DEFAULT_ROOM_SETTINGS,
        board: { ...DEFAULT_TRACK_SETTINGS, length: 500 }
      }
    })

    expect(restored.settings).toEqual(DEFAULT_ROOM_SETTINGS)
    expect(restored.refusals).toEqual(['settings.board.length'])
  })

  it('[stored] drops an opened entry a deploy retired, and says which', () => {
    const restored = parseStoredGames({
      openedEntries: [DEFAULT_QUIZ_SETTINGS, { kind: 'retired' }],
      settings: DEFAULT_ROOM_SETTINGS
    })

    expect(restored.openedEntries).toEqual([DEFAULT_QUIZ_SETTINGS])
    expect(restored.refusals).toEqual(['openedEntries.1'])
  })

  it('[stored] forgets a host’s own lines a deploy tightened, and says so', () => {
    const restored = parseStoredGames({
      openedEntries: [],
      ownLines: { challenge: ['x'.repeat(10_000)], mostlikely: [] },
      settings: DEFAULT_ROOM_SETTINGS
    })

    expect(restored.ownLines).toEqual({ challenge: [], mostlikely: [] })
    expect(restored.refusals).toEqual(['ownLines'])
  })
})
