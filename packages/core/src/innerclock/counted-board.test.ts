import { describe, expect, it } from 'vitest'

import { buildCountedBoard } from './counted-board'

const STARTS_AT = 1_700_000_000_000

describe('the board a count leaves behind', () => {
  it('[innerclock] ranks by the smallest gap, early or late', () => {
    const board = buildCountedBoard({
      openedWithPlayerIds: ['lea', 'marc', 'sam'],
      presses: [
        { atServerTime: STARTS_AT + 70_000, playerId: 'sam' },
        { atServerTime: STARTS_AT + 74_300, playerId: 'lea' },
        { atServerTime: STARTS_AT + 78_500, playerId: 'marc' }
      ],
      startsAt: STARTS_AT,
      targetSeconds: 77
    })

    expect(board).toEqual([
      { countedMs: 78_500, gapMs: 1_500, kind: 'counted', playerId: 'marc' },
      { countedMs: 74_300, gapMs: -2_700, kind: 'counted', playerId: 'lea' },
      { countedMs: 70_000, gapMs: -7_000, kind: 'counted', playerId: 'sam' }
    ])
  })

  it('[innerclock] names the seats that never pressed under the ones that did', () => {
    const board = buildCountedBoard({
      openedWithPlayerIds: ['lea', 'zoe'],
      presses: [{ atServerTime: STARTS_AT + 30_000, playerId: 'lea' }],
      startsAt: STARTS_AT,
      targetSeconds: 30
    })

    expect(board).toEqual([
      { countedMs: 30_000, gapMs: 0, kind: 'counted', playerId: 'lea' },
      { kind: 'silent', playerId: 'zoe' }
    ])
  })

  it('[innerclock] measures nothing for a round that never started', () => {
    expect(
      buildCountedBoard({
        openedWithPlayerIds: ['lea', 'zoe'],
        presses: [{ atServerTime: STARTS_AT + 30_000, playerId: 'lea' }],
        startsAt: null,
        targetSeconds: 30
      })
    ).toEqual([])
  })
})
