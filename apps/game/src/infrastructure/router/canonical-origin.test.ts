import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { CANONICAL_ORIGIN } from './navigation'

const INDEX_HTML = readFileSync(
  resolve(import.meta.dirname, '../../../index.html'),
  'utf8'
)

describe('canonical origin', () => {
  it('[assistant] is the origin index.html names as canonical', () => {
    expect(INDEX_HTML).toContain(
      `<link href="${CANONICAL_ORIGIN}/" rel="canonical" />`
    )
  })
})
