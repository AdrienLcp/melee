import { describe, expect, it } from 'vitest'

import type { PairPicture } from '@melee/protocol/higher-lower'

import { bankedPairOf } from './higher-lower-round'

const TOWER: PairPicture = {
  file: 'b9fa639ce03e.webp',
  height: 640,
  kind: 'photo',
  width: 346
}

const sideOf = (picture: PairPicture | null) => ({
  family: 'height.building' as const,
  names: { en: 'Tower', fr: 'Tower', pt: 'Tower' },
  picture,
  value: 300
})

describe('a banked pair', () => {
  it('[higherlower] is pictured on both sides when both are', () => {
    expect(
      bankedPairOf({ left: sideOf(TOWER), right: sideOf(TOWER) }).pictures
    ).toEqual({ left: TOWER, right: TOWER })
  })

  it('[higherlower] is pictured on neither side when one is bare', () => {
    expect(
      bankedPairOf({ left: sideOf(TOWER), right: sideOf(null) }).pictures
    ).toBeNull()
    expect(
      bankedPairOf({ left: sideOf(null), right: sideOf(TOWER) }).pictures
    ).toBeNull()
  })
})
