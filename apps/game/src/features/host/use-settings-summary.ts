import type { RoomSettings } from '@melee/protocol/room'
import type { TrackSource } from '@melee/protocol/track'

import { dealsAdultContent } from '@melee/core/quiz/adult-content'
import { isEveningPaidForSpeed } from '@melee/core/room/game-capabilities'
import {
  type SettingsSummaryPart,
  settingsSummary
} from '@melee/core/room/settings-summary'

import { useTranslate } from '@/presentation/i18n/i18n-provider'
import {
  answerModeLabelKey,
  gameNameKey
} from '@/presentation/i18n/translation'

import { useDurationLabels } from './number-choice'
import { sourceSummary } from './playlist-picker'

type SummaryInput = {
  draftSource: TrackSource | null
  settings: RoomSettings
}

/** What each group of the setup says while it is closed, the same way the whole of it does. */
export type SetupSummaries = Record<'room' | 'table', string>

/**
 * The setup's line cut along its groups. The table says the evening's length,
 * whichever game a round is drawn from, and its teams; the room says how a
 * round is led in and let go. What each round is set to is its own page's.
 */
export const useSetupSummaries = ({
  draftSource,
  settings
}: SummaryInput): SetupSummaries => {
  const translate = useTranslate()
  const join = useSummaryParts()
  const { seconds } = useDurationLabels()
  const parts = settingsSummary({ draftSource, settings })
  const isRoundCount = (part: SettingsSummaryPart): boolean =>
    part.kind === 'roundCount'
  const teams = settings.teams

  const teamsSummary =
    teams.kind === 'off'
      ? translate(`team.summary.${teams.kind}`)
      : translate(`team.summary.${teams.kind}`, { count: teams.count })

  const boardSummary =
    settings.board.kind === 'track'
      ? translate('board.summary', { length: settings.board.length })
      : ''

  const speedBonus =
    !settings.paysForSpeed &&
    settings.board.kind === 'points' &&
    isEveningPaidForSpeed(settings)
      ? translate('host.speedBonus.summaryOff')
      : ''

  const adultContent =
    !settings.isFamilyFriendly && dealsAdultContent(settings)
      ? translate('host.familyFriendly.summaryOff')
      : ''

  const hold =
    settings.autoAdvanceMs === null
      ? translate('host.setup.summary.holdOpen')
      : translate('host.setup.summary.hold', {
          duration: seconds(settings.autoAdvanceMs)
        })

  return {
    room: [
      hold,
      translate('host.setup.summary.countdown', {
        duration: seconds(settings.countdownMs)
      })
    ].join(' · '),
    table: [
      join(parts.filter(isRoundCount)),
      teamsSummary,
      boardSummary,
      speedBonus,
      adultContent
    ]
      .filter((part) => part !== '')
      .join(' · ')
  }
}

/** Puts a summary's parts into the reader's words, one ` · ` apart. */
const useSummaryParts = (): ((parts: SettingsSummaryPart[]) => string) => {
  const translate = useTranslate()

  const summaryPart = (part: SettingsSummaryPart): string => {
    switch (part.kind) {
      case 'game':
        return translate(gameNameKey(part.game))
      case 'source':
        return sourceSummary({ source: part.source, translate })
      case 'places':
        return part.places
          .map((places) => translate(`atlas.places.${places}`))
          .join(', ')
      case 'answerMode':
        return translate(answerModeLabelKey(part.mode))
      case 'itemCount':
        return translate('slate.items.summary', { count: part.count })
      case 'answerCount':
        return translate('blacksquare.answerCount.summary', {
          count: part.count
        })
      case 'roundCount':
        return part.isRace
          ? translate('host.eveningEnd.finishSummary')
          : part.count === null
            ? translate('host.roundCount.openSummary')
            : translate('host.roundCount.summary', { count: part.count })
    }
  }

  return (parts) => parts.map(summaryPart).join(' · ')
}
