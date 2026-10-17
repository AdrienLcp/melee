export const STALE_BUILD_RELOAD_KEY = 'melee:stale-build-reload-at'

/**
 * When this tab last reloaded itself onto a newer build, in `sessionStorage`
 * because the guard it feeds is about this tab's loop and nothing else. A
 * storage that throws reads as never, so the worst case is one reload too many.
 */
export const readStaleBuildReloadAt = (): number | null => {
  try {
    const stored = Number(sessionStorage.getItem(STALE_BUILD_RELOAD_KEY))

    return Number.isFinite(stored) && stored > 0 ? stored : null
  } catch {
    return null
  }
}

export const writeStaleBuildReloadAt = (at: number): void => {
  try {
    sessionStorage.setItem(STALE_BUILD_RELOAD_KEY, String(at))
  } catch {
    // A tab that cannot remember reloads at most once per failed chunk.
  }
}
