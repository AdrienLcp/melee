import { describe, expect, it } from 'vitest'

import { isBrowserNotice } from './browser-notice'

describe('browser notice', () => {
  it('[reports] takes the resize loop notice every engine raises for a notice', () => {
    expect([
      isBrowserNotice(
        'ResizeObserver loop completed with undelivered notifications.'
      ),
      isBrowserNotice('ResizeObserver loop limit exceeded'),
      isBrowserNotice(
        'Uncaught ResizeObserver loop completed with undelivered notifications.'
      )
    ]).toEqual([true, true, true])
  })

  it('[reports] keeps reporting an Error that says the same words', () => {
    expect(
      isBrowserNotice(
        new Error(
          'ResizeObserver loop completed with undelivered notifications.'
        )
      )
    ).toBe(false)
  })

  it('[reports] keeps reporting any other bare message', () => {
    expect([
      isBrowserNotice('Script error.'),
      isBrowserNotice('undefined is not a function'),
      isBrowserNotice('A ResizeObserver loop completed elsewhere')
    ]).toEqual([false, false, false])
  })
})
