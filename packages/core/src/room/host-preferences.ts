import type { GameKind } from '@melee/protocol/game'
import type { Locale } from '@melee/protocol/locale'
import type { RoomSettings } from '@melee/protocol/room'

import { questionLanguageFor } from '../quiz/question-language'
import { followedByLineUp, lineUpHolds } from './line-up'
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
   * Everything no game answers — the teams and the board among it —
   * so it survives every switch and opens every table, one game or several.
   * Not the line-up nor its order, which are this evening's: the games of the
   * last evening are kept apart, by the home tray that opens on them, and its
   * variants and running order are dealt again tonight.
   */
  room: Omit<
    RoomSettings,
    keyof GameSetup | 'lineUp' | 'lineUpAt' | 'runningOrder'
  >
}

/**
 * The same preferences, with the quiz asking in the language this host reads
 * today. A remembered question language is most often the one a door read off
 * another interface rather than anybody's choice, and a room opened in French
 * that draws English questions is the wrong game. A host who wants the other
 * bank picks it in the room, and keeps it until they leave the console.
 */
export const askedIn = ({
  locale,
  preferences
}: {
  locale: Locale
  preferences: HostPreferences
}): HostPreferences => {
  const quiz = preferences.games.quiz

  if (quiz?.game.kind !== 'quiz') {
    return preferences
  }

  return {
    ...preferences,
    games: {
      ...preferences.games,
      quiz: {
        ...quiz,
        game: { ...quiz.game, language: questionLanguageFor(locale) }
      }
    }
  }
}

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

const restoredTable = ({
  preferences,
  remembered,
  settings
}: {
  preferences: HostPreferences
  remembered: GameSetup | null
  settings: RoomSettings
}): RoomSettings => {
  const table = { ...settings, ...preferences.room }
  const lineUp = settings.lineUp.map(
    (entry) =>
      rememberedSetupFor({ game: entry.kind, preferences })?.game ?? entry
  )

  return {
    ...table,
    game:
      settings.lineUpAt === null
        ? settings.game
        : (lineUp[settings.lineUpAt] ?? settings.game),
    lineUp,
    mode: remembered?.mode ?? settings.mode
  }
}

/**
 * The room as this host would have left it. It is applied *over* the settings
 * the room opened on rather than replacing them, so anything never remembered
 * keeps what the door decided — the question language above all, which the door
 * reads off the host's own interface.
 *
 * The teams and the board are this host's on any table. A table of several
 * keeps its own length and hold, and takes each entry's game settings and
 * answer mode from the host, as `movedToEntry` answers every later switch.
 * Teams that would refuse a game ticked — a
 * table answering aloud over a slate — give way to the door's.
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

  const restored = isEvening(settings)
    ? restoredTable({ preferences, remembered, settings })
    : followedByLineUp({ ...settings, ...preferences.room, ...remembered })

  return lineUpHolds(restored)
    ? restored
    : { ...restored, teams: settings.teams }
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
 * A table of several files how each game was answered, and the teams and
 * board as any table does — but not its length or its hold, which were the
 * table's.
 */
export const rememberSettings = ({
  preferences,
  settings
}: {
  preferences: HostPreferences | null
  settings: RoomSettings
}): HostPreferences => {
  const {
    autoAdvanceMs,
    game,
    lineUp,
    lineUpAt,
    mode,
    roundCount,
    runningOrder,
    ...room
  } = settings
  const evening = isEvening(settings)
  const filed =
    evening && game !== null
      ? (rememberedSetupFor({ game: game.kind, preferences }) ?? {
          autoAdvanceMs,
          mode,
          roundCount
        })
      : { autoAdvanceMs, mode, roundCount }

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
    room
  }
}
