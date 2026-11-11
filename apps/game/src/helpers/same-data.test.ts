import { describe, expect, it } from 'vitest'

import { isSameData } from './same-data'

const seats = [
  { colour: 1, head: 'round', id: 'p1', nickname: 'Philippine', score: 0 },
  { colour: 2, head: 'square', id: 'p2', nickname: 'Octave', score: 0 }
]

const decodedFrame = <Data>(data: Data): Data =>
  JSON.parse(JSON.stringify(data))

describe('isSameData', () => {
  it('[report] reads two frames carrying the same seats as the same', () => {
    const kept = decodedFrame(seats)
    const next = decodedFrame(seats)

    expect(kept).not.toBe(next)
    expect(isSameData({ kept, next })).toBe(true)
  })

  it('[report] tells a seat that changed apart', () => {
    const recoloured = seats.map((seat) =>
      seat.id === 'p2' ? { ...seat, colour: 3 } : seat
    )

    expect(isSameData({ kept: seats, next: recoloured })).toBe(false)
    expect(isSameData({ kept: seats, next: null })).toBe(false)
  })
})
