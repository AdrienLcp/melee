import { describe, expect, it } from 'vitest'

import { withQuizSwitchAsLevel } from './retired-quiz-switch'

describe('a quiz stored with the well-known switch', () => {
  it('[difficulty] reads a switch that was on as easy, wherever the quiz sits', () => {
    const stored = {
      games: { quiz: { game: { kind: 'quiz', wellKnownOnly: true } } },
      lineUp: [{ kind: 'quiz', language: 'fr', wellKnownOnly: true }]
    }

    expect(withQuizSwitchAsLevel(stored)).toEqual({
      games: { quiz: { game: { difficulty: 'easy', kind: 'quiz' } } },
      lineUp: [{ difficulty: 'easy', kind: 'quiz', language: 'fr' }]
    })
  })

  it('[difficulty] leaves a switch that was off, and a level already set, alone', () => {
    const off = { kind: 'quiz', wellKnownOnly: false }
    const levelled = { difficulty: 'hard', kind: 'quiz', wellKnownOnly: true }

    expect(withQuizSwitchAsLevel([off, levelled])).toEqual([off, levelled])
  })

  it('[difficulty] reads another game carrying the word as it was', () => {
    const notAQuiz = { kind: 'atlas', wellKnownOnly: true }

    expect(withQuizSwitchAsLevel(notAQuiz)).toEqual(notAQuiz)
  })
})
