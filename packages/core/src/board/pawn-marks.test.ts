import { describe, expect, it } from 'vitest'

import { PAWN_COLOUR_COUNT } from '@melee/protocol/team'

import { pawnMarksOf, seatPawnColourOf } from './pawn-marks'

const seatsNamed = (nicknames: readonly string[]) =>
  nicknames.map((nickname, seat) => ({ id: `seat-${seat}`, nickname }))

/** Fills the roster so the next seat shares the first seat's colour. */
const fillers = (count: number): string[] =>
  Array.from({ length: count }, (_, index) => `${index}`)

describe('pawnMarksOf', () => {
  it('[pawn] marks a pawn with its initial, upper-cased', () => {
    expect([...pawnMarksOf(seatsNamed(['anna', 'Ben'])).values()]).toEqual([
      'A',
      'B'
    ])
  })

  it('[pawn] leaves two seats one initial apart when their colours differ', () => {
    const marks = pawnMarksOf(seatsNamed(['Marie', 'Max']))

    expect([...marks.values()]).toEqual(['M', 'M'])
  })

  it('[pawn] spells two letters where a pawn of the same colour has the same initial', () => {
    const marks = pawnMarksOf(
      seatsNamed(['Marie', ...fillers(PAWN_COLOUR_COUNT - 1), 'Michel'])
    )

    expect(marks.get('seat-0')).toBe('Ma')
    expect(marks.get(`seat-${PAWN_COLOUR_COUNT}`)).toBe('Mi')
    expect(seatPawnColourOf(0)).toBe(seatPawnColourOf(PAWN_COLOUR_COUNT))
  })

  it('[pawn] counts two seats of one colour whose first two letters match too', () => {
    const marks = pawnMarksOf(
      seatsNamed(['Marie', ...fillers(PAWN_COLOUR_COUNT - 1), 'Mathis'])
    )

    expect(marks.get('seat-0')).toBe('M1')
    expect(marks.get(`seat-${PAWN_COLOUR_COUNT}`)).toBe('M2')
  })

  it('[pawn] takes a whole emoji as an initial', () => {
    expect(pawnMarksOf(seatsNamed(['👩‍🚀 Ada'])).get('seat-0')).toBe('👩‍🚀')
  })
})
