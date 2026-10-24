import { describe, expect, it } from 'vitest'

import { LOCALES } from '@melee/protocol/locale'

import {
  bankedChallengeLines,
  drawChallengeLine,
  playedChallengeLineId
} from './challenge-bank'

const countOf = (category: string): number =>
  bankedChallengeLines().filter((line) => line.category === category).length

describe('the challenge bank', () => {
  it('[challenge] parses every row, each id once, in every locale', () => {
    const lines = bankedChallengeLines()
    const ids = lines.map(({ id }) => id)

    expect(ids.length).toBeGreaterThan(100)
    expect(new Set(ids).size).toBe(ids.length)

    for (const { labels } of lines) {
      expect(Object.keys(labels).toSorted()).toEqual([...LOCALES].toSorted())
    }
  })

  it('[challenge] holds plenty to fetch and plenty to do', () => {
    expect(countOf('fetch')).toBeGreaterThanOrEqual(40)
    expect(countOf('do')).toBeGreaterThanOrEqual(40)
    expect(countOf('festive')).toBeGreaterThanOrEqual(15)
  })

  it('[challenge] deals an evening without a repeat or a festive line', () => {
    const playedIds = new Set<string>()
    let rounds = 0

    for (
      let line = drawChallengeLine({
        avoidCategory: null,
        hasFestiveLines: false,
        playedIds
      });
      line !== null;
      line = drawChallengeLine({
        avoidCategory: line.category,
        hasFestiveLines: false,
        playedIds
      })
    ) {
      expect(line.category).not.toBe('festive')
      expect(playedIds.has(playedChallengeLineId(line.id))).toBe(false)
      playedIds.add(playedChallengeLineId(line.id))
      rounds += 1
    }

    expect(rounds).toBe(countOf('fetch') + countOf('do'))
  })

  it('[challenge] deals festive lines once the host asks for them', () => {
    const everyOtherLine = new Set(
      bankedChallengeLines()
        .filter(({ category }) => category !== 'festive')
        .map(({ id }) => playedChallengeLineId(id))
    )

    expect(
      drawChallengeLine({
        avoidCategory: null,
        hasFestiveLines: true,
        playedIds: everyOtherLine
      })?.category
    ).toBe('festive')
  })
})
