import {
  DEFAULT_LIGHTS_SETTINGS,
  DEFAULT_REFLEX_SETTINGS,
  type LightsSettings,
  type ReflexSettings
} from '@melee/protocol/game'

/**
 * The two ways _Réflexe_ is played, each a game kind of its own: one press
 * against one flip, or a twenty-second chase across nine lights. Two kinds
 * rather than one setting because they share the fifth guarantee and nothing
 * else — the round, the answer mode, the verdict and the screens all differ.
 */
export const REFLEX_FORMATS = ['reflex', 'lights'] as const

export type ReflexFormat = (typeof REFLEX_FORMATS)[number]

export type ReflexFormatSettings = ReflexSettings | LightsSettings

export const isReflexFormat = (value: unknown): value is ReflexFormat =>
  REFLEX_FORMATS.some((format) => format === value)

/**
 * The same game played the other way. Nothing carries over: the flip has no
 * setting at all, and the chase's window and traps mean nothing to it.
 */
export const inReflexFormat = ({
  format,
  game
}: {
  format: ReflexFormat
  game: ReflexFormatSettings
}): ReflexFormatSettings => {
  if (game.kind === format) {
    return game
  }

  return format === 'reflex' ? DEFAULT_REFLEX_SETTINGS : DEFAULT_LIGHTS_SETTINGS
}
