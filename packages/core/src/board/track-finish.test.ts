import { describe, expect, it } from 'vitest'

import { DEFAULT_TRACK_SETTINGS } from '@melee/protocol/board'

import { isTrackFinished } from './track-finish'

const LENGTH = DEFAULT_TRACK_SETTINGS.length

describe('isTrackFinished', () => {
  it('[board] ends on a seat’s pawn at the last case, in a room with no team', () => {
    expect(
      isTrackFinished({
        board: DEFAULT_TRACK_SETTINGS,
        pawns: [
          { board: { case: 4, move: 0 } },
          { board: { case: LENGTH, move: 2 } }
        ]
      })
    ).toBe(true)
  })

  it('[board] goes on while every pawn is short of the last case', () => {
    expect(
      isTrackFinished({
        board: DEFAULT_TRACK_SETTINGS,
        pawns: [{ board: { case: LENGTH - 1, move: 0 } }, { board: null }]
      })
    ).toBe(false)
  })

  it('[board] never ends a room whose board is off', () => {
    expect(
      isTrackFinished({
        board: { kind: 'off' },
        pawns: [{ board: { case: LENGTH, move: 0 } }]
      })
    ).toBe(false)
  })
})
