import type { BlackSquareCell } from '@melee/protocol/black-square'
import type { GameKind } from '@melee/protocol/game'
import type { AnswerMode } from '@melee/protocol/room'
import {
  type HalvesVerdict,
  MOST_A_ROUND_PAYS,
  POINTS_PER_HALF,
  type Verdict
} from '@melee/protocol/scoring'

import { isBullseye, pointsForDistance } from '../atlas/distance-pay'
import { isSheetClosed, pointsForCells } from '../blacksquare/sheet-pay'
import { isSpotOn, pointsForEstimate } from '../estimate/estimate-pay'
import { isWholeSheetRight, pointsForPairs } from '../higherlower/pairs-pay'
import { isBestMove, pointsForMove } from '../matchsticks/move-pay'
import { isFirstPlace, pointsForPlace } from '../reflex/place-pay'
import { isExactColour, pointsForColour } from '../swatch/colour-pay'
import { isPerfectOrder, pointsForOrder } from '../timeline/order-pay'

/**
 * Which shape of verdict a game is judged in. The blind test asks two
 * independent questions of one answer, and it is the only thing on the shelf
 * that does — a charade and a quiz question are each guessed or they are not.
 *
 * The server checks a host's verdict against this before applying it: a
 * `halves` verdict in a buzzer round would pay two points for one claim, and a
 * socket is whatever its owner makes it.
 */
export const verdictKindFor = (game: GameKind): Verdict['kind'] =>
  game === 'blindtest' ? 'halves' : 'single'

/** The same shape, scoring nothing — a floor that ran out, or a host's "no". */
export const nothingScored = (game: GameKind): Verdict =>
  verdictKindFor(game) === 'halves'
    ? { artistCorrect: false, kind: 'halves', titleCorrect: false }
    : { isCorrect: false, kind: 'single' }

/**
 * A blind-test answer: a half alone is worth less than half the round, and
 * holding both is the whole of it. A right pick sets both halves, so a choice
 * round pays it whole as well.
 */
const pointsForHalves = (verdict: HalvesVerdict): number => {
  if (verdict.titleCorrect && verdict.artistCorrect) {
    return MOST_A_ROUND_PAYS
  }

  return verdict.titleCorrect || verdict.artistCorrect ? POINTS_PER_HALF : 0
}

/**
 * What a verdict is worth on the round's scale, as it would be paid with no
 * clock — every game and every mode tops out at `MOST_A_ROUND_PAYS`. A right
 * pick and a right typed answer are worth the same: the room plays one mode,
 * so a gap between them only ever made one game worth more than another.
 */
export const pointsFor = (verdict: Verdict): number => {
  if (verdict.kind === 'single') {
    return verdict.isCorrect ? MOST_A_ROUND_PAYS : 0
  }

  if (verdict.kind === 'distance') {
    return pointsForDistance(verdict)
  }

  if (verdict.kind === 'order') {
    return pointsForOrder(verdict)
  }

  if (verdict.kind === 'move') {
    return pointsForMove(verdict)
  }

  if (verdict.kind === 'cells') {
    return pointsForCells(verdict)
  }

  if (verdict.kind === 'colour') {
    return pointsForColour(verdict)
  }

  if (verdict.kind === 'number') {
    return pointsForEstimate(verdict)
  }

  if (verdict.kind === 'pairs') {
    return pointsForPairs(verdict)
  }

  if (verdict.kind === 'place') {
    return pointsForPlace(verdict)
  }

  return pointsForHalves(verdict)
}

/** A verdict that scores nothing is what locks the player out for the rest of the round. */
export const isMiss = (verdict: Verdict): boolean => pointsFor(verdict) === 0

/**
 * Whether this player has banked everything the round had for them, which is
 * what closes typed mode for them and what lets the round end before its clock
 * does. Two halves need both; one claim is finished the moment it is right.
 */
export const isFullyBanked = (verdict: Verdict): boolean => {
  switch (verdict.kind) {
    case 'halves':
      return verdict.titleCorrect && verdict.artistCorrect
    case 'single':
      return verdict.isCorrect
    case 'distance':
      return isBullseye(verdict)
    case 'order':
      return isPerfectOrder(verdict)
    case 'move':
      return isBestMove(verdict)
    case 'cells':
      return isSheetClosed(verdict)
    case 'colour':
      return isExactColour(verdict)
    case 'number':
      return isSpotOn(verdict)
    case 'pairs':
      return isWholeSheetRight(verdict)
    case 'place':
      return isFirstPlace(verdict)
  }
}

/**
 * Whether the clock takes a share of what this answer earned. A sheet is many
 * answers rather than one, and a bonus on it would pay the fastest typist
 * rather than the best-read player. A colour fades as it waits, so a slow one
 * already pays itself less, and a bonus would pay rushing one nobody looked at.
 * An estimate is not a reflex either: rushing one is guessing. A reflex place
 * is the speed already, paid by its podium.
 */
export const isPaidForSpeed = (verdict: Verdict): boolean =>
  verdict.kind !== 'cells' &&
  verdict.kind !== 'colour' &&
  verdict.kind !== 'number' &&
  verdict.kind !== 'place'

/**
 * Everyone answers at once in these, so none is decided by who was first to the
 * buzzer. Not a spoken round, answered by nobody on a screen: a keeper ticks
 * what one team says.
 */
export type SimultaneousMode = Exclude<AnswerMode, 'buzzer' | 'spoken'>

/**
 * What a simultaneous answer is worth before the clock takes its share. Only a
 * black-square sheet asks more of the round than its own verdict: in a room
 * playing *Nobody else had it*, its lone finds weigh double in its share.
 */
export const pointsForSimultaneousAnswer = ({
  doubledCells,
  verdict
}: {
  /** A black-square sheet's lone finds, in a room playing *Nobody else had it*. */
  doubledCells?: readonly BlackSquareCell[]
  verdict: Verdict
}): number =>
  verdict.kind === 'cells'
    ? pointsForCells({ ...verdict, doubledCells })
    : pointsFor(verdict)
