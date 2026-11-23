import { describe, expect, it } from 'vitest'

import { fiveCluesLadderSchema } from '@melee/protocol/five-clues'
import { questionLanguages } from '@melee/protocol/question'

import { gradeQuizGuess } from '@melee/core/quiz/question-answer'

import {
  type AuthoredRow,
  type AuthoredSubject,
  authoredLadderOf,
  authoredRowSchema,
  authoredRowsOf,
  isDealtIn,
  playedAuthoredId
} from './five-clues-authored'
import { drawFiveCluesCard } from './five-clues-bank'

const AUTHORED_SUBJECTS = [
  'animal',
  'character',
  'film',
  'landmark',
  'person'
] as const satisfies readonly AuthoredSubject[]

/** Enough that an evening of twenty rounds on one subject never repeats, at any table. */
const FEWEST_DEALT_A_TABLE = 40

/** Lowercase, accents and punctuation dropped, padded so a match is whole words. */
const wordsOf = (text: string): string =>
  ` ${text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()} `

const namesOf = ({
  language,
  row
}: {
  language: (typeof questionLanguages)[number]
  row: AuthoredRow
}): string[] => [row.name[language], ...row.accepted[language]]

describe.each(AUTHORED_SUBJECTS)('the %s ladders', (subject) => {
  const rows = authoredRowsOf(subject)

  it('[fiveclues] deals every table enough of them', () => {
    for (const language of questionLanguages) {
      expect(
        rows.filter((row) => isDealtIn({ language, row })).length
      ).toBeGreaterThanOrEqual(FEWEST_DEALT_A_TABLE)
    }
  })

  it('[fiveclues] keeps every id once', () => {
    const ids = rows.map(({ id }) => id)

    expect(new Set(ids).size).toBe(ids.length)
  })

  it('[fiveclues] never names the answer in a clue', () => {
    const leaks = rows.flatMap((row) =>
      questionLanguages.flatMap((language) =>
        row.clues.flatMap(({ text }, index) =>
          namesOf({ language, row })
            .filter((name) => wordsOf(text[language]).includes(wordsOf(name)))
            .map((name) => `${row.id} clue ${index + 1} (${language}): ${name}`)
        )
      )
    )

    expect(leaks).toEqual([])
  })

  it('[fiveclues] grades the answer right and every decoy wrong', () => {
    const misgraded = rows.flatMap((row) =>
      questionLanguages.flatMap((language) => {
        const question = {
          accepted: row.accepted[language],
          answer: row.name[language],
          decoys: row.decoys.map((decoy) => decoy[language])
        }

        return [
          ...(gradeQuizGuess({ guess: row.name[language], question }).isCorrect
            ? []
            : [`${row.id} (${language}): its own name`]),
          ...question.decoys
            .filter(
              (decoy) => gradeQuizGuess({ guess: decoy, question }).isCorrect
            )
            .map((decoy) => `${row.id} (${language}): ${decoy}`)
        ]
      })
    )

    expect(misgraded).toEqual([])
  })

  it('[fiveclues] climbs five rungs every screen can draw', () => {
    for (const row of rows) {
      for (const language of questionLanguages) {
        expect(
          fiveCluesLadderSchema.safeParse(
            authoredLadderOf({ language, row, subject })
          ).success
        ).toBe(true)
      }
    }
  })
})

describe('the staircase', () => {
  it('[fiveclues] refuses a ladder whose first rungs strike the decoys out of order', () => {
    const [row] = authoredRowsOf('film')

    if (row === undefined) {
      throw new Error('no film to break')
    }

    const [first, second, ...rest] = row.clues
    const swapped = {
      ...row,
      clues: [{ ...first, strikes: 1 }, { ...second, strikes: 0 }, ...rest]
    }

    expect(authoredRowSchema.safeParse(row).success).toBe(true)
    expect(authoredRowSchema.safeParse(swapped).success).toBe(false)
  })
})

describe('a Five clues card', () => {
  it('[fiveclues] is dealt from the subjects the room ticked', () => {
    for (const subject of AUTHORED_SUBJECTS) {
      const card = drawFiveCluesCard({
        difficulty: 'mixed',
        language: 'fr',
        playedIds: new Set(),
        subjects: [subject]
      })

      expect(card?.subject).toBe(subject)
      expect(card?.playedId.startsWith(`fiveclues:${subject}:`)).toBe(true)
    }
  })

  it('[fiveclues] never deals a row tied to another table’s culture', () => {
    const portuguese = authoredRowsOf('person').filter(
      ({ homeCountry }) => homeCountry === 'PRT'
    )

    expect(portuguese.length).toBeGreaterThan(0)

    for (const row of portuguese) {
      expect(isDealtIn({ language: 'fr', row })).toBe(false)
      expect(isDealtIn({ language: 'pt', row })).toBe(true)
    }
  })

  it('[fiveclues] deals a row the room has not climbed', () => {
    const rows = authoredRowsOf('animal')
    const [kept, ...rest] = rows

    if (kept === undefined) {
      throw new Error('no animal to keep')
    }

    const card = drawFiveCluesCard({
      difficulty: 'mixed',
      language: 'en',
      playedIds: new Set(
        rest.map((row) => playedAuthoredId({ row, subject: 'animal' }))
      ),
      subjects: ['animal']
    })

    expect(card?.answer.answer).toBe(kept.name.en)
  })
})
