import type { ShelvedGame } from '@melee/protocol/game'

/** The rows the home shelf groups its games into, in the order it shows them. */
export const shelfFamilies = [
  'culture',
  'letters',
  'instinct',
  'table'
] as const

export type ShelfFamily = (typeof shelfFamilies)[number]

/**
 * Each family's games, in the order its row shows them: the one a table
 * already knows first. A game that is a format of another has no row of its
 * own — it is picked under its card.
 */
export const gamesOfFamily: Readonly<
  Record<ShelfFamily, readonly ShelvedGame[]>
> = {
  culture: ['quiz', 'blindtest', 'atlas', 'fiveclues', 'timeline', 'estimate'],
  instinct: ['reflex', 'innerclock', 'swatch'],
  letters: [
    'mysteryword',
    'longestword',
    'petitbac',
    'blacksquare',
    'makenumber',
    'matchsticks'
  ],
  table: ['mostlikely', 'thinkalike']
}

/**
 * The games with no content of their own — the host brings the questions —
 * shelved in a row of their own under the families. They tick like any game,
 * but no bulk tick and no first visit ticks them: a buzzer between quiz rounds
 * is a host's choice, never a default.
 */
export const hostTools: readonly ShelvedGame[] = [
  'buzzer',
  'slate',
  'challenge'
]

/** Every game a family holds, families in shelf order. */
export const familyGames: readonly ShelvedGame[] = shelfFamilies.flatMap(
  (family) => gamesOfFamily[family]
)
