import type { RoomSettings } from '@melee/protocol/room'
import type { TrackSource } from '@melee/protocol/track'

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
import { sourceKindKey } from './playlist-picker'

/**
 * The line that says what the room is set to play, read on both sides of a
 * game: closed, the setup fold says what opening it would let you change; on
 * the final board it says what *play again* is about to relaunch.
 *
 * It reads the draft source for the same reason in both places — the picker
 * commits on the launch, and on the final board that launch is one press away
 * with nothing between it and the countdown.
 */
export const useSettingsSummary = (input: SummaryInput): string =>
  useSummaryParts()(settingsSummary(input))

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
    table: [join(parts.filter(isRoundCount)), teamsSummary, boardSummary]
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
        return translate(sourceKindKey(part.source))
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
        return part.count === null
          ? translate('host.roundCount.openSummary')
          : translate('host.roundCount.summary', { count: part.count })
    }
  }

  return (parts) => parts.map(summaryPart).join(' · ')
}
