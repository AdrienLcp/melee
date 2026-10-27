import type React from 'react'

import type { GameKind } from '@melee/protocol/game'
import type { RoomSettings } from '@melee/protocol/room'

import {
  type HostPreferences,
  rememberedSetupFor
} from '@melee/core/room/host-preferences'
import { withEntryAdded } from '@melee/core/room/line-up'

import { useI18n, useTranslate } from '@/presentation/i18n/i18n-provider'

import { EveningPage } from './evening-page'
import { GamePickList } from './game-pick-list'

import './evening-add-page.sass'

/**
 * Plans a round of a game at the end of the evening, on what this host last
 * left it set to — or picks the game, in a room still deciding — and says
 * where it landed in the line-up.
 */
export const usePlanGame = ({
  onPlanned,
  preferences,
  settings
}: {
  onPlanned: (settings: RoomSettings, at: number) => void
  preferences: HostPreferences | null
  settings: RoomSettings
}): ((game: GameKind) => void) => {
  const { locale } = useI18n()

  return (game) => {
    const added = withEntryAdded({
      game,
      locale,
      remembered: rememberedSetupFor({ game, preferences }),
      settings
    })

    if (added !== settings) {
      onPlanned(added, added.lineUp.length - 1)
    }
  }
}

type EveningAddPageProps = {
  isLive: boolean
  /** This console holds a seat, so a judged game is one it sits out. */
  isSeated: boolean
  /** Called with the room's settings once the round is added, and where it landed in the line-up. */
  onAdded: (settings: RoomSettings, at: number) => void
  onBack: () => void
  /** What this host last left each game set to, so a round joins on it. */
  preferences: HostPreferences | null
  settings: RoomSettings
}

/** The shelf as a page, one press adding a round of a game to the end of the evening. */
export const EveningAddPage: React.FC<EveningAddPageProps> = ({
  isLive,
  isSeated,
  onAdded,
  onBack,
  preferences,
  settings
}) => {
  const translate = useTranslate()
  const plan = usePlanGame({ onPlanned: onAdded, preferences, settings })
  const heading = translate('host.evening.pick')

  return (
    <EveningPage onBack={onBack}>
      <h2 className='add-heading'>{heading}</h2>
      <GamePickList
        aria-label={heading}
        isDisabled={!isLive}
        isSeated={isSeated}
        onPick={plan}
        settings={settings}
      />
      <p className='hint'>{translate('host.evening.pickHint')}</p>
    </EveningPage>
  )
}
