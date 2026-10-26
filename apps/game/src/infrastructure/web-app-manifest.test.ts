import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const GAME_ROOT = resolve(import.meta.dirname, '../..')
const PUBLIC_DIRECTORY = resolve(GAME_ROOT, 'public')
const INDEX_HTML = readFileSync(resolve(GAME_ROOT, 'index.html'), 'utf8')

type ManifestIcon = { purpose: string; sizes: string; src: string }

const manifest: {
  background_color: string
  display: string
  icons: ManifestIcon[]
  start_url: string
  theme_color: string
} = JSON.parse(
  readFileSync(resolve(PUBLIC_DIRECTORY, 'manifest.webmanifest'), 'utf8')
)

const nightBoard = (): string | undefined =>
  /<meta content="(#[0-9a-f]{6})" data-scheme="dark"/.exec(INDEX_HTML)?.[1]

/** A PNG's IHDR chunk holds its width then its height, big-endian, from byte 16. */
const pngSize = (bytes: Buffer): string =>
  `${bytes.readUInt32BE(16)}x${bytes.readUInt32BE(20)}`

describe('web app manifest', () => {
  it('[pwa] is linked from the document every page is written from', () => {
    expect(INDEX_HTML).toContain('href="/manifest.webmanifest" rel="manifest"')
  })

  it('[pwa] opens standalone at the front door', () => {
    expect(manifest).toMatchObject({ display: 'standalone', start_url: '/' })
  })

  it('[pwa] offers an icon for each purpose an install needs', () => {
    expect(manifest.icons.map((icon) => icon.purpose)).toEqual(
      expect.arrayContaining(['any', 'maskable'])
    )
  })

  it('[pwa] paints the splash screen in the night board index.html announces', () => {
    expect(manifest.background_color).toBe(nightBoard())
    expect(manifest.theme_color).toBe(nightBoard())
  })

  it.each(manifest.icons)(
    '[pwa] ships $src at the $sizes it announces',
    (icon) => {
      const bytes = readFileSync(resolve(PUBLIC_DIRECTORY, `.${icon.src}`))

      expect(pngSize(bytes)).toBe(icon.sizes)
    }
  )
})
