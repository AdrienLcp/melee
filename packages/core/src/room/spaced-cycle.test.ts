import { describe, expect, it } from 'vitest'

import {
  DEFAULT_BLINDTEST_SETTINGS,
  DEFAULT_GAME_SETTINGS,
  DEFAULT_QUIZ_SETTINGS,
  type GameKind,
  type GameSettings
} from '@melee/protocol/game'
import { DEFAULT_ROOM_SETTINGS, type RoomSettings } from '@melee/protocol/room'
import { catalogueOf } from '@melee/protocol/track'

import {
  type ReadyMadeLineUpId,
  readyMadeLineUpsFor,
  rememberedOnReadyMade,
  savedEveningOfReadyMade
} from './ready-made-line-ups'
import {
  dealtOrder,
  scheduledEntryAt,
  withNextEntryDealt
} from './running-order'
import { withSavedEvening } from './saved-evening'
import { spacedCycle, spacingKeyOf } from './spaced-cycle'

const SEEDS = Array.from({ length: 40 }, (_, at) => at * 7_919 + 1)

const seededRandom = (seed: number) => {
  let state = seed

  return () => {
    state = (state * 1_103_515_245 + 12_345) % 2_147_483_648

    return state / 2_147_483_648
  }
}

/** A ready-made evening as the room holds it once loaded, with its hand-written order. */
const readyMade = (id: ReadyMadeLineUpId) => {
  const lineUp = readyMadeLineUpsFor('fr').find(
    (candidate) => candidate.id === id
  )

  if (lineUp === undefined) {
    throw new Error(`No ready-made line-up ${id}`)
  }

  return withSavedEvening({
    evening: savedEveningOfReadyMade({ lineUp, name: id }),
    locale: 'fr',
    rememberedFor: (game) =>
      rememberedOnReadyMade({ game, locale: 'fr', preferences: null }),
    settings: DEFAULT_ROOM_SETTINGS
  })
}

/** Every gap between two rounds of one game that is shorter than `isShort` allows. */
const shortGaps = ({
  isShort,
  kinds
}: {
  isShort: (gap: { gap: number; kind: string }) => boolean
  kinds: readonly string[]
}) =>
  kinds.flatMap((kind, at) => {
    const previous = kinds.slice(0, at).lastIndexOf(kind)
    const gap = { gap: at - previous, kind }

    return previous !== -1 && isShort(gap) ? [{ ...gap, at }] : []
  })

/**
 * The game each round plays, the evening drawn the way the console and the
 * server draw it: the console as each reveal goes up, unless `isDrawMissed`
 * says its frame never landed, and the server as the next round opens.
 */
const playedKinds = ({
  isDrawMissed = () => false,
  lineUp,
  order,
  repeatsOrder = false,
  rounds,
  seed
}: {
  isDrawMissed?: (roundAt: number) => boolean
  lineUp: readonly GameSettings[]
  order: RoomSettings['runningOrder']
  repeatsOrder?: boolean
  rounds: number
  seed: number
}): GameKind[] => {
  const random = seededRandom(seed)
  const played = lineUp.map(() => 0)
  const settledOn = ({
    at,
    roundAt,
    settings
  }: {
    at: number
    roundAt: number
    settings: RoomSettings
  }): RoomSettings => ({
    ...settings,
    game: lineUp[at] ?? null,
    lineUpAt: at,
    runningOrder: dealtOrder({
      deals: [],
      drawnAt: at,
      lineUp,
      order: settings.runningOrder,
      played,
      random,
      upcoming: roundAt
    })
  })
  let settings = settledOn({
    at: 0,
    roundAt: 0,
    settings: {
      ...DEFAULT_ROOM_SETTINGS,
      lineUp: [...lineUp],
      repeatsRunningOrder: repeatsOrder,
      roundCount: null,
      runningOrder: [...order]
    }
  })
  const kinds: GameKind[] = []

  for (let roundAt = 1; roundAt <= rounds; roundAt += 1) {
    const at = settings.lineUpAt
    const kind = at === null ? undefined : lineUp[at]?.kind

    if (at === null || kind === undefined) {
      break
    }

    played[at] = (played[at] ?? 0) + 1
    kinds.push(kind)

    const drawn = scheduledEntryAt({
      deals: [],
      lastAt: at,
      lineUp,
      order: settings.runningOrder,
      played,
      random,
      repeatsOrder,
      roundAt,
      roundsLeft: null
    })

    if (drawn !== null && drawn !== at && !isDrawMissed(roundAt)) {
      settings = settledOn({ at: drawn, roundAt, settings })
    }

    const opening = withNextEntryDealt({
      lastAt: at,
      played,
      random,
      roundAt,
      settings
    })

    if (opening !== settings && opening.lineUpAt !== null) {
      settings = settledOn({ at: opening.lineUpAt, roundAt, settings: opening })
    }
  }

  return kinds
}

