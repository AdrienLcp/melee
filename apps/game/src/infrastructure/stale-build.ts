import { reloadPage } from '@/infrastructure/browser'
import { nowMs } from '@/infrastructure/clock'
import {
  readStaleBuildReloadAt,
  writeStaleBuildReloadAt
} from '@/infrastructure/storage/stale-build-storage'

/** Long enough to cover a reload, short enough that a later deploy still heals. */
export const STALE_BUILD_RELOAD_COOLDOWN_MS = 10_000

/**
 * A deploy removes the previous build's chunks, so a tab opened before it fails
 * on the first lazy route or stylesheet it had not loaded yet — a page with no
 * style and no icons. Reloading fetches the document naming the new chunks. The
 * cooldown is what stops a build genuinely missing a chunk from reloading
 * forever: the second failure inside it is left to surface.
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
    writeStaleBuildReloadAt(now)
    reloadPage()
  })
}
