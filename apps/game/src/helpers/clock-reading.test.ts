import { describe, expect, it } from 'vitest'

import { clockReadingOf } from './clock-reading'

describe('clockReadingOf', () => {
  it('[clock] reads a clock of a minute or more in minutes and seconds', () => {
    expect(clockReadingOf({ seconds: 80, spanSeconds: 80 })).toEqual({
      kind: 'minutes',
      minutes: 1,
      seconds: 20
    })
  })

  it('[clock] keeps minutes all the way down a clock that started past a minute', () => {
    expect(clockReadingOf({ seconds: 5, spanSeconds: 90 })).toEqual({
      kind: 'minutes',
      minutes: 0,
      seconds: 5
    })
  })

  it('[clock] reads a clock of exactly a minute in minutes from its first second', () => {
    expect(clockReadingOf({ seconds: 60, spanSeconds: 60 })).toEqual({
      kind: 'minutes',
      minutes: 1,
      seconds: 0
    })
  })

  it('[clock] reads a clock under a minute in bare seconds', () => {
    expect(clockReadingOf({ seconds: 45, spanSeconds: 59 })).toEqual({
      kind: 'seconds',
      seconds: 45
    })
  })

  it('[clock] counts up in bare seconds until the first minute', () => {
    expect(clockReadingOf({ seconds: 59, spanSeconds: null })).toEqual({
      kind: 'seconds',
      seconds: 59
    })
  })

  it('[clock] counts up in minutes from the first minute', () => {
    expect(clockReadingOf({ seconds: 125, spanSeconds: null })).toEqual({
      kind: 'minutes',
      minutes: 2,
      seconds: 5
    })
  })
})
