import type React from 'react'

import { type GameKind, shelvedGames } from '@melee/protocol/game'
import type { RoomSettings } from '@melee/protocol/room'

import {
  capabilitiesOf,
  isPlayableAloud
} from '@melee/core/room/game-capabilities'
import {
  type HostPreferences,
  rememberedSetupFor
} from '@melee/core/room/host-preferences'
import { withEntryAdded } from '@melee/core/room/line-up'

import { PickShelf } from '@/presentation/components/box-shelf'
import { GameIcon } from '@/presentation/components/icons'
import { useI18n } from '@/presentation/i18n/i18n-provider'
import {
  gameNameKey,
  type PlainTranslationKey
} from '@/presentation/i18n/translation'

import { EveningPage } from './evening-page'

import './evening-add-page.sass'

const howItPlays = (game: GameKind): PlainTranslationKey =>
  capabilitiesOf(game).servesItsOwnContent
    ? 'host.evening.fills'
    : 'host.evening.once'

type EveningAddPageProps = {
  isLive: boolean
  /** Called with the room's settings once the round is added, and where it landed in the line-up. */
  onAdded: (settings: RoomSettings, at: number) => void
  onBack: () => void
  /** What this host last left each game set to, so a round joins on it. */
  preferences: HostPreferences | null
  settings: RoomSettings
}

/**
 * The shelf of games as a page, one press adding a round of it to the end of
 * the evening. Each box says whether its game fills the evening or is played
 * once, which is the one thing about it the list of rounds depends on.
 */
export const EveningAddPage: React.FC<EveningAddPageProps> = ({
  isLive,
  onAdded,
  onBack,
  preferences,
  settings
}) => {
  const { locale, translate } = useI18n()

  const options = shelvedGames.map((game) => {
    const playsAloud = isPlayableAloud({ game, teams: settings.teams })

    return {
      description: translate(
        playsAloud ? howItPlays(game) : 'team.aloud.needsScreens'
      ),
      icon: <GameIcon game={game} />,
      isDisabled: !playsAloud,
      label: translate(gameNameKey(game)),
      spine: `var(--spine-${game})`,
      value: game
    }
  })

  return (
    <EveningPage onBack={onBack}>
      <PickShelf
        className='evening-shelf'
        isDisabled={!isLive}
        label={translate('host.evening.pick')}
        onPick={(value) => {
          const game = shelvedGames.find((shelved) => shelved === value)

          if (game === undefined) {
            return
          }

          const added = withEntryAdded({
            game,
            locale,
            remembered: rememberedSetupFor({ game, preferences }),
            settings
          })

          if (added !== settings) {
            onAdded(added, added.lineUp.length - 1)
          }
        }}
        options={options}
      />
      <p className='hint'>{translate('host.evening.pickHint')}</p>
    </EveningPage>
  )
}
