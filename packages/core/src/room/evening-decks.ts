import type { Deck, OwnLinesGame } from '@melee/protocol/deck'
import type { GameKind, GameSettings } from '@melee/protocol/game'

import { quizDeckProblems } from '../quiz/quiz-deck'
import { slateDeckProblems } from '../slate/slate-deck'
import { timelineDeckProblems } from '../timeline/timeline-deck'
import { lineDeckProblems } from './line-deck'

const deckProblemsAt = ({
  deck,
  entry,
  path
}: {
  deck: Deck
  entry: GameSettings | undefined
  path: string
}): string[] => {
  if (entry === undefined) {
    return [`${path}: there is no lineUp entry at this index to deal it.`]
  }

  if (entry.kind !== deck.game) {
    return [
      `${path}.game: a ${deck.game} deck, beside a lineUp entry of ${entry.kind}.`
    ]
  }

  switch (deck.game) {
    case 'quiz':
      return quizDeckProblems({ items: deck.items, path })
    case 'challenge':
    case 'mostlikely':
      return lineDeckProblems({ items: deck.items, path })
    case 'timeline':
      return timelineDeckProblems({ items: deck.items, path })
    case 'slate':
      return slateDeckProblems({
        itemCount: entry.kind === 'slate' ? entry.itemCount : 0,
        items: deck.items,
        path
      })
  }
}

/**
 * Everything wrong with an evening's decks against its line-up, each problem
 * led by its path (`decks[1].items[4].decoys[0]: …`): a deck past the last
 * entry, a deck of another game than its entry's, and whatever the deck's own
 * game refuses in an item. Empty when the decks hold.
 */
export const deckProblems = ({
  decks,
  lineUp
}: {
  decks: readonly (Deck | null)[]
  lineUp: readonly GameSettings[]
}): string[] =>
  decks.flatMap((deck, index) =>
    deck === null
      ? []
      : deckProblemsAt({ deck, entry: lineUp[index], path: `decks[${index}]` })
  )

const keyOf = (entry: GameSettings | GameKind): string => JSON.stringify(entry)

const kindOf = (entry: GameSettings | GameKind): GameKind =>
  typeof entry === 'string' ? entry : entry.kind

/**
 * The decks of `from` realigned on the line-up `to`, which a console sends
 * whole: each deck follows the entry it was written for to wherever that entry
 * went — an identical entry first, then an entry of the same game left at the
 * same index, which is an entry whose settings were tuned. A deck whose entry
 * left the line-up goes with it. `from` may hold a saved entry's game alone,
 * whose settings no longer read: it is found by its game at its index.
 */
export const decksFollowingLineUp = <TDeck>({
  decks,
  from,
  to
}: {
  decks: readonly (TDeck | null)[]
  from: readonly (GameSettings | GameKind)[]
  to: readonly GameSettings[]
}): (TDeck | null)[] => {
  const followed: (TDeck | null)[] = to.map(() => null)
  const isTaken = to.map(() => false)
  const toKeys = to.map(keyOf)
  const holders = decks.flatMap((deck, index) => {
    const entry = from[index]

    return deck === null || entry === undefined ? [] : [{ deck, entry, index }]
  })
  const place = ({ at, deck }: { at: number; deck: TDeck }) => {
    followed[at] = deck
    isTaken[at] = true
  }

  const unmatched = holders.filter(({ deck, entry, index }) => {
    const key = keyOf(entry)
    const at =
      toKeys[index] === key && isTaken[index] === false
        ? index
        : toKeys.findIndex(
            (candidate, candidateAt) =>
              candidate === key && isTaken[candidateAt] === false
          )

    if (at === -1) {
      return true
    }

    place({ at, deck })

    return false
  })

  for (const { deck, entry, index } of unmatched) {
    if (to[index]?.kind === kindOf(entry) && isTaken[index] === false) {
      place({ at: index, deck })
    }
  }

  return followed
}

/**
 * The decks an evening brought, on the line-up a room was set to from it: each
 * follows its entry (`decksFollowingLineUp`), and one that no longer fits the
 * entry it landed on is dropped rather than costing the room every other —
 * the server refuses `host.setDecks` whole. Empty when no deck is left, which
 * is no deck at all.
 */
export const decksForLineUp = ({
  decks,
  from,
  to
}: {
  decks: readonly (Deck | null)[]
  from: readonly (GameSettings | GameKind)[]
  to: readonly GameSettings[]
}): (Deck | null)[] => {
  const fitting = decksFollowingLineUp({ decks, from, to }).map((deck, at) =>
    deck !== null &&
    deckProblemsAt({ deck, entry: to[at], path: 'deck' }).length === 0
      ? deck
      : null
  )

  return fitting.some((deck) => deck !== null) ? fitting : []
}

/** The id a deck's item is dealt and remembered under — see `RoomDeck`. */
export const deckItemId = ({
  deckId,
  index
}: {
  deckId: string
  index: number
}): string => `deck:${deckId}:${index}`

/** Whether an id names a deck's item rather than a bank's row. */
export const isDeckItemId = (id: string): boolean => id.startsWith('deck:')

/**
 * The id a line the host wrote is dealt and remembered under, told apart by
 * its game and its text alone: the console sends its list again whole after
 * every edit, so an index would deal a played line twice once one above it
 * goes.
 */
export const ownLineId = ({
  game,
  text
}: {
  game: OwnLinesGame
  text: string
}): string => `own:${game}:${text}`

/** Whether an id names a line the host wrote rather than a deck's item or a bank's row. */
export const isOwnLineId = (id: string): boolean => id.startsWith('own:')
