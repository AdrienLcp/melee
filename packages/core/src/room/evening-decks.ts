import type { Deck } from '@melee/protocol/deck'
import type { GameSettings } from '@melee/protocol/game'

import { quizDeckProblems } from '../quiz/quiz-deck'

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

  return quizDeckProblems({ items: deck.items, path })
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

const keyOf = (entry: GameSettings): string => JSON.stringify(entry)

/**
 * The decks of `from` realigned on the line-up `to`, which a console sends
 * whole: each deck follows the entry it was written for to wherever that entry
 * went — an identical entry first, then an entry of the same game left at the
 * same index, which is an entry whose settings were tuned. A deck whose entry
 * left the line-up goes with it.
 */
export const decksFollowingLineUp = <TDeck>({
  decks,
  from,
  to
}: {
  decks: readonly (TDeck | null)[]
  from: readonly GameSettings[]
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
    if (to[index]?.kind === entry.kind && isTaken[index] === false) {
      place({ at: index, deck })
    }
  }

  return followed
}

/** The id a deck's item is dealt and remembered under — see `RoomDeck`. */
export const deckItemId = ({
  deckId,
  index
}: {
  deckId: string
  index: number
}): string => `deck:${deckId}:${index}`
