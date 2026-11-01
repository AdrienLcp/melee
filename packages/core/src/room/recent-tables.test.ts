import { describe, expect, it } from 'vitest'

import {
  DEFAULT_BUZZER_SETTINGS,
  DEFAULT_QUIZ_SETTINGS,
  DEFAULT_TIMELINE_SETTINGS
} from '@melee/protocol/game'
import { DEFAULT_ROOM_SETTINGS, type RoomSettings } from '@melee/protocol/room'

import {
  readyMadeLineUpsFor,
  savedEveningOfReadyMade
} from './ready-made-line-ups'
import {
  gamesOfPlayedLineUp,
  homeLineUps,
  isSameLineUp,
  type PlayedLineUp,
  RECENT_TABLES_MAX,
  type RecentTable,
  readyMadeOfTable,
  recentTableOf,
  savedEveningOfRecent,
  withTablePlayed
} from './recent-tables'
import {
  type SavedEntry,
  type SavedEvening,
  withSavedEvening
} from './saved-evening'

const quizThenBuzzer = {
  lineUp: [DEFAULT_QUIZ_SETTINGS, DEFAULT_BUZZER_SETTINGS],
  lineUpDeals: ['both', 'row'],
  roundCount: 10,
  runningOrder: [0, 1]
} satisfies PlayedLineUp & Pick<RoomSettings, 'lineUp'>

const timelineAlone: PlayedLineUp = {
  lineUp: [DEFAULT_TIMELINE_SETTINGS],
  lineUpDeals: [],
  roundCount: 5,
  runningOrder: []
}

const tableOn = ({
  lineUp,
  playedAt,
  roomCode
}: {
  lineUp: PlayedLineUp
  playedAt: number
  roomCode: string
}): RecentTable => ({
  ...lineUp,
  playedAt,
  readyMade: null,
  roomCode,
  roundsPlayed: 3
})

const eveningOn = (lineUp: PlayedLineUp, name: string): SavedEvening => ({
  ...lineUp,
  name
})

/** What storage hands back for `entry` when it was written with its keys the other way round. */
const readBackWithKeysReversed = (entry: SavedEntry): SavedEntry =>
  JSON.parse(
    JSON.stringify(
      typeof entry === 'string'
        ? entry
        : Object.fromEntries(Object.entries(entry).toReversed())
    )
  )

describe('recentTableOf', () => {
  it('[recent-tables] keeps the line-up the room plays and not the rest of its settings', () => {
    const settings: RoomSettings = {
      ...DEFAULT_ROOM_SETTINGS,
      ...quizThenBuzzer,
      lineUpAt: 1
    }

    expect(
      recentTableOf({
        now: 1_000,
        readyMade: 'quick',
        roomCode: 'ABCD',
        roundsPlayed: 4,
        settings
      })
    ).toEqual({
      ...quizThenBuzzer,
      playedAt: 1_000,
      readyMade: 'quick',
      roomCode: 'ABCD',
      roundsPlayed: 4
    })
  })
})

