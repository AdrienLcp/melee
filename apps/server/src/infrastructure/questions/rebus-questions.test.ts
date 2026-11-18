import { describe, expect, it } from 'vitest'

import emojiTwelve from './rebus-emoji.json' with { type: 'json' }
import { bankedRebusQuestions } from './rebus-questions'

/**
 * Every fully-qualified emoji of Unicode Emoji 12.0 (2019), yellow, with no
 * flag: every guest draws a rebus in their own phone's font, and an older
 * Android or Windows misses whatever came later. Windows draws no flag at all,
 * only its two letters, which is why they are out of every version.
 */
const READABLE_EVERYWHERE = new Set<string>(emojiTwelve)

const graphemes = new Intl.Segmenter('en', { granularity: 'grapheme' })

const emojisOf = (rebus: string): string[] =>
  [...graphemes.segment(rebus)]
    .map(({ segment }) => segment)
    .filter((segment) => segment !== ' ')

const REBUSES = bankedRebusQuestions()

const PORTUGUESE_ASKS = new Set([
  'Que filme?',
  'Que expressão?',
  'Que série?',
  'Que canção?'
])

describe('the rebus rubric', () => {
  it('[rebus] writes Portugal a list of its own, every kind asked in Portuguese', () => {
    const portuguese = REBUSES.filter(({ language }) => language === 'pt')

    expect(portuguese.length).toBeGreaterThanOrEqual(180)
    expect(
      portuguese
        .filter(
          ({ id, prompt }) =>
            !id.startsWith('rebus-pt-') || !PORTUGUESE_ASKS.has(prompt)
        )
        .map(({ id }) => id)
    ).toEqual([])
  })

  it('[rebus] writes every rebus in emojis every phone at the table draws', () => {
    const unreadable = REBUSES.flatMap(({ id, rebus }) =>
      emojisOf(rebus ?? '')
        .filter((emoji) => !READABLE_EVERYWHERE.has(emoji))
        .map((emoji) => `${id}: ${emoji}`)
    )

    expect(unreadable).toEqual([])
  })

  it('[rebus] holds every rebus to between two and eight emojis', () => {
    const misshapen = REBUSES.filter(({ rebus }) => {
      const count = emojisOf(rebus ?? '').length

      return count < 2 || count > 8
    })

    expect(misshapen.map(({ id }) => id)).toEqual([])
  })

  it('[rebus] stands every answer beside three others', () => {
    const lopsided = REBUSES.filter(
      ({ answer, decoys }) =>
        new Set([answer, ...decoys].map((title) => title.toLowerCase()))
          .size !== 4
    )

    expect(lopsided.map(({ id }) => id)).toEqual([])
  })

  it('[rebus] writes no rebus twice in one language', () => {
    const seen = new Set<string>()
    const repeated: string[] = []

    for (const { id, language, rebus } of REBUSES) {
      const key = `${language}::${rebus}`

      if (seen.has(key)) {
        repeated.push(id)
      }

      seen.add(key)
    }

    expect(repeated).toEqual([])
  })
})
