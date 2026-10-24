import { Result } from '@adrienlcp/result'

import type {
  GuessNineAnswer,
  GuessNineBlackWord,
  GuessNineCell,
  GuessNineLabels,
  GuessNineSentLine,
  GuessNineTheme
} from '@melee/protocol/guess-nine'
import type { PlayerId, RoundId } from '@melee/protocol/identifiers'
import type { RoundContent } from '@melee/protocol/room'
import type { CellsVerdict, Verdict } from '@melee/protocol/scoring'
import type { TeamId } from '@melee/protocol/team'

import { gradeLine } from '@melee/core/guessnine/line-match'
import {
  EMPTY_SHEET,
  isSheetClosed,
  pointsForCells,
  tierOfCell,
  withCellTicked,
  withLineBanked
} from '@melee/core/guessnine/sheet-pay'
import { drawSpokenTurn } from '@melee/core/guessnine/spoken-turn'
import { teamForLateSeat } from '@melee/core/team/late-seat'

import type { Room, Round } from '@/domain/room/room'
import { seatsOf } from '@/domain/room/team-service'
import type { AnswerRejection } from '@/domain/round/round-service'

type GuessNineContent = Extract<Round['content'], { kind: 'guessnine' }>

type Named = GuessNineTheme['answers'][number]

/** Every language's names at once: a French table types an English title as often as a French one. */
const namesOf = ({ aliases, labels }: Named): string[] => [
  ...Object.values(labels),
  ...Object.values(aliases).flat()
]

export const guessNineContent = (theme: GuessNineTheme): GuessNineContent => ({
  kind: 'guessnine',
  lines: [],
  spoken: null,
  theme
})

const connectedSeatsOf = (room: Room, teamId: TeamId): PlayerId[] =>
  seatsOf(room, teamId)
    .filter((seat) => seat.isConnected)
    .map((seat) => seat.id)

/**
 * Whether a spoken round can open: two teams holding a connected seat once
 * every seat still without one is placed, which `openRound` does by the
 * late-seat rule this replays — a host who never dealt the teams has every
 * seat unplaced until the round opens.
 */
export const canTakeSpokenTurn = (room: Room): boolean => {
  const counts = room.teams.map((team) => ({
    connectedSeatCount: connectedSeatsOf(room, team.id).length,
    id: team.id
  }))

  for (const participant of room.players.values()) {
    if (participant.teamId !== null || !participant.isConnected) {
      continue
    }

    const placedId = teamForLateSeat(counts)
    const placed = counts.find(({ id }) => id === placedId)

    if (placed !== undefined) {
      placed.connectedSeatCount += 1
    }
  }

  return counts.filter((team) => team.connectedSeatCount > 0).length > 1
}

/**
 * Who says the answers this round and who ticks them, drawn and counted as a
 * spoken round opens — every seat placed by then. `null` in a typed room, and
 * in one that `canTakeSpokenTurn` would have refused.
 */
export const takeSpokenTurn = (room: Room): GuessNineContent['spoken'] => {
  if (room.settings.mode.kind !== 'spoken') {
    return null
  }

  const turn = drawSpokenTurn({
    guessesByTeam: room.guessesByTeam,
    keepsBySeat: room.keepsBySeat,
    teams: room.teams.map((team) => ({
      id: team.id,
      seatIds: connectedSeatsOf(room, team.id)
    }))
  })

  if (turn === null) {
    return null
  }

  room.guessesByTeam.set(
    turn.guessingTeamId,
    (room.guessesByTeam.get(turn.guessingTeamId) ?? 0) + 1
  )
  room.keepsBySeat.set(
    turn.keeperId,
    (room.keepsBySeat.get(turn.keeperId) ?? 0) + 1
  )

  return {
    ...turn,
    guessers: seatsOf(room, turn.guessingTeamId).map((seat) => seat.id),
    sheet: EMPTY_SHEET
  }
}

type SpokenTurnHeld = NonNullable<GuessNineContent['spoken']>

/**
 * Whether the keeper may read the list: it sits in another team than the one
 * guessing. Asked on every frame rather than at the draw, because the host can
 * move a seat between teams mid-round.
 */
const keepsFromAnotherTeam = (room: Room, spoken: SpokenTurnHeld): boolean =>
  room.players.get(spoken.keeperId)?.teamId !== spoken.guessingTeamId

/**
 * The keeper ticking what the guessing team said. `closes` says the round has
 * nothing left to wait for — the black word, or all nine — and the caller
 * closes it, which is what pays the team.
 */
export const tickSpokenCell = ({
  cell,
  isTicked,
  playerId,
  room,
  roundId
}: {
  cell: GuessNineCell | 'blackWord'
  isTicked: boolean
  playerId: PlayerId
  room: Room
  roundId: RoundId
}): Result<{ closes: boolean }, AnswerRejection> => {
  const round = room.round

  if (round === null || room.phase !== 'playing') {
    return Result.failure('wrong_phase')
  }

  if (round.id !== roundId) {
    return Result.failure('stale_round')
  }

  const spoken =
    round.content.kind === 'guessnine' ? round.content.spoken : null

  if (spoken === null) {
    return Result.failure('invalid_message')
  }

  if (spoken.keeperId !== playerId || !keepsFromAnotherTeam(room, spoken)) {
    return Result.failure('not_your_turn')
  }

  spoken.sheet = withCellTicked({ cell, isTicked, sheet: spoken.sheet })

  return Result.success({ closes: isSheetClosed(spoken.sheet) })
}