describe('spacedCycle', () => {
  const grandMix = readyMade('grandMix').lineUp
  const keyOf = (entry: GameSettings) => spacingKeyOf(entry.kind)
  const isShortOfItsShare = ({ gap, kind }: { gap: number; kind: string }) =>
    gap <
    Math.floor(
      grandMix.length / grandMix.filter((entry) => keyOf(entry) === kind).length
    )
  const everyEntry = grandMix.map((_entry, at) => at)
  const keysOf = (entries: readonly number[]) =>
    entries.map((at) => {
      const entry = grandMix[at]

      return entry === undefined ? 'none' : keyOf(entry)
    })

  it('[line-up] deals Free-for-all with each game, and each family of cousins, its share of the evening apart', () => {
    for (const seed of SEEDS) {
      const cycle = spacedCycle({
        entries: everyEntry,
        lineUp: grandMix,
        opened: [],
        random: seededRandom(seed)
      })

      expect(cycle.toSorted((a, b) => a - b)).toEqual(everyEntry)
      expect(
        shortGaps({ isShort: isShortOfItsShare, kinds: keysOf(cycle) })
      ).toEqual([])
    }
  })

  it('[line-up] spaces the seam with the rows already played', () => {
    const lineUp = [
      DEFAULT_GAME_SETTINGS.quiz,
      { ...DEFAULT_QUIZ_SETTINGS, categories: ['flags' as const] },
      DEFAULT_GAME_SETTINGS.atlas,
      DEFAULT_GAME_SETTINGS.blindtest
    ]

    for (const seed of SEEDS) {
      expect(
        spacedCycle({
          entries: [1, 3],
          lineUp,
          opened: [0, 2],
          random: seededRandom(seed)
        })
      ).toEqual([3, 1])
    }
  })

  it('[line-up] keeps a game holding half the entries every other row beside two not played yet', () => {
    const lineUp = [
      DEFAULT_GAME_SETTINGS.quiz,
      DEFAULT_GAME_SETTINGS.quiz,
      DEFAULT_GAME_SETTINGS.quiz,
      DEFAULT_GAME_SETTINGS.quiz,
      DEFAULT_GAME_SETTINGS.atlas,
      DEFAULT_GAME_SETTINGS.atlas,
      DEFAULT_GAME_SETTINGS.timeline,
      DEFAULT_GAME_SETTINGS.timeline
    ]

    for (const seed of SEEDS) {
      const kinds = spacedCycle({
        entries: lineUp.map((_entry, at) => at),
        lineUp,
        opened: [],
        random: seededRandom(seed)
      }).map((at) => lineUp[at]?.kind ?? 'none')

      expect(kinds.filter((_kind, row) => row % 2 === 0)).toEqual([
        'quiz',
        'quiz',
        'quiz',
        'quiz'
      ])
      expect(
        shortGaps({
          isShort: ({ gap, kind }) => gap < (kind === 'quiz' ? 2 : 4),
          kinds
        })
      ).toEqual([])
    }
  })

  it('[line-up] alternates two games holding half the entries each', () => {
    const halves = [
      DEFAULT_GAME_SETTINGS.quiz,
      DEFAULT_GAME_SETTINGS.quiz,
      DEFAULT_GAME_SETTINGS.quiz,
      DEFAULT_GAME_SETTINGS.atlas,
      DEFAULT_GAME_SETTINGS.atlas,
      DEFAULT_GAME_SETTINGS.atlas
    ]

    for (const seed of SEEDS) {
      const cycle = spacedCycle({
        entries: halves.map((_entry, at) => at),
        lineUp: halves,
        opened: [0],
        random: seededRandom(seed)
      })

      expect(cycle.map((at) => halves[at]?.kind)).toEqual([
        'atlas',
        'quiz',
        'atlas',
        'quiz',
        'atlas',
        'quiz'
      ])
    }
  })

  it('[line-up] deals a looped cycle’s last row off the game its order opens on', () => {
    const lineUp = [
      DEFAULT_GAME_SETTINGS.quiz,
      { ...DEFAULT_QUIZ_SETTINGS, categories: ['flags' as const] },
      DEFAULT_GAME_SETTINGS.atlas,
      DEFAULT_GAME_SETTINGS.blindtest
    ]

    for (const seed of SEEDS) {
      const cycle = spacedCycle({
        entries: [1, 2, 3],
        lineUp,
        loops: true,
        opened: [0],
        random: seededRandom(seed)
      })

      expect(cycle[1]).toBe(1)
    }
  })

  it('[line-up] deals the variant played longest ago first', () => {
    const blindTests = [
      DEFAULT_BLINDTEST_SETTINGS,
      {
        ...DEFAULT_BLINDTEST_SETTINGS,
        source: catalogueOf({ hasFilmScores: true })
      },
      {
        ...DEFAULT_BLINDTEST_SETTINGS,
        source: catalogueOf({ decades: ['1980s'] })
      }
    ]

    for (const seed of SEEDS) {
      expect(
        spacedCycle({
          entries: [0, 1, 2],
          lineUp: blindTests,
          opened: [1, 2, 0],
          random: seededRandom(seed)
        })
      ).toEqual([1, 2, 0])
    }
  })
})

