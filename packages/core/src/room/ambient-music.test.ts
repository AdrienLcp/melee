import { describe, expect, it } from 'vitest'

import { ambientMoodOf } from './ambient-music'

const PLAYING_QUIZ = {
  isPaused: false,
  isTestingSound: false,
  phase: 'playing',
  playsMusic: true,
  roundKind: 'quiz'
} as const

describe('ambientMoodOf', () => {
  it('[ambient-music] plays calm under a lobby and lively around a reveal', () => {
    expect(
      ambientMoodOf({ ...PLAYING_QUIZ, phase: 'lobby', roundKind: null })
    ).toBe('calm')
    expect(ambientMoodOf({ ...PLAYING_QUIZ, phase: 'revealed' })).toBe('lively')
    expect(ambientMoodOf({ ...PLAYING_QUIZ, phase: 'finished' })).toBe('final')
  })

  it('[ambient-music] gives way to a blind test from its count in to its reveal', () => {
    for (const phase of [
      'countdown',
      'playing',
      'buzzed',
      'revealed'
    ] as const) {
      expect(
        ambientMoodOf({ ...PLAYING_QUIZ, phase, roundKind: 'blindtest' })
      ).toBeNull()
    }
  })

  it('[ambient-music] keeps quiet through Inner clock count and back for its reveal', () => {
    expect(
      ambientMoodOf({ ...PLAYING_QUIZ, roundKind: 'innerclock' })
    ).toBeNull()
    expect(
      ambientMoodOf({
        ...PLAYING_QUIZ,
        phase: 'countdown',
        roundKind: 'innerclock'
      })
    ).toBeNull()
    expect(
      ambientMoodOf({
        ...PLAYING_QUIZ,
        phase: 'revealed',
        roundKind: 'innerclock'
      })
    ).toBe('lively')
  })

  it('[ambient-music] keeps playing under the reflex race and Lights', () => {
    expect(ambientMoodOf({ ...PLAYING_QUIZ, roundKind: 'reflex' })).toBe('calm')
    expect(ambientMoodOf({ ...PLAYING_QUIZ, roundKind: 'lights' })).toBe('calm')
  })

  it('[ambient-music] stops for a pause, a sound check and a host who turned it off', () => {
    expect(ambientMoodOf({ ...PLAYING_QUIZ, isPaused: true })).toBeNull()
    expect(ambientMoodOf({ ...PLAYING_QUIZ, isTestingSound: true })).toBeNull()
    expect(ambientMoodOf({ ...PLAYING_QUIZ, playsMusic: false })).toBeNull()
  })

  it('[ambient-music] plays the final board of an evening that ended on a blind test', () => {
    expect(
      ambientMoodOf({
        ...PLAYING_QUIZ,
        phase: 'finished',
        roundKind: 'blindtest'
      })
    ).toBe('final')
  })
})
