import { describe, expect, it } from 'vitest'

import {
  DEFAULT_ATLAS_SETTINGS,
  DEFAULT_QUIZ_SETTINGS,
  type GameKind,
  type GameSettings,
  gameKinds
} from '@melee/protocol/game'
import type { RoomSettings } from '@melee/protocol/room'

import { isPlayableWithTeams } from './game-capabilities'
import { offersAnswerMode } from './game-modes'
import { lineUpHolds, withoutEntry } from './line-up'
import {
  type GameSetup,
  movedToEntry,
  openedSetup,
  roomSettingsFor
} from './room-settings'
import { scheduledEntryAt } from './running-order'

const NAMING_ATLAS = { ...DEFAULT_ATLAS_SETTINGS, direction: 'name' } as const
const QUIZ_RUBRICS = ['flags', 'capitals', 'silhouettes', 'rebus'] as const

const isAcceptedByServer = (settings: RoomSettings): boolean =>
  offersAnswerMode({ game: settings.game, mode: settings.mode.kind }) &&
  isPlayableWithTeams({ mode: settings.mode.kind, teams: settings.teams }) &&
  lineUpHolds(settings)

const rememberedOnAPawn = (game: GameKind): GameSetup | null =>
  openedSetup({ game, locale: 'fr' })

/** Every game ticked once, each quiz rubric as a variant, and an Atlas naming a country. */
const everyGameEvening = (): RoomSettings => {
  const games: GameKind[] = [
    ...gameKinds,
    ...QUIZ_RUBRICS.map(() => 'quiz' as const),
    'atlas'
  ]
  const opened = roomSettingsFor({ games, locale: 'fr' })
  const variants: GameSettings[] = [
    ...QUIZ_RUBRICS.map((category) => ({
      ...DEFAULT_QUIZ_SETTINGS,
      categories: [category]
    })),
    NAMING_ATLAS
  ]
  const lineUp = opened.lineUp.map(
    (entry, index) => variants[index - gameKinds.length] ?? entry
  )

  return { ...opened, game: lineUp[opened.lineUpAt ?? 0] ?? null, lineUp }
}

const labelOf = (entry: GameSettings | null | undefined): string =>
  entry?.kind === 'quiz'
    ? `quiz:${entry.categories.join('+')}`
    : entry?.kind === 'atlas'
      ? `atlas:${entry.direction}`
      : (entry?.kind ?? 'none')

const seededRandom = (seed: number) => {
  let state = seed

  return () => {
    state = (state * 1_103_515_245 + 12_345) % 2_147_483_648

    return state / 2_147_483_648
  }
}

const playedEvening = (seed: number) => {
  const random = seededRandom(seed)
  let settings = everyGameEvening()
  const played = settings.lineUp.map(() => 0)
  const sequence: string[] = []
  const refused: string[] = []
  const roundCount = settings.roundCount ?? 0

  for (let roundAt = 0; roundAt < roundCount; roundAt += 1) {
    const at = settings.lineUpAt ?? 0
    played[at] = (played[at] ?? 0) + 1
    sequence.push(labelOf(settings.lineUp[at]))

    const drawn = scheduledEntryAt({
      deals: settings.lineUpDeals,
      lastAt: at,
      lineUp: settings.lineUp,
      order: settings.runningOrder,
      played,
      random,
      roundAt: roundAt + 1,
      roundsLeft: roundCount - roundAt - 1
    })
    const entry = drawn === null ? undefined : settings.lineUp[drawn]

    if (drawn === null || entry === undefined || drawn === at) {
      continue
    }

    const moved = movedToEntry({
      at: drawn,
      locale: 'fr',
      remembered: rememberedOnAPawn(entry.kind),
      settings
    })

    if (isAcceptedByServer(moved)) {
      settings = moved
    } else {
      refused.push(labelOf(entry))
    }
  }

  return { refused, sequence }
}

describe('an evening with every game ticked', () => {
  it('[line-up] opens on settings the server accepts', () => {
    expect(isAcceptedByServer(everyGameEvening())).toBe(true)
  })

  it('[line-up] deals every round on settings the server accepts', () => {
    for (const seed of [1, 7, 42, 2026]) {
      expect(playedEvening(seed).refused).toEqual([])
    }
  })

  // The loop Adrien saw: a refused draw replayed the round just played.
  it('[line-up] never deals the same entry twice in a row', () => {
    for (const seed of [1, 7, 42, 2026]) {
      const { sequence } = playedEvening(seed)
      const repeats = sequence.filter(
        (label, index) => label === sequence[index - 1]
      )

      expect(repeats).toEqual([])
    }
  })

  it('[line-up] plays the Atlas naming a country', () => {
    expect(playedEvening(42).sequence).toContain('atlas:name')
  })

  it('[line-up] takes entries out one after another, each on settings the server accepts', () => {
    let settings = everyGameEvening()

    while (settings.lineUp.length > 1) {
      const next = withoutEntry({
        at: settings.lineUpAt ?? 0,
        locale: 'fr',
        rememberedFor: rememberedOnAPawn,
        settings
      })

      expect(next.lineUp.length).toBe(settings.lineUp.length - 1)
      expect(isAcceptedByServer(next)).toBe(true)
      settings = next
    }
  })
})