describe('a ready-made evening, played through', { timeout: 20_000 }, () => {
  it('[line-up] keeps Free-for-all’s games half their share apart, past its last row', () => {
    const { lineUp, runningOrder } = readyMade('grandMix')
    const keys = lineUp.map((entry) => spacingKeyOf(entry.kind))
    const shareOf = (key: string) =>
      Math.floor(lineUp.length / keys.filter((other) => other === key).length)

    for (const seed of SEEDS.slice(0, 10)) {
      const kinds = playedKinds({
        lineUp,
        order: runningOrder,
        rounds: 2 * lineUp.length,
        seed
      }).map(spacingKeyOf)

      expect(kinds).toHaveLength(2 * lineUp.length)
      expect(
        shortGaps({
          isShort: ({ gap, kind }) =>
            gap < Math.max(2, Math.floor(shareOf(kind) / 2)),
          kinds
        })
      ).toEqual([])
    }
  })

  it('[line-up] never runs one game of Free-for-all twice in a row over 150 rounds, played again or drawn', () => {
    const { lineUp, runningOrder } = readyMade('grandMix')

    for (const seed of SEEDS.slice(0, 10)) {
      for (const repeatsOrder of [false, true]) {
        const kinds = playedKinds({
          lineUp,
          order: runningOrder,
          repeatsOrder,
          rounds: 150,
          seed
        })

        expect(kinds).toHaveLength(150)
        expect(
          shortGaps({
            isShort: ({ gap }) => gap < 2,
            kinds: kinds.map(spacingKeyOf)
          })
        ).toEqual([])
      }
    }
  })

  it('[line-up] moves Free-for-all off the game just played when the console’s draw never lands', () => {
    const { lineUp, runningOrder } = readyMade('grandMix')

    for (const seed of SEEDS.slice(0, 10)) {
      const kinds = playedKinds({
        isDrawMissed: (roundAt) => roundAt % 3 === 0 || roundAt > 40,
        lineUp,
        order: runningOrder,
        rounds: 150,
        seed
      })

      expect(kinds).toHaveLength(150)
      expect(
        shortGaps({
          isShort: ({ gap }) => gap < 2,
          kinds: kinds.map(spacingKeyOf)
        })
      ).toEqual([])
    }
  })

  it('[line-up] never runs the quick game’s two clock races back to back, nor any game within three rounds', () => {
    const { lineUp, roundCount, runningOrder } = readyMade('quick')

    for (const seed of SEEDS) {
      const kinds = playedKinds({
        lineUp,
        order: runningOrder,
        rounds: roundCount ?? 0,
        seed
      })
      const families = kinds.map((kind) =>
        kind === 'reflex' || kind === 'innerclock' ? 'clockRaces' : kind
      )

      expect(shortGaps({ isShort: ({ gap }) => gap < 3, kinds })).toEqual([])
      expect(
        shortGaps({ isShort: ({ gap }) => gap < 2, kinds: families })
      ).toEqual([])
    }
  })

  it('[line-up] keeps General knowledge’s quizzes apart and its other games four rounds apart', () => {
    const { lineUp, roundCount, runningOrder } = readyMade('generalKnowledge')

    for (const seed of SEEDS) {
      const kinds = playedKinds({
        lineUp,
        order: runningOrder,
        rounds: roundCount ?? 0,
        seed
      })

      expect(
        shortGaps({
          isShort: ({ gap, kind }) => gap < (kind === 'quiz' ? 2 : 4),
          kinds
        })
      ).toEqual([])
    }
  })
})

