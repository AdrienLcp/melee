import { describe, expect, it } from 'vitest'

import { challengeHandOf, challengePickOf } from './challenge-hand'

const DEALT = [
  'Bring back something red',
  'Bring back a key',
  'Bring back a pen'
]
const OWN = ['Bring back a key', 'Grandma’s wedding photo']

describe('challengeHandOf', () => {
  it('[challenge-hand] keeps the server’s slots and marks the lines the host wrote', () => {
    expect(challengeHandOf({ dealt: DEALT, own: OWN })).toEqual([
      { isOwn: false, slot: 0, text: 'Bring back something red' },
      { isOwn: true, slot: 1, text: 'Bring back a key' },
      { isOwn: false, slot: 2, text: 'Bring back a pen' }
    ])
  })
})

describe('challengePickOf', () => {
  const hand = challengeHandOf({ dealt: DEALT, own: OWN })

  it('[challenge-hand] names a line by its server slot, the host’s own included', () => {
    expect(
      challengePickOf({ choice: { at: 1, kind: 'line' }, hand, typed: '' })
    ).toEqual({ challengeAt: 1 })
    expect(
      challengePickOf({ choice: { at: 2, kind: 'line' }, hand, typed: '' })
    ).toEqual({ challengeAt: 2 })
  })

  it('[challenge-hand] lets a typed line win, and reads a blank one as the hand’s first', () => {
    expect(
      challengePickOf({
        choice: { kind: 'typed' },
        hand,
        typed: 'Hop on one foot'
      })
    ).toEqual({ challengeText: 'Hop on one foot' })
    expect(
      challengePickOf({ choice: { kind: 'typed' }, hand, typed: '  ' })
    ).toEqual({ challengeAt: 0 })
  })

  it('[challenge-hand] says aloud with no line, and falls back to the first once a slot is gone', () => {
    expect(
      challengePickOf({ choice: { kind: 'aloud' }, hand, typed: 'ignored' })
    ).toEqual({ isChallengeSaidAloud: true })
    expect(
      challengePickOf({
        choice: { at: 2, kind: 'line' },
        hand: hand.slice(0, 1),
        typed: ''
      })
    ).toEqual({ challengeAt: 0 })
    expect(
      challengePickOf({ choice: { at: 0, kind: 'line' }, hand: [], typed: '' })
    ).toEqual({})
  })
})
