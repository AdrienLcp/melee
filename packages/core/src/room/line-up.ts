import type { GameKind } from '@melee/protocol/game'
import type { Locale } from '@melee/protocol/locale'
import type { RoomSettings } from '@melee/protocol/room'

import { type GameSetup, movedToGame } from './room-settings'

/**
 * Whether `game` is one of the games ticked — always, once there is a game,
 * and none ticked before there is. The schema cannot say it across two fields,
 * so the server asks here before it accepts a settings frame.
 */
export const lineUpHolds = (settings: RoomSettings): boolean =>
  settings.game === null
    ? settings.lineUp.length === 0
    : settings.lineUp.includes(settings.game.kind)

/**
 * The settings with `game` ticked into the line-up or taken out of it.
 *
 * The first tick of a room still deciding picks its game. Taking out the game
 * the next round is on moves the room to the first one left, with what this
 * host last left that game set to. The last tick cannot be taken out: a room
 * that has picked a game does not go back to deciding.
 */
export const toggledInLineUp = ({
  game,
  locale,
  rememberedFor,
  settings
}: {
  game: GameKind
  locale: Locale
  /** What this host last left a game set to, or `null` if they never have. */
  rememberedFor: (game: GameKind) => GameSetup | null
  settings: RoomSettings
}): RoomSettings => {
  if (!settings.lineUp.includes(game)) {
    return settings.game === null
      ? movedToGame({ game, locale, remembered: rememberedFor(game), settings })
      : { ...settings, lineUp: [...settings.lineUp, game] }
  }

  const rest = settings.lineUp.filter((ticked) => ticked !== game)
  const [first] = rest

  if (first === undefined) {
    return settings
  }

  if (settings.game?.kind !== game) {
    return { ...settings, lineUp: rest }
  }

  return movedToGame({
    game: first,
    locale,
    remembered: rememberedFor(first),
    settings: { ...settings, lineUp: rest }
  })
}
