import { describe, expect, it } from 'vitest'

import { trackLeadOf } from './track-lead'

const pawnAt = (id: string, at: number) => ({ board: { case: at }, id })

describe('trackLeadOf', () => {
  it('[board] measures a pawn in front against the best of the others', () => {
    expect(
      trackLeadOf({
        pawns: [pawnAt('owls', 12), pawnAt('foxes', 9), pawnAt('otters', 4)],
        yours: pawnAt('owls', 12)
      })
    ).toEqual({ gap: 3, kind: 'ahead' })
  })

  it('[board] calls a shared front level rather than a lead of nothing', () => {
    expect(
      trackLeadOf({
        pawns: [pawnAt('owls', 9), pawnAt('foxes', 9)],
        yours: pawnAt('owls', 9)
      })
    ).toEqual({ kind: 'level' })
  })

  it('[board] names whoever is in front of a pawn behind, and the gap', () => {
    expect(
      trackLeadOf({
        pawns: [pawnAt('owls', 5), pawnAt('foxes', 9), pawnAt('otters', 14)],
        yours: pawnAt('owls', 5)
      })
    ).toEqual({ gap: 9, kind: 'behind', leader: pawnAt('otters', 14) })
  })

  it('[board] says nothing while no other pawn is on the track', () => {
    expect(
      trackLeadOf({ pawns: [pawnAt('owls', 5)], yours: pawnAt('owls', 5) })
    ).toBeNull()
  })
})
