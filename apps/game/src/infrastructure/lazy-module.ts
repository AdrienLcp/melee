import { holdWhileReloading } from './stale-build'

/** A chunk split out of the page, fetched once and read synchronously once in hand. */
export type LazyModule<Module> = {
  /**
   * Fetches the chunk, sharing a fetch already in flight. A fetch that failed
   * is asked again by the next caller rather than kept as the answer.
   */
  load: () => Promise<Module>
  /**
   * The module once it has landed, `null` before. A render reads this first
   * and suspends on `use(load())` only without it: `React.lazy` suspends a
   * frame even on a module in hand, which cuts the entrance motion of what it
   * draws.
   */
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
