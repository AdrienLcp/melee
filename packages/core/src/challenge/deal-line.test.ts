import { describe, expect, it } from 'vitest'

import type { ChallengeCategory } from '@melee/protocol/challenge'

import { dealLine } from './deal-line'

const lineOf = (category: ChallengeCategory, index: number) => ({
  category,
  id: `${category}-${index}`
})

const linesOf = (category: ChallengeCategory, count: number) =>
  Array.from({ length: count }, (_, index) => lineOf(category, index))

const BANK = [
  ...linesOf('fetch', 10),
  ...linesOf('do', 10),
  ...linesOf('festive', 10)
]

const DRAWS = 200

describe('dealing a ready-made challenge line', () => {
  it('[challenge] never deals a line the room has had', () => {
    const playedIds = new Set(
      BANK.filter(({ id }) => id !== 'do-3').map(({ id }) => id)
    )

    expect(
      dealLine({
        avoidCategory: null,
        hasFestiveLines: true,
        lines: BANK,
        playedIds
      })?.id
    ).toBe('do-3')
  })

  it('[challenge] deals no festive line unless the host asked for them', () => {
    for (let draw = 0; draw < DRAWS; draw += 1) {
      expect(
        dealLine({
          avoidCategory: null,
          hasFestiveLines: false,
          lines: BANK,
          playedIds: new Set()
        })?.category
      ).not.toBe('festive')
    }
  })

  it('[challenge] deals a festive line once the host asks for them', () => {
    expect(
      dealLine({
        avoidCategory: null,
        hasFestiveLines: true,
        lines: linesOf('festive', 3),
        playedIds: new Set()
      })?.category
    ).toBe('festive')
  })

  it('[challenge] moves off the last round’s category while another is left', () => {
    for (let draw = 0; draw < DRAWS; draw += 1) {
      expect(
        dealLine({
          avoidCategory: 'fetch',
          hasFestiveLines: false,
          lines: BANK,
          playedIds: new Set()
        })?.category
      ).toBe('do')
    }
  })

  it('[challenge] falls back on the last round’s category rather than nothing', () => {
    expect(
      dealLine({
        avoidCategory: 'fetch',
        hasFestiveLines: false,
        lines: [...linesOf('fetch', 2), ...linesOf('festive', 2)],
        playedIds: new Set()
      })?.category
    ).toBe('fetch')
  })

  it('[challenge] gives up once every line has been dealt', () => {
    expect(
      dealLine({
        avoidCategory: null,
        hasFestiveLines: false,
        lines: linesOf('do', 2),
        playedIds: new Set(['do-0', 'do-1'])
      })
    ).toBeNull()
  })
})
