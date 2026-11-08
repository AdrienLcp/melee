import { z } from 'zod'

import { atlasTargetKindSchema } from './atlas'
import {
  BLACK_SQUARE_CELL_COUNT,
  blackSquareCellSchema,
  blackSquareCellTiersSchema
} from './black-square'
import { HIGHER_LOWER_PAIR_COUNT } from './higher-lower'
import { playerIdSchema } from './identifiers'

/**
 * One printed point, in the board's units. A thousand, because the clock pays
 * by the millisecond: three players right inside the same second are three
 * different scores, the first one highest, and a board of whole points could
 * only round them together. A screen prints `points / POINT`.
 */
export const POINT = 1_000

/**
 * The most any round pays, in every game and every mode — a sheet of nine
 * answers is one round, and so is a reflex race. One scale is what keeps a
 * player strong at a single game from running away with an evening: a full
 * black-square sheet once paid eighteen reflex rounds. Inside a round the
 * order between players is the game's own rule; only the ceiling is shared.
 *
 * Every rule prices an answer on this scale, as it would be paid with no
 * clock. A round the clock pays splits it — see `MOST_THE_CLOCK_PAYS`.
 */
export const MOST_A_ROUND_PAYS = 100 * POINT

/**
 * The clock's share of the ceiling, taken out of the answer's rather than
 * added on top: with the speed bonus on, a perfect answer keeps 90 and the
 * clock adds up to 10, falling linearly to nothing when the round runs out.
 *
 * The share scales with what the answer earned, so speed can only reverse two
 * players whose answers are within ten points of each other: a map pin 400 km
 * off placed in two seconds no longer beats one inside the country placed at
 * twenty-five, which the old bonus — up to the answer's own worth again — let
 * happen at a table. A wrong answer earns no speed at all.
 *
 * It replaced a rank table of `[2, 1]` — the first scorer, then the second —
 * which lost on the case it could not price: answering at one second and at
 * twenty-nine paid 2 and 1, when the gap the room saw was the whole round.
 * **Do not put the table back.**
 *
 * The bare buzzer pays no such share, and cannot — it has no round clock,
 * because the host brings the content and eight seconds into a charade is not
 * eight seconds into a riddle.
 */
export const MOST_THE_CLOCK_PAYS = 10 * POINT

/**
 * Half a blind-test answer, title or artist alone. Holding both is worth the
 * whole round, more than the sum of its halves, because typing both against a
 * clock is harder than either — and a host judging aloud pays the same.
 */
export const POINTS_PER_HALF = 40 * POINT

/**
 * What a hand correction moves a score by, a tenth of a round. A host fixes an
 * answer the rules got wrong in a few presses, never in a hundred.
 */
export const SCORE_ADJUSTMENT_STEP = 10 * POINT

/**
 * What the host granted, in the vocabulary of the game they were judging — the
 * same seam as `round.content`, one layer down.
 *
 * A blind test answer is two independent claims, so `halves` judges them
 * separately and half a guess still scores. Everything else is one claim: a
 * charade is guessed or it is not, and there is no half of it to award.
 *
 * Either way, a verdict worth nothing is what locks the player out and hands
 * the floor back to the room.
 */
/**
 * `titleCorrect` is the half the *track* named, which on a source drawn from
 * film composers is the **film** rather than the cue — see
 * `trackIdentitySchema.film`. The judging is identical either way, which is why
 * the verdict keeps one shape and only the screen changes its word.
 */
export const halvesVerdictSchema = z.object({
  artistCorrect: z.boolean(),
  kind: z.literal('halves'),
  titleCorrect: z.boolean()
})

export const singleVerdictSchema = z.object({
  isCorrect: z.boolean(),
  kind: z.literal('single')
})

/**
 * How far a marker fell from the answer, which is the world map's whole grade:
 * a point in the sea off Brittany is not *wrong* the way a wrong pick is, and
 * the curve in `@melee/core/atlas/distance-pay` pays it for being close.
 * Nought means inside a country, or on the city to the kilometre. The server
 * measures it; no screen ever sends one. `target` says which reach prices it,
 * since 50 km is a near miss of a country and a far one of a city.
 */
export const distanceVerdictSchema = z.object({
  distanceKm: z.number().nonnegative(),
  kind: z.literal('distance'),
  target: atlasTargetKindSchema
})

/**
 * How far an order sent for a timeline is from the true one, counted as the
 * pairs of events it puts the wrong way round. One neighbour swapped is one
 * pair, which reads as the near miss it is where a count of events in their
 * right place would call it two wrong; `@melee/core/timeline/order-pay` prices
 * it. The server counts it; no screen ever sends one.
 */
