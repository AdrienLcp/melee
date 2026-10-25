import { Result } from '@adrienlcp/result'

import type { ProtocolErrorCode } from '@melee/protocol/error-code'
import type { PetitBacSettings } from '@melee/protocol/game'
import type { PlayerId, RoundId } from '@melee/protocol/identifiers'
import {
  PETIT_BAC_STOP_GRACE_MS,
  type PetitBacLineOutcome,
  type PetitBacRow,
  type PetitBacSettledLine
} from '@melee/protocol/petit-bac'

import { drawCategories } from '@melee/core/petitbac/category-draw'
import { drawLetter } from '@melee/core/petitbac/letter-draw'
import {
  isStoppableLine,
  startsWithLetter
} from '@melee/core/petitbac/letter-match'
import { isRowRefused } from '@melee/core/petitbac/row-vote'
import { categoryOutcomes, sheetPoints } from '@melee/core/petitbac/sheet-pay'
import { groupAnswers } from '@melee/core/round/answer-groups'

import type { Room, Round } from '@/domain/room/room'
import { touch } from '@/domain/room/room-service'
import { closeRound, elapsedRoundMs } from '@/domain/round/round-service'

type PetitBacContent = Extract<Round['content'], { kind: 'petitbac' }>

type PetitBacRound = { content: PetitBacContent; round: Round }

export type PetitBacRejection = Extract<
  ProtocolErrorCode,
  | 'invalid_message'
  | 'joined_mid_round'
  | 'sheet_not_full'
  | 'stale_round'
  | 'wrong_phase'
>

/**
 * A round's letter and categories, drawn as it opens. The letter is written
 * into the room's history here, because the round about to open is what
 * spends it.
 */
export const petitBacContent = ({
  room,
  settings
}: {
  room: Room
  settings: PetitBacSettings
}): Round['content'] => {
  const letter = drawLetter({
    excluded: settings.excludedLetters,
    played: room.playedLetters
  })
  const categories = drawCategories({
    count: settings.categoryCount,
    fixed: settings.categories
  })

  room.playedLetters.push(letter)

  return {
    barredStoppers: new Set(),
    categories,
    categoryStates: categories.map(() => 'open'),
    kind: 'petitbac',
    letter,
    refusals: new Map(),
    sheets: new Map(),
    sheetsClosed: false,
    stopClosesAtElapsedMs: null,
    stoppedBy: null,
    stopsWhenFull: settings.stopsWhenFull,
    votesDone: new Set()
  }
}

const livePetitBacRoundIn = ({
  room,
  roundId
}: {
  room: Room
  roundId: RoundId
}): Result<PetitBacRound, PetitBacRejection> => {
  const round = room.round

  if (round === null || round.content.kind !== 'petitbac') {
    return Result.failure('wrong_phase')
  }

  if (round.id !== roundId) {
    return Result.failure('stale_round')
  }

  if (room.phase !== 'playing') {
    return Result.failure('wrong_phase')
  }

  return Result.success({ content: round.content, round })
}

/** The seats the round opened on that still hold one, in seat order. */
export const petitBacSeats = ({
  room,
  round
}: {
  room: Room
  round: Round
}): PlayerId[] =>
  [...room.players.keys()].filter(
    (playerId) => round.openedWithPlayerIds?.has(playerId) ?? false
  )

const isSeatedIn = ({
  playerId,
  round
}: {
  playerId: PlayerId
  round: Round
}): boolean => round.openedWithPlayerIds?.has(playerId) ?? false

/** The category the room is voting, or `null` before the sheets close and after the last settles. */
export const votingCategoryIndex = (
  content: PetitBacContent
): number | null => {
  const index = content.categoryStates.indexOf('voting')

  return index === -1 ? null : index
}

export const writePetitBacLine = ({
  answer,
  categoryIndex,
  now,
  playerId,
  room,
  roundId
}: {
  answer: string
  categoryIndex: number
  now: number
  playerId: PlayerId
  room: Room
  roundId: RoundId
}): Result<void, PetitBacRejection> => {
  const found = livePetitBacRoundIn({ room, roundId })

  if (found.status === 'failure') {
    return found
  }

  const { content, round } = found.data

  if (categoryIndex >= content.categories.length) {
    return Result.failure('invalid_message')
  }

  if (!isSeatedIn({ playerId, round })) {
    return Result.failure('joined_mid_round')
  }

  if (content.sheetsClosed) {
    return Result.failure('wrong_phase')
  }

  const sheet = content.sheets.get(playerId) ?? new Map<number, string>()

  if (answer === '') {
    sheet.delete(categoryIndex)
  } else {
    sheet.set(categoryIndex, answer)
  }

  content.sheets.set(playerId, sheet)
  touch(room, now)

  return Result.success()
}

