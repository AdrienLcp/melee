import { describe, expect, it } from 'vitest'

import { DEFAULT_GAME_SETTINGS } from '@melee/protocol/game'

import { eveningCarriedBy, eveningFragmentOf } from './evening-link'
import type { SavedEvening } from './saved-evening'

const EVENING: SavedEvening = {
  decks: [],
  lineUp: [DEFAULT_GAME_SETTINGS.quiz, 'buzzer', DEFAULT_GAME_SETTINGS.atlas],
  lineUpDeals: ['both', 'row', 'chance'],
  name: 'Soirée « été » — 🎉',
  roundCount: 12,
  runningOrder: [1, 0]
}

describe('evening link', () => {
  it('[evening-link] reads back the evening it wrote, accents and emoji kept', async () => {
    const fragment = await eveningFragmentOf(EVENING)

    expect(await eveningCarriedBy(fragment)).toEqual(EVENING)
  })

  it('[evening-link] reads a fragment handed over with its hash', async () => {
    const fragment = await eveningFragmentOf(EVENING)

    expect(await eveningCarriedBy(`#${fragment}`)).toEqual(EVENING)
  })

  it('[evening-link] writes nothing a URL fragment would have to escape', async () => {
    expect(await eveningFragmentOf(EVENING)).toMatch(/^1\.[\w-]+$/)
  })

  it('[evening-link] reads a payload of another version as nothing', async () => {
    const [, payload] = (await eveningFragmentOf(EVENING)).split('.')

    expect(await eveningCarriedBy(`2.${payload}`)).toBeNull()
  })

  it('[evening-link] reads a truncated link as nothing', async () => {
    const fragment = await eveningFragmentOf(EVENING)

    expect(await eveningCarriedBy(fragment.slice(0, -12))).toBeNull()
  })

  it('[evening-link] reads text that is no payload at all as nothing', async () => {
    expect(await eveningCarriedBy('1.not*base64')).toBeNull()
    expect(await eveningCarriedBy('')).toBeNull()
  })
})
