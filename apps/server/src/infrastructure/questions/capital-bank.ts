import { z } from 'zod'

import { countryCodeSchema } from '@melee/protocol/country-code'
import { geoPointSchema } from '@melee/protocol/worldmap'

import bank from './capital-bank.json' with { type: 'json' }

const wordingSchema = z.object({ en: z.string(), fr: z.string() })

const placeSchema = z.object({
  /** Every other name the place answers to, per language — never its own name. */
  aliases: z.object({ en: z.array(z.string()), fr: z.array(z.string()) }),
  /** Its Wikidata id, which is what stops one city standing twice under two spellings. */
  id: z.string(),
  names: wordingSchema
})

export const capitalRowSchema = z.object({
  capital: placeSchema.extend({
    /** Whether a French room can be expected to have heard of it, by its article's traffic. */
    isWellKnown: z.boolean(),
    point: geoPointSchema
  }),
  code: countryCodeSchema,
  /**
   * Up to five cities of the country that are neither its capital nor one of
   * its seats, most populous first: what a table takes for the capital.
   */
  largestCities: z.array(placeSchema.extend({ sitelinks: z.number() })),
  /** The UN M49 continent: `002` Africa, `009` Oceania, `019` the Americas, `142` Asia, `150` Europe. */
  region: z.string(),
  /**
   * Other capitals a table may give and be right — La Paz beside Sucre, Cape
   * Town and Bloemfontein beside Pretoria.
   */
  seats: z.array(placeSchema),
  /**
   * The UN M49 group finest-but-one: the intermediate region where M49 has
   * one (`005` South America), the subregion otherwise (`155` Western Europe).
   */
  subregion: z.string()
})

export type CapitalRow = z.infer<typeof capitalRowSchema>

/** Parsed on the first read, like the other banks, rather than on every cold start. */
let parsed: readonly CapitalRow[] | null = null

/** Every sovereign state the map draws, with its capital, by country code. */
export const bankedCapitals = (): readonly CapitalRow[] => {
  parsed ??= z.array(capitalRowSchema).parse(bank)

  return parsed
}
