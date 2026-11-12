import type { Deck, OwnLinesGame, QuizDeckItem } from '@melee/protocol/deck'
import type { OwnQuantityAsk } from '@melee/protocol/estimate'
import type { ValuedHigherLowerPair } from '@melee/protocol/higher-lower'
import type { HostQuestion } from '@melee/protocol/question'
import type { DeckSummary } from '@melee/protocol/room'
import {
  type DatedTimelineEvent,
  TIMELINE_EVENTS_PER_ROUND,
  type TimelineLabels
} from '@melee/protocol/timeline'

import { shuffled } from '@melee/core/helpers/random'
import { deckItemId, ownLineId } from '@melee/core/room/evening-decks'
import { keyedItemIndexes } from '@melee/core/slate/slate-deck'
import { dealDeckEvents } from '@melee/core/timeline/deal'

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

const labelsOf = (label: string): TimelineLabels => ({ en: label, fr: label })

/** The first item of a deck the room has not played, under the id it is remembered by, and `null` once the deck is spent. */
const firstUnplayed = <TItem>({
  deckId,
  items,
  room
}: {
  deckId: string
  items: readonly TItem[]
  room: Room
}): { id: string; item: TItem } | null => {
  for (const [index, item] of items.entries()) {
    const id = deckItemId({ deckId, index })

    if (!room.playedContentIds.has(id)) {
      return { id, item }
    }
  }

  return null
}

/** A number an entry's deck deals, its value the answer, and the id the room remembers it by. */
export type DeckQuantity = {
  playedId: string
  question: OwnQuantityAsk
  value: number
}

/**
 * The next number the entry at `lineUpAt` brought for the table to estimate,
 * in order, and `null` once its deck is spent or it brought none — the bank
 * then deals.
 */
export const nextDeckQuantity = ({
  lineUpAt,
  room
}: {
  lineUpAt: number | null
  room: Room
}): DeckQuantity | null => {
  const held = lineUpAt === null ? null : (room.decks[lineUpAt] ?? null)

  if (held === null || held.deck.game !== 'estimate') {
    return null
  }

  const next = firstUnplayed({ deckId: held.id, items: held.deck.items, room })

  return next === null
    ? null
    : {
        playedId: next.id,
        question: {
          kind: 'own',
          prompt: next.item.prompt,
          unit: next.item.unit
        },
        value: next.item.value
      }
}

/** A pair an entry's deck deals, and the id the room remembers it by. */
export type DeckPair = { pair: ValuedHigherLowerPair; playedId: string }

/**
 * The next pair the entry at `lineUpAt` brought, in order, its two sides
 * shuffled — whoever wrote it most likely put the bigger first — and `null`
 * once its deck is spent or it brought none, when the bank deals.
 */
export const nextDeckPair = ({
  lineUpAt,
  room
}: {
  lineUpAt: number | null
  room: Room
}): DeckPair | null => {
  const held = lineUpAt === null ? null : (room.decks[lineUpAt] ?? null)

  if (held === null || held.deck.game !== 'higherlower') {
    return null
  }

  const next = firstUnplayed({ deckId: held.id, items: held.deck.items, room })

  if (next === null) {
    return null
  }

  const { prompt, unit } = next.item
  const [left, right] = shuffled([next.item.left, next.item.right])

  return left === undefined || right === undefined
    ? null
    : {
        pair: {
          ask: { kind: 'own', prompt, unit },
          left: labelsOf(left.name),
          leftValue: left.value,
          right: labelsOf(right.name),
          rightValue: right.value
        },
        playedId: next.id
      }
}

/** A round of dated events an entry's deck deals, and the ids the room remembers them by. */
export type DeckTimelineRound = {
  events: DatedTimelineEvent[]
  playedIds: string[]
}

/**
 * The next round the entry at `lineUpAt` deals from its timeline deck
 * (`dealDeckEvents`), and `null` once every event is dealt or it brought
 * none — the bank then deals. An event goes on the wire as `deck-<index>`,
 * because an order names events by an id a deck's own does not fit, and a
 * round is never half deck and half bank.
 */
export const nextDeckTimelineRound = ({
  lineUpAt,
  room
}: {
  lineUpAt: number | null
  room: Room
}): DeckTimelineRound | null => {
  const held = lineUpAt === null ? null : (room.decks[lineUpAt] ?? null)

  if (held === null || held.deck.game !== 'timeline') {
    return null
  }

  const dealt = dealDeckEvents({
    count: TIMELINE_EVENTS_PER_ROUND,
    events: held.deck.items.map(({ label, year }, index) => ({
      id: deckItemId({ deckId: held.id, index }),
      index,
      label,
      year
    })),
    playedIds: room.playedContentIds
  })

  return dealt === null
    ? null
    : {
        events: dealt.map(({ index, label, year }) => ({
          id: `deck-${index}`,
          labels: labelsOf(label),
          year
        })),
        playedIds: dealt.map(({ id }) => id)
      }
}

/** The answer key an entry's deck brings its sheet, and the ids the room remembers its keys by. */
export type DeckSlateKeys = {
  keys: readonly (string | null)[]
  playedIds: string[]
}

/**
 * The keys the entry at `lineUpAt` brought for its sheet, all dealt as the
 * sheet opens, and `null` once they have been or it brought none — the sheet
 * then takes whatever keys the press carried.
 */
export const nextDeckSlateKeys = ({
  lineUpAt,
  room
}: {
  lineUpAt: number | null
  room: Room
}): DeckSlateKeys | null => {
  const held = lineUpAt === null ? null : (room.decks[lineUpAt] ?? null)

  if (held === null || held.deck.game !== 'slate') {
    return null
  }

  const playedIds = keyedItemIndexes(held.deck.items).map((index) =>
    deckItemId({ deckId: held.id, index })
  )

  return playedIds.every((id) => room.playedContentIds.has(id))
    ? null
    : { keys: held.deck.items, playedIds }
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

/** The items a deck counts: every one, save a slate item it holds no key for. */
const countedItemIndexes = (deck: Deck): number[] =>
  deck.game === 'slate'
    ? keyedItemIndexes(deck.items)
    : deck.items.map((_item, index) => index)

/** What the console is told of each entry's deck: how many items, how many dealt. */
export const deckSummariesOf = (room: Room): (DeckSummary | null)[] =>
  room.settings.lineUp.map((_, index) => {
    const held = room.decks[index] ?? null

    if (held === null) {
      return null
    }

    const counted = countedItemIndexes(held.deck)

    return {
      played: counted.filter((itemIndex) =>
        room.playedContentIds.has(
          deckItemId({ deckId: held.id, index: itemIndex })
        )
      ).length,
      size: counted.length
    }
  })
