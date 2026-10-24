import type {
  GuessNineAnswer,
  GuessNineBlackWord,
  GuessNineLabels,
  GuessNineSentLine,
  GuessNineTheme
} from '@melee/protocol/guess-nine'
import type { PlayerId } from '@melee/protocol/identifiers'
import type { RoundContent } from '@melee/protocol/room'
import type { CellsVerdict, Verdict } from '@melee/protocol/scoring'

import { gradeLine } from '@melee/core/guessnine/line-match'
import {
  EMPTY_SHEET,
  tierOfCell,
  withLineBanked
} from '@melee/core/guessnine/sheet-pay'

import type { Round } from '@/domain/room/room'

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
  theme
})

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

const sheetsOf = (
  round: Round
): { playerId: PlayerId; sheet: CellsVerdict }[] =>
  round.attempts.flatMap(({ playerId, verdict }) =>
    verdict.kind === 'cells' ? [{ playerId, sheet: verdict }] : []
  )

/**
 * What every screen holds of a guess-nine round: the theme, a count of the
 * cells the room has found, and the grid once it is revealed. A voided sheet
 * still found its cells — the black word costs the seat its points, not the
 * room its count.
 */
export const guessNineContentView = ({
  content,
  round,
  youId
}: {
  content: GuessNineContent
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
