import { Result } from '@adrienlcp/result'

import type { CountryCode } from '@melee/protocol/country-code'
import type {
  CluesStanding,
  FiveCluesLadder,
  YourCluesStanding
} from '@melee/protocol/five-clues'
import type { PlayerId } from '@melee/protocol/identifiers'
import type { AnswerMode, RoundContent } from '@melee/protocol/room'
import type { Award } from '@melee/protocol/scoring'

import { pointsForClue, worthOfClue } from '@melee/core/fiveclues/clue-pay'
import {
  type CluesSeat,
  type FiveCluesMode,
  isRaceSettled,
  LAST_CLUE_INDEX,
  mayGuess,
  opensNextClueEarly,
  RACING_SEAT,
  seatAfterGuess
} from '@melee/core/fiveclues/clue-race'
import { shuffled } from '@melee/core/helpers/random'
import {
  gradeQuizGuess,
  type QuestionAnswer
} from '@melee/core/quiz/question-answer'
import { isExpectedInRound } from '@melee/core/round/round-roster'
import { isPerfectPay } from '@melee/core/scoring/perfect-pay'

import type { Room, Round } from '@/domain/room/room'
import { touch } from '@/domain/room/room-service'
import {
  type AnswerRejection,
  elapsedRoundMs
} from '@/domain/round/round-service'

type FiveCluesContent = Extract<Round['content'], { kind: 'fiveclues' }>

export type FiveCluesGuess =
  | { choiceIndex: number; kind: 'choice' }
  | { guess: string; kind: 'typed' }

export const fiveCluesContent = ({
  answer,
  clueDurationMs,
  country,
  ladder,
  mode
}: {
  /** What a typed line is graded against, and the three names `choice` puts beside it. */
  answer: QuestionAnswer
  clueDurationMs: number
  country: CountryCode
  ladder: FiveCluesLadder
  /** The room's answer mode as the round opens: `choice` deals the four names, anything else none. */
  mode: AnswerMode
}): FiveCluesContent => {
  const choices =
    mode === 'choice' ? shuffled([answer.answer, ...answer.decoys]) : []

  return {
    answer,
    choices,
    clueDurationMs,
    clueOpenedAtElapsedMs: 0,
    correctChoiceIndex:
      choices.length === 0 ? null : choices.indexOf(answer.answer),
    country,
    kind: 'fiveclues',
    ladder,
    openClueIndex: 0,
    seats: new Map()
  }
}

const fiveCluesOf = (room: Room): FiveCluesContent | null =>
  room.round?.content.kind === 'fiveclues' ? room.round.content : null

/** The seats the round still waits on, a dropped one only through its grace, each where it stands. */
const seatsInRace = ({
  content,
  now,
  room,
  round
}: {
  content: FiveCluesContent
  now: number
  room: Room
  round: Round
}): CluesSeat[] =>
  [...room.players.values()]
    .filter((participant) =>
      isExpectedInRound({
        now,
        openedWithPlayerIds: round.openedWithPlayerIds,
        participant
      })
    )
    .map((participant) => content.seats.get(participant.id) ?? RACING_SEAT)

/** A buzzing seat held on the clue it missed is let back on the floor as the next one opens. */
const openNextClue = ({
  content,
  openedAtElapsedMs,
  round
}: {
  content: FiveCluesContent
  openedAtElapsedMs: number
  round: Round
}): void => {
  content.openClueIndex += 1
  content.clueOpenedAtElapsedMs = openedAtElapsedMs
  round.lockedOutPlayerIds.clear()
}

/**
 * The next clue opening before its time once every seat still racing has
 * guessed on the open one. Run after a guess, and after a dropped seat stops
 * being waited for.
 */
export const climbWhenEveryoneGuessed = (room: Room, now: number): void => {
  const round = room.round
  const content = fiveCluesOf(room)

  if (round === null || content === null || room.phase !== 'playing') {
    return
  }

  if (
    opensNextClueEarly({
      openClueIndex: content.openClueIndex,
      seats: seatsInRace({ content, now, room, round })
    })
  ) {
    openNextClue({
      content,
      openedAtElapsedMs: elapsedRoundMs(round, now),
      round
    })
    touch(room, now)
  }
}

/**
 * The open clue's window running out: the next clue opens on the instant the
 * window ended, and `false` on the last one, which the caller closes.
 */
export const climbOnTime = (room: Room, now: number): boolean => {
  const round = room.round
  const content = fiveCluesOf(room)

  if (
    round === null ||
    content === null ||
    content.openClueIndex >= LAST_CLUE_INDEX
  ) {
    return false
  }

  openNextClue({
    content,
    openedAtElapsedMs: content.clueOpenedAtElapsedMs + content.clueDurationMs,
    round
  })
  touch(room, now)

  return true
}

/** Where the open clue's window ends, on the round's own clock. */
export const clueWindowEndsAtElapsedMs = (content: FiveCluesContent): number =>
  content.clueOpenedAtElapsedMs + content.clueDurationMs

