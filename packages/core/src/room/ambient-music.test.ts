import { describe, expect, it } from 'vitest'

import { soundtrackStyles } from '@melee/protocol/room'

import { ambientMoodOf, nextSoundtrackStyle } from './ambient-music'

const PLAYING_QUIZ = {
  isPaused: false,
  isTestingSound: false,
  phase: 'playing',
  roundKind: 'quiz',
  soundtrack: 'mix'
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
    expect(ambientMoodOf({ ...PLAYING_QUIZ, soundtrack: 'off' })).toBeNull()
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

describe('nextSoundtrackStyle', () => {
  it('[ambient-music] plays the style the room chose, piece after piece', () => {
    expect(
      nextSoundtrackStyle({
        previous: 'drift',
        random: () => 0.5,
        soundtrack: 'drift'
      })
    ).toBe('drift')
  })

  it('[ambient-music] plays nothing when the soundtrack is off', () => {
    expect(
      nextSoundtrackStyle({
        previous: null,
        random: () => 0,
        soundtrack: 'off'
      })
    ).toBeNull()
  })

  it('[ambient-music] mixes every style in and never the one just played', () => {
    for (const previous of soundtrackStyles) {
      const drawn = new Set(
        [0, 0.26, 0.51, 0.76, 0.999].map((unit) =>
          nextSoundtrackStyle({
            previous,
            random: () => unit,
            soundtrack: 'mix'
          })
        )
      )

      expect(drawn.has(previous)).toBe(false)
      expect(drawn.size).toBe(soundtrackStyles.length - 1)
    }
  })

  it('[ambient-music] opens a mix on any style', () => {
    const drawn = new Set(
      [0, 0.2, 0.4, 0.6, 0.8].map((unit) =>
        nextSoundtrackStyle({
          previous: null,
          random: () => unit,
          soundtrack: 'mix'
        })
      )
    )

    expect(drawn.size).toBe(soundtrackStyles.length)
  })
})
