import type React from 'react'

import { type GameKind, shelvedGames } from '@melee/protocol/game'
import type { RoomSettings } from '@melee/protocol/room'

import { isPlayableAloud } from '@melee/core/room/game-capabilities'
import { isJudgedInEveryMode } from '@melee/core/room/game-modes'
import {
  type HostPreferences,
  rememberedSetupFor
} from '@melee/core/room/host-preferences'
import { kindsInLineUp, toggledInLineUp } from '@melee/core/room/line-up'

import { TickShelf } from '@/presentation/components/box-shelf'
import { GameIcon } from '@/presentation/components/icons'
import { useI18n } from '@/presentation/i18n/i18n-provider'
import { gameNameKey, gameTaglineKey } from '@/presentation/i18n/translation'

type GamePickerProps = {
  /** The socket is closed, or a round is under way and the server would refuse the switch. */
  isDisabled: boolean
  onChange: (settings: RoomSettings) => void
  /** What this host last left each game set to, or `null` if they never set anything. */
  preferences: HostPreferences | null
  settings: RoomSettings
}

/**
 * What the room is playing, and nothing is ticked until somebody says. A room
 * is opened before the table decides — the code goes up, the players arrive,
 * and this is the decision they are waiting on, which is why the lobby shows
 * it on the stage and every later phase keeps it with the settings.
 *
 * One game ticked is a room playing that game; several are the games of the
 * evening, which the next round is drawn from. Switching games is ticking the
 * new one and taking the old one out, because the last one cannot be.
 */
export const GamePicker: React.FC<GamePickerProps> = ({
  isDisabled,
  onChange,
  preferences,
  settings
}) => {
  const { locale, translate } = useI18n()
  const rememberedFor = (game: GameKind) =>
    rememberedSetupFor({ game, preferences })
  const ticked = kindsInLineUp(settings.lineUp)

  const options = shelvedGames.map((game) => {
    const playsAloud = isPlayableAloud({ game, teams: settings.teams })

    return {
      badge:
        settings.lineUp.length > 1 && settings.game?.kind === game
          ? translate('host.lineUp.first')
          : undefined,
      description: translate(
        playsAloud ? gameTaglineKey(game) : 'team.aloud.needsScreens'
      ),
      icon: <GameIcon game={game} />,
      isDisabled: !playsAloud || (ticked.length === 1 && ticked.includes(game)),
      label: translate(gameNameKey(game)),
      mark: isJudgedInEveryMode(game)
        ? translate('host.judgedMark')
        : undefined,
      spine: `var(--spine-${game})`,
      value: game
    }
  })

  return (
    <TickShelf
      className='game-picker'
      isDisabled={isDisabled}
      label={translate('host.game.label')}
      onChange={(nowTicked) => {
        const toggled = shelvedGames.find(
          (game) => nowTicked.includes(game) !== ticked.includes(game)
        )

        if (toggled !== undefined) {
          onChange(
            toggledInLineUp({ game: toggled, locale, rememberedFor, settings })
          )
        }
      }}
      options={options}
      value={ticked}
    />
  )
}
