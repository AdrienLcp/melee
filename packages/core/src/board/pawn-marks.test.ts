import { describe, expect, it } from 'vitest'

import { pawnMarksOf } from './pawn-marks'

/** One seat per name, each in a colour of its own. */
const seatsNamed = (nicknames: readonly string[]) =>
  nicknames.map((nickname, seat) => ({
    colour: seat + 1,
    id: `seat-${seat}`,
    nickname
  }))

/** Two seats standing in one colour. */
const sharingAColour = (first: string, second: string) => [
  { colour: 4, id: 'seat-0', nickname: first },
  { colour: 4, id: 'seat-1', nickname: second }
]

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
    const marks = pawnMarksOf(sharingAColour('Marie', 'Michel'))

    expect(marks.get('seat-0')).toBe('Ma')
    expect(marks.get('seat-1')).toBe('Mi')
  })

  it('[pawn] counts two seats of one colour whose first two letters match too', () => {
    const marks = pawnMarksOf(sharingAColour('Marie', 'Mathis'))

    expect(marks.get('seat-0')).toBe('M1')
    expect(marks.get('seat-1')).toBe('M2')
  })

  it('[pawn] takes a whole emoji as an initial', () => {
    expect(pawnMarksOf(seatsNamed(['👩‍🚀 Ada'])).get('seat-0')).toBe('👩‍🚀')
  })
})
