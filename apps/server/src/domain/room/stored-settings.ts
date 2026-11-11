import { z } from 'zod'

import { deckSchema, type OwnLines, ownLinesSchema } from '@melee/protocol/deck'
import { type GameSettings, gameSettingsSchema } from '@melee/protocol/game'
import {
  DEFAULT_ROOM_SETTINGS,
  type RoomSettings,
  roomSettingsSchema
} from '@melee/protocol/room'

import { NO_OWN_LINES } from './new-room'
import type { RoomDeck } from './room'

const storedDecksSchema = z.array(
  z.object({ deck: deckSchema, id: z.string().min(1) }).nullable()
)

type StoredGames = {
  /** Absent from a room stored before an evening could bring content. */
  decks?: unknown
  openedEntries: readonly unknown[]
  /** Absent from a room stored before a host's own lines reached the server. */
  ownLines?: unknown
  settings: unknown
}

type ParsedGames = {
  decks: (RoomDeck | null)[]
  openedEntries: GameSettings[]
  ownLines: OwnLines
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
  const decks = storedDecksSchema.safeParse(stored.decks ?? [])
  const ownLines = ownLinesSchema.safeParse(stored.ownLines ?? {})
  const entries = stored.openedEntries.map((entry) =>
    gameSettingsSchema.safeParse(entry)
  )

  return {
    decks: decks.success ? decks.data : [],
    openedEntries: entries.flatMap((entry) =>
      entry.success ? [entry.data] : []
    ),
    ownLines: ownLines.success ? ownLines.data : NO_OWN_LINES,
    refusals: [
      ...(settings.success
        ? []
        : settings.error.issues.map(
            (issue) => `settings.${issue.path.map(String).join('.')}`
          )),
      ...entries.flatMap((entry, index) =>
        entry.success ? [] : [`openedEntries.${index}`]
      ),
      ...(decks.success ? [] : ['decks']),
      ...(ownLines.success ? [] : ['ownLines'])
    ],
    settings: settings.success ? settings.data : DEFAULT_ROOM_SETTINGS
  }
}