/**
 * What a spoken round pays: the guessing team's one sheet on each of its seats,
 * the way a challenge pays a placed team — each seat's screen says what the
 * round did to it, and the team, answering as one, is paid it once.
 */
export const payGuessingTeam = (room: Room): void => {
  const round = room.round
  const spoken =
    round?.content.kind === 'guessnine' ? round.content.spoken : null

  if (round === null || spoken === null) {
    return
  }

  const points = pointsForCells(spoken.sheet)

  round.awards = spoken.guessers.flatMap((playerId) => {
    const participant = room.players.get(playerId)

    if (participant === undefined) {
      return []
    }

    participant.score += points

    return [{ playerId, points, speedBonus: 0, verdict: spoken.sheet }]
  })
}

/** Whether a round's team is paid once for what every one of its seats holds. */
export const isSpokenRound = (round: Round): boolean =>
  round.content.kind === 'guessnine' && round.content.spoken !== null

const isMiss = (line: GuessNineSentLine): boolean =>
  line.cells.length === 0 && !line.hitBlackWord

/**
 * Keeps the line a seat just sent beside what it found, read off the sheet
 * before and after it: the seat's earlier miss gives way to it.
 */
export const keepSheetLine = ({
  after,
  before,
  content,
  line,
  playerId
}: {
  after: CellsVerdict
  before: Verdict | null
  content: GuessNineContent
  line: string
  playerId: PlayerId
}): void => {
  const held = before?.kind === 'cells' ? before : EMPTY_SHEET

  content.lines = content.lines.filter(
    (kept) => kept.playerId !== playerId || !isMiss(kept)
  )
  content.lines.push({
    cells: after.foundCells.filter((cell) => !held.foundCells.includes(cell)),
    hitBlackWord: after.hitBlackWord && !held.hitBlackWord,
    line,
    playerId
  })
}

/** A seat's sheet once this line is read against it. */
export const gradeSheetLine = ({
  content,
  held,
  line
}: {
  content: GuessNineContent
  /** What the seat banked so far, or `null` for its first line. */
  held: Verdict | null
  line: string
}): CellsVerdict =>
  withLineBanked({
    graded: gradeLine({
      answers: content.theme.answers.map(namesOf),
      blackWord: namesOf(content.theme.blackWord),
      line
    }),
    sheet: held?.kind === 'cells' ? held : EMPTY_SHEET
  })

const labelsOf = (labels: GuessNineTheme['labels']): GuessNineLabels => ({
  ...labels
})

/** The nine and the black word without a single alias — what a screen allowed to read them shows. */
export const guessNineGrid = (
  theme: GuessNineTheme
): { answers: GuessNineAnswer[]; blackWord: GuessNineBlackWord } => ({
  answers: theme.answers.map((answer, cell) => ({
    labels: labelsOf(answer.labels),
    tier: tierOfCell(cell)
  })),
  blackWord: {
    labels: labelsOf(theme.blackWord.labels),
    why: labelsOf(theme.blackWord.why)
  }
})

/** Each seat's sheet — in a spoken round, the guessing team's one sheet on each of its seats. */
const sheetsOf = (
  round: Round
): { playerId: PlayerId; sheet: CellsVerdict }[] => {
  const spoken =
    round.content.kind === 'guessnine' ? round.content.spoken : null

  if (spoken !== null) {
    return spoken.guessers.map((playerId) => ({
      playerId,
      sheet: spoken.sheet
    }))
  }

  return round.attempts.flatMap(({ playerId, verdict }) =>
    verdict.kind === 'cells' ? [{ playerId, sheet: verdict }] : []
  )
}

/**
 * What every screen holds of a guess-nine round: the theme, a count of the
 * cells the room has found, and the grid once it is revealed. A voided sheet
 * still found its cells — the black word costs the seat its points, not the
 * room its count.
 */
export const guessNineContentView = ({
  content,
  room,
  round,
  youId
}: {
  content: GuessNineContent
  room: Room
  round: Round
  /** The reader's seat, `null` for a screen holding none. */
  youId: PlayerId | null
}): Extract<RoundContent, { kind: 'guessnine' }> => {
  const sheets = sheetsOf(round)
  const foundBy = (cell: number): PlayerId[] =>
    sheets
      .filter(({ sheet }) => sheet.foundCells.includes(cell))
      .map(({ playerId }) => playerId)

  const grid = guessNineGrid(content.theme)

  return {
    foundCellCount: new Set(sheets.flatMap(({ sheet }) => sheet.foundCells))
      .size,
    kind: 'guessnine',
    revealed: round.revealed
      ? {
          answers: grid.answers.map((answer, cell) => ({
            ...answer,
            foundBy: foundBy(cell)
          })),
          blackWord: {
            ...grid.blackWord,
            hitBy: sheets
              .filter(({ sheet }) => sheet.hitBlackWord)
              .map(({ playerId }) => playerId)
          }
        }
      : null,
    spoken:
      content.spoken === null
        ? null
        : {
            guessingTeamId: content.spoken.guessingTeamId,
            keeperId: content.spoken.keeperId,
            list:
              youId === content.spoken.keeperId &&
              keepsFromAnotherTeam(room, content.spoken)
                ? grid
                : null,
            tickedCells: [...content.spoken.sheet.foundCells]
          },
    theme: labelsOf(content.theme.labels),
    yourLines:
      youId === null
        ? null
        : content.lines
            .filter(({ playerId }) => playerId === youId)
            .map(({ cells, hitBlackWord, line }) => ({
              cells: [...cells],
              hitBlackWord,
              line
            }))
  }
}
