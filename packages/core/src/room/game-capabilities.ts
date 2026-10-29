import type { GameKind, GameSettings } from '@melee/protocol/game'
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
 * Black square is typed on every screen at once, or said aloud by one team while
 * a seat of another ticks what it hears — which needs teams with seats, and
 * `isPlayableWithTeams` says so.
 */
const TYPED_OR_SPOKEN = [
  'typed',
  'spoken'
] as const satisfies readonly AnswerMode[]

/**
 * The world map asks both ways. Placing what it names is answered by putting a
 * marker down, which is neither a pick among four nor a line typed: the answer
 * is a place, and the server measures it. Naming what it shows is a quiz
 * question, and opens on four candidates like one.
 */
const POINT_ONLY = ['point'] as const satisfies readonly AnswerMode[]
const NAMED = ['choice', 'typed'] as const satisfies readonly AnswerMode[]
const POINT_OR_NAMED = [
  ...POINT_ONLY,
  ...NAMED
] as const satisfies readonly AnswerMode[]

/** The timeline is answered by sending the events in an order, which the server counts. */
const ORDER_ONLY = ['order'] as const satisfies readonly AnswerMode[]

/** A colour is answered by rebuilding it on a picker, which the server measures. */
const COLOUR_ONLY = ['colour'] as const satisfies readonly AnswerMode[]

/** Most likely is answered by voting for a seat, which the server counts. */
const VOTE_ONLY = ['vote'] as const satisfies readonly AnswerMode[]

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
   *
   * Every mode the game may take under some setting of its own —
   * `answerModesFor` narrows it to what its settings offer now.
   */
  answerModes: readonly AnswerMode[]
  /**
   * Whether a round of it can make the room's speaker sound: a clip, or the
   * honk when a buzz takes the floor. A screen that plays none owes nobody
   * an offer to unmute it.
   */
  makesSound: boolean
  /**
   * Whether a table with no phone can play it, the wall showing the round and
   * the host tapping who had it. Not a game whose answer *is* a screen: a pawn
   * put down on a map, a press racing a colour, a sheet written in private.
   */
  playsAloud: boolean
  /**
   * Whether two seats can play a round of it head to head while the room
   * watches. A race cannot — the bare buzzer and the reflex race are decided
   * *between* players — and neither can a sheet the host marks across the
   * whole room.
   */
  playsDuels: boolean
  /**
   * Whether a round of it brings its own question. The bare buzzer, the slate
   * and the challenge play what the host brings, so an entry of one plays once
   * an evening — a second round would replay the same sheet or the same line —
   * and only the others fill the rounds left over.
   */
  servesItsOwnContent: boolean
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
        makesSound: true,
        playsAloud: true,
        playsDuels: true,
        servesItsOwnContent: true
      }
    case 'buzzer':
    case 'challenge':
      return {
        answerModes: BUZZER_ONLY,
        makesSound: true,
        playsAloud: true,
        playsDuels: false,
        servesItsOwnContent: false
      }
    case 'matchsticks':
      return {
        answerModes: MOVE_OR_BUZZER,
        makesSound: true,
        playsAloud: true,
        playsDuels: false,
        servesItsOwnContent: true
      }
    case 'blacksquare':
      return {
        answerModes: TYPED_OR_SPOKEN,
        makesSound: false,
        playsAloud: false,
        playsDuels: true,
        servesItsOwnContent: true
      }
    case 'innerclock':
    case 'reflex':
      return {
        answerModes: BUZZER_ONLY,
        makesSound: false,
        playsAloud: false,
        playsDuels: false,
        servesItsOwnContent: true
      }
    // A sheet paid by what nobody else wrote needs the whole room writing it,
    // so it never plays as a duel.
    case 'petitbac':
      return {
        answerModes: TYPED_ONLY,
        makesSound: false,
        playsAloud: false,
        playsDuels: false,
        servesItsOwnContent: true
      }
    case 'slate':
      return {
        answerModes: TYPED_ONLY,
        makesSound: false,
        playsAloud: false,
        playsDuels: false,
        servesItsOwnContent: false
      }
    case 'timeline':
      return {
        answerModes: ORDER_ONLY,
        makesSound: false,
        playsAloud: false,
        playsDuels: true,
        servesItsOwnContent: true
      }
    case 'atlas':
      return {
        answerModes: POINT_OR_NAMED,
        makesSound: false,
        playsAloud: false,
        playsDuels: true,
        servesItsOwnContent: true
      }
    case 'swatch':
      return {
        answerModes: COLOUR_ONLY,
        makesSound: false,
        playsAloud: false,
        playsDuels: true,
        servesItsOwnContent: true
      }
    // Two seats voting for one of themselves is not a round.
    case 'mostlikely':
      return {
        answerModes: VOTE_ONLY,
        makesSound: false,
        playsAloud: false,
        playsDuels: false,
        servesItsOwnContent: true
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
export const answerModesFor = (
  game: GameSettings | null
): readonly AnswerMode[] => {
  if (game === null) {
    return answerModes
  }

  if (game.kind === 'atlas') {
    return game.direction === 'name' ? NAMED : POINT_ONLY
  }

  return capabilitiesOf(game.kind).answerModes
}

/**
 * Whether a room's teams can play `mode`: a spoken round needs a team to guess
 * and a seat of another to keep the list, so it asks for teams that hold seats
 * — never none, never a table answering aloud with no screen in hand.
 */
export const isPlayableWithTeams = ({
  mode,
  teams
}: {
  mode: AnswerMode
  teams: TeamsSettings
}): boolean =>
  mode !== 'spoken' || teams.kind === 'drawn' || teams.kind === 'chosen'

/**
 * Whether nothing the evening plays makes a sound — every game ticked and the
 * one on now. An evening whose game is not picked yet is not silent: what the
 * table settles on may be a blind test.
 */
export const isEveningSilent = ({
  game,
  lineUp
}: {
  game: GameSettings | null
  lineUp: readonly GameSettings[]
}): boolean => {
  const games = game === null ? lineUp : [...lineUp, game]

  return (
    games.length > 0 &&
    games.every(({ kind }) => !capabilitiesOf(kind).makesSound)
  )
}
