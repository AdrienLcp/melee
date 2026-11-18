import { describe, expect, it } from 'vitest'

import { countryCodeSchema } from '@melee/protocol/country-code'
import { fiveCluesLadderSchema } from '@melee/protocol/five-clues'
import { questionLanguages } from '@melee/protocol/question'

import { gradeQuizGuess } from '@melee/core/quiz/question-answer'

import {
  drawFiveCluesCountry,
  type FiveCluesCountry,
  fiveCluesAnswerOf,
  fiveCluesCountries,
  fiveCluesLadderOf,
  playedFiveCluesId
} from './five-clues-bank'

const countryOf = (code: string): FiveCluesCountry => {
  const country = fiveCluesCountries().find(
    (candidate) => candidate.code === countryCodeSchema.parse(code)
  )

  if (country === undefined) {
    throw new Error(`${code} is not dealt`)
  }

  return country
}

describe('the five-clues bank', () => {
  it('[fiveclues] climbs a whole ladder for every country it deals, in every language', () => {
    const countries = fiveCluesCountries()

    expect(countries.length).toBeGreaterThanOrEqual(140)

    for (const country of countries) {
      for (const language of questionLanguages) {
        expect(() =>
          fiveCluesLadderSchema.parse(fiveCluesLadderOf({ country, language }))
        ).not.toThrow()
      }
    }
  })

  it('[fiveclues] deals no country whose size names it on the first clue', () => {
    const dealt = new Set(fiveCluesCountries().map(({ code }) => code))

    for (const code of ['CHN', 'IND', 'RUS', 'USA', 'CAN']) {
      expect(dealt.has(countryCodeSchema.parse(code))).toBe(false)
    }

    expect(dealt.has(countryCodeSchema.parse('BRA'))).toBe(true)
  })

  it('[fiveclues] names a region that hides at least four countries, the continent where the group is smaller', () => {
    const countries = fiveCluesCountries()

    for (const { region } of countries) {
      expect(
        countries.filter((other) => other.region === region).length
      ).toBeGreaterThanOrEqual(4)
    }

    expect(countryOf('PER').region).toBe('005')
    expect(countryOf('AUS').region).toBe('009')
    expect(countryOf('MEX').region).toBe('013')
  })

  it('[fiveclues] never names the capital, nor a city carrying the country name, among its cities', () => {
    for (const country of fiveCluesCountries()) {
      for (const language of questionLanguages) {
        expect(country.cities.map((names) => names[language])).not.toContain(
          country.capital[language]
        )
      }
    }

    expect(
      fiveCluesLadderOf({ country: countryOf('CUB'), language: 'fr' })[3]
    ).not.toEqual(
      expect.objectContaining({
        cities: expect.arrayContaining(['Santiago de Cuba'])
      })
    )
  })

  it('[fiveclues] puts beside a country three others of its own region, nearest first', () => {
    for (const country of fiveCluesCountries()) {
      expect(new Set(country.decoys).size).toBe(3)
      expect(country.decoys).not.toContain(country.code)

      for (const decoy of country.decoys) {
        expect(countryOf(decoy).region).toBe(country.region)
      }
    }

    expect(countryOf('URY').decoys).toContain('ARG')
  })

  it('[fiveclues] writes a ladder from the banks, the names in the room’s language', () => {
    const [size, region, outline, cities, flag] = fiveCluesLadderOf({
      country: countryOf('PER'),
      language: 'fr'
    })

    expect(size.population).toBe(34_200_000)
    expect(region.region).toBe('005')
    expect(outline.silhouette).toMatch(/^[0-9a-f]{12}\.svg$/)
    expect(cities.cities).toEqual(['Cuzco', 'Arequipa', 'Trujillo'])
    expect(flag.capital).toBe('Lima')
    expect(
      fiveCluesLadderOf({ country: countryOf('NPL'), language: 'en' })[4]
        .capital
    ).toBe('Kathmandu')
    expect(
      fiveCluesLadderOf({ country: countryOf('NPL'), language: 'fr' })[4]
        .capital
    ).toBe('Katmandou')
  })

  it('[fiveclues] grades a typed line as the flags rubric does, never paying a decoy', () => {
    const country = countryOf('PER')
    const answer = fiveCluesAnswerOf({ country, language: 'fr' })

    expect(answer.decoys).toEqual(['Équateur', 'Bolivie', 'Colombie'])
    expect(
      gradeQuizGuess({ guess: 'le Pérou', question: answer }).isCorrect
    ).toBe(true)
    expect(
      gradeQuizGuess({ guess: 'Bolivie', question: answer }).isCorrect
    ).toBe(false)
  })

  it('[fiveclues] deals a country the room has not climbed, and any once it has climbed them all', () => {
    const countries = fiveCluesCountries()
    const [kept, ...rest] = countries

    if (kept === undefined) {
      throw new Error('the bank is empty')
    }

    const allButOne = new Set(rest.map(({ code }) => playedFiveCluesId(code)))

    expect(
      drawFiveCluesCountry({ difficulty: 'mixed', playedIds: allButOne })
    ).toEqual({ country: kept, playedId: playedFiveCluesId(kept.code) })

    const all = new Set(countries.map(({ code }) => playedFiveCluesId(code)))

    expect(
      drawFiveCluesCountry({ difficulty: 'easy', playedIds: all })
    ).not.toBeNull()
  })
})
