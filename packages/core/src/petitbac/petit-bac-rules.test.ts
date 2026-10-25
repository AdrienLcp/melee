import { describe, expect, it } from 'vitest'

import {
  type PetitBacLetter,
  petitBacBankCategories,
  RARE_PETIT_BAC_LETTERS
} from '@melee/protocol/petit-bac'
import { POINT } from '@melee/protocol/scoring'

import { drawCategories } from './category-draw'
import { drawLetter, playableLetters } from './letter-draw'
import { startsWithLetter } from './letter-match'
import { isRowRefused } from './row-vote'
import { categoryOutcomes, sheetPoints } from './sheet-pay'

describe('drawLetter', () => {
  it('[petitbac] plays every letter once before any comes back', () => {
    const playable = playableLetters(RARE_PETIT_BAC_LETTERS)
    const played: PetitBacLetter[] = []

    for (const _ of playable) {
      played.push(drawLetter({ excluded: RARE_PETIT_BAC_LETTERS, played }))
    }

    expect(new Set(played)).toEqual(new Set(playable))
    expect(played).not.toContain('Z')
  })

  it('[petitbac] starts a new cycle once every letter has gone', () => {
    const excluded = playableLetters([]).filter(
      (letter) => letter !== 'A' && letter !== 'B'
    )

    const third = drawLetter({ excluded, played: ['A', 'B'] })

    expect(['A', 'B']).toContain(third)
    expect(drawLetter({ excluded, played: ['A', 'B', 'A'] })).toBe('B')
  })

  it('[petitbac] falls back to the whole alphabet when everything is left out', () => {
    expect(playableLetters(playableLetters([]))).toHaveLength(26)
  })
})

describe('startsWithLetter', () => {
  it('[petitbac] folds case and accents', () => {
    expect(startsWithLetter({ answer: 'émeu', letter: 'E' })).toBe(true)
    expect(startsWithLetter({ answer: '  Zèbre', letter: 'Z' })).toBe(true)
  })

  it('[petitbac] lets a leading article play both ways', () => {
    expect(startsWithLetter({ answer: 'La Rochelle', letter: 'L' })).toBe(true)
    expect(startsWithLetter({ answer: 'La Rochelle', letter: 'R' })).toBe(true)
    expect(startsWithLetter({ answer: "L'Oréal", letter: 'O' })).toBe(true)
  })

  it('[petitbac] refuses an answer on another letter', () => {
    expect(startsWithLetter({ answer: 'Belgique', letter: 'P' })).toBe(false)
    expect(startsWithLetter({ answer: 'Le Havre', letter: 'R' })).toBe(false)
  })
})

describe('drawCategories', () => {
  it('[petitbac] draws distinct bank categories', () => {
    const categories = drawCategories({ count: 6, fixed: null })

    expect(categories).toHaveLength(6)
    expect(new Set(categories.map((category) => category.kind))).toEqual(
      new Set(['bank'])
    )
    expect(
      new Set(
        categories.map((category) =>
          category.kind === 'bank' ? category.key : category.label
        )
      ).size
    ).toBe(6)
  })

  it('[petitbac] keeps a fixed list as the host wrote it', () => {
    const fixed = [
      { key: 'country', kind: 'bank' },
      { kind: 'own', label: 'Un plat de mamie' }
    ] as const

    expect(drawCategories({ count: 6, fixed })).toEqual(fixed)
  })

  it('[petitbac] can draw the whole bank', () => {
    expect(
      drawCategories({ count: petitBacBankCategories.length, fixed: null })
    ).toHaveLength(petitBacBankCategories.length)
  })
})

describe('isRowRefused', () => {
  const roster = new Set(['ana', 'bob', 'cy', 'dee', 'eve'])

  it('[petitbac] refuses on a strict majority of the voters', () => {
    expect(
      isRowRefused({
        authors: ['ana'],
        refusedBy: new Set(['bob', 'cy', 'dee']),
        roster
      })
    ).toBe(true)
  })

  it('[petitbac] keeps a row on a tie', () => {
    expect(
      isRowRefused({
        authors: ['ana'],
        refusedBy: new Set(['bob', 'cy']),
        roster
      })
    ).toBe(false)
  })

  it('[petitbac] counts no refusal from an author or a latecomer', () => {
    expect(
      isRowRefused({
        authors: ['ana', 'bob', 'cy'],
        refusedBy: new Set(['ana', 'bob', 'dee', 'zed']),
        roster
      })
    ).toBe(false)
  })

  it('[petitbac] keeps a row every seat wrote', () => {
    expect(
      isRowRefused({ authors: [...roster], refusedBy: new Set(), roster })
    ).toBe(false)
  })
})

describe('categoryOutcomes', () => {
  it('[petitbac] pays a unique answer double a shared one', () => {
    const outcomes = categoryOutcomes({
      answers: new Map([
        ['ana', 'Belgique'],
        ['bob', 'belgique '],
        ['cy', 'Bénin']
      ]),
      letter: 'B',
      refusedKeys: new Set()
    })

    expect(Object.fromEntries(outcomes)).toEqual({
      ana: 'shared',
      bob: 'shared',
      cy: 'unique'
    })
    expect(sheetPoints([...outcomes.values()])).toBe(4 * POINT)
  })

  it('[petitbac] files blanks, wrong letters and refusals apart, all paying nothing', () => {
    const outcomes = categoryOutcomes({
      answers: new Map<string, string | null>([
        ['ana', null],
        ['bob', ' ?! '],
        ['cy', 'Portugal'],
        ['dee', 'Bolivie']
      ]),
      letter: 'B',
      refusedKeys: new Set(['bolivie'])
    })

    expect(Object.fromEntries(outcomes)).toEqual({
      ana: 'empty',
      bob: 'empty',
      cy: 'offLetter',
      dee: 'refused'
    })
    expect(sheetPoints([...outcomes.values()])).toBe(0)
  })

  it('[petitbac] leaves an answer unique when its only twin was off the letter', () => {
    const outcomes = categoryOutcomes({
      answers: new Map([
        ['ana', 'La Rochelle'],
        ['bob', 'Rochelle']
      ]),
      letter: 'L',
      refusedKeys: new Set()
    })

    expect(Object.fromEntries(outcomes)).toEqual({
      ana: 'unique',
      bob: 'offLetter'
    })
  })
})
