import type { GameKind } from '@melee/protocol/game'
import { type AnswerMode, answerModes } from '@melee/protocol/room'
import type { TeamsSettings } from '@melee/protocol/team'

/** What a game that serves its own question offers: a buzzer, four candidates or a typed field. */
const SERVED_MODES = [
  'buzzer',
  'choice',
  'typed'
] as const satisfies readonly AnswerMode[]

const BUZZER_ONLY = ['buzzer'] as const satisfies readonly AnswerMode[]

/**
 * The slate is written, so it is `typed` — the mode says how a round is
 * answered, and a sheet is answered by typing. What the mode usually brings
 * with it, a server grade and a speed bonus, is the game's to refuse: the host
 * marks the sheets, which `isJudgedByHost` says rather than this.
 */
const TYPED_ONLY = ['typed'] as const satisfies readonly AnswerMode[]

/**
 * The world map is answered by putting a marker down, which is neither a pick
 * among four nor a line typed: the answer is a place, and the server measures it.
 */
const POINT_ONLY = ['point'] as const satisfies readonly AnswerMode[]

/** The timeline is answered by sending the events in an order, which the server counts. */
const ORDER_ONLY = ['order'] as const satisfies readonly AnswerMode[]

/**
 * Matchsticks is answered by moving a stick on every screen at once, which the
 * server judges — first, so a room opens on it — or aloud on the buzzer, the
 * host judging the move whoever took the floor says.
 */
const MOVE_OR_BUZZER = [
  'move',
  'buzzer'
] as const satisfies readonly AnswerMode[]

/**
 * What the shell may ask of a game without knowing anything else about it —
 * the questions an evening of several games puts to each one it draws.
 */
export type GameCapabilities = {
  /**
   * Which answer modes it offers. The mode is the room's because the shell
   * reads it everywhere a round is answered and scored; what a game does is
   * narrow it, and two of them narrow it to one — four candidates and a typed
   * field both need something to answer *against*, and neither the bare buzzer
   * nor the reflex race serves anything to answer.
   *
   * A game with one mode is a game whose host is never asked: the panel hides
   * the control rather than offering an option that would break the round.
   */
  answerModes: readonly AnswerMode[]
  /**
   * Whether a table with no phone can play it, the wall showing the round and
   * the host tapping who had it. Not a game whose answer *is* a screen: a pawn
   * put down on a map, a press racing a colour, a sheet written in private.
   */
  playsAloud: boolean
  /**
   * Whether one team can play a round of it while the others watch. A race
   * cannot — the bare buzzer and the reflex race are decided *between* players
   * — and neither can a sheet the host marks across the whole room.
   */
  playsInTeamTurns: boolean
  /**
   * Whether the wall may answer for a team, which takes a round every screen
   * answers at once against something served: a press on the wall cannot win a
   * race against a phone, and a sheet is private to the seat writing it.
   */
  wallAnswers: boolean
}

/**
 * A switch rather than a default, so that adding a game kind stops compiling
 * here instead of silently being offered a typed field it cannot grade.
 */
export const capabilitiesOf = (game: GameKind): GameCapabilities => {
  switch (game) {
    case 'blindtest':
    case 'quiz':
      return {
        answerModes: SERVED_MODES,
        playsAloud: true,
        playsInTeamTurns: true,
        wallAnswers: true
      }
    case 'buzzer':
    case 'challenge':
      return {
        answerModes: BUZZER_ONLY,
        playsAloud: true,
        playsInTeamTurns: false,
        wallAnswers: false
      }
    case 'matchsticks':
      return {
        answerModes: MOVE_OR_BUZZER,
        playsAloud: true,
        playsInTeamTurns: false,
        wallAnswers: false
      }
    case 'innerclock':
    case 'reflex':
      return {
        answerModes: BUZZER_ONLY,
        playsAloud: false,
        playsInTeamTurns: false,
        wallAnswers: false
      }
    case 'slate':
      return {
        answerModes: TYPED_ONLY,
        playsAloud: false,
        playsInTeamTurns: false,
        wallAnswers: false
      }
    case 'timeline':
      return {
        answerModes: ORDER_ONLY,
        playsAloud: false,
        playsInTeamTurns: true,
        wallAnswers: true
      }
    case 'worldmap':
      return {
        answerModes: POINT_ONLY,
        playsAloud: false,
        playsInTeamTurns: true,
        wallAnswers: true
      }
  }
}

/** Whether `game` may be ticked in a room whose teams answer aloud. */
export const isPlayableAloud = ({
  game,
  teams
}: {
  game: GameKind
  teams: TeamsSettings
}): boolean => teams.kind !== 'aloud' || capabilitiesOf(game).playsAloud

/**
 * A room with no game yet narrows nothing, which is what lets the settings
 * frame carrying a mode be accepted before the table has decided. The panel
 * still shows no strip — "how to answer" cannot be explained without a game —
 * and `movedToGame` narrows whatever was held the moment one is picked.
 */
export const answerModesFor = (game: GameKind | null): readonly AnswerMode[] =>
  game === null ? answerModes : capabilitiesOf(game).answerModes