/**
 * A full sheet calling time on everyone's. The sheets close a grace later
 * rather than at once, so the word a hand is still finishing lands; a second
 * stop inside that grace changes nothing and is refused. Full means every line
 * a word on the letter, so a sheet of initials closes nobody's.
 */
export const stopPetitBac = ({
  now,
  playerId,
  room,
  roundId
}: {
  now: number
  playerId: PlayerId
  room: Room
  roundId: RoundId
}): Result<void, PetitBacRejection> => {
  const found = livePetitBacRoundIn({ room, roundId })

  if (found.status === 'failure') {
    return found
  }

  const { content, round } = found.data

  if (!isSeatedIn({ playerId, round })) {
    return Result.failure('joined_mid_round')
  }

  if (
    !content.stopsWhenFull ||
    content.sheetsClosed ||
    content.stoppedBy !== null ||
    content.barredStoppers.has(playerId)
  ) {
    return Result.failure('wrong_phase')
  }

  const sheet = content.sheets.get(playerId)
  const isFull = content.categories.every((_, index) =>
    isStoppableLine({
      answer: sheet?.get(index) ?? '',
      letter: content.letter
    })
  )

  if (!isFull) {
    return Result.failure('sheet_not_full')
  }

  content.stoppedBy = playerId
  content.stopClosesAtElapsedMs =
    elapsedRoundMs(round, now) + PETIT_BAC_STOP_GRACE_MS
  touch(room, now)

  return Result.success()
}

/**
 * Whether the console may still take the stop back: one was called, and no
 * category with a row has settled yet — once the room has moved past a vote,
 * reopening the sheets would hand everyone the answers they just read.
 */
export const canCancelPetitBacStop = ({
  content,
  room
}: {
  content: PetitBacContent
  room: Room
}): boolean =>
  room.phase === 'playing' &&
  content.stoppedBy !== null &&
  content.stopClosesAtElapsedMs !== null &&
  !content.categoryStates.some(
    (state, categoryIndex) =>
      state === 'settled' && petitBacRowsFor({ categoryIndex, room }).length > 0
  )

/**
 * The console taking a stop back. The sheets reopen on the
 * clock as it stood when the stop was called, the vote so far is dropped, and
 * the caller may not stop again this round.
 */
export const cancelPetitBacStop = ({
  now,
  room,
  roundId
}: {
  now: number
  room: Room
  roundId: RoundId
}): Result<void, PetitBacRejection> => {
  const found = livePetitBacRoundIn({ room, roundId })

  if (found.status === 'failure') {
    return found
  }

  const { content, round } = found.data
  const { stopClosesAtElapsedMs, stoppedBy } = content

  if (
    stoppedBy === null ||
    stopClosesAtElapsedMs === null ||
    !canCancelPetitBacStop({ content, room })
  ) {
    return Result.failure('wrong_phase')
  }

  round.elapsedMs = stopClosesAtElapsedMs - PETIT_BAC_STOP_GRACE_MS
  round.runningSince = round.runningSince === null ? null : now
  content.barredStoppers.add(stoppedBy)
  content.stoppedBy = null
  content.stopClosesAtElapsedMs = null
  content.sheetsClosed = false
  content.categoryStates = content.categories.map(() => 'open')
  content.refusals = new Map()
  content.votesDone = new Set()
  rescore({ content, room, round })
  touch(room, now)

  return Result.success()
}

/**
 * Every sheet goes read-only, and the vote opens on the first category with
 * something to vote on. `true` once nothing is left to vote, which is the
 * reveal's cue.
 */
export const closePetitBacSheets = (room: Room): boolean => {
  const round = room.round

  if (round === null || round.content.kind !== 'petitbac') {
    return false
  }

  round.content.sheetsClosed = true

  return moveVoteOn({ content: round.content, room, round })
}

/**
 * A seat refusing a row it did not write, or taking a refusal back. Scored again
 * on the spot, because a vote can be changed and the board is on screen.
 */
