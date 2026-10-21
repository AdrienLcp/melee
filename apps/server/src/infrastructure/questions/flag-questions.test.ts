import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { bankedFlagQuestions } from './flag-questions'

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
  it('[flags] serves files that never name their country', () => {
    const telling = readdirSync(SERVED_FLAGS).filter((file) =>
      /flag-icons|(?:id="|#|class="|\.)(?!f-)[a-z]{2}-[a-z]/.test(
        readFileSync(join(SERVED_FLAGS, file), 'utf8')
      )
    )

    expect(telling).toEqual([])
  })

  it('[flags] stands every flag beside three other countries', () => {
    const lopsided = bankedFlagQuestions().filter(
      ({ answer, decoys }) => new Set([answer, ...decoys]).size !== 4
    )

    expect(lopsided.map(({ id }) => id)).toEqual([])
  })
})
