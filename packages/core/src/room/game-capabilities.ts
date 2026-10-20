import type { GameKind } from '@melee/protocol/game'
import { type AnswerMode, answerModes } from '@melee/protocol/room'

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
        playsInTeamTurns: true,
        wallAnswers: true
      }
    case 'buzzer':
    case 'challenge':
    case 'reflex':
      return {
        answerModes: BUZZER_ONLY,
        playsInTeamTurns: false,
        wallAnswers: false
      }
    case 'slate':
      return {
        answerModes: TYPED_ONLY,
        playsInTeamTurns: false,
        wallAnswers: false
      }
    case 'worldmap':
      return {
        answerModes: POINT_ONLY,
        playsInTeamTurns: true,
        wallAnswers: true
      }
  }
}

/**
 * A room with no game yet narrows nothing, which is what lets the settings
 * frame carrying a mode be accepted before the table has decided. The panel
 * still shows no strip — "how to answer" cannot be explained without a game —
 * and `movedToGame` narrows whatever was held the moment one is picked.
 */
export const answerModesFor = (game: GameKind | null): readonly AnswerMode[] =>
  game === null ? answerModes : capabilitiesOf(game).answerModes
