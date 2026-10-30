import { describe, expect, it } from 'vitest'

import { freeWallNumber, speakingWallOf } from './room-walls'

const wall = ({
  id,
  isSpeaker = false,
  number
}: {
  id: string
  isSpeaker?: boolean
  number: number
}) => ({ isSpeaker, number, sessionId: id })

describe('the speaking wall', () => {
  const one = wall({ id: 'one', number: 1 })
  const two = wall({ id: 'two', isSpeaker: true, number: 2 })
  const three = wall({ id: 'three', number: 3 })

  it('[speaker] is the wall the host picked while it is there', () => {
    expect(
      speakingWallOf({
        choice: { kind: 'wall', wallId: 'three' },
        walls: [one, two, three]
      })
    ).toBe(three)
  })

  it('[speaker] stays with the wall already sounding when the pick is gone', () => {
    expect(
      speakingWallOf({
        choice: { kind: 'wall', wallId: 'gone' },
        walls: [one, two, three]
      })
    ).toBe(two)
  })

  it('[speaker] falls to the first wall when none is sounding', () => {
    expect(speakingWallOf({ choice: null, walls: [one, three] })).toBe(one)
  })

  it('[speaker] is no wall when the host picked the console', () => {
    expect(
      speakingWallOf({ choice: { kind: 'console' }, walls: [one, two] })
    ).toBeNull()
  })

  it('[speaker] is no wall when there is none', () => {
    expect(speakingWallOf({ choice: null, walls: [] })).toBeNull()
  })
})

describe('a wall number', () => {
  it('[speaker] starts at one', () => {
    expect(freeWallNumber([])).toBe(1)
  })

  it('[speaker] fills the lowest gap a wall that left made', () => {
    expect(freeWallNumber([{ number: 1 }, { number: 3 }])).toBe(2)
  })
})
