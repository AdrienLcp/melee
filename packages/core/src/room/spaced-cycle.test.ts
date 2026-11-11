import { describe, expect, it } from 'vitest'

import {
  DEFAULT_BLINDTEST_SETTINGS,
  DEFAULT_GAME_SETTINGS,
  DEFAULT_QUIZ_SETTINGS,
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
import { dealtOrder, scheduledEntryAt } from './running-order'
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

/** The game each round plays, the evening drawn the way the console and the server draw it. */
const playedKinds = ({
  lineUp,
  order,
  rounds,
  seed
}: {
  lineUp: readonly GameSettings[]
  order: RoomSettings['runningOrder']
  rounds: number
  seed: number
}): string[] => {
  const random = seededRandom(seed)
  const played = lineUp.map(() => 0)
  let runningOrder = dealtOrder({
    deals: [],
    drawnAt: 0,
    lineUp,
    order,
    played,
    random,
    upcoming: 0
  })
  let at: number | null = 0
  const kinds: string[] = []

  for (let roundAt = 1; roundAt <= rounds && at !== null; roundAt += 1) {
    played[at] = (played[at] ?? 0) + 1
    kinds.push(lineUp[at]?.kind ?? 'none')
    at = scheduledEntryAt({
      deals: [],
      lastAt: at,
      lineUp,
      order: runningOrder,
      played,
      random,
      repeatsOrder: false,
      roundAt,
      roundsLeft: null
    })
    runningOrder = dealtOrder({
      deals: [],
      drawnAt: at,
      lineUp,
      order: runningOrder,
      played,
      random,
      upcoming: roundAt
    })
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

describe('a ready-made evening, played through', () => {
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
      }).map((kind) =>
        spacingKeyOf(
          lineUp.find((entry) => entry.kind === kind)?.kind ?? 'quiz'
        )
      )

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
