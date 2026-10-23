import { describe, expect, it } from 'vitest'

import { DEFAULT_GAME_SETTINGS } from '@melee/protocol/game'
import type { RoomSettings } from '@melee/protocol/room'

import {
  comingRounds,
  dealtOrder,
  orderWithEntryNext,
  scheduledEntryAt
} from './running-order'

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

  it('[running-order] closes up on the next row when the round’s row is a hole', () => {
    expect(drawnAt({ order: [0, null, 3, 1], roundAt: 1 })).toBe(3)
  })

  it('[running-order] draws a round with no row left among the entries serving their own content', () => {
    for (const roll of ROLLS) {
      expect([0, 2]).toContain(drawnAt({ order: [null], roll, roundAt: 0 }))
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
})

describe('dealtOrder', () => {
  const dealt = ({
    drawnAt = null,
    order = [],
    played = lineUp.map(() => 0),
    roll,
    upcoming = 0
  }: {
    drawnAt?: number | null
    order?: RoomSettings['runningOrder']
    played?: readonly number[]
    roll: number
    upcoming?: number
  }) =>
    dealtOrder({
      drawnAt,
      lineUp,
      order,
      played,
      random: () => roll,
      upcoming
    })

  it('[running-order] deals one row per entry, the next one first', () => {
    for (const roll of ROLLS) {
      const order = dealt({ drawnAt: 2, roll })

      expect(order[0]).toBe(2)
      expect(order.toSorted()).toEqual([0, 1, 2, 3])
    }
  })

  it('[running-order] keeps the host’s rows in order, closes the holes and adds the entries owed', () => {
    for (const roll of ROLLS) {
      const order = dealt({ drawnAt: 2, order: [2, null, 1, null], roll })

      expect(order.slice(0, 2)).toEqual([2, 1])
      expect(order.slice(2).toSorted()).toEqual([0, 3])
    }
  })

  it('[running-order] drops a second row for one entry', () => {
    expect(dealt({ drawnAt: 0, order: [0, 2, 0, 2, 1], roll: 0 })).toEqual([
      0, 2, 1, 3
    ])
  })

  it('[running-order] drops the row of an entry the host brought once it is played', () => {
    for (const roll of ROLLS) {
      const order = dealt({
        order: [1, 1, 0],
        played: [0, 1, 0, 0],
        roll,
        upcoming: 1
      })

      expect(order.slice(0, 2)).toEqual([1, 0])
      expect(order.slice(2).toSorted()).toEqual([2, 3])
    }
  })

  it('[running-order] gives no new row to an entry already played', () => {
    expect(
      dealt({ order: [0], played: [1, 0, 0, 0], roll: 0, upcoming: 1 })
        .slice(1)
        .toSorted()
    ).toEqual([1, 2, 3])
    expect(
      dealt({ order: [0, 1, 2, 3], played: [1, 1, 1, 1], roll: 0, upcoming: 4 })
    ).toEqual([0, 1, 2, 3])
  })

  it('[running-order] holds nothing for a single entry', () => {
    expect(
      dealtOrder({
        drawnAt: 0,
        lineUp: [DEFAULT_GAME_SETTINGS.quiz],
        order: [0, 0],
        played: [0],
        random: () => 0,
        upcoming: 0
      })
    ).toEqual([])
  })
})

describe('comingRounds', () => {
  it('[running-order] starts on the next round’s entry whatever its row says', () => {
    expect(
      comingRounds({
        drawnAt: 3,
        order: [null, 0, 1, 2],
        roundCount: 4,
        upcoming: 1
      }).map((round) => round.at)
    ).toEqual([3, 1, 2])
  })

  it('[running-order] marks the rows past the count', () => {
    expect(
      comingRounds({ drawnAt: 0, order: [0, 1, 3], roundCount: 2, upcoming: 0 })
    ).toEqual([
      { at: 0, isPastTheEnd: false, roundAt: 0 },
      { at: 1, isPastTheEnd: false, roundAt: 1 },
      { at: 3, isPastTheEnd: true, roundAt: 2 }
    ])
  })
})

describe('orderWithEntryNext', () => {
  it('[running-order] swaps the entry put first with the one that was there', () => {
    expect(
      orderWithEntryNext({ at: 2, order: [0, 1, 2, null], upcoming: 1 })
    ).toEqual([0, 2, 1, null])
  })

  it('[running-order] gives the displaced entry the first chance round when the other had no row', () => {
    expect(
      orderWithEntryNext({ at: 3, order: [0, 1, 2, null], upcoming: 1 })
    ).toEqual([0, 3, 2, 1])
  })
})
