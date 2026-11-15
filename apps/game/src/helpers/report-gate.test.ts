import { describe, expect, it } from 'vitest'

import { createReportGate } from './report-gate'

const fault = (message: string) => ({
  message,
  name: 'TypeError',
  where: 'at x'
})

describe('report gate', () => {
  it('[reports] lets one fault through once', () => {
    const passes = createReportGate()

    expect([
      passes(fault('a')),
      passes(fault('a')),
      passes(fault('b'))
    ]).toEqual([true, false, true])
  })

  it('[reports] stops at its limit, whatever the faults', () => {
    const passes = createReportGate(2)

    expect(['a', 'b', 'c'].map((message) => passes(fault(message)))).toEqual([
      true,
      true,
      false
    ])
  })
})
