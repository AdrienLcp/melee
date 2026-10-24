import type {
  GuessNineAnswer,
  GuessNineBlackWord,
  GuessNineLabels,
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
  theme
})

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
  round
}: {
  content: GuessNineContent
  round: Round
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
    theme: labelsOf(content.theme.labels)
  }
}
