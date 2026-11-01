import { describe, expect, it } from 'vitest'

import { PAWN_COLOUR_COUNT } from '@melee/protocol/team'

import {
  isPawnColourFree,
  pawnColourForArrival,
  pawnColourOf
} from './pawn-colour'

const EVERY_COLOUR = Array.from(
  { length: PAWN_COLOUR_COUNT },
  (_, index) => index + 1
)

describe('pawn colours', () => {
  it('[pawn] refuses a colour another seat holds while one is still free', () => {
    expect(isPawnColourFree({ colour: 3, heldByOthers: [1, 3] })).toBe(false)
    expect(isPawnColourFree({ colour: 2, heldByOthers: [1, 3] })).toBe(true)
  })

  it('[pawn] lets a seat share a colour once every colour is held', () => {
    expect(isPawnColourFree({ colour: 3, heldByOthers: EVERY_COLOUR })).toBe(
      true
    )
  })

  it('[pawn] seats an arrival in the colour its screen asks for when it is free', () => {
    expect(pawnColourForArrival({ asked: 7, heldByOthers: [1, 2] })).toBe(7)
  })

  it('[pawn] seats an arrival asking for a held colour in the first free one', () => {
    expect(pawnColourForArrival({ asked: 1, heldByOthers: [1, 2, 4] })).toBe(3)
    expect(pawnColourForArrival({ asked: null, heldByOthers: [1] })).toBe(2)
  })

  it('[pawn] spreads the repeats of a full table over the colours held least', () => {
    const heldTwiceButFive = EVERY_COLOUR.flatMap((colour) =>
      colour === 5 ? [colour] : [colour, colour]
    )

    expect(
      pawnColourForArrival({ asked: null, heldByOthers: heldTwiceButFive })
    ).toBe(5)
  })

  it("[pawn] draws a seat in its team's colour, and in its own without one", () => {
    const teams = [{ colour: 9, seatIds: ['anna'] }]

    expect(pawnColourOf({ player: { colour: 2, id: 'anna' }, teams })).toBe(9)
    expect(pawnColourOf({ player: { colour: 2, id: 'ben' }, teams })).toBe(2)
  })
})
