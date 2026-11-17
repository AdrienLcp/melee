import { describe, expect, it } from 'vitest'

import { bankedCapitals } from './capital-bank'
import bank from './capital-bank.json' with { type: 'json' }

describe('the capital bank', () => {
  it('[capitals] names every capital, seat and city in both languages', () => {
    const unnamed = bankedCapitals().flatMap(
      ({ capital, code, largestCities, seats }) =>
        [capital, ...seats, ...largestCities]
          .filter(({ names }) => names.en === '' || names.fr === '')
          .map(({ id }) => `${code}:${id}`)
    )

    expect(unnamed).toEqual([])
  })

  it('[capitals] names every capital, seat and city in Portuguese ahead of the locale', () => {
    const unnamed = bank.flatMap(({ capital, code, largestCities, seats }) =>
      [capital, ...seats, ...largestCities]
        .filter(
          ({ aliases, names }) =>
            names.pt.trim() === '' || aliases.pt.includes(names.pt)
        )
        .map(({ id }) => `${code}:${id}`)
    )

    expect(unnamed).toEqual([])
  })

  it('[capitals] never offers a capital or a seat as one of the largest other cities', () => {
    const official = new Set(
      bankedCapitals().flatMap(({ capital, seats }) => [
        capital.id,
        ...seats.map(({ id }) => id)
      ])
    )
    const misfiled = bankedCapitals().flatMap(({ code, largestCities }) =>
      largestCities
        .filter(({ id }) => official.has(id))
        .map(({ names }) => `${code}:${names.en}`)
    )

    expect(misfiled).toEqual([])
  })

  it('[capitals] gives no two states the same capital', () => {
    const ids = bankedCapitals().map(({ capital }) => capital.id)

    expect(new Set(ids).size).toBe(ids.length)
  })

  it('[capitals] holds one row per state', () => {
    const codes = bankedCapitals().map(({ code }) => code)

    expect(new Set(codes).size).toBe(codes.length)
  })

  it('[capitals] leaves out the states whose capital a reference work would argue', () => {
    const codes = bankedCapitals().map(({ code }) => code)

    expect(codes).not.toContain('ISR')
    expect(codes).not.toContain('PSE')
  })
})
