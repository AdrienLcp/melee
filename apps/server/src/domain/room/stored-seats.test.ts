import { describe, expect, it } from 'vitest'

import type { Participant } from './room'
import { withSeatColours } from './stored-seats'

const seat = (id: string): Omit<Participant, 'colour'> => ({
  bankedCase: 0,
  disconnectedAt: null,
  id,
  isConnected: true,
  isReady: false,
  nickname: id,
  score: 0,
  sessionId: `session-${id}`,
  teamId: null
})

describe('seats stored before a seat held its own colour', () => {
  it('[stored] paints each seat the colour its place in the roster gave it', () => {
    const players = withSeatColours(
      new Map([
        ['anna', seat('anna')],
        ['ben', seat('ben')]
      ])
    )

    expect([...players.values()].map(({ colour }) => colour)).toEqual([1, 2])
  })

  it('[stored] keeps a colour already stored', () => {
    const players = withSeatColours(
      new Map([['anna', { ...seat('anna'), colour: 7 }]])
    )

    expect(players.get('anna')?.colour).toBe(7)
  })
})
