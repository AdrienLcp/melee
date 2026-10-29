import { z } from 'zod'

import { atlasDirectionSchema, atlasPlaceSetSchema } from './atlas'
import {
  BLACK_SQUARE_CELL_COUNT,
  blackSquareAnswerCountSchema
} from './black-square'
import { matchsticksGoalSchema } from './matchsticks'
import {
  MAX_PETIT_BAC_CATEGORIES,
  MIN_PETIT_BAC_CATEGORIES,
  MIN_PLAYABLE_PETIT_BAC_LETTERS,
  petitBacCategoryCountSchema,
  petitBacCategorySchema,
  petitBacLetterSchema,
  petitBacLetters,
  RARE_PETIT_BAC_LETTERS
} from './petit-bac'
import { questionDrawSettingsSchema } from './question'
import { slateItemCountSchema, slateLabelsSchema } from './slate'
import { swatchShowMsSchema } from './swatch'
import { trackDifficultySchema, trackSourceSchema } from './track'

export const gameKinds = [
  'blindtest',
  'buzzer',
  'challenge',
  'blacksquare',
  'innerclock',
  'matchsticks',
  'petitbac',
  'quiz',
  'reflex',
  'slate',
  'timeline',
  'atlas',
  'swatch'
] as const

export const gameKindSchema = z.enum(gameKinds)

/**
 * The games a room may actually be opened for. It is not `gameKinds` and must
 * not collapse into it: a game is served in full before it has screens, and a
 * room opened on one of those would render another game's round. Refusing it at
 * the door beats opening a room whose first "start" cannot be looked at.
 *
 * `slate` spent a stage in exactly that window, as `reflex` did before it and
 * every game before that.
 *
 * **The order is the shelf's**, not the alphabet's: it is the order the front
 * door draws its cards in and the order the lobby's picker offers, so the two
 * games a table reaches for first come first. Sorting it is a product change.
 */
export const shelvedGames = [
  'blindtest',
  'quiz',
  'slate',
  'reflex',
  'buzzer',
  'atlas',
  'challenge',
  'innerclock',
  'matchsticks',
  'timeline',
  'blacksquare',
  'petitbac',
  'swatch'
] as const satisfies readonly GameKind[]

export const shelvedGameSchema = z.enum(shelvedGames)

/**
 * What a room is playing, and the settings only that game has. The room keeps
 * what every game needs — how a round is answered, how many rounds, the
 * countdown — and hands the rest here.
 *
 * This union exists because a second game exists. It is deliberately not a
 * registry, an engine interface or a payload of unknowns: two implementations
 * are enough to see the shape and not enough to abstract it, and
 * `docs/game-catalogue.md` holds the argument in full.
 */
