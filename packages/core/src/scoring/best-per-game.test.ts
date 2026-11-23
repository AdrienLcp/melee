import { describe, expect, it } from 'vitest'

import type { PlayedGame } from '@melee/protocol/played-game'

import { bestPerGame } from './best-per-game'

const quiz = (totals: PlayedGame['totals'], roundCount = 4): PlayedGame => ({
  kind: 'quiz',
  lineUpAt: 0,
  roundCount,
  totals
})

describe('bestPerGame', () => {
  it('[best-per-game] crowns the highest total and averages it over every round the room played', () => {
    const [best] = bestPerGame({
      games: [
        quiz([
          { playerId: 'ada', points: 180_000 },
          { playerId: 'bo', points: 240_000 }
        ])
      ],
      seatIds: ['ada', 'bo']
    })

    expect(best?.bestIds).toEqual(['bo'])
    expect(best?.average).toBe(60_000)
  })

  it('[best-per-game] does not crown a latecomer on the one round it played', () => {
    const [best] = bestPerGame({
      games: [
        quiz([
          { playerId: 'ada', points: 200_000 },
          { playerId: 'late', points: 100_000 }
        ])
      ],
      seatIds: ['ada', 'late']
    })

    expect(best?.bestIds).toEqual(['ada'])
  })

  it('[best-per-game] crowns every seat sharing the best total', () => {
    const [best] = bestPerGame({
      games: [
        quiz([
          { playerId: 'ada', points: 90_000 },
          { playerId: 'bo', points: 90_000 },
          { playerId: 'cy', points: 10_000 }
        ])
      ],
      seatIds: ['ada', 'bo', 'cy']
    })

    expect(best?.bestIds).toEqual(['ada', 'bo'])
  })

  it('[best-per-game] crowns nobody on a game that paid nobody', () => {
    const [best] = bestPerGame({ games: [quiz([])], seatIds: ['ada'] })

    expect(best?.bestIds).toEqual([])
    expect(best?.average).toBe(0)
  })

  it('[best-per-game] passes over a seat that has left the table', () => {
    const [best] = bestPerGame({
      games: [
        quiz([
          { playerId: 'gone', points: 300_000 },
          { playerId: 'ada', points: 100_000 }
        ])
      ],
      seatIds: ['ada']
    })

    expect(best?.bestIds).toEqual(['ada'])
  })
})
