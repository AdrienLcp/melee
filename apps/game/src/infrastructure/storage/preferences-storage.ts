import { Result } from '@adrienlcp/result'
import {
  readRecognizedText,
  readStoredText,
  type StorageReadError,
  type StorageWriteError,
  writeStoredJson,
  writeStoredText
} from '@adrienlcp/safe-storage'
import { z } from 'zod'

import {
  type BoardSettings,
  boardSettingsSchema,
  DEFAULT_BOARD_SETTINGS,
  DEFAULT_TRACK_SETTINGS
} from '@melee/protocol/board'
import { gameKindSchema, gameSettingsSchema } from '@melee/protocol/game'
import { type Nickname, nicknameSchema } from '@melee/protocol/identifiers'
import { isLocale, type Locale } from '@melee/protocol/locale'
import { modeSettingsSchema, roomSettingsSchema } from '@melee/protocol/room'
import {
  DEFAULT_TEAMS_SETTINGS,
  type TeamsSettings,
  teamsSettingsSchema
} from '@melee/protocol/team'

import type { HostPreferences } from '@melee/core/room/host-preferences'

import { readStoredWithSchema } from './read-stored-with-schema'

export const HOST_SETUP_KEY = 'melee:host-setup'
export const LOCALE_KEY = 'melee:locale'
export const NICKNAME_KEY = 'melee:nickname'
export const PANEL_FOLDED_KEY = 'melee:panel-folded'
export const PANEL_SIDE_KEY = 'melee:panel-side'
export const VOLUME_KEY = 'melee:volume'

/**
 * Composed out of the protocol's own schemas rather than restated, so a setting
 * that changes shape on the wire stops parsing here instead of being restored
 * into a room that no longer accepts it. `omit` is what keeps the two halves
 * from drifting: whatever the room grows that no game answers is remembered
 * without an edit.
 */
const gameSetupSchema = z.object({
  autoAdvanceMs: roomSettingsSchema.shape.autoAdvanceMs,
  game: gameSettingsSchema,
  mode: modeSettingsSchema,
  roundCount: roomSettingsSchema.shape.roundCount
})

/**
 * Entry by entry, so one game this build no longer serves — or one whose
 * settings changed shape — costs that game's memory and not the host's whole
 * setup.
 */
const usableGameSetups = (
  stored: Record<string, unknown>
): HostPreferences['games'] =>
  Object.fromEntries(
    Object.entries(stored).flatMap(([key, value]) => {
      const game = gameKindSchema.safeParse(key)
      const setup = gameSetupSchema.safeParse(value)

      return game.success && setup.success ? [[game.data, setup.data]] : []
    })
  )

/**
 * The board a setup stored before it existed is read with: the one the teams
 * setting lays now, since a host who played in teams then would be raced on a
 * track today, and an untouched setting leaves no way to lay it.
 */
const boardLaidWith = (teams: TeamsSettings): BoardSettings =>
  teams.kind === 'off' ? DEFAULT_BOARD_SETTINGS : DEFAULT_TRACK_SETTINGS

const hostPreferencesSchema = z.object({
  games: z.record(z.string(), z.unknown()).transform(usableGameSetups),
  room: roomSettingsSchema
    .omit({
      autoAdvanceMs: true,
      game: true,
      lineUp: true,
      lineUpAt: true,
      mode: true,
      roundCount: true,
      runningOrder: true
    })
    .extend({
      board: boardSettingsSchema.optional().catch(undefined),
      /** Stored before a room could have a judge, which no room did. */
      hasJudge: z.boolean().catch(false),
      /** *A screen per team* is gone: its seats played as everyone for themselves. */
      teams: teamsSettingsSchema.catch(DEFAULT_TEAMS_SETTINGS)
    })
    .transform(({ board, ...room }) => ({
      ...room,
      board: board ?? boardLaidWith(room.teams)
    }))
})

/**
 * Succeeds with `null` when no locale was ever chosen, which is not the same as
 * choosing the default: the caller falls back to what the browser and the
 * operating system are already saying rather than overriding them.
 *
 * Every failure — `localStorage` throws outright in a Safari private window —
 * degrades to a preference that does not survive a reload, which beats a blank
 * page.
 */
export const readStoredLocale = (): Result<Locale | null, StorageReadError> =>
  readRecognizedText({ isRecognized: isLocale, key: LOCALE_KEY })

export const writeStoredLocale = (
  locale: Locale
): Result<void, StorageWriteError> =>
  writeStoredText({ key: LOCALE_KEY, text: locale })

/**
 * Not the seat — that is `session-storage.ts`, keyed per room, and it is what
 * brings a player who reloaded back to their score. This is only what the
 * player likes being called, so the join form on the *next* room arrives
 * filled in.
 */
