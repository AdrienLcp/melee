import type { QuizDeckItem } from '@melee/protocol/deck'
import type { HostQuestion } from '@melee/protocol/question'
import type { DeckSummary } from '@melee/protocol/room'

import { deckItemId } from '@melee/core/room/evening-decks'

import type { Room } from '@/domain/room/room'

const questionOf = ({
  id,
  item
}: {
  id: string
  item: QuizDeckItem
}): HostQuestion => ({
  accepted: item.accepted,
  answer: item.answer,
  category: item.category,
  decoys: item.decoys,
  flag: null,
  id,
  note: item.note,
  prompt: item.prompt,
  rebus: null,
  silhouette: null
})

/**
 * The next question the entry at `lineUpAt` brought and the room has not
 * played, and `null` once its deck is spent or it brought none — the bank then
 * deals. `isUsable` is the bank's own test, so a `typed` room skips a
 * `choiceOnly` item exactly as it skips a row.
 */
export const nextDeckQuestion = ({
  isUsable,
  lineUpAt,
  room
}: {
  isUsable: (item: QuizDeckItem) => boolean
  lineUpAt: number | null
  room: Room
}): HostQuestion | null => {
  const held = lineUpAt === null ? null : (room.decks[lineUpAt] ?? null)

  if (held === null || held.deck.game !== 'quiz') {
    return null
  }

  for (const [index, item] of held.deck.items.entries()) {
    const id = deckItemId({ deckId: held.id, index })

    if (!room.playedContentIds.has(id) && isUsable(item)) {
      return questionOf({ id, item })
    }
  }

  return null
}

/** One line an entry's deck brought, under the id it is dealt and remembered by. */
export type DeckLine = {
  id: string
  text: string
}

/**
 * The lines of the deck the entry at `lineUpAt` brought for `game` that the
 * room has not played, in the order written, and none once the deck is spent
 * or the entry brought none — the bank then deals.
 */
export const unplayedDeckLines = ({
  game,
  lineUpAt,
  room
}: {
  game: 'challenge' | 'mostlikely'
  lineUpAt: number | null
  room: Room
}): DeckLine[] => {
  const held = lineUpAt === null ? null : (room.decks[lineUpAt] ?? null)

  if (held === null || held.deck.game !== game) {
    return []
  }

  return held.deck.items.flatMap((text, index) => {
    const id = deckItemId({ deckId: held.id, index })

    return room.playedContentIds.has(id) ? [] : [{ id, text }]
  })
}

/** What the console is told of each entry's deck: how many items, how many dealt. */
export const deckSummariesOf = (room: Room): (DeckSummary | null)[] =>
  room.settings.lineUp.map((_, index) => {
    const held = room.decks[index] ?? null

    return held === null
      ? null
      : {
          played: held.deck.items.filter((_item, itemIndex) =>
            room.playedContentIds.has(
              deckItemId({ deckId: held.id, index: itemIndex })
            )
          ).length,
          size: held.deck.items.length
        }
  })
