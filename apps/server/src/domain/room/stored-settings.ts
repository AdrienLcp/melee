import {
  DEFAULT_BLINDTEST_SETTINGS,
  type GameSettings
} from '@melee/protocol/game'
import type { RoomSettings } from '@melee/protocol/room'
import { trackSourceSchema } from '@melee/protocol/track'

import type { Room } from './room'

type StoredGames = Pick<Room, 'openedEntries' | 'settings'>

/**
 * A blind test as the Durable Object stored it, which may predate the
 * catalogue (protocol 67): a room outlives a deploy, and a source on one of the
 * four arms it replaced reached a draw that no longer knows them. Each reads as
 * the strands it drew, through the schema the browser's stored setups go
 * through too.
 */
const withCatalogueSource = (game: GameSettings): GameSettings => {
  if (game.kind !== 'blindtest') {
    return game
  }

  const source = trackSourceSchema.safeParse(game.source)

  return {
    ...game,
    source: source.success ? source.data : DEFAULT_BLINDTEST_SETTINGS.source
  }
}

const withCatalogueSettings = (settings: RoomSettings): RoomSettings => ({
  ...settings,
  game: settings.game === null ? null : withCatalogueSource(settings.game),
  lineUp: settings.lineUp.map(withCatalogueSource)
})

/** Every blind test a stored room holds, read onto the catalogue. */
export const withCatalogueSources = <T extends StoredGames>(stored: T): T => ({
  ...stored,
  openedEntries: stored.openedEntries.map(withCatalogueSource),
  settings: withCatalogueSettings(stored.settings)
})
