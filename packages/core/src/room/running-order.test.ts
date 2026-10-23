import { describe, expect, it } from 'vitest'

import { DEFAULT_GAME_SETTINGS } from '@melee/protocol/game'
import type { RoomSettings } from '@melee/protocol/room'

import { scheduledEntryAt } from './running-order'

const lineUp = [
  DEFAULT_GAME_SETTINGS.quiz,
  DEFAULT_GAME_SETTINGS.challenge,
  DEFAULT_GAME_SETTINGS.blindtest,
  DEFAULT_GAME_SETTINGS.slate
]

const ROLLS = [0, 0.34, 0.5, 0.67, 0.99]

const drawnAt = ({
  lastAt = null,
  order,
  played = lineUp.map(() => 0),
  roll = 0,
  roundAt
}: {
  lastAt?: number | null
  order: RoomSettings['runningOrder']
  played?: readonly number[]
  roll?: number
  roundAt: number
}) =>
  scheduledEntryAt({
    lastAt,
    lineUp,
    order,
    played,
    random: () => roll,
    roundAt,
    roundsLeft: null
  })

describe('scheduledEntryAt', () => {
  it('[running-order] plays the entry the host put on the round', () => {
    expect(drawnAt({ order: [3, 1, 0], roundAt: 0 })).toBe(3)
    expect(drawnAt({ order: [3, 1, 0], roundAt: 1 })).toBe(1)
  })

  it('[running-order] draws a chance round among the entries serving their own content', () => {
    for (const roll of ROLLS) {
      expect([0, 2]).toContain(
        drawnAt({ order: [null, 1, 3], roll, roundAt: 0 })
      )
    }
  })

  it('[running-order] draws every round past the order’s end', () => {
    for (const roll of ROLLS) {
      expect([0, 2]).toContain(
        drawnAt({
          lastAt: 3,
          order: [1, 3],
          played: [0, 1, 0, 1],
          roll,
          roundAt: 2
        })
      )
    }
  })

  it('[running-order] leaves a row whose entry is played out to chance', () => {
    expect(
      drawnAt({ order: [1, 1], played: [0, 1, 0, 0], roundAt: 1 })
    ).not.toBe(1)
  })

  it('[running-order] leaves a row whose entry is gone to chance', () => {
    expect(drawnAt({ order: [7], roundAt: 0 })).not.toBeNull()
  })

  it('[running-order] draws as before with no order', () => {
    for (const roll of ROLLS) {
      expect(drawnAt({ lastAt: 0, order: null, roll, roundAt: 1 })).not.toBe(0)
    }
  })
})
