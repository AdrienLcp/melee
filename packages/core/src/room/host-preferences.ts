import type { GameKind } from '@melee/protocol/game'
import type { RoomSettings } from '@melee/protocol/room'

import { followedByLineUp } from './line-up'
import type { GameSetup } from './room-settings'

/**
 * What one host keeps between rooms, split on the seam `movedToGame` turns on: a
 * game answers four of the room's settings, so those are remembered per game
 * and everything else is remembered once.
 *
 * That is why `roundCount` and `autoAdvanceMs` sit on the game's side of the
 * line despite being room settings. A host who lengthened the countdown meant it
 * for every game; a host who set the quiz to twenty rounds did not mean it for
 * the slate, and neither did the one whose bare buzzer runs until they stop it.
 * Nor did the one who held the reveal twenty-five seconds so a quiz note could be
 * read aloud mean it for a reflex race, which has nothing to read.
 */
export type HostPreferences = {
  /** What this host last left each game set to; absent until they have played it. */
  games: Partial<Record<GameKind, GameSetup>>
  /**
   * Everything no game answers, so it survives every switch — but the line-up,
   * which is this evening's and not this host's: a quick game opened from its
   * front door next week is one game, whatever was ticked tonight.
   */
  room: Omit<RoomSettings, keyof GameSetup | 'lineUp' | 'lineUpAt'>
}

/**
 * Whether the room was opened on an evening of several games, which only a
 * preset does: it decided the teams and the length, and the host's last quick
 * game decided neither.
 */
const isEvening = (settings: RoomSettings): boolean =>
  settings.lineUp.length > 1

/**
 * What this host last left `game` set to, and `null` when that is nothing
 * usable.
 *
 * A key and the arm filed under it can disagree — this is read back out of the
 * browser's own storage, which anyone can edit — and an arm that contradicts its
 * key is dropped rather than trusted. Trusting it would have the host press Quiz
 * and get a blind test.
 */
export const rememberedSetupFor = ({
  game,
  preferences
}: {
  game: GameKind
  preferences: HostPreferences | null
}): GameSetup | null => {
  const setup = preferences?.games[game]

  return setup !== undefined && setup.game.kind === game ? setup : null
}

/**
 * The room as this host would have left it. It is applied *over* the settings
 * the room opened on rather than replacing them, so anything never remembered
 * keeps what the door decided — the question language above all, which the door
 * reads off the host's own interface.
 *
 * An evening keeps what its preset decided — the teams, the track, the length
 * and the hold — and takes from the host only each entry's game settings. Not
 * the answer mode: an evening has nobody set aside to judge, so each game is
 * answered the way it opens — see `movedToEntry`.
 */
export const restoredSettings = ({
  preferences,
  settings
}: {
  preferences: HostPreferences
  settings: RoomSettings
}): RoomSettings => {
  const remembered =
    settings.game === null
      ? null
      : rememberedSetupFor({ game: settings.game.kind, preferences })

  if (isEvening(settings)) {
    return followedByLineUp({
      ...settings,
      ...preferences.room,
      ...remembered,
      autoAdvanceMs: settings.autoAdvanceMs,
      board: settings.board,
      lineUp: settings.lineUp.map(
        (entry) =>
          rememberedSetupFor({ game: entry.kind, preferences })?.game ?? entry
      ),
      mode: settings.mode,
      roundCount: settings.roundCount,
      teams: settings.teams
    })
  }

  return followedByLineUp({ ...settings, ...preferences.room, ...remembered })
}

/**
 * The same preferences with what the room is set to now folded in. The rest
 * pattern is the seam itself: whatever `RoomSettings` grows that no game answers
 * joins `room` without an edit here.
 *
 * A room still deciding what to play remembers nothing per game — there is no
 * game to file it under, and its `mode`, `roundCount` and reveal hold are the
 * shell's placeholders rather than anybody's choice.
 *
 * An evening files how each game was played and nothing of its own: its
 * length, its hold and its teams were the evening's, and remembering them
 * would hand tonight's party to next week's quick game.
 */
export const rememberSettings = ({
  preferences,
  settings
}: {
  preferences: HostPreferences | null
  settings: RoomSettings
}): HostPreferences => {
  const { autoAdvanceMs, game, lineUp, lineUpAt, mode, roundCount, ...room } =
    settings
  const evening = isEvening(settings)
  const filed =
    evening && game !== null
      ? (rememberedSetupFor({ game: game.kind, preferences }) ?? {
          autoAdvanceMs,
          roundCount
        })
      : { autoAdvanceMs, roundCount }

  return {
    games:
      game === null
        ? (preferences?.games ?? {})
        : {
            ...preferences?.games,
            [game.kind]: {
              autoAdvanceMs: filed.autoAdvanceMs,
              game,
              mode,
              roundCount: filed.roundCount
            }
          },
    room: evening && preferences !== null ? preferences.room : room
  }
}
