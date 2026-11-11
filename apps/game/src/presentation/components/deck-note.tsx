import type React from 'react'

import { type Deck, deckSchema } from '@melee/protocol/deck'
import type { GameKind } from '@melee/protocol/game'

import { PenIcon } from '@/presentation/components/icons'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './deck-note.sass'

const DECK_GAMES: readonly GameKind[] = deckSchema.options.map(
  (arm) => arm.shape.game.value
)

const isDeckGame = (game: GameKind): game is Deck['game'] =>
  DECK_GAMES.includes(game)

type DeckNoteProps = {
  /** The entry's game, whose own word counts the deck's items. */
  game: GameKind
  /** How many of its items are still to be dealt; `0` is a spent deck, whose entry deals from the game's bank. */
  left: number
}

/**
 * That a line-up entry brings content of its own, and how much is left of it:
 * a count and never an item, because the room may be reading the same screen.
 */
export const DeckNote: React.FC<DeckNoteProps> = ({ game, left }) => {
  const translate = useTranslate()

  if (!isDeckGame(game)) {
    return null
  }

  return (
    <span className='deck-note' data-spent={left === 0 || undefined} key={left}>
      <PenIcon />
      {left === 0
        ? translate(`${game}.deck.spent`)
        : translate(`${game}.deck.count`, { count: left })}
    </span>
  )
}
