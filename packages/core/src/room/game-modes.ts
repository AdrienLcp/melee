import type { GameKind, GameSettings } from '@melee/protocol/game'
import {
  type AnswerMode,
  DEFAULT_MODE_SETTINGS,
  type ModeSettings,
  type RoomSettings
} from '@melee/protocol/room'

import { answerModesFor, capabilitiesOf } from './game-capabilities'

export const offersAnswerMode = ({
  game,
  mode
}: {
  game: GameSettings | null
  mode: AnswerMode
}): boolean => answerModesFor(game).includes(mode)

/**
 * Whether the round ends in a verdict a human has to grant, which is the one
 * thing that keeps a console out of its own game: a judge who is also answering
 * is not one.
 *
 * `buzzer` is the mode that asks for one, and the reflex race is the exception
 * that shares that mode without needing it — being first *is* being right
 * there, so the heat settles on the presses and nobody reads anything out.
 * Keying on the mode alone caught it by accident of what it narrows to. The
 * inner clock is the second: its round settles on the presses' gap to a count.
 *
 * The slate is the one game judged by hand under another mode: its sheets are
 * typed and its host marks them, knowing every answer from the key.
 *
 * A room with no game yet answers `true` under `buzzer`, because the seat is
 * withheld until something says otherwise rather than the other way round.
 */
export const isJudgedByHost = ({
  game,
  mode
}: {
  game: GameKind | null
  mode: AnswerMode
}): boolean =>
  game === 'slate' ||
  (mode === 'buzzer' && game !== 'reflex' && game !== 'innerclock')

/**
 * `isJudgedByHost` over the whole room: a table answering aloud is judged on
 * its console every round, whatever the game, and the console holds no seat.
 */
export const isRoomJudgedByHost = (settings: RoomSettings): boolean =>
  settings.teams.kind === 'aloud' ||
  isJudgedByHost({
    game: settings.game?.kind ?? null,
    mode: settings.mode.kind
  })

/**
 * Whether every way this game can be answered ends in a verdict the host
 * grants — the bare buzzer, the challenge and the slate — as opposed to a game
 * that merely offers a judged mode beside others. The first kind is a promise
 * about the game itself, which is what lets its box on the shelf say so.
 */
export const isJudgedInEveryMode = (game: GameKind): boolean =>
  capabilitiesOf(game).answerModes.every((mode) =>
    isJudgedByHost({ game, mode })
  )

/**
 * Why a console holds no seat, in the terms the host can act on — `null`
 * where it could hold one: `aloud` when the teams answer aloud, judged on the
 * console every round.
 *
 * A game or a mode the console judges withholds nothing: the seat sits those
 * rounds out and keeps its score (`isRoundJudgedByHost`).
 */
export type SeatWithheldReason = 'aloud'

export const seatWithheldReason = (
  settings: RoomSettings
): SeatWithheldReason | null =>
  settings.teams.kind === 'aloud' ? 'aloud' : null

/**
 * Whether the round on screen is one the console judges, from what it was
 * opened on rather than the settings, which may already have moved on. A
 * seated console sits it out and plays again on the next.
 */
export const isRoundJudgedByHost = (
  round: { answerMode: AnswerMode; content: { kind: GameKind } } | null
): boolean =>
  round !== null &&
  isJudgedByHost({ game: round.content.kind, mode: round.answerMode })

/**
 * The nearest thing to `preferred` that this game can serve, with its own
 * settings intact — the preference itself when the game offers it, and the
 * game's only mode otherwise. Carrying the settings rather than the kind is the
 * whole point of the arm: a host who set the floor to "you decide" keeps it.
 */
export const modeOfferedBy = ({
  game,
  preferred
}: {
  game: GameSettings
  preferred: ModeSettings
}): ModeSettings =>
  offersAnswerMode({ game, mode: preferred.kind })
    ? preferred
    : DEFAULT_MODE_SETTINGS[answerModesFor(game)[0] ?? preferred.kind]

/**
 * How a game expects to be answered before anybody has said otherwise. It is
 * the game's preference and not the room's rule: `modeOfferedBy` still narrows
 * it, so an entry naming a mode its own game does not offer is corrected rather
 * than served.
 *
 * Both games that serve their own content open on four candidates. A quiz
 * question is a sentence with one fact missing, and a table reads it faster
 * than it types it — the shape most of the bank was written in. A blind test
 * was opened on typing until a table played it over lunch: a clip leaves no
 * time to type an artist on a phone, and the room it was played in asked for
 * the four.
 */
const DEFAULT_ANSWER_MODE: Record<GameKind, AnswerMode> = {
  atlas: 'point',
  blacksquare: 'typed',
  blindtest: 'choice',
  buzzer: 'buzzer',
  challenge: 'buzzer',
  estimate: 'number',
  fiveclues: 'choice',
  higherlower: 'pairs',
  innerclock: 'buzzer',
  lights: 'tap',
  longestword: 'letters',
  makenumber: 'calculation',
  matchsticks: 'move',
  mostlikely: 'vote',
  mysteryword: 'word',
  petitbac: 'typed',
  quiz: 'choice',
  reflex: 'buzzer',
  slate: 'typed',
  swatch: 'colour',
  thinkalike: 'match',
  timeline: 'order'
}

/**
 * The mode `game` is answered on before anybody has said otherwise — what a
 * ready-made line-up promises, and what an evening moved to an entry falls
 * back on when the host's own word on that game is not there to be read.
 */
export const openingModeOf = (game: GameSettings): ModeSettings =>
  modeOfferedBy({
    game,
    preferred: DEFAULT_MODE_SETTINGS[DEFAULT_ANSWER_MODE[game.kind]]
  })
