import { describe, expect, it } from 'vitest'

import {
  franchiseStemOf,
  isFranchiseBase,
  isTitleWithin
} from './franchise-stem'

describe('franchiseStemOf', () => {
  it.each([
    ['Shrek', 'shrek'],
    ['Shrek 2', 'shrek'],
    ['Shrek the Third', 'shrek'],
    ['Shrek le troisième', 'shrek'],
    ['Shrek 4 : Il était une fin', 'shrek'],
    ['The Godfather Part II', 'godfather'],
    ['Le Parrain, 2e partie', 'parrain'],
    ['Kill Bill: Volume 2', 'kill bill'],
    ['Evil Dead II', 'evil dead'],
    ['Avatar : la voie de l’eau', 'avatar'],
    ['Retour vers le futur 3', 'retour vers'],
    ['The Dark Knight Rises', 'dark knight'],
    ['Alive 2007', 'alive'],
    ['L’Âge de glace 2', 'age de']
  ])('[blacksquare] stems %s to %s', (label, stem) => {
    expect(franchiseStemOf(label)).toBe(stem)
  })

  it('[blacksquare] keeps two films that only share a first word apart', () => {
    expect(franchiseStemOf('Jurassic Park')).not.toBe(
      franchiseStemOf('Jurassic World')
    )
  })
})

describe('isFranchiseBase', () => {
  it('[blacksquare] reads the franchise’s own name as its base, a number or a subtitle as a sequel', () => {
    expect(isFranchiseBase('Shrek')).toBe(true)
    expect(isFranchiseBase('Retour vers le futur')).toBe(true)
    expect(isFranchiseBase('Shrek 2')).toBe(false)
    expect(isFranchiseBase('Dune : Deuxième partie')).toBe(false)
  })
})

describe('isTitleWithin', () => {
  it('[blacksquare] finds a whole title inside its sequel’s', () => {
    expect(
      isTitleWithin({ title: 'Trainspotting', within: 'T2 Trainspotting' })
    ).toBe(true)
  })

  it('[blacksquare] ignores a short title and a title that is only a part of a word', () => {
    expect(
      isTitleWithin({ title: 'Une femme', within: 'La Femme gelée' })
    ).toBe(false)
    expect(isTitleWithin({ title: 'Alien', within: 'Aliens, le retour' })).toBe(
      false
    )
  })
})
