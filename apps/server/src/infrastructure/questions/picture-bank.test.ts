import { readdirSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import pictureBank from './picture-bank.json' with { type: 'json' }
import priceBank from './price-bank.json' with { type: 'json' }
import quantityBank from './quantity-bank.json' with { type: 'json' }

const SERVED_PICTURES = join(
  import.meta.dirname,
  '..',
  '..',
  '..',
  '..',
  'game',
  'public',
  'pictures'
)

describe('the picture bank', () => {
  it('[pictures] names a file the app serves for every row', () => {
    const served = new Set(readdirSync(SERVED_PICTURES))
    const missing = pictureBank.filter(({ file }) => !served.has(file))

    expect(missing.map(({ entity }) => entity)).toEqual([])
  })

  it('[pictures] serves no file that no row shows', () => {
    const shown = new Set(pictureBank.map(({ file }) => file))
    const orphans = readdirSync(SERVED_PICTURES).filter(
      (file) => !shown.has(file)
    )

    expect(orphans).toEqual([])
  })

  it('[pictures] pictures only rows the banks deal', () => {
    const banked = new Set([
      ...quantityBank.map(({ entity }) => entity),
      ...priceBank.map(({ entity }) => entity)
    ])
    const strays = pictureBank.filter(({ entity }) => !banked.has(entity))

    expect(strays.map(({ entity }) => entity)).toEqual([])
  })

  it('[pictures] ships every picture at most 640 pixels on its long side', () => {
    const oversized = pictureBank.filter(
      ({ height, width }) => Math.max(height, width) > 640
    )

    expect(oversized.map(({ entity }) => entity)).toEqual([])
  })
})
