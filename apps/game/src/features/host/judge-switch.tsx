import type React from 'react'

import type { RoomSettings } from '@melee/protocol/room'

import {
  type HostPreferences,
  rememberedSetupFor
} from '@melee/core/room/host-preferences'
import { movedToEntry } from '@melee/core/room/room-settings'

import { Switch } from '@/presentation/components/switch'
import { useI18n } from '@/presentation/i18n/i18n-provider'

type JudgeSwitchProps = {
  isDisabled: boolean
  onChange: (settings: RoomSettings) => void
  /** What this host last left each game set to, which a judge's evening plays on. */
  preferences: HostPreferences | null
  settings: RoomSettings
}

/**
 * Whether somebody runs the room and never plays. The game on screen is landed
 * again under the new rule, so an evening given a judge goes back to the mode
 * this host left the game on and one losing its judge to the game's own.
 */
export const JudgeSwitch: React.FC<JudgeSwitchProps> = ({
  isDisabled,
  onChange,
  preferences,
  settings
}) => {
  const { locale, translate } = useI18n()

  return (
    <Switch
      description={translate('host.judge.hint')}
      isDisabled={isDisabled}
      isSelected={settings.hasJudge}
      label={translate('host.judge.label')}
      onChange={(hasJudge) => {
        const judged = { ...settings, hasJudge }

        onChange(
          settings.lineUpAt === null || settings.game === null
            ? judged
            : movedToEntry({
                at: settings.lineUpAt,
                locale,
                remembered: rememberedSetupFor({
                  game: settings.game.kind,
                  preferences
                }),
                settings: judged
              })
        )
      }}
    />
  )
}
