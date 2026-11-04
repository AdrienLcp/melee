import { describe, expect, it } from 'vitest'

import type { Participant } from './room'
import { withSeatPieces } from './stored-seats'

const seat = (id: string): Omit<Participant, 'colour' | 'head'> => ({
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

describe('seats stored before a seat held its own piece', () => {
  it('[stored] paints each seat the colour its place in the roster gave it', () => {
    const players = withSeatPieces(
      new Map([
        ['anna', seat('anna')],
        ['ben', seat('ben')]
      ])
    )

    expect([...players.values()].map(({ colour }) => colour)).toEqual([1, 2])
  })

  it('[stored] keeps a colour already stored', () => {
    const players = withSeatPieces(
      new Map([['anna', { ...seat('anna'), colour: 7 }]])
    )

    expect(players.get('anna')?.colour).toBe(7)
  })

  it('[stored] stands a seat stored before heads in a round head', () => {
    const players = withSeatPieces(
      new Map([['anna', { ...seat('anna'), colour: 7 }]])
    )

    expect(players.get('anna')?.head).toBe('round')
  })

  it('[stored] keeps a head already stored', () => {
    const players = withSeatPieces(
      new Map([
        ['anna', { ...seat('anna'), colour: 7, head: 'point' as const }]
      ])
    )

    expect(players.get('anna')?.head).toBe('point')
  })

  it('[stored] keeps two seats an older rule left in one piece', () => {
    const players = withSeatPieces(
      new Map([
        ['anna', { ...seat('anna'), colour: 3 }],
        ['ben', { ...seat('ben'), colour: 3 }]
      ])
    )

    expect(
      [...players.values()].map(({ colour, head }) => [colour, head])
    ).toEqual([
      [3, 'round'],
      [3, 'round']
    ])
  })
})
