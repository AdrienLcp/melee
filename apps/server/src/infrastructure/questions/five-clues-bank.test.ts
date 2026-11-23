import { describe, expect, it } from 'vitest'

import { countryCodeSchema } from '@melee/protocol/country-code'
import { fiveCluesLadderSchema } from '@melee/protocol/five-clues'
import { questionLanguages } from '@melee/protocol/question'

import { gradeQuizGuess } from '@melee/core/quiz/question-answer'

import {
  drawFiveCluesCard,
  drawFiveCluesCountry,
  type FiveCluesCountry,
  fiveCluesAnswerOf,
  fiveCluesCountries,
  fiveCluesLadderOf,
  measuredCountries,
  outlinesDiffer,
  playedFiveCluesId,
  regionHolds,
  SIZE_APART,
  sizeRatioOf
} from './five-clues-bank'

/**
 * Where a region holds no country of a like size drawn clearly otherwise —
 * Western Europe for France, whose like-sized neighbours are all as compact —
 * the outline clue strikes nothing new and the third decoy waits for the flag.
 * A ceiling, so a bank change that thins the staircase shows.
 */
const MOST_OUTLINE_STAND_INS = 60

/** Luxembourg: nothing outside Western Europe is within three times its size, so its region decoy already fell on the size clue. */
const REGION_STAND_INS = ['LUX']

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

  it('[fiveclues] lays its decoys as a staircase: the size, the region and the outline each strike one as they open', () => {
    const measured = new Map(
      measuredCountries().map((country) => [country.code, country])
    )
    const decoyOf = (code: string) => {
      const decoy = measured.get(countryCodeSchema.parse(code))

      if (decoy === undefined) {
        throw new Error(`${code} is not measured`)
      }

      return decoy
    }
    const outlineStandIns: string[] = []
    const regionStandIns: string[] = []

    for (const country of fiveCluesCountries()) {
      const size = decoyOf(country.decoys.size)
      const region = decoyOf(country.decoys.region)
      const outline = decoyOf(country.decoys.outline)
      const holds = (decoy: typeof size) =>
        regionHolds({ country: decoy, region: country.region })
      const survivesSize = (decoy: typeof size) =>
        sizeRatioOf(country, decoy) < SIZE_APART

      expect(
        new Set([size.code, region.code, outline.code, country.code]).size
      ).toBe(4)

      expect(survivesSize(size)).toBe(false)
      expect(holds(size)).toBe(true)

      expect(holds(region)).toBe(false)
      if (!survivesSize(region)) {
        regionStandIns.push(country.code)
      }

      expect(holds(outline)).toBe(true)
      if (
        !survivesSize(outline) ||
        !outlinesDiffer(country.outline, outline.outline)
      ) {
        outlineStandIns.push(country.code)
      }

      for (const decoy of [size, region, outline]) {
        expect(decoy.capital.fr).not.toBe(country.capital.fr)
      }
    }

    expect(regionStandIns).toEqual(REGION_STAND_INS)
    expect(outlineStandIns.length).toBeLessThanOrEqual(MOST_OUTLINE_STAND_INS)
    expect(countryOf('PER').decoys).toEqual({
      outline: 'CHL',
      region: 'MLI',
      size: 'ECU'
    })
  })

  it('[fiveclues] writes a ladder from the banks, the names in the room’s language', () => {
    const [size, region, outline, cities, flag] = fiveCluesLadderOf({
      country: countryOf('PER'),
      language: 'fr'
    })

    expect(size).toEqual(
      expect.objectContaining({ kind: 'size', population: 34_200_000 })
    )
    expect(region).toEqual({ kind: 'region', region: '005' })
    expect(outline).toEqual({
      kind: 'outline',
      silhouette: expect.stringMatching(/^[0-9a-f]{12}\.svg$/)
    })
    expect(cities).toEqual({
      cities: ['Cuzco', 'Arequipa', 'Trujillo'],
      kind: 'cities'
    })
    expect(flag).toEqual(expect.objectContaining({ capital: 'Lima' }))
    expect(
      fiveCluesLadderOf({ country: countryOf('NPL'), language: 'en' })[4]
    ).toEqual(expect.objectContaining({ capital: 'Kathmandu' }))
    expect(
      fiveCluesLadderOf({ country: countryOf('NPL'), language: 'fr' })[4]
    ).toEqual(expect.objectContaining({ capital: 'Katmandou' }))
  })

  it('[fiveclues] grades a typed line as the flags rubric does, never paying a decoy', () => {
    const country = countryOf('PER')
    const answer = fiveCluesAnswerOf({ country, language: 'fr' })

    expect(answer.decoys).toEqual(['Équateur', 'Mali', 'Chili'])
    expect(
      gradeQuizGuess({ guess: 'le Pérou', question: answer }).isCorrect
    ).toBe(true)
    expect(gradeQuizGuess({ guess: 'Chili', question: answer }).isCorrect).toBe(
      false
    )
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
    ).toEqual(kept)
    expect(
      drawFiveCluesCard({
        difficulty: 'mixed',
        language: 'en',
        playedIds: allButOne
      })
    ).toEqual({
      answer: fiveCluesAnswerOf({ country: kept, language: 'en' }),
      ladder: fiveCluesLadderOf({ country: kept, language: 'en' }),
      playedId: playedFiveCluesId(kept.code),
      subject: 'country'
    })

    const all = new Set(countries.map(({ code }) => playedFiveCluesId(code)))

    expect(
      drawFiveCluesCountry({ difficulty: 'easy', playedIds: all })
    ).not.toBeNull()
  })
})
