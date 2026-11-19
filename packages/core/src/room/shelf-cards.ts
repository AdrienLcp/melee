import {
  type GameKind,
  type ShelvedGame,
  shelvedGames
} from '@melee/protocol/game'

/**
 * A game played as a way of playing another, with no card of its own: it is
 * served, it has screens and a line-up may hold it, but a host reaches it from
 * its card's settings. _Plus ou moins_ is the estimate dealt as pairs.
 */
const CARD_OF_FORMAT: Readonly<Record<string, ShelvedGame>> = {
  higherlower: 'estimate'
}

/** The card a format id is picked under, or `null` when it is not a format. */
export const cardOfFormat = (id: string): ShelvedGame | null =>
  Object.hasOwn(CARD_OF_FORMAT, id) ? (CARD_OF_FORMAT[id] ?? null) : null

/** The card a game is picked under: its own, or the game it is a format of. */
export const cardOf = (game: GameKind): GameKind => cardOfFormat(game) ?? game

/** Whether a game is a card of its own rather than a format of another's. */
export const isOwnCard = (game: GameKind): boolean => cardOf(game) === game

/**
 * The games a host picks from — the home page's cards, the lobby's list, the
 * front doors — in `shelvedGames` order.
 */
export const shelfCards: readonly ShelvedGame[] = shelvedGames.filter(isOwnCard)
