import { holdWhileReloading } from './stale-build'

/** A chunk split out of the page, fetched once and read synchronously once in hand. */
export type LazyModule<Module> = {
  /**
   * Fetches the chunk, sharing a fetch already in flight. A fetch that failed
   * is asked again by the next caller rather than kept as the answer. Once it
   * has landed the promise is marked fulfilled, so a render reading it with
   * `use(load())` gets the module without suspending: `React.lazy` suspends a
   * frame even on a module in hand, which cuts the entrance motion of what it
   * draws. A render calls `use` on every pass — skipping it once the module
   * is in hand makes React's replay of the suspended render throw.
   */
  load: () => Promise<Module>
  /** The module once it has landed, `null` before. */
  loaded: () => Module | null
}

/** Wraps `() => import('…')` so every reader shares one fetch, held through a stale-build reload. */
export const lazyModule = <Module>(
  importModule: () => Promise<Module>
): LazyModule<Module> => {
  const fetchModule = holdWhileReloading(importModule)
  let landed: Module | null = null
  let loading: Promise<Module> | null = null

  return {
    load: () => {
      loading ??= fetchModule().then(
        (module) => {
          landed = module
          // The fields React's `use` reads to answer a thenable synchronously.
          if (loading !== null) {
            Object.assign(loading, { status: 'fulfilled', value: module })
          }
          return module
        },
        (error: unknown) => {
          loading = null
          throw error
        }
      )

      return loading
    },
    loaded: () => landed
  }
}