export const votePetitBacRow = ({
  categoryIndex,
  now,
  playerId,
  refuses,
  room,
  roundId,
  rowKey
}: {
  categoryIndex: number
  now: number
  playerId: PlayerId
  refuses: boolean
  room: Room
  roundId: RoundId
  rowKey: string
}): Result<void, PetitBacRejection> => {
  const found = votingRoundIn({ categoryIndex, room, roundId })

  if (found.status === 'failure') {
    return found
  }

  const { content, round } = found.data

  if (!isSeatedIn({ playerId, round })) {
    return Result.failure('joined_mid_round')
  }

  const row = petitBacRowsFor({ categoryIndex, room }).find(
    (candidate) => candidate.key === rowKey
  )

  if (row === undefined || row.authors.includes(playerId)) {
    return Result.failure('invalid_message')
  }

  const byRow = content.refusals.get(categoryIndex) ?? new Map()
  const refusedBy = byRow.get(rowKey) ?? new Set<PlayerId>()

  if (refuses) {
    refusedBy.add(playerId)
  } else {
    refusedBy.delete(playerId)
  }

  byRow.set(rowKey, refusedBy)
  content.refusals.set(categoryIndex, byRow)
  rescore({ content, room, round })
  touch(room, now)

  return Result.success()
}

/**
 * A seat saying it has read the category being voted. The last seat on the
 * last category is the reveal.
 */
export const finishPetitBacVote = ({
  categoryIndex,
  now,
  playerId,
  room,
  roundId
}: {
  categoryIndex: number
  now: number
  playerId: PlayerId
  room: Room
  roundId: RoundId
}): Result<void, PetitBacRejection> => {
  const found = votingRoundIn({ categoryIndex, room, roundId })

  if (found.status === 'failure') {
    return found
  }

  const { content, round } = found.data

  if (!isSeatedIn({ playerId, round })) {
    return Result.failure('joined_mid_round')
  }

  content.votesDone.add(playerId)
  touch(room, now)

  const isEverySeatDone = petitBacSeats({ room, round }).every((seatId) =>
    content.votesDone.has(seatId)
  )

  if (isEverySeatDone && settleVotingCategory({ content, room, round })) {
    closeRound(room, now)
  }

  return Result.success()
}

/** The console moving the room on, whether or not every seat said it was done. */
export const nextPetitBacCategory = ({
  categoryIndex,
  now,
  room,
  roundId
}: {
  categoryIndex: number
  now: number
  room: Room
  roundId: RoundId
}): Result<void, PetitBacRejection> => {
  const found = votingRoundIn({ categoryIndex, room, roundId })

  if (found.status === 'failure') {
    return found
  }

  const { content, round } = found.data

  touch(room, now)

  if (settleVotingCategory({ content, room, round })) {
    closeRound(room, now)
  }

  return Result.success()
}

/** Whether the sheets are still being written, which no reveal may cut short. */
export const isPetitBacWriting = (room: Room): boolean =>
  room.round?.content.kind === 'petitbac' && !room.round.content.sheetsClosed

/**
 * The round is being revealed, or the game ended under it: the sheets close
 * and every category settles on the votes as they stand.
 */
export const settleEveryCategory = (room: Room): void => {
  const round = room.round

  if (round === null || round.content.kind !== 'petitbac') {
    return
  }

  const content = round.content

  content.sheetsClosed = true
  content.categoryStates = content.categoryStates.map(() => 'settled')
  content.votesDone = new Set()
  rescore({ content, room, round })
}

/**
 * The category's rows as voted: what the round's seats wrote on the letter,
 * grouped by the shared normalisation. A blank or off-the-letter line is never
 * a row — there is nothing to vote on, and it already pays nothing.
 */
export const petitBacRowsFor = ({
  categoryIndex,
  room
}: {
  categoryIndex: number
  room: Room
}): PetitBacRow[] => {
  const round = room.round

  if (round === null || round.content.kind !== 'petitbac') {
    return []
  }

  const content = round.content
  const seats = petitBacSeats({ room, round })
  const roster = new Set(seats)
  const refusals = content.refusals.get(categoryIndex)

  return groupAnswers(
    seats.flatMap((playerId) => {
      const text = content.sheets.get(playerId)?.get(categoryIndex)

      return text === undefined ||
        !startsWithLetter({ answer: text, letter: content.letter })
        ? []
        : [{ playerId, text }]
    })
  ).map(({ key, playerIds, text }) => {
    const refusedBy = refusals?.get(key) ?? new Set<PlayerId>()

    return {
      authors: playerIds,
      key,
      refusals: [...refusedBy].filter(
        (playerId) => roster.has(playerId) && !playerIds.includes(playerId)
      ).length,
      refused: isRowRefused({ authors: playerIds, refusedBy, roster }),
      text
    }
  })
}

