import { describe, expect, it } from 'vitest'

import { refuseShellForHashedAsset } from '@/infrastructure/http/hashed-asset'

describe('refuseShellForHashedAsset', () => {
  it('[assets] answers 404 where the asset server fell back to the shell', () => {
    const shell = new Response('<!DOCTYPE html>', {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    })

    expect(refuseShellForHashedAsset(shell).status).toBe(404)
  })

  it('[assets] passes a stylesheet it holds through untouched', () => {
    const stylesheet = new Response('a{}', {
      headers: { 'Content-Type': 'text/css' }
    })

    expect(refuseShellForHashedAsset(stylesheet)).toBe(stylesheet)
  })
})
