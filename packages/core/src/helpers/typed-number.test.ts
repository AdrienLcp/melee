import { describe, expect, it } from 'vitest'

import { retypedNumber } from './typed-number'

const NARROW_NO_BREAK_SPACE = ' '

const typed = ({
  caret,
  locale = 'fr-FR',
  previous = '',
  text
}: {
  caret?: number
  locale?: string
  previous?: string
  text: string
}) =>
  retypedNumber({
    caret: caret ?? text.length,
    locale,
    maximumFractionDigits: 2,
    maxValue: 1e15,
    previous,
    text
  })

describe('retypedNumber', () => {
  it('[typed-number] groups the digits the French way while they are typed', () => {
    expect(typed({ previous: '10 000', text: '10 0000' })).toEqual({
      caret: 7,
      text: `100${NARROW_NO_BREAK_SPACE}000`,
      value: 100_000
    })
  })

  it('[typed-number] groups the English way with commas', () => {
    expect(typed({ locale: 'en-US', text: '1234567' })).toEqual({
      caret: 9,
      text: '1,234,567',
      value: 1_234_567
    })
  })

  it('[typed-number] reads a pasted number whatever spaces group it', () => {
    expect(typed({ text: '100 000' })?.value).toBe(100_000)
    expect(typed({ text: `2${NARROW_NO_BREAK_SPACE}500` })?.value).toBe(2500)
    expect(typed({ locale: 'en-US', text: '1,000' })?.value).toBe(1000)
  })

  it('[typed-number] reads the dot a numeric keyboard types as the French decimal comma', () => {
    expect(typed({ text: '1.5' })).toEqual({
      caret: 3,
      text: '1,5',
      value: 1.5
    })
  })

  it('[typed-number] keeps a decimal mark typed last, and opens a bare one on a zero', () => {
    expect(typed({ text: '12,' })).toEqual({ caret: 3, text: '12,', value: 12 })
    expect(typed({ text: ',' })).toEqual({ caret: 2, text: '0,', value: 0 })
  })

  it('[typed-number] stops at two decimals and drops leading zeros', () => {
    expect(typed({ text: '3,14159' })?.text).toBe('3,14')
    expect(typed({ text: '007' })).toEqual({ caret: 1, text: '7', value: 7 })
  })

  it('[typed-number] keeps the caret after the digit it followed', () => {
    expect(
      typed({
        caret: 2,
        previous: `1${NARROW_NO_BREAK_SPACE}000`,
        text: `15${NARROW_NO_BREAK_SPACE}000`
      })
    ).toEqual({
      caret: 2,
      text: `15${NARROW_NO_BREAK_SPACE}000`,
      value: 15_000
    })
    expect(typed({ caret: 1, previous: '999', text: '9999' })).toEqual({
      caret: 1,
      text: `9${NARROW_NO_BREAK_SPACE}999`,
      value: 9999
    })
  })

  it('[typed-number] deletes the digit before a group separator deleted on its own', () => {
    expect(
      typed({
        caret: 3,
        previous: `100${NARROW_NO_BREAK_SPACE}000`,
        text: '100000'
      })
    ).toEqual({
      caret: 2,
      text: `10${NARROW_NO_BREAK_SPACE}000`,
      value: 10_000
    })
  })

  it('[typed-number] reads an emptied field as no number', () => {
    expect(typed({ previous: '5', text: '' })).toEqual({
      caret: 0,
      text: '',
      value: Number.NaN
    })
  })

  it('[typed-number] refuses a digit past the largest number', () => {
    expect(typed({ text: '1000000000000001' })).toBeNull()
  })
})
