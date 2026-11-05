import { reloadPage } from '@/infrastructure/browser'
import { nowMs } from '@/infrastructure/clock'
import {
  readStaleBuildReloadAt,
  writeStaleBuildReloadAt
} from '@/infrastructure/storage/stale-build-storage'

/** Long enough to cover a reload, short enough that a later deploy still heals. */
export const STALE_BUILD_RELOAD_COOLDOWN_MS = 10_000

const NEVER_SETTLES: Promise<never> = new Promise(() => undefined)

let isReloadingOntoNewBuild = false

/**
 * A deploy removes the previous build's chunks, so a tab opened before it fails
 * on the first lazy route or stylesheet it had not loaded yet — a page with no
 * style and no icons. Reloading fetches the document naming the new chunks. The
 * cooldown is what stops a build genuinely missing a chunk from reloading
 * forever: the second failure inside it is left to surface.
 *
 * Seen on a tab left in the background across a deploy, which failed on its
 * very first route the moment it was brought back.
 */
export const reloadOnStaleBuild = (): void => {
  window.addEventListener('vite:preloadError', (event) => {
    const now = nowMs()
    const lastReloadAt = readStaleBuildReloadAt()

    if (
      lastReloadAt !== null &&
      now - lastReloadAt < STALE_BUILD_RELOAD_COOLDOWN_MS
    ) {
      return
    }

    event.preventDefault()
    isReloadingOntoNewBuild = true
    writeStaleBuildReloadAt(now)
    reloadPage()
  })
}

/**
 * Wraps a lazy import so a stale build leaves the screen as it is until the
 * reload lands. A prevented `vite:preloadError` resolves the import to
 * `undefined`, and reading the export off it would throw into the error screen,
 * shown for the instant before the reload — a flash of "something went wrong"
 * over a page that was about to heal.
 */
export const holdWhileReloading =
  <Loaded>(load: () => Promise<Loaded>) =>
  async (): Promise<Loaded> => {
    try {
      return await load()
    } catch (error) {
      if (isReloadingOntoNewBuild) {
        return await NEVER_SETTLES
      }

      throw error
    }
  }
