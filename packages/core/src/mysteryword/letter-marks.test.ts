import { describe, expect, it } from 'vitest'

import { isFoundBy, marksForTry } from './letter-marks'

describe('marksForTry', () => {
  it('[mysteryword] marks every letter of the word itself placed', () => {
    const marks = marksForTry({ answer: 'MAISON', guess: 'MAISON' })

    expect(marks).toEqual([
      'placed',
      'placed',
      'placed',
      'placed',
      'placed',
      'placed'
    ])
    expect(isFoundBy(marks)).toBe(true)
  })

  it('[mysteryword] tells a letter elsewhere from a letter not in the word', () => {
    expect(marksForTry({ answer: 'POISON', guess: 'PIANOS' })).toEqual([
      'placed',
      'present',
      'absent',
      'present',
      'placed',
      'present'
    ])
  })

  it('[mysteryword] counts the letters in place before giving any elsewhere', () => {
    expect(marksForTry({ answer: 'ALLEE', guess: 'LLAMA' })).toEqual([
      'present',
      'placed',
      'present',
      'absent',
      'absent'
    ])
  })

  it('[mysteryword] marks a letter written more times than the word holds it absent past its copies', () => {
    expect(marksForTry({ answer: 'CABLE', guess: 'EEEEE' })).toEqual([
      'absent',
      'absent',
      'absent',
      'absent',
      'placed'
    ])
    expect(marksForTry({ answer: 'PORTE', guess: 'EPEES' })).toEqual([
      'present',
      'present',
      'absent',
      'absent',
      'absent'
    ])
  })

  it('[mysteryword] gives elsewhere left to right while a copy is unclaimed', () => {
    expect(marksForTry({ answer: 'ABBEY', guess: 'BOBBY' })).toEqual([
      'present',
      'absent',
      'placed',
      'absent',
      'placed'
    ])
    expect(isFoundBy(marksForTry({ answer: 'ABBEY', guess: 'BOBBY' }))).toBe(
      false
    )
  })
})
