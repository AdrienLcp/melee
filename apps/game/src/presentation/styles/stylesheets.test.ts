import { globSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { REACT_ARIA_TOKENS } from '@adrienlcp/react-aria'
import {
  findFallbackFailures,
  findTokenFailures,
  findTypeLiterals,
  findUnitFailures,
  findUnnamedValues,
  webFontFamilies
} from '@adrienlcp/styles/audit'
import { describe, expect, it } from 'vitest'

const SOURCE_ROOT = fileURLToPath(new URL('../..', import.meta.url))
const STYLESHEETS = globSync('**/*.{sass,css}', { cwd: SOURCE_ROOT })
const SOURCES = globSync('**/*.{sass,css,ts,tsx}', { cwd: SOURCE_ROOT }).map(
  (path) => readFileSync(join(SOURCE_ROOT, path), 'utf8')
)
const TEXT_VOICE_SOURCES = ['_typography.sass', '_text-box.sass']
const WEB_FONTS = webFontFamilies(
  STYLESHEETS.map((path) => readFileSync(join(SOURCE_ROOT, path), 'utf8'))
)

describe.each(STYLESHEETS)('%s', (path) => {
  const stylesheet = readFileSync(join(SOURCE_ROOT, path), 'utf8')

  it('[units] sizes text, spacing and boxes in rem', () => {
    expect(findUnitFailures(stylesheet)).toEqual([])
  })

  it.skipIf(TEXT_VOICE_SOURCES.some((source) => path.endsWith(source)))(
    '[type] takes its text voice from the typography mixins',
    () => {
      expect(findTypeLiterals(stylesheet)).toEqual([])
    }
  )

  it('[tokens] takes its radii and durations from tokens', () => {
    expect(findUnnamedValues(stylesheet)).toEqual([])
  })

  it('[fonts] names the fallback face after every web font in a font token', () => {
    expect(findFallbackFailures(stylesheet, WEB_FONTS)).toEqual([])
  })
})

it('[tokens] reads only custom properties that exist, under their one shared name', () => {
  expect(findTokenFailures(SOURCES, { provided: REACT_ARIA_TOKENS })).toEqual(
    []
  )
})
