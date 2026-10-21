import type React from 'react'

import {
  type HostRoomView,
  type PlayStyle,
  playStyleSchema
} from '@melee/protocol/room'

import { canPlayByTeam } from '@melee/core/team/team-turn'

import { SegmentedControl } from '@/presentation/components/segmented-control'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './turns-choice.sass'

const PLAY_STYLES: readonly PlayStyle[] = ['together', 'byTeam', 'solo', 'duel']

/** Whether the next round may be one team's, read off the room as it stands. */
export const offersTurns = (view: HostRoomView): boolean =>
  canPlayByTeam({
    game: view.settings.game?.kind ?? null,
    mode: view.settings.mode.kind,
    teamCount: view.teams.length
  })

/** What the press opening the next round asks for: the host's wish, where the room can grant it. */
export const playStyleFor = ({
  playStyle,
  view
}: {
  playStyle: PlayStyle
  view: HostRoomView
}): PlayStyle => (offersTurns(view) ? playStyle : 'together')

type TurnsChoiceProps = {
  isDisabled: boolean
  onChange: (playStyle: PlayStyle) => void
  playStyle: PlayStyle
  view: HostRoomView
}

/**
 * Everyone at once, team by team, one seat per team or in duels, beside the
 * press that opens the next round — and nothing at all where a round cannot
 * be one team's, because an option that would be refused is not one.
 */
export const TurnsChoice: React.FC<TurnsChoiceProps> = ({
  isDisabled,
  onChange,
  playStyle,
  view
}) => {
  const translate = useTranslate()

  if (!offersTurns(view)) {
    return null
  }

  return (
    <SegmentedControl
      className='turns-choice'
      description={translate(`host.turns.hint.${playStyle}`)}
      isDisabled={isDisabled}
      label={translate('host.turns.label')}
      onChange={(value) => onChange(playStyleSchema.parse(value))}
      options={PLAY_STYLES.map((style) => ({
        label: translate(`host.turns.${style}`),
        value: style
      }))}
      value={playStyle}
    />
  )
}