/** Whether nobody the round opened on is left to wait for. */
export const isFiveCluesSettled = (room: Room, now: number): boolean => {
  const round = room.round
  const content = fiveCluesOf(room)

  if (round === null || content === null) {
    return false
  }

  const seats = seatsInRace({ content, now, room, round })

  return (
    seats.length > 0 &&
    isRaceSettled({ openClueIndex: content.openClueIndex, seats })
  )
}

const gradeGuess = ({
  content,
  guess
}: {
  content: FiveCluesContent
  guess: FiveCluesGuess
}): { isCorrect: boolean; said: string } | null => {
  if (guess.kind === 'typed') {
    return {
      isCorrect: gradeQuizGuess({
        guess: guess.guess,
        question: content.answer
      }).isCorrect,
      said: guess.guess
    }
  }

  const picked = content.choices[guess.choiceIndex]

  return picked === undefined
    ? null
    : {
        isCorrect: guess.choiceIndex === content.correctChoiceIndex,
        said: picked
      }
}

/**
 * One guess on the open clue, graded as it lands. A seat that found is done,
 * a wrong pick is out, and a wrong typed line holds its seat until the next
 * clue opens — which may be at once, if it was the last seat thinking.
 */
export const registerFiveCluesGuess = ({
  guess,
  now,
  playerId,
  room,
  round
}: {
  guess: FiveCluesGuess
  now: number
  playerId: PlayerId
  room: Room
  round: Round
}): Result<void, AnswerRejection> => {
  const content = round.content

  if (content.kind !== 'fiveclues') {
    return Result.failure('invalid_message')
  }

  const mode = round.mode.kind

  if (!isAnsweredOnScreen(mode) || guess.kind !== mode) {
    return Result.failure('invalid_message')
  }

  const seat = content.seats.get(playerId) ?? RACING_SEAT

  if (!mayGuess({ openClueIndex: content.openClueIndex, seat })) {
    return Result.failure(
      seat.status === 'out' ? 'player_locked_out' : 'already_buzzed'
    )
  }

  const graded = gradeGuess({ content, guess })

  if (graded === null) {
    return Result.failure('invalid_message')
  }

  const elapsedMs = elapsedRoundMs(round, now)

  content.seats.set(
    playerId,
    seatAfterGuess({
      elapsedInClueMs: elapsedMs - content.clueOpenedAtElapsedMs,
      isCorrect: graded.isCorrect,
      mode,
      openClueIndex: content.openClueIndex
    })
  )
  keepAttempt({ elapsedMs, graded, now, playerId, round })
  climbWhenEveryoneGuessed(room, now)
  touch(room, now)

  return Result.success()
}

const isAnsweredOnScreen = (
  mode: AnswerMode
): mode is Exclude<FiveCluesMode, 'buzzer'> =>
  mode === 'choice' || mode === 'typed'

/**
 * The host's verdict on the seat that took the floor, priced by the clue open
 * as its buzz arrived: the round's clock stopped on the buzz's stamp, so the
 * clock's tenth is measured to it however long the floor was held. A miss holds
 * the seat on the shell's lockout until the next clue opens — one try a clue.
 * The caller ends the round on a right one: it was said aloud, and the whole
 * table heard it.
 */
export const judgeFiveCluesBuzz = ({
  buzzedAt,
  isCorrect,
  now,
  playerId,
  round
}: {
  /** When the server heard the buzz, the attempt's stamp on the reveal. */
  buzzedAt: number
  isCorrect: boolean
  now: number
  playerId: PlayerId
  round: Round
}): void => {
  const content = round.content

  if (content.kind !== 'fiveclues') {
    return
  }

  const elapsedMs = elapsedRoundMs(round, now)

  content.seats.set(
    playerId,
    seatAfterGuess({
      elapsedInClueMs: elapsedMs - content.clueOpenedAtElapsedMs,
      isCorrect,
      mode: 'buzzer',
      openClueIndex: content.openClueIndex
    })
  )

  if (!isCorrect) {
    round.lockedOutPlayerIds.add(playerId)
  }

  keepAttempt({
    elapsedMs,
    graded: { isCorrect, said: isCorrect ? content.answer.answer : null },
    now: buzzedAt,
    playerId,
    round
  })
}

/**
 * What the shared round view and the reveal read of a seat: who answered,
 * when, and what it said — nothing for a buzz judged wrong, which was said
 * aloud.
 */
