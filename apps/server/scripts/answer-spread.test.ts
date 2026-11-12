import { describe, expect, it } from 'vitest'

import {
  DEPTH_SHARE,
  LEAST_POOLED_ANSWERS,
  MOST_POOLED_ANSWERS,
  spreadAnswers
} from './answer-spread'

type Ranked = { name: string; views: number }

const TYPICAL_VIEWS = 1000

const answersAt = ({
  count,
  from,
  views
}: {
  count: number
  from: number
  views: number
}): Ranked[] =>
  Array.from({ length: count }, (_, index) => ({
    name: `answer ${from + index}`,
    views
  }))

const spreadOf = (ranked: readonly Ranked[]) =>
  spreadAnswers({ ranked, viewsOf: ({ views }) => views })

describe('the spread of a black square theme', () => {
  it('[blacksquare] reaches past the nine best known while a table still names answers, and draws the rare third from there', () => {
    const reachedViews = TYPICAL_VIEWS * DEPTH_SHARE
    const ranked = [
      ...answersAt({ count: 9, from: 0, views: TYPICAL_VIEWS }),
      ...answersAt({ count: 6, from: 9, views: reachedViews }),
      ...answersAt({ count: 10, from: 15, views: reachedViews - 1 })
    ]

    const spread = spreadOf(ranked)

    expect(spread).toHaveLength(15)
    expect(
      spread
        .filter(({ tier }) => tier === 'hard')
        .map(({ answer }) => answer.views)
    ).toEqual(Array.from({ length: 5 }, () => reachedViews))
    expect(spread.map(({ tier }) => tier)).toEqual(
      ['easy', 'medium', 'hard'].flatMap((tier) =>
        Array.from({ length: 5 }, () => tier)
      )
    )
  })

  it('[blacksquare] keeps nine answers of a theme a table knows no further, tiered by thirds', () => {
    const ranked = [
      ...answersAt({ count: 9, from: 0, views: TYPICAL_VIEWS }),
      ...answersAt({ count: 20, from: 9, views: 1 })
    ]

    expect(spreadOf(ranked).map(({ tier }) => tier)).toEqual(
      ['easy', 'medium', 'hard'].flatMap((tier) =>
        Array.from({ length: LEAST_POOLED_ANSWERS / 3 }, () => tier)
      )
    )
  })

  it('[blacksquare] cuts a list deeper than the pool holds to its best known', () => {
    const ranked = answersAt({ count: 40, from: 0, views: TYPICAL_VIEWS })

    expect(spreadOf(ranked).map(({ answer }) => answer)).toEqual(
      ranked.slice(0, MOST_POOLED_ANSWERS)
    )
  })
})