describe('isSameLineUp', () => {
  it('[recent-tables] is the same line-up whatever order its keys were written in', () => {
    const readBack = {
      ...quizThenBuzzer,
      lineUp: quizThenBuzzer.lineUp.map(readBackWithKeysReversed)
    }

    expect(isSameLineUp({ left: quizThenBuzzer, right: readBack })).toBe(true)
  })

  it('[recent-tables] leaves the running order out', () => {
    expect(
      isSameLineUp({
        left: quizThenBuzzer,
        right: { ...quizThenBuzzer, runningOrder: [] }
      })
    ).toBe(true)
  })

  it('[recent-tables] reads deals left empty as every entry on its default', () => {
    expect(
      isSameLineUp({
        left: quizThenBuzzer,
        right: { ...quizThenBuzzer, lineUpDeals: [] }
      })
    ).toBe(true)
    expect(
      isSameLineUp({
        left: quizThenBuzzer,
        right: { ...quizThenBuzzer, lineUpDeals: ['chance'] }
      })
    ).toBe(false)
  })

  it('[recent-tables] tells apart another round count, another setting or another entry', () => {
    expect(
      isSameLineUp({
        left: quizThenBuzzer,
        right: { ...quizThenBuzzer, roundCount: 12 }
      })
    ).toBe(false)
    expect(
      isSameLineUp({
        left: quizThenBuzzer,
        right: {
          ...quizThenBuzzer,
          lineUp: [
            {
              ...DEFAULT_QUIZ_SETTINGS,
              wellKnownOnly: !DEFAULT_QUIZ_SETTINGS.wellKnownOnly
            },
            DEFAULT_BUZZER_SETTINGS
          ]
        }
      })
    ).toBe(false)
    expect(
      isSameLineUp({
        left: quizThenBuzzer,
        right: {
          ...quizThenBuzzer,
          lineUp: [DEFAULT_BUZZER_SETTINGS, DEFAULT_QUIZ_SETTINGS]
        }
      })
    ).toBe(false)
  })

  it('[recent-tables] holds an entry kept as its game alone equal to that game alone', () => {
    const lost: PlayedLineUp = { ...quizThenBuzzer, lineUp: ['quiz', 'buzzer'] }

    expect(isSameLineUp({ left: lost, right: { ...lost } })).toBe(true)
    expect(isSameLineUp({ left: lost, right: quizThenBuzzer })).toBe(false)
  })
})

describe('withTablePlayed', () => {
  const earlier = tableOn({
    lineUp: timelineAlone,
    playedAt: 1,
    roomCode: 'ABCD'
  })

  it('[recent-tables] puts the table first, in place of the same room recorded before', () => {
    const later = { ...earlier, playedAt: 2, roundsPlayed: 4 }
    const other = tableOn({
      lineUp: quizThenBuzzer,
      playedAt: 0,
      roomCode: 'EFGH'
    })

    expect(
      withTablePlayed({ recents: [other, earlier], table: later })
    ).toEqual([later, other])
  })

  it('[recent-tables] keeps one table per line-up, the latest', () => {
    const again = tableOn({
      lineUp: timelineAlone,
      playedAt: 2,
      roomCode: 'JKLM'
    })

    expect(withTablePlayed({ recents: [earlier], table: again })).toEqual([
      again
    ])
  })

  it('[recent-tables] forgets the oldest past the most it keeps', () => {
    const recents = Array.from({ length: RECENT_TABLES_MAX }, (_, at) =>
      tableOn({
        lineUp: { ...timelineAlone, roundCount: at + 1 },
        playedAt: RECENT_TABLES_MAX - at,
        roomCode: `AB${at}C`
      })
    )
    const table = tableOn({
      lineUp: quizThenBuzzer,
      playedAt: 100,
      roomCode: 'JKLM'
    })

    expect(withTablePlayed({ recents, table })).toEqual([
      table,
      ...recents.slice(0, -1)
    ])
  })
})

describe('homeLineUps', () => {
  it('[recent-tables] lists every saved line-up in its order, then the tables nobody saved, the latest first', () => {
    const night = eveningOn(quizThenBuzzer, 'Night')
    const quiet = eveningOn(timelineAlone, 'Quiet')
    const nightPlayed = tableOn({
      lineUp: quizThenBuzzer,
      playedAt: 5,
      roomCode: 'ABCD'
    })
    const olderUnsaved = tableOn({
      lineUp: { ...timelineAlone, roundCount: 20 },
      playedAt: 1,
      roomCode: 'EFGH'
    })
    const newerUnsaved = tableOn({
      lineUp: { ...quizThenBuzzer, roundCount: 20 },
      playedAt: 9,
      roomCode: 'JKLM'
    })

    expect(
      homeLineUps({
        evenings: [quiet, night],
        recents: [olderUnsaved, nightPlayed, newerUnsaved]
      })
    ).toEqual([
      { evening: quiet, recent: null },
      { evening: night, recent: nightPlayed },
      { evening: null, recent: newerUnsaved },
      { evening: null, recent: olderUnsaved }
    ])
  })

  it('[recent-tables] shows a saved line-up once, with the latest table that played it', () => {
    const night = eveningOn(quizThenBuzzer, 'Night')
    const older = tableOn({
      lineUp: quizThenBuzzer,
      playedAt: 1,
      roomCode: 'ABCD'
    })
    const newer = tableOn({
      lineUp: { ...quizThenBuzzer, runningOrder: [1, 0] },
      playedAt: 2,
      roomCode: 'EFGH'
    })

    expect(homeLineUps({ evenings: [night], recents: [older, newer] })).toEqual(
      [{ evening: night, recent: newer }]
    )
  })
})

