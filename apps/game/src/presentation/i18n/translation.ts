import type { DotPath, PlainKey, Translator } from '@adrienlcp/i18n'

import type { ProtocolErrorCode } from '@melee/protocol/error-code'
import type { GameKind, ShelvedGame } from '@melee/protocol/game'
import type { QuestionCategory } from '@melee/protocol/question'
import type { AnswerMode } from '@melee/protocol/room'
import type {
  WorldmapDirection,
  WorldmapPlaces
} from '@melee/protocol/worldmap'

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
type ServedMode = Exclude<AnswerMode, 'move' | 'order' | 'point' | 'spoken'>

const WORLDMAP_SCORING_KEYS = {
  countries: 'worldmap.scoring',
  frenchCities: 'worldmap.scoringCities',
  worldCapitals: 'worldmap.scoringCapitals'
} as const satisfies Record<WorldmapPlaces, string>

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
  asksForAFilm,
  doublesLoneFinds,
  game,
  worldmap
}: {
  answerMode: AnswerMode
  /** The blind test's two halves are a film and its composer on one source out of five. */
  asksForAFilm: boolean
  /** Guess nine's *Nobody else had it*, which doubles a lone find. */
  doublesLoneFinds: boolean
  game: GameKind
  /** Which way a map room asks and what it draws from, each kind priced by its own tiers; `null` off the map. */
  worldmap: {
    direction: WorldmapDirection
    places: readonly WorldmapPlaces[]
  } | null
}): BuiltKey<
  | 'buzzer.scoring'
  | 'challenge.scoring'
  | 'guessnine.scoring'
  | 'guessnine.scoringLoneFinds'
  | 'guessnine.scoringSpoken'
  | 'innerclock.scoring'
  | 'matchsticks.scoring'
  | 'matchsticks.scoringMove'
  | 'petitbac.scoring'
  | 'reflex.scoring'
  | 'slate.scoring'
  | 'timeline.scoring'
  | 'worldmap.scoring'
  | 'worldmap.scoringCapitals'
  | 'worldmap.scoringCities'
  | 'worldmap.scoringMixed'
  | `worldmap.scoringName.${Exclude<ServedMode, 'buzzer'>}`
  | `blindtest.scoring.${ServedMode}`
  | `blindtest.scoringFilm.${Exclude<ServedMode, 'choice'>}`
  | `quiz.scoring.${ServedMode}`
> => {
  // A marker is the map's alone, an order the timeline's, a move the
  // matchsticks' and a spoken round guess nine's, so the two games that serve
  // their own question are never in any of them; reading them as a pick keeps
  // the switch total.
  const served =
    answerMode === 'point' ||
    answerMode === 'order' ||
    answerMode === 'move' ||
    answerMode === 'spoken'
      ? 'choice'
      : answerMode

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
    case 'guessnine':
      if (answerMode === 'spoken') {
        return 'guessnine.scoringSpoken'
      }

      return doublesLoneFinds
        ? 'guessnine.scoringLoneFinds'
        : 'guessnine.scoring'
    case 'innerclock':
      return 'innerclock.scoring'
    case 'matchsticks':
      return answerMode === 'move'
        ? 'matchsticks.scoringMove'
        : 'matchsticks.scoring'
    case 'petitbac':
      return 'petitbac.scoring'
    case 'quiz':
      return `quiz.scoring.${served}`
    case 'reflex':
      return 'reflex.scoring'
    case 'slate':
      return 'slate.scoring'
    case 'timeline':
      return 'timeline.scoring'
    case 'worldmap':
      if (worldmap?.direction === 'name') {
        return `worldmap.scoringName.${served === 'typed' ? 'typed' : 'choice'}`
      }

      return worldmap !== null && worldmap.places.length > 1
        ? 'worldmap.scoringMixed'
        : WORLDMAP_SCORING_KEYS[worldmap?.places[0] ?? 'countries']
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

/**
 * The home press with one game ticked. A whole sentence per game rather than
 * *Play {name}*, because French elides and contracts the article into the verb
 * — *au*, *à l’*, *aux*, one per game.
 */
export const gamePlayKey = (
  game: ShelvedGame
): BuiltKey<`${ShelvedGame}.play`> => `${game}.play`

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
