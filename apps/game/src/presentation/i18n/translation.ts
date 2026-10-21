import type { DotPath, PlainKey, Translator } from '@adrienlcp/i18n'

import type { ProtocolErrorCode } from '@melee/protocol/error-code'
import type { GameKind, ShelvedGame } from '@melee/protocol/game'
import type { QuestionCategory } from '@melee/protocol/question'
import type { AnswerMode } from '@melee/protocol/room'

import type { ClipRefusal } from '@melee/core/blindtest/clip-audio'
import type { BuzzBlocker } from '@melee/core/round/buzz-eligibility'

import type { ApiError } from '@/infrastructure/api/melee-api'

import type { EN_DICTIONARY } from './dictionary-en'

export type TranslationKey = DotPath<typeof EN_DICTIONARY>

/**
 * A key whose message carries no placeholder, so it renders from nothing but
 * itself. It is what a lookup table or a piece of state may hold: a key needing
 * values cannot be translated by whoever ends up reading it back.
 */
export type PlainTranslationKey = PlainKey<typeof EN_DICTIONARY>

export type Translate = Translator<typeof EN_DICTIONARY>

/**
 * Narrows a builder to the handful of keys it can return while checking that
 * the dictionary has every one of them — widening the enum underneath fails to
 * compile here until both locales carry the new string.
 */
type BuiltKey<Key extends PlainTranslationKey> = Key

/**
 * The server writes `message` in English for a developer reading a log. What a
 * player sees comes from the code, which is a closed enum.
 */
export const protocolErrorKey = (
  code: ProtocolErrorCode
): BuiltKey<`error.${ProtocolErrorCode}`> => `error.${code}`

export const apiErrorKey = (
  error: ApiError
): BuiltKey<`error.api.${ApiError}`> => `error.api.${error}`

export const buzzBlockerKey = (
  blocker: BuzzBlocker
): BuiltKey<`buzz.blocked.${BuzzBlocker}`> => `buzz.blocked.${blocker}`

export const clipRefusalKey = (
  refusal: ClipRefusal
): BuiltKey<`blindtest.audio.refused.${ClipRefusal}`> =>
  `blindtest.audio.refused.${refusal}`

export const answerModeLabelKey = (
  mode: AnswerMode
): BuiltKey<`host.answerMode.${AnswerMode}`> => `host.answerMode.${mode}`

/** The modes a game answering against its own question offers. */
type ServedMode = Exclude<AnswerMode, 'point'>

/**
 * How a game pays, in one sentence — its own, because the amounts differ and so
 * does what is being paid for: the blind test's buzzer sentence is about a title
 * and an artist judged separately, and neither other game has a half.
 *
 * A switch rather than a ternary, so a game added to the protocol stops
 * compiling here instead of quietly borrowing the blind test's prices.
 */
export const scoringKey = ({
  answerMode,
  asksForACity,
  asksForAFilm,
  game
}: {
  answerMode: AnswerMode
  /** The world map prices a French city by its own, tighter tiers. */
  asksForACity: boolean
  /** The blind test's two halves are a film and its composer on one source out of five. */
  asksForAFilm: boolean
  game: GameKind
}): BuiltKey<
  | 'buzzer.scoring'
  | 'challenge.scoring'
  | 'innerclock.scoring'
  | 'reflex.scoring'
  | 'slate.scoring'
  | 'worldmap.scoring'
  | 'worldmap.scoringCities'
  | `blindtest.scoring.${ServedMode}`
  | `blindtest.scoringFilm.${Exclude<ServedMode, 'choice'>}`
  | `quiz.scoring.${ServedMode}`
> => {
  // A marker is the map's alone, so the two games that serve their own
  // question are never in `point`; reading it as a pick keeps the switch total.
  const served = answerMode === 'point' ? 'choice' : answerMode

  switch (game) {
    case 'blindtest':
      // Choice mode names neither half — four candidates and one is right —
      // so it has one sentence whatever the round is asking for.
      return asksForAFilm && served !== 'choice'
        ? `blindtest.scoringFilm.${served}`
        : `blindtest.scoring.${served}`
    case 'buzzer':
      return 'buzzer.scoring'
    case 'challenge':
      return 'challenge.scoring'
    case 'innerclock':
      return 'innerclock.scoring'
    case 'quiz':
      return `quiz.scoring.${served}`
    case 'reflex':
      return 'reflex.scoring'
    case 'slate':
      return 'slate.scoring'
    case 'worldmap':
      return asksForACity ? 'worldmap.scoringCities' : 'worldmap.scoring'
  }
}

export const questionCategoryKey = (
  category: QuestionCategory
): BuiltKey<`quiz.category.${QuestionCategory}`> => `quiz.category.${category}`

/**
 * What a game is called, owed by every game the *server* serves rather than
 * only the ones with a front door: a room's tab names the game it is playing,
 * and a game reachable by a settings frame alone is still a game a room can be
 * in. Adding one to `gameKinds` stops compiling until both locales name it.
 */
export const gameNameKey = (game: GameKind): BuiltKey<`${GameKind}.name`> =>
  `${game}.name`

/**
 * The two the shelf and a game's own front door read, and those only the
 * shelved games owe — nothing pitches a game a room cannot be opened for.
 */
export const gameTaglineKey = (
  game: ShelvedGame
): BuiltKey<`${ShelvedGame}.tagline`> => `${game}.tagline`

export const gameDescriptionKey = (
  game: ShelvedGame
): BuiltKey<`${ShelvedGame}.home.description`> => `${game}.home.description`

const TEAM_COLOUR_KEYS = [
  'team.colour.pawn1',
  'team.colour.pawn2',
  'team.colour.pawn3',
  'team.colour.pawn4',
  'team.colour.pawn5',
  'team.colour.pawn6',
  'team.colour.pawn7',
  'team.colour.pawn8'
] as const satisfies readonly PlainTranslationKey[]

/** What a team is called before the host names it, from its 1-based pawn number. */
export const teamColourKey = (
  colour: number
): (typeof TEAM_COLOUR_KEYS)[number] =>
  TEAM_COLOUR_KEYS[(colour - 1) % TEAM_COLOUR_KEYS.length] ??
  'team.colour.pawn1'
