import { describe, expect, it } from 'vitest'

import { LOCALES } from '@melee/protocol/locale'

import { LETTER_SLOT } from '@melee/core/challenge/letter-slot'

import {
  bankedChallengeLines,
  drawChallengeLine,
  playedChallengeLineId
} from './challenge-bank'

describe('the challenge bank', () => {
  it('[challenge] parses every row, each id once, in every locale', () => {
    const lines = bankedChallengeLines()
    const ids = lines.map(({ id }) => id)

    expect(ids.length).toBeGreaterThan(80)
    expect(new Set(ids).size).toBe(ids.length)

    for (const { labels } of lines) {
      expect(Object.keys(labels).toSorted()).toEqual([...LOCALES].toSorted())
    }
  })

  it('[challenge] holds no slot but the letter, and the letter in every locale or none', () => {
    for (const { id, labels } of bankedChallengeLines()) {
      const slotted = Object.values(labels).map((label) =>
        label.includes(LETTER_SLOT)
      )

      expect(
        Object.values(labels).filter((label) =>
          /\{/.test(label.replaceAll(LETTER_SLOT, ''))
        ),
        id
      ).toEqual([])
      expect(new Set(slotted).size, id).toBe(1)
    }
  })

  it('[challenge] deals an evening without a repeat, every letter filled in', () => {
    const playedIds = new Set<string>()
    let rounds = 0

    for (
      let line = drawChallengeLine(playedIds);
      line !== null;
      line = drawChallengeLine(playedIds)
    ) {
      expect(playedIds.has(playedChallengeLineId(line.id))).toBe(false)
      expect(Object.values(line.labels).join()).not.toContain(LETTER_SLOT)
      playedIds.add(playedChallengeLineId(line.id))
      rounds += 1
    }

    expect(rounds).toBe(bankedChallengeLines().length)
  })
})
