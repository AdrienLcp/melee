import type { GameKind } from '@melee/protocol/game'
import { DEFAULT_MODE_SETTINGS, type RoomSettings } from '@melee/protocol/room'

import { answerModesFor } from './game-capabilities'
import { isJudgedByHost, isRoomJudgedByHost, modeOfferedBy } from './game-modes'
import { type HostPreferences, restoredSettings } from './host-preferences'

/**
 * Whether a game can open with the person who opened it already playing. It
 * can wherever some way of answering it owes nobody a verdict: the bare buzzer
 * and the slate are judged by their host under every mode they offer, so a
 * table there waits for players before it starts.
 */
export const canPlayRightAway = (game: GameKind): boolean =>
  answerModesFor(game).some((mode) => !isJudgedByHost({ game, mode }))

/**
 * The room a host who pressed *play right away* starts on: their remembered
 * setup for the game, except a way of answering that would make them the
 * judge — a judge cannot take the seat the press asked for, so a quiz or a
 * blind test remembered on `buzzer` opens on four choices instead.
 */
export const settingsToPlayRightAway = ({
  preferences,
  settings
}: {
  preferences: HostPreferences | null
  settings: RoomSettings
}): RoomSettings => {
  const restored =
    preferences === null
      ? settings
      : restoredSettings({ preferences, settings })
  const game = restored.game?.kind ?? null

  if (game === null || !isJudgedByHost({ game, mode: restored.mode.kind })) {
    return restored
  }

  return {
    ...restored,
    mode: modeOfferedBy({ game, preferred: DEFAULT_MODE_SETTINGS.choice })
  }
}

/**
 * Whether the lobby's launch is the press that seats its host and starts: the
 * table is empty, a game is chosen, and the room lets its host play. The
 * moment anybody else sits down it is the group's launch again.
 */
export const launchesWithHostSeated = ({
  seated,
  settings
}: {
  /** How many seats the room holds. */
  seated: number
  settings: RoomSettings
}): boolean =>
  seated === 0 && settings.game !== null && !isRoomJudgedByHost(settings)
