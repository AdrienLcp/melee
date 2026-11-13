import { describe, expect, it } from 'vitest'

import { lazyModule } from './lazy-module'

describe('lazyModule', () => {
  it('[lazy] marks a landed chunk fulfilled, so use() reads it without suspending', async () => {
    const chunk = { name: 'stage' }
    const module = lazyModule(async () => chunk)

    const loading = module.load()
    await loading

    expect(Reflect.get(loading, 'status')).toBe('fulfilled')
    expect(Reflect.get(loading, 'value')).toBe(chunk)
    expect(module.loaded()).toBe(chunk)
  })

  it('[lazy] hands every reader the one promise use() was given', async () => {
    const module = lazyModule(async () => ({ name: 'stage' }))

    const first = module.load()
    await first

    expect(module.load()).toBe(first)
  })
})