export const gameSettingsSchema = z.discriminatedUnion('kind', [
  z.object({
    difficulty: trackDifficultySchema,
    kind: z.literal('blindtest'),
    /** A Deezer preview is 30 seconds, so this ceiling is a hard limit, not a taste call. */
    roundDurationMs: z.number().int().min(5_000).max(30_000),
    source: trackSourceSchema
  }),
  z.object({
    kind: z.literal('buzzer'),
    /**
     * Whether a wrong answer sits the player out for the rest of the round. The
     * blind test has no say in this — its round is a finite clip, and a table
     * that could buzz forever would burn it in seconds — but a host running a
     * charade does: one go each keeps a loud room honest, where an open field is
     * what a "name five" wants. `host.clearLockouts` reopens it either way.
     */
    locksOutOnMiss: z.boolean()
  }),
  /**
   * Nothing of its own: the line changes every round, so it rides the press
   * that opens one rather than sitting in the settings.
   */
  z.object({ kind: z.literal('challenge') }),
  z.object({
    /**
     * *Nobody else had it*: at the reveal, a cell one seat alone found pays
     * double. Typed rounds only — a spoken round has one team guessing, so
     * every find is that team's alone. Defaulted so a setup remembered before
     * the switch existed still parses.
     */
    /**
     * How many of the theme's answers a round deals, its most read first.
     * Defaulted so a setup remembered before the count existed still parses.
     */
    answerCount: blackSquareAnswerCountSchema.default(BLACK_SQUARE_CELL_COUNT),
    doublesLoneFinds: z.boolean().default(false),
    kind: z.literal('blacksquare'),
    /**
     * How long a sheet stays open. Longer than a question's, because a round
     * is up to nine answers and a seat keeps sending until its black word or
     * this runs out.
     */
    roundDurationMs: z.number().int().min(30_000).max(180_000)
  }),
  /**
   * Nothing of its own, like a challenge: the count changes every round, so it
   * rides the press that opens one.
   */
  z.object({ kind: z.literal('innerclock') }),
  z.object({
    /**
     * The goals a round may be dealt, one drawn per round. A room ticking only
     * the equations plays the classic; the numbers are dealt by the server and
     * never run out.
     */
    goals: z.array(matchsticksGoalSchema).min(1),
    kind: z.literal('matchsticks'),
    /** How long a puzzle stays up before the room is shown the move. */
    roundDurationMs: z.number().int().min(10_000).max(180_000)
  }),
  z.object({
    /**
     * The host's own list, played every round, or `null` to draw
     * `categoryCount` from the bank for each round.
     */
    categories: z
      .array(petitBacCategorySchema)
      .min(MIN_PETIT_BAC_CATEGORIES)
      .max(MAX_PETIT_BAC_CATEGORIES)
      .nullable(),
    /** How many a drawn round deals; a fixed list is as long as it is. */
    categoryCount: petitBacCategoryCountSchema,
    /** Left out of the draw, so some letter always stays playable. */
    excludedLetters: z
      .array(petitBacLetterSchema)
      .max(petitBacLetters.length - MIN_PLAYABLE_PETIT_BAC_LETTERS),
    kind: z.literal('petitbac'),
    /** How long the sheets stay open, unless a full one calls stop first. */
    roundDurationMs: z.number().int().min(60_000).max(300_000),
    /** Whether a seat whose every line is filled may close everyone's sheet. */
    stopsWhenFull: z.boolean()
  }),
  questionDrawSettingsSchema.extend({
    kind: z.literal('quiz'),
    /** How long a question stays open before the round times out. */
    roundDurationMs: z.number().int().min(5_000).max(120_000)
  }),
  /**
   * Nothing of its own, and the first arm that is empty rather than minimal.
   * The wait before the screen flips is drawn per round rather than set — a
   * fixed one is a wait a room learns to count — and the floor that keeps the
   * race honest is not a taste call either.
   */
  z.object({ kind: z.literal('reflex') }),
  z.object({
    /**
     * How many numbered lines a sheet opens with. The round's own count starts
     * here and grows with `host.addItem`, so a host who goes one cup at a time
     * opens on one — this setting is where the next sheet starts, not a cap.
     */
    itemCount: slateItemCountSchema,
    kind: z.literal('slate'),
    labels: slateLabelsSchema
  }),
  z.object({
    kind: z.literal('timeline'),
    /** How long the events stay up to be ordered before the round times out. */
    roundDurationMs: z.number().int().min(15_000).max(120_000)
  }),
  z.object({
    /** Defaulted so a setup remembered before the map asked both ways still parses. */
    direction: atlasDirectionSchema.default('place'),
    kind: z.literal('atlas'),
    /**
     * Defaulted so a host's setup remembered before French cities existed
     * still parses, rather than forgetting the whole game.
     */
    places: atlasPlaceSetSchema.default(['countries']),
    /** How long the map stays open before the round times out. */
    roundDurationMs: z.number().int().min(5_000).max(120_000)
  }),
  z.object({
    kind: z.literal('swatch'),
    /** How long the colour is rebuilt for once it has hidden, the showing not counted. */
    roundDurationMs: z.number().int().min(10_000).max(60_000),
    /** How long the colour stays up before every screen hides it. */
    showMs: swatchShowMsSchema
  })
])

export type GameKind = z.infer<typeof gameKindSchema>
export type ShelvedGame = z.infer<typeof shelvedGameSchema>
export type GameSettings = z.infer<typeof gameSettingsSchema>
export type BlindtestSettings = Extract<GameSettings, { kind: 'blindtest' }>
export type BuzzerSettings = Extract<GameSettings, { kind: 'buzzer' }>
export type ChallengeSettings = Extract<GameSettings, { kind: 'challenge' }>
export type BlackSquareSettings = Extract<GameSettings, { kind: 'blacksquare' }>
export type InnerclockSettings = Extract<GameSettings, { kind: 'innerclock' }>
export type MatchsticksSettings = Extract<GameSettings, { kind: 'matchsticks' }>
export type PetitBacSettings = Extract<GameSettings, { kind: 'petitbac' }>
export type QuizSettings = Extract<GameSettings, { kind: 'quiz' }>
export type ReflexSettings = Extract<GameSettings, { kind: 'reflex' }>
export type SlateSettings = Extract<GameSettings, { kind: 'slate' }>
export type TimelineSettings = Extract<GameSettings, { kind: 'timeline' }>
export type AtlasSettings = Extract<GameSettings, { kind: 'atlas' }>
export type SwatchSettings = Extract<GameSettings, { kind: 'swatch' }>

/**
 * How long a round stays open unanswered, or `null` for a game whose *settings*
 * have no such clock. The bare buzzer is the first `null`: nothing is being
 * played or displayed, so there is nothing for the room to run out of — the
 * round ends when someone is right or when the host says so. A room with no
 * game yet is the same answer for a different reason: there is no round to run
 * out.
 *
 * The reflex race is the third, and the only one that answers `null` while
 * still having a clock: its wait is drawn per round, so the round knows how
 * long it runs and the settings never could. `openPhaseDurationMs` is where the
 * two are reconciled, and it is why this reads *the settings'* clock rather
 * than *the round's*. The inner clock is the fourth of that kind: its cap is
 * the round's target, and a bar draining towards it would be the answer.
 */
