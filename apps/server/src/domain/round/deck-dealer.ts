import type { OwnLinesGame, QuizDeckItem } from '@melee/protocol/deck'
import type { HostQuestion } from '@melee/protocol/question'
import type { DeckSummary } from '@melee/protocol/room'

import { deckItemId, ownLineId } from '@melee/core/room/evening-decks'

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

/**
 * One line the evening brought — an entry's deck or the host's own — under
 * the id it is dealt and remembered by.
 */
export type EveningLine = {
  id: string
  text: string
}

const unplayedDeckLines = ({
  game,
  lineUpAt,
  room
}: {
  game: OwnLinesGame
  lineUpAt: number | null
  room: Room
}): EveningLine[] => {
  const held = lineUpAt === null ? null : (room.decks[lineUpAt] ?? null)

  if (held === null || held.deck.game !== game) {
    return []
  }

  return held.deck.items.flatMap((text, index) => {
    const id = deckItemId({ deckId: held.id, index })

    return room.playedContentIds.has(id) ? [] : [{ id, text }]
  })
}

const unplayedOwnLines = ({
  game,
  room
}: {
  game: OwnLinesGame
  room: Room
}): EveningLine[] =>
  [...new Set(room.ownLines[game])].flatMap((text) => {
    const id = ownLineId({ game, text })

    return room.playedContentIds.has(id) ? [] : [{ id, text }]
  })

/**
 * The lines the room has not played that the entry at `lineUpAt` deals for
 * `game` before its bank: its own deck's, then the ones the host wrote, each
 * in the order written. None once both are spent — the bank then deals.
 */
export const unplayedEveningLines = ({
  game,
  lineUpAt,
  room
}: {
  game: OwnLinesGame
  lineUpAt: number | null
  room: Room
}): EveningLine[] => [
  ...unplayedDeckLines({ game, lineUpAt, room }),
  ...unplayedOwnLines({ game, room })
]

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
