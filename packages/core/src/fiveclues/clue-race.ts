import { FIVE_CLUES_CLUE_COUNT } from '@melee/protocol/five-clues'
import type { AnswerMode } from '@melee/protocol/room'

/**
 * The three ways a five-clues round is answered: a typed line, a pick among
 * four countries, or a buzz said aloud and judged by the host.
 */
export type FiveCluesMode = Extract<AnswerMode, 'buzzer' | 'choice' | 'typed'>

/**
 * Where one seat stands in the round:
 *
 * - `racing` — still looking, `guessedOnClue` the last clue it guessed on,
 *   which locks a typed or a buzzing seat until the next clue opens;
 * - `found` — named the country on `clueIndex`, `elapsedInClueMs` into it;
 * - `out` — picked a wrong country, which ends a `choice` round for it.
 */
export type CluesSeat =
  | { guessedOnClue: number | null; status: 'racing' }
  | { clueIndex: number; elapsedInClueMs: number; status: 'found' }
  | { status: 'out' }

export const RACING_SEAT: CluesSeat = { guessedOnClue: null, status: 'racing' }

export const LAST_CLUE_INDEX = FIVE_CLUES_CLUE_COUNT - 1

/**
 * One guess per clue, so nobody sprays every country they know. A `choice`
 * seat never reaches a second clue racing: its one pick found it or put it out.
 */
export const mayGuess = ({
  openClueIndex,
  seat
}: {
  openClueIndex: number
  seat: CluesSeat
}): boolean => seat.status === 'racing' && seat.guessedOnClue !== openClueIndex

/**
 * A seat after a guess `mayGuess` let through: a right one found, a wrong
 * typed line or a buzz judged wrong locked until the next clue — one try a
 * clue, so a vague clue is still worth the risk — and a wrong pick out: four
 * candidates with retries would be the answer with extra steps.
 */
export const seatAfterGuess = ({
  elapsedInClueMs,
  isCorrect,
  mode,
  openClueIndex
}: {
  elapsedInClueMs: number
  isCorrect: boolean
  mode: FiveCluesMode
  openClueIndex: number
}): CluesSeat => {
  if (isCorrect) {
    return { clueIndex: openClueIndex, elapsedInClueMs, status: 'found' }
  }

  return mode === 'choice'
    ? { status: 'out' }
    : { guessedOnClue: openClueIndex, status: 'racing' }
}

/**
 * Whether the round has nobody left to wait for, and closes without waiting
 * for the clock: every seat has found or is out — or, on the last clue, has
 * guessed on it, since a typed seat held until a next clue that never comes
 * is out in all but name, and the table would only watch the clock.
 */
export const isRaceSettled = ({
  openClueIndex,
  seats
}: {
  openClueIndex: number
  seats: Iterable<CluesSeat>
}): boolean =>
  [...seats].every(
    (seat) =>
      seat.status !== 'racing' ||
      (openClueIndex === LAST_CLUE_INDEX &&
        seat.guessedOnClue === LAST_CLUE_INDEX)
  )

/**
 * The next clue opens before its time once every seat still racing has
 * guessed on the open one: nobody is left thinking, so the table would only
 * watch the clock. Never past the last clue, and never on a round already
 * settled, which closes instead.
 */
export const opensNextClueEarly = ({
  openClueIndex,
  seats
}: {
  openClueIndex: number
  seats: Iterable<CluesSeat>
}): boolean => {
  const racing = [...seats].filter((seat) => seat.status === 'racing')

  return (
    openClueIndex < LAST_CLUE_INDEX &&
    racing.length > 0 &&
    racing.every((seat) => seat.guessedOnClue === openClueIndex)
  )
}

/**
 * When the open clue's window ends: the next clue opens then, or the round
 * closes if it is the last.
 */
export const clueWindowEndsAt = ({
  clueDurationMs,
  openedAt
}: {
  clueDurationMs: number
  /** When the open clue opened, on the round's own clock. */
  openedAt: number
}): number => openedAt + clueDurationMs
