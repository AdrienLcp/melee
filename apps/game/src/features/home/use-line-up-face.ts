import type { ShelvedGame } from '@melee/protocol/game'

import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { gameNameKey } from '@/presentation/i18n/translation'

/** Under this many days a play is told in days, then in weeks. */
const DAYS_IN_A_WEEK = 7
/** Under this many days a play is told in weeks, then in months. */
const DAYS_TOLD_IN_WEEKS = 35
const DAYS_IN_A_MONTH = 30

/** How long a line-up runs, as its lid's foot prints it. */
export const useRoundsText = () => {
  const translate = useTranslate()

  return (roundCount: number | null): string =>
    roundCount === null
      ? translate('host.roundCount.open')
      : translate('readyMade.rounds', { count: roundCount })
}

/** What a lid of the host's own says about the line-up and its last play. */
export const useLineUpFace = () => {
  const translate = useTranslate()

  return {
    /** The games, named in the order they first come up. */
    gamesText: (games: readonly ShelvedGame[]): string =>
      games.map((game) => translate(gameNameKey(game))).join(' · '),
    /** When it was last played, `daysAgo` whole calendar days back. */
    playedAgo: (daysAgo: number): string => {
      if (daysAgo < DAYS_IN_A_WEEK) {
        return translate('home.played.days', { when: -daysAgo })
      }

      return daysAgo < DAYS_TOLD_IN_WEEKS
        ? translate('home.played.weeks', {
            when: -Math.round(daysAgo / DAYS_IN_A_WEEK)
          })
        : translate('home.played.months', {
            when: -Math.round(daysAgo / DAYS_IN_A_MONTH)
          })
    },
    /** How far its last table got. */
    roundsPlayed: ({
      roundCount,
      roundsPlayed
    }: {
      roundCount: number | null
      roundsPlayed: number
    }): string => {
      if (roundCount === null) {
        return translate('home.played.rounds', { count: roundsPlayed })
      }

      return roundsPlayed >= roundCount
        ? translate('home.played.all', { count: roundCount })
        : translate('home.played.roundsOf', {
            count: roundsPlayed,
            total: roundCount
          })
    }
  }
}
