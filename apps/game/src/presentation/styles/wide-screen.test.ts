import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

import { expect, it } from 'vitest'

import { DESK_SCREEN_QUERY, WIDE_SCREEN_QUERY } from './wide-screen'

const readWideScreen = (path: string): string | undefined =>
  /^\$wide-screen: ([\d.]+rem)/m.exec(readFileSync(path, 'utf8'))?.[1]

it('[layout] asks for the same width as the stylesheets’ wide screen', () => {
  const stylesPackage = dirname(
    createRequire(import.meta.url).resolve('@adrienlcp/styles/package.json')
  )
  const wideScreen =
    readWideScreen(join(import.meta.dirname, '_layout.sass')) ??
    readWideScreen(join(stylesPackage, 'src', '_breakpoints.sass'))

  expect(WIDE_SCREEN_QUERY).toBe(`(width >= ${wideScreen})`)
})

it('[layout] asks for the same width as the stylesheets’ desk screen', () => {
  const deskScreen = /^\$desk-screen: ([\d.]+rem)/m.exec(
    readFileSync(join(import.meta.dirname, '_layout.sass'), 'utf8')
  )?.[1]

  expect(DESK_SCREEN_QUERY).toBe(`(width >= ${deskScreen})`)
})
