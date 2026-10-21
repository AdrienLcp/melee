import type React from 'react'
import { useState } from 'react'

import { type GameKind, shelvedGames } from '@melee/protocol/game'
import type { RoomSettings } from '@melee/protocol/room'

import { isPlayableAloud } from '@melee/core/room/game-capabilities'
import {
  type HostPreferences,
  rememberedSetupFor
} from '@melee/core/room/host-preferences'
import { kindsInLineUp, toggledInLineUp } from '@melee/core/room/line-up'
import { movedToGame } from '@melee/core/room/room-settings'
import { isShelvedGame } from '@melee/core/room/shelved-game'

import { BoxShelf, TickShelf } from '@/presentation/components/box-shelf'
import { GameIcon } from '@/presentation/components/icons'
import { Switch } from '@/presentation/components/switch'
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
 * Which game the room is playing, and nothing is selected until somebody says.
 * A room is opened before the table decides — the code goes up, the players
 * arrive, and this is the decision they are waiting on, which is why the lobby
 * shows it on the stage and every later phase keeps it with the settings.
 *
 * One game is one press, exactly as a quick game has always been. *Several
 * games* turns the same shelf into ticks — the games of the evening, which the
 * next round is drawn from — so a host switching games does not have to tick
 * one and untick the other, and a host planning an evening sees it is one.
 */
export const GamePicker: React.FC<GamePickerProps> = ({
  isDisabled,
  onChange,
  preferences,
  settings
}) => {
  const { locale, translate } = useI18n()
  const [wantsSeveral, setWantsSeveral] = useState(settings.lineUp.length > 1)
  const isEvening = wantsSeveral || settings.lineUp.length > 1
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
      isDisabled:
        !playsAloud ||
        (isEvening && ticked.length === 1 && ticked.includes(game)),
      label: translate(gameNameKey(game)),
      spine: `var(--spine-${game})`,
      value: game
    }
  })

  const several = (
    <Switch
      className='several-games'
      isDisabled={isDisabled}
      isSelected={isEvening}
      label={translate('host.game.several')}
      onChange={(isSelected) => {
        setWantsSeveral(isSelected)

        // Back to one game is back to the one the next round is on.
        if (!isSelected && settings.game !== null) {
          onChange({ ...settings, lineUp: [settings.game], lineUpAt: 0 })
        }
      }}
    />
  )

  if (isEvening) {
    return (
      <TickShelf
        aside={several}
        className='game-picker'
        isDisabled={isDisabled}
        label={translate('host.game.labelSeveral')}
        onChange={(nowTicked) => {
          const toggled = shelvedGames.find(
            (game) => nowTicked.includes(game) !== ticked.includes(game)
          )

          if (toggled !== undefined) {
            onChange(
              toggledInLineUp({
                game: toggled,
                locale,
                rememberedFor,
                settings
              })
            )
          }
        }}
        options={options}
        value={ticked}
      />
    )
  }

  return (
    <BoxShelf
      aside={several}
      className='game-picker'
      isDisabled={isDisabled}
      label={translate('host.game.label')}
      onChange={(next) => {
        // One frame, whole settings: the server refuses a mode the new game
        // does not offer, so a room left on the old one between two presses
        // would be a round nobody could answer.
        if (isShelvedGame(next)) {
          onChange(
            movedToGame({
              game: next,
              locale,
              remembered: rememberedFor(next),
              settings
            })
          )
        }
      }}
      options={options}
      value={settings.game?.kind ?? null}
    />
  )
}
