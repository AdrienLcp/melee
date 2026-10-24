import { describe, expect, it } from 'vitest'

import { dealLine } from './deal-line'

const BANK = Array.from({ length: 10 }, (_, index) => ({ id: `line-${index}` }))

describe('dealing a ready-made challenge line', () => {
  it('[challenge] never deals a line the room has had', () => {
    const playedIds = new Set(
      BANK.filter(({ id }) => id !== 'line-3').map(({ id }) => id)
    )

    expect(dealLine({ lines: BANK, playedIds })?.id).toBe('line-3')
  })

  it('[challenge] deals nothing once the bank is spent', () => {
    expect(
      dealLine({ lines: BANK, playedIds: new Set(BANK.map(({ id }) => id)) })
    ).toBeNull()
  })
})
