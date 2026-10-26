import type { GameKind } from '@melee/protocol/game'

/**
 * The ids a game was shipped under before it took its name. A host's stored
 * setup and a shared link still carry them, so they are read as the game they
 * now name rather than dropped as a game this build no longer serves.
 */
const GAME_KIND_RENAMED_FROM: Readonly<Record<string, GameKind>> = {
  guessnine: 'blacksquare',
  worldmap: 'atlas'
}

/** The game an old id names today, or `null` when it was never renamed. */
export const renamedGameKindOf = (id: string): GameKind | null =>
  Object.hasOwn(GAME_KIND_RENAMED_FROM, id)
    ? (GAME_KIND_RENAMED_FROM[id] ?? null)
    : null

const currentIdOf = (id: string): string => renamedGameKindOf(id) ?? id

/**
 * Stored JSON with every game it names under its current id: as a record key,
 * as a `kind`, or as an entry of a list of games. A name the host typed is
 * never one of those, so it is left as it was.
 */
export const withCurrentGameKinds = (stored: unknown): unknown => {
  if (Array.isArray(stored)) {
    return stored.map((entry) =>
      typeof entry === 'string'
        ? currentIdOf(entry)
        : withCurrentGameKinds(entry)
    )
  }

  if (typeof stored !== 'object' || stored === null) {
    return stored
  }

  return Object.fromEntries(
    Object.entries(stored).map(([key, value]) => [
      currentIdOf(key),
      key === 'kind' && typeof value === 'string'
        ? currentIdOf(value)
        : withCurrentGameKinds(value)
    ])
  )
}
