// cspell:words Catmandu
import { describe, expect, it } from 'vitest'

import { countryCodeSchema } from '@melee/protocol/country-code'
import { fiveCluesLadderSchema } from '@melee/protocol/five-clues'
import { questionLanguages } from '@melee/protocol/question'

import {
  answerInEveryLanguage,
  gradeQuizGuess
} from '@melee/core/quiz/question-answer'

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
      expect(() =>
        fiveCluesLadderSchema.parse(fiveCluesLadderOf(country))
      ).not.toThrow()
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

    expect(fiveCluesLadderOf(countryOf('CUB'))[3]).not.toEqual(
      expect.objectContaining({
        cities: expect.arrayContaining([
          expect.objectContaining({ fr: 'Santiago de Cuba' })
        ])
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

  it('[fiveclues] writes a ladder from the banks, the names in every language', () => {
    const [size, region, outline, cities, flag] = fiveCluesLadderOf(
      countryOf('PER')
    )
    const everywhere = (name: string) => ({ en: name, fr: name, pt: name })

    expect(size).toEqual(
      expect.objectContaining({ kind: 'size', population: 34_200_000 })
    )
    expect(region).toEqual({ kind: 'region', region: '005' })
    expect(outline).toEqual({
      kind: 'outline',
      silhouette: expect.stringMatching(/^[0-9a-f]{12}\.svg$/)
    })
    expect(cities).toEqual({
      cities: [
        { en: 'Cusco', fr: 'Cuzco', pt: 'Cusco' },
        everywhere('Arequipa'),
        everywhere('Trujillo')
      ],
      kind: 'cities'
    })
    expect(flag).toEqual(
      expect.objectContaining({ capital: everywhere('Lima') })
    )
    expect(fiveCluesLadderOf(countryOf('NPL'))[4]).toEqual(
      expect.objectContaining({
        capital: { en: 'Kathmandu', fr: 'Katmandou', pt: 'Catmandu' }
      })
    )
  })

  it('[fiveclues] names every choice in all three languages, each the same country in each', () => {
    const { answer, decoys } = fiveCluesAnswerOf(countryOf('PER'))

    expect([answer, ...decoys]).toEqual([
      { en: 'Peru', fr: 'Pérou', pt: 'Peru' },
      { en: 'Ecuador', fr: 'Équateur', pt: 'Equador' },
      { en: 'Mali', fr: 'Mali', pt: 'Mali' },
      { en: 'Chile', fr: 'Chili', pt: 'Chile' }
    ])
  })

  it('[fiveclues] grades a typed line as the flags rubric does, in any language, never paying a decoy named in any', () => {
    const answerOfPeru = answerInEveryLanguage(
      fiveCluesAnswerOf(countryOf('PER'))
    )
    const answerOfGermany = answerInEveryLanguage(
      fiveCluesAnswerOf(countryOf('DEU'))
    )
    const graded = (guess: string, question: typeof answerOfPeru) =>
      gradeQuizGuess({ guess, question }).isCorrect

    expect(graded('le Pérou', answerOfPeru)).toBe(true)
    expect(graded('Alemanha', answerOfGermany)).toBe(true)
    expect(graded('Germany', answerOfGermany)).toBe(true)
    expect(graded('Chili', answerOfPeru)).toBe(false)
    expect(graded('Equador', answerOfPeru)).toBe(false)
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
        homeCountry: null,
        playedIds: allButOne,
        subjects: ['country']
      })
    ).toEqual({
      answer: fiveCluesAnswerOf(kept),
      ladder: fiveCluesLadderOf(kept),
      playedId: playedFiveCluesId(kept.code),
      subject: 'country'
    })

    const all = new Set(countries.map(({ code }) => playedFiveCluesId(code)))

    expect(
      drawFiveCluesCountry({ difficulty: 'easy', playedIds: all })
    ).not.toBeNull()
  })
})