export const orderVerdictSchema = z.object({
  kind: z.literal('order'),
  swappedPairs: z.number().int().nonnegative()
})

/**
 * How good a matchstick move was, as the place of what it made among the
 * answers one stick can make, best first: `0` is a true equation or the
 * biggest (smallest) number, `1` the next best number, and so on. `null` is a
 * move that answers nothing — a false equation, a number no better than the
 * one dealt, or no number at all. `@melee/core/matchsticks/move-pay` prices
 * it. The server measures it; no screen ever sends one.
 */
export const moveVerdictSchema = z.object({
  kind: z.literal('move'),
  placesFromBest: z.number().int().nonnegative().nullable()
})

/**
 * A black-square sheet: the cells a seat has found so far, in the order it found
 * them, and whether it fell on the black word — which voids the sheet whatever
 * it holds, and closes it. `@melee/core/blacksquare/sheet-pay` prices it. The
 * server grades every line; no screen ever sends one.
 */
export const cellsVerdictSchema = z.object({
  /** The tier of every answer the round dealt: a full sheet holds them all, and each weighs its tier. */
  cellTiers: blackSquareCellTiersSchema,
  foundCells: z.array(blackSquareCellSchema).max(BLACK_SQUARE_CELL_COUNT),
  hitBlackWord: z.boolean(),
  kind: z.literal('cells')
})

/**
 * How far a rebuilt colour is from the one shown, as the Euclidean distance
 * between the two in OKLab: about `0.02` is the smallest gap an eye sees, and
 * black to white is `1`. `@melee/core/swatch/colour-pay` prices it. The server
 * measures it; no screen ever sends one.
 */
export const colourVerdictSchema = z.object({
  distance: z.number().nonnegative(),
  kind: z.literal('colour')
})

/**
 * How an estimate fell against the truth: the guess over the true value, so
 * 0.8 and 1.25 are the same miss on either side, and it is what the reveal
 * draws. It is the whole grade — a guess is paid for its own precision, never
 * for where it ranks, because a podium paid three seats nine times off.
 * `@melee/core/estimate/estimate-pay` prices it. The server measures it; no
 * screen ever sends one.
 */
export const numberVerdictSchema = z.object({
  kind: z.literal('number'),
  ratio: z.number().positive()
})

/**
 * A higher-or-lower sheet: how many of its pairs were picked the right way.
 * Five of five is the whole sheet. `@melee/core/higherlower/pairs-pay` prices
 * it. The server counts it; no screen ever sends one.
 */
export const pairsVerdictSchema = z.object({
  kind: z.literal('pairs'),
  rightPairs: z.number().int().min(0).max(HIGHER_LOWER_PAIR_COUNT)
})

export const verdictSchema = z.discriminatedUnion('kind', [
  halvesVerdictSchema,
  singleVerdictSchema,
  distanceVerdictSchema,
  orderVerdictSchema,
  moveVerdictSchema,
  cellsVerdictSchema,
  colourVerdictSchema,
  numberVerdictSchema,
  pairsVerdictSchema
])

export const awardSchema = z.object({
  /**
   * Paid on what the seat's screen held when the round closed, because it
   * never sent an answer — see `player.lean`. Said on that seat's own reveal,
   * so nobody wonders why a round they never answered scored.
   */
  isUnsent: z.boolean(),
  playerId: playerIdSchema,
  /** Everything the round paid, the speed bonus included. */
  points: z.number().int().nonnegative(),
  /**
   * How much of `points` the clock paid, so a screen can say why two players
   * who both got it right did not get the same. A curve is less visible than
   * the rank table it replaced — the room watched the order happen and could
   * count it — so the breakdown travels rather than being inferred.
   */
  speedBonus: z.number().int().nonnegative(),
  verdict: verdictSchema
})

export type Verdict = z.infer<typeof verdictSchema>
export type HalvesVerdict = z.infer<typeof halvesVerdictSchema>
export type SingleVerdict = z.infer<typeof singleVerdictSchema>
export type DistanceVerdict = z.infer<typeof distanceVerdictSchema>
export type OrderVerdict = z.infer<typeof orderVerdictSchema>
export type MoveVerdict = z.infer<typeof moveVerdictSchema>
export type CellsVerdict = z.infer<typeof cellsVerdictSchema>
export type ColourVerdict = z.infer<typeof colourVerdictSchema>
export type NumberVerdict = z.infer<typeof numberVerdictSchema>
export type PairsVerdict = z.infer<typeof pairsVerdictSchema>
export type Award = z.infer<typeof awardSchema>
