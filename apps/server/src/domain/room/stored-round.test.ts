import { describe, expect, it } from 'vitest'

import { withHoldFields } from './stored-round'

describe('a round stored before the ready hold', () => {
  it('[stored] reads as counting the setting’s hold, with nothing waived', () => {
    expect(withHoldFields({ advancesAt: 42_000 })).toEqual({
      advancesAt: 42_000,
      isHoldWaived: false,
      isReadyHold: false,
      settingHoldEndsAt: 42_000
    })
  })

  it('[stored] keeps the fields a current round already carries', () => {
    const current = {
      advancesAt: 5_000,
      isHoldWaived: false,
      isReadyHold: true,
      settingHoldEndsAt: 20_000
    }

    expect(withHoldFields(current)).toEqual(current)
  })
})
