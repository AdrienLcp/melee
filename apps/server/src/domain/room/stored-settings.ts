import { type GameSettings, gameSettingsSchema } from '@melee/protocol/game'
import {
  DEFAULT_ROOM_SETTINGS,
  type RoomSettings,
  roomSettingsSchema
} from '@melee/protocol/room'

type StoredGames = {
  openedEntries: readonly unknown[]
  settings: unknown
}

type ParsedGames = {
  openedEntries: GameSettings[]
  /**
   * Where the stored room broke today's schemas, empty when nothing did: each
   * opened entry dropped, and every rule the settings failed before they went
   * back to the defaults.
   */
  refusals: string[]
  settings: RoomSettings
}

/**
 * A room's games as the Durable Object stored them, read through today's
 * schemas. Storage hands back what was written with nothing in between, and a
 * room outlives a deploy: a field added since takes its `.default`, an arm
 * replaced since reads through its preprocess. Every view goes out through the
 * same schemas, so what fails here is a deploy that tightened one rather than
 * a room that drifted.
 */
export const parseStoredGames = (stored: StoredGames): ParsedGames => {
  const settings = roomSettingsSchema.safeParse(stored.settings)
  const entries = stored.openedEntries.map((entry) =>
    gameSettingsSchema.safeParse(entry)
  )

  return {
    openedEntries: entries.flatMap((entry) =>
      entry.success ? [entry.data] : []
    ),
    refusals: [
      ...(settings.success
        ? []
        : settings.error.issues.map(
            (issue) => `settings.${issue.path.map(String).join('.')}`
          )),
      ...entries.flatMap((entry, index) =>
        entry.success ? [] : [`openedEntries.${index}`]
      )
    ],
    settings: settings.success ? settings.data : DEFAULT_ROOM_SETTINGS
  }
}