const keepAttempt = ({
  elapsedMs,
  graded,
  now,
  playerId,
  round
}: {
  elapsedMs: number
  graded: { isCorrect: boolean; said: string | null }
  now: number
  playerId: PlayerId
  round: Round
}): void => {
  const held = round.attempts.find((entry) => entry.playerId === playerId)
  const entry = held ?? {
    firstGuessedAt: now,
    isUnsent: false,
    landed: [],
    lastMiss: null,
    playerId,
    scoredAfterMs: null,
    verdict: { isCorrect: false, kind: 'single' as const }
  }

  if (graded.isCorrect) {
    entry.landed = graded.said === null ? [] : [graded.said]
    entry.scoredAfterMs = elapsedMs
    entry.verdict = { isCorrect: true, kind: 'single' }
  } else if (graded.said !== null) {
    entry.lastMiss = graded.said
  }

  if (held === undefined) {
    round.attempts.push(entry)
  }
}

/**
 * Pays every seat that found, by the clue it found on and how far into that
 * clue — never by the round's whole clock, which would pay the first clue by
 * five windows and every later one by none. Found first, earliest clue first,
 * then the millisecond.
 */
export const payFiveClues = (room: Room): void => {
  const round = room.round
  const content = fiveCluesOf(room)

  if (round === null || content === null) {
    return
  }

  const awards = round.attempts.map((attempts): Award => {
    const seat = content.seats.get(attempts.playerId)

    if (seat?.status !== 'found') {
      return {
        isPerfect: false,
        isUnsent: false,
        playerId: attempts.playerId,
        points: 0,
        speedBonus: 0,
        verdict: attempts.verdict
      }
    }

    const { points, speedBonus } = pointsForClue({
      clueDurationMs: content.clueDurationMs,
      clueIndex: seat.clueIndex,
      elapsedInClueMs: seat.elapsedInClueMs,
      paysForSpeed: round.paysForSpeed
    })
    const participant = room.players.get(attempts.playerId)

    if (participant !== undefined) {
      participant.score += points
    }

    return {
      isPerfect: isPerfectPay(worthOfClue(seat.clueIndex)),
      isUnsent: false,
      playerId: attempts.playerId,
      points,
      speedBonus,
      verdict: attempts.verdict
    }
  })

  round.awards = awards.toSorted((one, other) =>
    byFoundFirst({
      one: content.seats.get(one.playerId),
      other: content.seats.get(other.playerId)
    })
  )
}

const byFoundFirst = ({
  one,
  other
}: {
  one: CluesSeat | undefined
  other: CluesSeat | undefined
}): number => {
  if (one?.status !== 'found' || other?.status !== 'found') {
    return Number(one?.status !== 'found') - Number(other?.status !== 'found')
  }

  return (
    one.clueIndex - other.clueIndex ||
    one.elapsedInClueMs - other.elapsedInClueMs
  )
}

const standingOf = ({
  playerId,
  seat
}: {
  playerId: PlayerId
  seat: CluesSeat
}): CluesStanding => {
  switch (seat.status) {
    case 'found':
      return { clueIndex: seat.clueIndex, playerId, status: 'found' }
    case 'out':
      return { playerId, status: 'out' }
    case 'racing':
      return { playerId, status: 'racing' }
  }
}

const yourStandingOf = (seat: CluesSeat): YourCluesStanding => {
  switch (seat.status) {
    case 'found':
      return { clueIndex: seat.clueIndex, status: 'found' }
    case 'out':
      return { status: 'out' }
    case 'racing':
      return { guessedOnClue: seat.guessedOnClue, status: 'racing' }
  }
}

/**
 * The round as a seat, the wall or a console reads it — the console blind
 * like the rest. No clue before the clock starts, then the open ones alone, so
 * a rung still to come travels in no frame, its outline and flag files
 * included; the country and the whole ladder only once revealed.
 */
export const fiveCluesContentView = ({
  content,
  now,
  room,
  round,
  youId
}: {
  content: FiveCluesContent
  now: number
  room: Room
  round: Round
  youId: PlayerId | null
}): Extract<RoundContent, { kind: 'fiveclues' }> => {
  const roster = round.openedWithPlayerIds
  const openClues =
    roster === null ? [] : content.ladder.slice(0, content.openClueIndex + 1)
  const isClueRunning =
    !round.revealed && roster !== null && round.runningSince !== null
  const yourSeat =
    youId !== null && roster?.has(youId) === true
      ? (content.seats.get(youId) ?? RACING_SEAT)
      : null

  return {
    answer: round.revealed
      ? { code: content.country, name: content.answer.answer }
      : null,
    choices: [...content.choices],
    clueDurationMs: content.clueDurationMs,
    clues: round.revealed ? [...content.ladder] : openClues,
    kind: 'fiveclues',
    nextClueAt: isClueRunning
      ? now +
        Math.max(
          0,
          clueWindowEndsAtElapsedMs(content) - elapsedRoundMs(round, now)
        )
      : null,
    openClueIndex: content.openClueIndex,
    standings: [...(roster ?? [])]
      .filter((playerId) => room.players.has(playerId))
      .map((playerId) =>
        standingOf({
          playerId,
          seat: content.seats.get(playerId) ?? RACING_SEAT
        })
      ),
    yourStanding: yourSeat === null ? null : yourStandingOf(yourSeat)
  }
}
