import {
  DEFAULT_ESTIMATE_SETTINGS,
  DEFAULT_HIGHER_LOWER_SETTINGS,
  type EstimateSettings,
  type HigherLowerSettings
} from '@melee/protocol/game'

/**
 * The two ways _Le juste chiffre_ is played, each a game kind of its own:
 * every seat estimating one number, or picking the larger of a pair. Two
 * kinds rather than one setting because they share the bank and nothing else
 * — the round, the answer, the pay, the deck and the clock all differ.
 */
export const ESTIMATE_FORMATS = ['estimate', 'higherlower'] as const

export type EstimateFormat = (typeof ESTIMATE_FORMATS)[number]

export type EstimateFormatSettings = EstimateSettings | HigherLowerSettings

export const isEstimateFormat = (value: unknown): value is EstimateFormat =>
  ESTIMATE_FORMATS.some((format) => format === value)

/**
 * The same game played the other way. What both read off the bank — its
 * level and the table's country — carries over; the clock is the format's
 * own, because ten seconds to pick a side is not long enough to estimate.
 */
export const inEstimateFormat = ({
  format,
  game
}: {
  format: EstimateFormat
  game: EstimateFormatSettings
}): EstimateFormatSettings => {
  if (game.kind === format) {
    return game
  }

  const { difficulty, homeCountry } = game

  return format === 'estimate'
    ? { ...DEFAULT_ESTIMATE_SETTINGS, difficulty, homeCountry }
    : { ...DEFAULT_HIGHER_LOWER_SETTINGS, difficulty, homeCountry }
}