describe('withNextEntryDealt', () => {
  const lineUp = [
    DEFAULT_GAME_SETTINGS.quiz,
    DEFAULT_GAME_SETTINGS.atlas,
    DEFAULT_GAME_SETTINGS.blindtest
  ]
  const evening = (
    runningOrder: RoomSettings['runningOrder']
  ): RoomSettings => ({
    ...DEFAULT_ROOM_SETTINGS,
    game: DEFAULT_GAME_SETTINGS.atlas,
    lineUp,
    lineUpAt: 1,
    roundCount: null,
    runningOrder
  })

  it('[line-up] opens the next row when the room is still on the entry just played', () => {
    const settings = withNextEntryDealt({
      lastAt: 1,
      played: [1, 1, 0],
      random: seededRandom(1),
      roundAt: 2,
      settings: evening([0, 1, 2])
    })

    expect(settings.lineUpAt).toBe(2)
    expect(settings.game).toEqual(DEFAULT_GAME_SETTINGS.blindtest)
  })

  it('[line-up] draws another game past the order’s end', () => {
    for (const seed of SEEDS) {
      const settings = withNextEntryDealt({
        lastAt: 1,
        played: [1, 1, 1],
        random: seededRandom(seed),
        roundAt: 3,
        settings: evening([0, 2, 1])
      })

      expect(settings.lineUpAt).not.toBe(1)
    }
  })

  it('[line-up] keeps the entry just played when the host put it on the next row', () => {
    const asked = evening([0, 1, 1, 2])

    expect(
      withNextEntryDealt({
        lastAt: 1,
        played: [1, 1, 0],
        random: seededRandom(1),
        roundAt: 2,
        settings: asked
      })
    ).toBe(asked)
  })

  it('[line-up] leaves a round the console already drew', () => {
    const drawn = { ...evening([0, 1, 2]), lineUpAt: 2 }

    expect(
      withNextEntryDealt({
        lastAt: 1,
        played: [1, 1, 0],
        random: seededRandom(1),
        roundAt: 2,
        settings: drawn
      })
    ).toBe(drawn)
  })
})
