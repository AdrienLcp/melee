import { describe, expect, it } from 'vitest'

import { PT_DICTIONARY } from './dictionary-pt'
import { i18n } from './i18n'

type Branch = Record<string, unknown>

const isBranch = (value: unknown): value is Branch =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const pluralsIn = (
  branch: unknown,
  path: string[] = []
): { forms: Branch; key: string }[] => {
  if (Array.isArray(branch)) {
    const options: unknown = branch[1]
    const plural =
      isBranch(options) && isBranch(options.plural) ? options.plural : {}

    return Object.values(plural)
      .filter(isBranch)
      .map((forms) => ({ forms, key: path.join('.') }))
  }

  if (isBranch(branch)) {
    return Object.entries(branch).flatMap(([segment, child]) =>
      pluralsIn(child, [...path, segment])
    )
  }

  return []
}

describe('Portuguese counts', () => {
  it('[i18n] reads 0 as a plural, where the CLDR rule for pt reads it as one', async () => {
    const translate = await i18n.load('pt')

    expect(translate('admin.rooms.seats', { count: 0 })).toBe('0 lugares')
    expect(translate('admin.rooms.seats', { count: 1 })).toBe('1 lugar')
  })

  it('[i18n] gives every count that inflects a zero form of its own', () => {
    const missing = pluralsIn(PT_DICTIONARY)
      .filter(
        ({ forms }) => forms.one !== undefined && forms.one !== forms.other
      )
      .filter(({ forms }) => forms.zero === undefined)
      .map(({ key }) => key)

    expect(missing).toEqual([])
  })
})