export const roundDurationMsOf = (game: GameSettings | null): number | null =>
  game === null ||
  game.kind === 'buzzer' ||
  game.kind === 'challenge' ||
  game.kind === 'innerclock' ||
  game.kind === 'reflex' ||
  game.kind === 'slate'
    ? null
    : game.kind === 'swatch'
      ? game.showMs + game.roundDurationMs
      : game.roundDurationMs

/**
 * Whether a wrong answer sits the player out for the rest of the round. Only the
 * bare buzzer gets a say: every other game's round is a clip or a question that
 * runs out on its own, so a table that could buzz forever would spend it in
 * seconds.
 */
export const locksOutOnMissIn = (game: GameSettings | null): boolean =>
  game?.kind === 'buzzer' ? game.locksOutOnMiss : true

export const DEFAULT_BLINDTEST_SETTINGS: BlindtestSettings = {
  difficulty: 'wellKnown',
  kind: 'blindtest',
  roundDurationMs: 20_000,
  source: { kind: 'all' }
}

export const DEFAULT_BUZZER_SETTINGS: BuzzerSettings = {
  kind: 'buzzer',
  locksOutOnMiss: true
}

export const DEFAULT_CHALLENGE_SETTINGS: ChallengeSettings = {
  kind: 'challenge'
}

export const DEFAULT_BLACK_SQUARE_SETTINGS: BlackSquareSettings = {
  answerCount: BLACK_SQUARE_CELL_COUNT,
  doublesLoneFinds: false,
  kind: 'blacksquare',
  roundDurationMs: 60_000
}

export const DEFAULT_INNERCLOCK_SETTINGS: InnerclockSettings = {
  kind: 'innerclock'
}

export const DEFAULT_MATCHSTICKS_SETTINGS: MatchsticksSettings = {
  goals: ['equation', 'biggest', 'smallest'],
  kind: 'matchsticks',
  roundDurationMs: 60_000
}

export const DEFAULT_PETIT_BAC_SETTINGS: PetitBacSettings = {
  categories: null,
  categoryCount: 6,
  excludedLetters: [...RARE_PETIT_BAC_LETTERS],
  kind: 'petitbac',
  roundDurationMs: 120_000,
  stopsWhenFull: true
}

export const DEFAULT_QUIZ_SETTINGS: QuizSettings = {
  allowsAdultContent: false,
  categories: [],
  kind: 'quiz',
  language: 'fr',
  roundDurationMs: 30_000,
  wellKnownOnly: false
}

export const DEFAULT_REFLEX_SETTINGS: ReflexSettings = { kind: 'reflex' }

export const DEFAULT_SLATE_SETTINGS: SlateSettings = {
  itemCount: 10,
  kind: 'slate',
  labels: []
}

/** Forty-five seconds, because five rows are dragged into place before anything is sent. */
export const DEFAULT_TIMELINE_SETTINGS: TimelineSettings = {
  kind: 'timeline',
  roundDurationMs: 45_000
}

export const DEFAULT_ATLAS_SETTINGS: AtlasSettings = {
  direction: 'place',
  kind: 'atlas',
  places: ['countries'],
  roundDurationMs: 30_000
}

/** Five seconds shown, a glance a table calls fair, and twenty to rebuild it. */
export const DEFAULT_SWATCH_SETTINGS: SwatchSettings = {
  kind: 'swatch',
  roundDurationMs: 20_000,
  showMs: 5_000
}

/** A record rather than a switch, so a new kind without a default cannot compile. */
export const DEFAULT_GAME_SETTINGS: Record<GameKind, GameSettings> = {
  atlas: DEFAULT_ATLAS_SETTINGS,
  blacksquare: DEFAULT_BLACK_SQUARE_SETTINGS,
  blindtest: DEFAULT_BLINDTEST_SETTINGS,
  buzzer: DEFAULT_BUZZER_SETTINGS,
  challenge: DEFAULT_CHALLENGE_SETTINGS,
  innerclock: DEFAULT_INNERCLOCK_SETTINGS,
  matchsticks: DEFAULT_MATCHSTICKS_SETTINGS,
  petitbac: DEFAULT_PETIT_BAC_SETTINGS,
  quiz: DEFAULT_QUIZ_SETTINGS,
  reflex: DEFAULT_REFLEX_SETTINGS,
  slate: DEFAULT_SLATE_SETTINGS,
  swatch: DEFAULT_SWATCH_SETTINGS,
  timeline: DEFAULT_TIMELINE_SETTINGS
}
