import { describe, expect, it } from 'vitest'

import {
  HASHED_ASSET_CACHE_CONTROL,
  servedHashedAsset
} from '@/infrastructure/http/hashed-asset'

const STALE_CACHE_CONTROL = 'public, max-age=0, must-revalidate'

describe('servedHashedAsset', () => {
  it('[assets] answers 404 where the asset server fell back to the shell', () => {
    const shell = new Response('<!DOCTYPE html>', {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    })

    expect(servedHashedAsset(shell).status).toBe(404)
  })

  it('[assets] serves a stylesheet it holds with its body, cached for good', async () => {
    const stylesheet = new Response('a{}', {
      headers: {
        'Cache-Control': STALE_CACHE_CONTROL,
        'Content-Type': 'text/css'
      }
    })

    const served = servedHashedAsset(stylesheet)

    expect(served.status).toBe(200)
    expect(served.headers.get('Content-Type')).toBe('text/css')
    expect(served.headers.get('Cache-Control')).toBe(HASHED_ASSET_CACHE_CONTROL)
    expect(await served.text()).toBe('a{}')
  })

  it('[assets] keeps a revalidated chunk cached for good', () => {
    const notModified = new Response(null, {
      headers: { 'Cache-Control': STALE_CACHE_CONTROL },
      status: 304
    })

    expect(servedHashedAsset(notModified).headers.get('Cache-Control')).toBe(
      HASHED_ASSET_CACHE_CONTROL
    )
  })

  it('[assets] never caches a failure', () => {
    const failure = new Response('oops', {
      headers: { 'Content-Type': 'text/plain' },
      status: 500
    })

    expect(servedHashedAsset(failure).headers.get('Cache-Control')).toBeNull()
  })
})
