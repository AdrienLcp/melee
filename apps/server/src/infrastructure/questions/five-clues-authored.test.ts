import { describe, expect, it } from 'vitest'

import {
  type FiveCluesClue,
  fiveCluesLadderSchema
} from '@melee/protocol/five-clues'
import type { LocalizedText } from '@melee/protocol/locale'
import { questionLanguages } from '@melee/protocol/question'

import {
  answerInEveryLanguage,
  gradeQuizGuess
} from '@melee/core/quiz/question-answer'

import {
  type AuthoredRow,
  type AuthoredSubject,
  authoredLadderOf,
  authoredRowSchema,
  authoredRowsOf,
  isDealtAt,
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

/** The tables a host's language seats — none for English — and the borderless one. */
const TABLE_COUNTRIES = ['FRA', 'PRT', null] as const

/** Lowercase, accents and punctuation dropped, padded so a match is whole words. */
const wordsOf = (text: string): string =>
  ` ${text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()} `

const wordingOf = (clue: FiveCluesClue): LocalizedText | null => {
  switch (clue.kind) {
    case 'text':
      return clue.text
    case 'image':
      return clue.alt
    default:
      return null
  }
}

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
    for (const homeCountry of TABLE_COUNTRIES) {
      expect(
        rows.filter((row) => isDealtAt({ homeCountry, row })).length
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
      expect(
        fiveCluesLadderSchema.safeParse(authoredLadderOf({ row, subject }))
          .success
      ).toBe(true)
    }
  })

  it('[fiveclues] grades the answer right in every language, and no decoy in any', () => {
    const misgraded = rows.flatMap((row) => {
      const question = answerInEveryLanguage({
        accepted: questionLanguages.flatMap(
          (language) => row.accepted[language]
        ),
        answer: row.name,
        decoys: row.decoys
      })

      return questionLanguages.flatMap((language) => [
        ...(gradeQuizGuess({ guess: row.name[language], question }).isCorrect
          ? []
          : [`${row.id} (${language}): its own name`]),
        ...row.decoys
          .map((decoy) => decoy[language])
          .filter(
            (decoy) => gradeQuizGuess({ guess: decoy, question }).isCorrect
          )
          .map((decoy) => `${row.id} (${language}): ${decoy}`)
      ])
    })

    expect(misgraded).toEqual([])
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
        homeCountry: 'FRA',
        playedIds: new Set(),
        subjects: [subject]
      })

      expect(card?.subject).toBe(subject)
      expect(card?.playedId.startsWith(`fiveclues:${subject}:`)).toBe(true)
    }
  })

  it.each([
    { dealt: [null], homeCountry: null },
    { dealt: [null, 'FRA'], homeCountry: 'FRA' },
    { dealt: [null, 'PRT'], homeCountry: 'PRT' }
  ] as const)(
    "[fiveclues] deals a table of $homeCountry everyone's people and its own, never another country's",
    ({ dealt, homeCountry }) => {
      const homes = new Set(
        Array.from({ length: 300 }, () =>
          drawFiveCluesCard({
            difficulty: 'mixed',
            homeCountry,
            playedIds: new Set(),
            subjects: ['person']
          })
        ).map(
          (card) =>
            authoredRowsOf('person').find(
              (row) =>
                card !== null &&
                card.playedId === playedAuthoredId({ row, subject: 'person' })
            )?.homeCountry
        )
      )

      expect(homes).toEqual(new Set(dealt))
    }
  )

  it('[fiveclues] sends every rung of a written ladder in all three languages', () => {
    const card = drawFiveCluesCard({
      difficulty: 'mixed',
      homeCountry: null,
      playedIds: new Set(),
      subjects: ['film']
    })
    const row = authoredRowsOf('film').find(
      (film) =>
        card?.playedId === playedAuthoredId({ row: film, subject: 'film' })
    )

    expect(card?.answer.answer).toEqual(row?.name)
    expect(card?.ladder.map(wordingOf)).toEqual(
      row?.clues.map(({ text }) => text)
    )
  })

  it('[fiveclues] deals a row the room has not climbed', () => {
    const rows = authoredRowsOf('animal')
    const [kept, ...rest] = rows

    if (kept === undefined) {
      throw new Error('no animal to keep')
    }

    const card = drawFiveCluesCard({
      difficulty: 'mixed',
      homeCountry: null,
      playedIds: new Set(
        rest.map((row) => playedAuthoredId({ row, subject: 'animal' }))
      ),
      subjects: ['animal']
    })

    expect(card?.answer.answer).toEqual(kept.name)
  })
})
