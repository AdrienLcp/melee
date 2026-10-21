import type { GameKind } from '@melee/protocol/game'
import type { Locale } from '@melee/protocol/locale'
import type { RoomSettings } from '@melee/protocol/room'

import { isPlayableAloud } from './game-capabilities'
import { type GameSetup, movedToGame } from './room-settings'

/**
 * Whether `game` is one of the games ticked — always, once there is a game,
 * and none ticked before there is. The schema cannot say it across two fields,
 * so the server asks here before it accepts a settings frame. Nor can it say
 * that a table answering aloud ticks only games played without a screen.
 */
export const lineUpHolds = (settings: RoomSettings): boolean =>
  (settings.game === null
    ? settings.lineUp.length === 0
    : settings.lineUp.includes(settings.game.kind)) &&
  settings.lineUp.every((game) =>
    isPlayableAloud({ game, teams: settings.teams })
  )

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

/** What an evening falls back to when none of its games can be played aloud. */
const FIRST_GAME_ALOUD: GameKind = 'quiz'

/**
 * The settings with every game a table answering aloud cannot play taken out
 * of the line-up, so the press that turns it on is the whole change. A room
 * still deciding has nothing to take out; an evening of only such games gets
 * the quiz, because the last tick never goes on its own.
 */
export const fittedToAloud = ({
  locale,
  rememberedFor,
  settings
}: {
  locale: Locale
  rememberedFor: (game: GameKind) => GameSetup | null
  settings: RoomSettings
}): RoomSettings => {
  const playsAloud = (game: GameKind) =>
    isPlayableAloud({ game, teams: settings.teams })

  if (settings.lineUp.length === 0 || settings.lineUp.every(playsAloud)) {
    return settings
  }

  const toggle = (from: RoomSettings, game: GameKind) =>
    toggledInLineUp({ game, locale, rememberedFor, settings: from })

  const withOne = settings.lineUp.some(playsAloud)
    ? settings
    : toggle(settings, FIRST_GAME_ALOUD)

  return withOne.lineUp
    .filter((game) => !playsAloud(game))
    .reduce(toggle, withOne)
}