/** Every seat's line on a category and what it paid. */
export const petitBacLinesFor = ({
  categoryIndex,
  room
}: {
  categoryIndex: number
  room: Room
}): PetitBacSettledLine[] => {
  const round = room.round

  if (round === null || round.content.kind !== 'petitbac') {
    return []
  }

  const content = round.content
  const outcomes = outcomesFor({ categoryIndex, content, room, round })

  return petitBacSeats({ room, round }).map((playerId) => ({
    outcome: outcomes.get(playerId) ?? 'empty',
    playerId,
    text: content.sheets.get(playerId)?.get(categoryIndex) ?? ''
  }))
}

const votingRoundIn = ({
  categoryIndex,
  room,
  roundId
}: {
  categoryIndex: number
  room: Room
  roundId: RoundId
}): Result<PetitBacRound, PetitBacRejection> => {
  const found = livePetitBacRoundIn({ room, roundId })

  if (found.status === 'failure') {
    return found
  }

  const votingAt = votingCategoryIndex(found.data.content)

  if (votingAt === null) {
    return Result.failure('wrong_phase')
  }

  // The room has moved on since the tap was made, the way a stale round id
  // means the round has.
  if (votingAt !== categoryIndex) {
    return Result.failure('stale_round')
  }

  return found
}

const outcomesFor = ({
  categoryIndex,
  content,
  room,
  round
}: PetitBacRound & {
  categoryIndex: number
  room: Room
}): Map<PlayerId, PetitBacLineOutcome> =>
  categoryOutcomes({
    answers: new Map(
      petitBacSeats({ room, round }).map((playerId) => [
        playerId,
        content.sheets.get(playerId)?.get(categoryIndex) ?? null
      ])
    ),
    letter: content.letter,
    refusedKeys: new Set(
      petitBacRowsFor({ categoryIndex, room })
        .filter((row) => row.refused)
        .map((row) => row.key)
    )
  })

/** Settles the category being voted and opens the next; `true` once none is left. */
const settleVotingCategory = ({
  content,
  room,
  round
}: PetitBacRound & { room: Room }): boolean => {
  const votingAt = votingCategoryIndex(content)

  if (votingAt !== null) {
    content.categoryStates[votingAt] = 'settled'
  }

  return moveVoteOn({ content, room, round })
}

/**
 * Opens the vote on the next category still `open`, settling on the spot any
 * with no row: a category nobody wrote on the letter has nothing to wait for.
 */
const moveVoteOn = ({
  content,
  room,
  round
}: PetitBacRound & { room: Room }): boolean => {
  content.votesDone = new Set()

  for (const [index, state] of content.categoryStates.entries()) {
    if (state !== 'open') {
      continue
    }

    if (petitBacRowsFor({ categoryIndex: index, room }).length === 0) {
      content.categoryStates[index] = 'settled'
    } else {
      content.categoryStates[index] = 'voting'
      break
    }
  }

  rescore({ content, room, round })

  return content.categoryStates.every((state) => state === 'settled')
}

/**
 * Recomputed from the sheets on every vote rather than added to, because a
 * vote can be taken back: each score moves by the difference from what the
 * round had already paid that seat. A category still `open` pays nothing yet.
 */
const rescore = ({
  content,
  room,
  round
}: PetitBacRound & { room: Room }): void => {
  const counted = content.categoryStates.flatMap((state, index) =>
    state === 'open'
      ? []
      : [outcomesFor({ categoryIndex: index, content, room, round })]
  )

  round.awards = petitBacSeats({ room, round }).map((playerId) => {
    const points = sheetPoints(
      counted.map((outcomes) => outcomes.get(playerId) ?? 'empty')
    )
    const paid =
      round.awards.find((award) => award.playerId === playerId)?.points ?? 0
    const participant = room.players.get(playerId)

    if (participant !== undefined) {
      participant.score += points - paid
    }

    return {
      playerId,
      points,
      speedBonus: 0,
      verdict: { isCorrect: points > 0, kind: 'single' }
    }
  })
}