export const readStoredNickname = (): Result<
  Nickname | null,
  StorageReadError
> => {
  const stored = readStoredText(NICKNAME_KEY)

  if (stored.status === 'failure') {
    return stored
  }

  if (stored.data === null) {
    return Result.success(null)
  }

  const parsed = nicknameSchema.safeParse(stored.data)

  return parsed.success
    ? Result.success(parsed.data)
    : Result.failure('unrecognized')
}

export const writeStoredNickname = (
  nickname: Nickname
): Result<void, StorageWriteError> =>
  writeStoredText({ key: NICKNAME_KEY, text: nickname })

const PANEL_FOLDED_VALUES = ['true', 'false'] as const

const isPanelFoldedValue = (
  text: string
): text is (typeof PANEL_FOLDED_VALUES)[number] =>
  PANEL_FOLDED_VALUES.some((value) => value === text)

/** Whether the host last folded the console's panel down to its rail; never stored means open. */
export const readStoredPanelFolded = (): Result<boolean, StorageReadError> => {
  const stored = readRecognizedText({
    isRecognized: isPanelFoldedValue,
    key: PANEL_FOLDED_KEY
  })

  return stored.status === 'success'
    ? Result.success(stored.data === 'true')
    : stored
}

export const writeStoredPanelFolded = (
  isFolded: boolean
): Result<void, StorageWriteError> =>
  writeStoredText({ key: PANEL_FOLDED_KEY, text: String(isFolded) })

/** The edge of a wide console the panel stands against. */
export type PanelSide = 'left' | 'right'

const PANEL_SIDES = ['left', 'right'] as const satisfies readonly PanelSide[]

const isPanelSide = (text: string): text is PanelSide =>
  PANEL_SIDES.some((side) => side === text)

/** The side the host last put the console's panel on; never stored means the right. */
export const readStoredPanelSide = (): Result<PanelSide, StorageReadError> => {
  const stored = readRecognizedText({
    isRecognized: isPanelSide,
    key: PANEL_SIDE_KEY
  })

  return stored.status === 'success'
    ? Result.success(stored.data ?? 'right')
    : stored
}

export const writeStoredPanelSide = (
  side: PanelSide
): Result<void, StorageWriteError> =>
  writeStoredText({ key: PANEL_SIDE_KEY, text: side })

const isVolume = (volume: number): boolean =>
  Number.isFinite(volume) && volume >= 0 && volume <= 1

/**
 * The host machine's own loudness, not the room's — it belongs to whichever
 * laptop is plugged into the speakers, so it never travels over the socket.
 * Succeeds with `null` when none was ever chosen.
 */
export const readStoredVolume = (): Result<number | null, StorageReadError> => {
  const stored = readStoredText(VOLUME_KEY)

  if (stored.status === 'failure') {
    return stored
  }

  if (stored.data === null) {
    return Result.success(null)
  }

  const volume = Number.parseFloat(stored.data)

  return isVolume(volume)
    ? Result.success(volume)
    : Result.failure('unrecognized')
}

export const writeStoredVolume = (
  volume: number
): Result<void, StorageWriteError> =>
  writeStoredText({ key: VOLUME_KEY, text: String(volume) })

/**
 * How this host left the last room they ran, so the next one opens on it rather
 * than on the shell's defaults.
 *
 * `null` is a host who has never changed a setting, and it is deliberately not
 * "the defaults": the caller skips the restore entirely instead of opening every
 * room ever with a frame that says nothing. A blob that no longer parses fails
 * as `'unrecognized'`, and the caller treats it the same way — a shape this
 * build cannot read is worth less than the defaults it would replace.
 */
export const readStoredHostPreferences = (): Result<
  HostPreferences | null,
  StorageReadError
> => {
  const stored = readStoredWithSchema({
    key: HOST_SETUP_KEY,
    schema: hostPreferencesSchema
  })

  if (stored.status === 'success' && stored.data !== null) {
    dropUnknownFields(stored.data)
  }

  return stored
}

/**
 * The schema strips a field it no longer knows, and the blob is written back
 * without it so the field does not sit on the machine until the next setting
 * changes. The slate's answer key once lived here, and answers are not
 * something this store may keep past the tab.
 */
const dropUnknownFields = (preferences: HostPreferences): void => {
  const cleaned = JSON.stringify(preferences)
  const stored = readStoredText(HOST_SETUP_KEY)

  if (stored.status === 'success' && stored.data !== cleaned) {
    writeStoredText({ key: HOST_SETUP_KEY, text: cleaned })
  }
}

export const writeStoredHostPreferences = (
  preferences: HostPreferences
): Result<void, StorageWriteError> =>
  writeStoredJson({ key: HOST_SETUP_KEY, value: preferences })