describe('savedEveningOfRecent', () => {
  it('[recent-tables] keeps the line-up under the name, and nothing of the table it was played at', () => {
    const table = tableOn({
      lineUp: quizThenBuzzer,
      playedAt: 1,
      roomCode: 'ABCD'
    })

    expect(savedEveningOfRecent({ name: '  Friday ', recent: table })).toEqual(
      eveningOn(quizThenBuzzer, 'Friday')
    )
  })
})

describe('gamesOfPlayedLineUp', () => {
  it('[recent-tables] names each game once, in the order the line-up plays them', () => {
    expect(
      gamesOfPlayedLineUp({
        ...quizThenBuzzer,
        lineUp: [DEFAULT_BUZZER_SETTINGS, 'quiz', DEFAULT_BUZZER_SETTINGS]
      })
    ).toEqual(['buzzer', 'quiz'])
  })
})

describe('readyMadeOfTable', () => {
  const quick = readyMadeLineUpsFor('fr').find(({ id }) => id === 'quick')

  if (quick === undefined) {
    throw new Error('the quick line-up ships')
  }

  const onQuick = withSavedEvening({
    evening: savedEveningOfReadyMade({ lineUp: quick, name: 'Quick' }),
    locale: 'fr',
    rememberedFor: () => null,
    settings: DEFAULT_ROOM_SETTINGS
  })
  const ofThisRoom = (
    readyMade: RecentTable['readyMade']
  ): readonly RecentTable[] => [
    recentTableOf({
      now: 1,
      readyMade,
      roomCode: 'ABCD',
      roundsPlayed: 1,
      settings: { ...onQuick, roundCount: 99 }
    })
  ]

  it('[recent-tables] keeps the one the console loaded while its games are played', () => {
    expect(
      readyMadeOfTable({
        loaded: 'quick',
        locale: 'fr',
        recents: [],
        roomCode: 'ABCD',
        settings: onQuick
      })
    ).toBe('quick')
  })

  it('[recent-tables] lets go of it once a game is taken out', () => {
    expect(
      readyMadeOfTable({
        loaded: 'quick',
        locale: 'fr',
        recents: ofThisRoom('quick'),
        roomCode: 'ABCD',
        settings: { ...onQuick, lineUp: onQuick.lineUp.slice(1) }
      })
    ).toBeNull()
  })

  it('[recent-tables] finds it again on the room recorded before, for a console that reloaded', () => {
    expect(
      readyMadeOfTable({
        loaded: null,
        locale: 'fr',
        recents: ofThisRoom('quick'),
        roomCode: 'ABCD',
        settings: onQuick
      })
    ).toBe('quick')
    expect(
      readyMadeOfTable({
        loaded: null,
        locale: 'fr',
        recents: ofThisRoom('quick'),
        roomCode: 'EFGH',
        settings: onQuick
      })
    ).toBeNull()
  })

  it('[recent-tables] finds it again on the same line-up played at another table', () => {
    const elsewhere = recentTableOf({
      now: 1,
      readyMade: 'quick',
      roomCode: 'EFGH',
      roundsPlayed: 1,
      settings: onQuick
    })

    expect(
      readyMadeOfTable({
        loaded: null,
        locale: 'fr',
        recents: [elsewhere],
        roomCode: 'ABCD',
        settings: onQuick
      })
    ).toBe('quick')
  })
})
