import { describe, expect, it } from 'vitest'

import { challengeHandOf, challengePickOf } from './challenge-hand'

const DEALT = [
  'Bring back something red',
  'Bring back a key',
  'Bring back a pen'
]
const OWN = [
  { isPlayed: true, text: 'The oldest book in the house' },
  { isPlayed: false, text: 'Grandma’s wedding photo' },
  { isPlayed: false, text: 'One of Paul’s shoes' }
]

describe('challengeHandOf', () => {
  it('[challenge-hand] deals the host’s unplayed lines first, then the server’s, to the size', () => {
    expect(
      challengeHandOf({ dealt: DEALT, own: OWN, setAside: new Set(), size: 3 })
    ).toEqual([
      { kind: 'own', ownAt: 1, text: 'Grandma’s wedding photo' },
      { kind: 'own', ownAt: 2, text: 'One of Paul’s shoes' },
      { kind: 'dealt', slot: 0, text: 'Bring back something red' }
    ])
  })

  it('[challenge-hand] fills the place of a line set aside with the next one', () => {
    expect(
      challengeHandOf({
        dealt: DEALT,
        own: OWN,
        setAside: new Set([1]),
        size: 3
      })
    ).toEqual([
      { kind: 'own', ownAt: 2, text: 'One of Paul’s shoes' },
      { kind: 'dealt', slot: 0, text: 'Bring back something red' },
      { kind: 'dealt', slot: 1, text: 'Bring back a key' }
    ])
  })
})

describe('challengePickOf', () => {
  const hand = challengeHandOf({
    dealt: DEALT,
    own: OWN,
    setAside: new Set(),
    size: 3
  })

  it('[challenge-hand] sends an own line as typed text and a dealt one by its server slot', () => {
    expect(
      challengePickOf({ choice: { at: 1, kind: 'line' }, hand, typed: '' })
    ).toEqual({ challengeText: 'One of Paul’s shoes' })
    expect(
      challengePickOf({ choice: { at: 2, kind: 'line' }, hand, typed: '' })
    ).toEqual({ challengeAt: 0 })
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
    ).toEqual({ challengeText: 'Grandma’s wedding photo' })
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
    ).toEqual({ challengeText: 'Grandma’s wedding photo' })
    expect(
      challengePickOf({ choice: { at: 0, kind: 'line' }, hand: [], typed: '' })
    ).toEqual({})
  })
})
