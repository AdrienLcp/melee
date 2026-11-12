import { describe, expect, it } from 'vitest'

import type { BlackSquareDeckItem } from '@melee/protocol/deck'

import { blackSquareDeckProblems } from './black-square-deck'

const answer = (label: string, tier: 'easy' | 'medium' | 'hard') => ({
  aliases: [],
  label,
  tier
})

const FRUITS: BlackSquareDeckItem = {
  answers: [
    answer('Apple', 'easy'),
    answer('Banana', 'easy'),
    answer('Orange', 'easy'),
    answer('Strawberry', 'easy'),
    answer('Cherry', 'medium'),
    answer('Apricot', 'medium'),
    answer('Pineapple', 'medium'),
    { aliases: ['Kiwis'], label: 'Kiwi', tier: 'medium' },
    answer('Persimmon', 'hard'),
    { aliases: ['Lychee'], label: 'Litchi', tier: 'hard' },
    answer('Grenade', 'hard'),
    answer('Quince', 'hard')
  ],
  blackWord: {
    aliases: [],
    label: 'Rhubarb',
    why: 'A stalk, cooked like a fruit'
  },
  label: 'Fruits'
}

const problemsOf = (item: BlackSquareDeckItem): string[] =>
  blackSquareDeckProblems({ items: [item], path: 'decks[0]' })

describe('blackSquareDeckProblems', () => {
  it('[blacksquare] finds nothing in a broad theme of three tiers and a black word apart', () => {
    expect(problemsOf(FRUITS)).toEqual([])
  })

  it('[blacksquare] refuses a tier of fewer than three answers', () => {
    expect(
      problemsOf({ ...FRUITS, answers: FRUITS.answers.slice(0, 10) })
    ).toEqual([
      'decks[0].items[0].answers: 2 hard answers — every tier needs at least 3.'
    ])
  })

  it('[blacksquare] refuses two varieties of one thing, and keeps the theme’s own word', () => {
    expect(
      problemsOf({
        ...FRUITS,
        answers: FRUITS.answers.with(3, answer('Cherry plum', 'easy'))
      })
    ).toEqual([
      expect.stringMatching(
        /^decks\[0\]\.items\[0\]\.answers\[4\]\.label: “Cherry plum”, “Cherry” open alike/
      )
    ])
    expect(
      problemsOf({
        ...FRUITS,
        answers: FRUITS.answers
          .with(2, answer('Fruit de la passion', 'easy'))
          .with(3, answer('Fruit du dragon', 'easy'))
      })
    ).toEqual([])
  })

  it('[blacksquare] refuses a black word spelled like an answer or a slip from one, by its path', () => {
    expect(
      problemsOf({
        ...FRUITS,
        blackWord: { ...FRUITS.blackWord, aliases: ['Kiwis'] }
      })
    ).toContain(
      'decks[0].items[0].blackWord.aliases[0]: “Kiwis” is taken for answers[7] (“Kiwi”) — no two names on the board may be one spelling or a slip apart.'
    )
    expect(
      problemsOf({
        ...FRUITS,
        blackWord: { ...FRUITS.blackWord, label: 'Quinces' }
      })
    ).toContain(
      'decks[0].items[0].blackWord.label: “Quinces” is a slip from answers[11] (“Quince”) — whoever types that answer a letter off loses the round to a spelling.'
    )
  })

  it('[blacksquare] refuses an alias two answers share, by its path', () => {
    expect(
      problemsOf({
        ...FRUITS,
        answers: FRUITS.answers.with(8, {
          aliases: ['Lychee'],
          label: 'Persimmon',
          tier: 'hard'
        })
      })
    ).toContain(
      'decks[0].items[0].answers[9].aliases[0]: “Lychee” is taken for answers[8] (“Persimmon”) — no two names on the board may be one spelling or a slip apart.'
    )
  })
})
