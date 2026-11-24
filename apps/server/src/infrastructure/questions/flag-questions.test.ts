import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { countryCodeSchema } from '@melee/protocol/country-code'
import { questionLanguages } from '@melee/protocol/question'

import { COUNTRY_NAMES_EN } from '@melee/core/countries/country-names-en'
import { COUNTRY_NAMES_FR } from '@melee/core/countries/country-names-fr'
import { COUNTRY_NAMES_PT } from '@melee/core/countries/country-names-pt'

import flagRows from './flag-bank.json' with { type: 'json' }
import { bankedFlagQuestions } from './flag-questions'

const flagBank = z
  .array(
    z.object({ code: countryCodeSchema, decoys: z.array(countryCodeSchema) })
  )
  .parse(flagRows)

const SERVED_FLAGS = join(
  import.meta.dirname,
  '..',
  '..',
  '..',
  '..',
  'game',
  'public',
  'flags'
)

describe('the flags rubric', () => {
  it('[flags] asks about a flag the app serves', () => {
    const served = new Set(readdirSync(SERVED_FLAGS))
    const missing = bankedFlagQuestions().filter(
      (question) => question.flag === null || !served.has(question.flag)
    )

    expect(missing.map(({ id }) => id)).toEqual([])
  })

  /**
   * `flag-icons` writes the country's code into every id and class it draws
   * with, and a player can fetch the file the prompt names.
   */
  it('[flags] serves files that never name their country', {
    timeout: 20_000
  }, () => {
    const telling = readdirSync(SERVED_FLAGS).filter((file) =>
      /flag-icons|(?:id="|#|class="|\.)(?!f-)[a-z]{2}-[a-z]/.test(
        readFileSync(join(SERVED_FLAGS, file), 'utf8')
      )
    )

    expect(telling).toEqual([])
  })

  it('[flags] deals the flag of a state, never of a territory', () => {
    const asked = new Set(bankedFlagQuestions().map(({ answer }) => answer.en))

    expect(asked.size).toBe(195)
    expect(asked).toContain('France')
    expect(asked).toContain('Bhutan')
    expect(asked).not.toContain('Greenland')
    expect(asked).not.toContain('Puerto Rico')
    expect(asked).not.toContain('Hong Kong')
  })

  it('[flags] stands every flag beside three other countries', () => {
    const lopsided = bankedFlagQuestions().filter(({ answer, decoys }) =>
      questionLanguages.some(
        (language) =>
          new Set([answer, ...decoys].map((name) => name[language])).size !== 4
      )
    )

    expect(lopsided.map(({ id }) => id)).toEqual([])
  })

  it('[flags] asks each flag once, read in every language', () => {
    const flagsOfPortugal = bankedFlagQuestions().filter(
      ({ answer }) => answer.en === 'Portugal'
    )

    expect(flagsOfPortugal).toHaveLength(1)
    expect(flagsOfPortugal[0]?.language).toBeNull()
    expect(flagsOfPortugal[0]?.id).toMatch(/^flag-[0-9a-f]{12}$/)
    expect(flagsOfPortugal[0]?.answer).toEqual({
      en: 'Portugal',
      fr: 'Portugal',
      pt: 'Portugal'
    })
  })

  it('[flags] names each decoy as the same country in every language', () => {
    const japan = bankedFlagQuestions().find(
      ({ answer }) => answer.en === 'Japan'
    )
    const decoyCodes = flagBank.find(({ code }) => code === 'JPN')?.decoys ?? []

    expect(japan?.answer).toEqual({ en: 'Japan', fr: 'Japon', pt: 'Japão' })
    expect(japan?.decoys).toEqual(
      decoyCodes.map((code) => ({
        en: COUNTRY_NAMES_EN[code].name,
        fr: COUNTRY_NAMES_FR[code].name,
        pt: COUNTRY_NAMES_PT[code].name
      }))
    )
  })
})
