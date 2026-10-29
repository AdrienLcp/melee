import type React from 'react'
import { Button } from 'react-aria-components'

import { type GameKind, shelvedGames } from '@melee/protocol/game'
import type { RoomSettings } from '@melee/protocol/room'

import {
  capabilitiesOf,
  isPlayableAloud
} from '@melee/core/room/game-capabilities'
import { isJudgedInEveryMode } from '@melee/core/room/game-modes'

import { GameIcon, PlusIcon } from '@/presentation/components/icons'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { gameNameKey, gameTaglineKey } from '@/presentation/i18n/translation'

import './game-pick-list.sass'

type GamePickListProps = {
  /** Names the list for assistive technology; the page's heading shows it. */
  'aria-label': string
  /** The socket is closed: a press would send nothing. */
  isDisabled: boolean
  /** Only the games a round drawn by chance may land on: those serving their own content. */
  isDrawnOnly?: boolean
  /** This console holds a seat, so a judged game is one it sits out. */
  isSeated: boolean
  onPick: (game: GameKind) => void
  settings: RoomSettings
}

/**
 * Every game on the shelf as a ruled list, one press planning a round of it.
 * A game already planned says how many times, because a second press plans
 * another rather than opening the first.
 */
export const GamePickList: React.FC<GamePickListProps> = ({
  'aria-label': label,
  isDisabled,
  isDrawnOnly = false,
  isSeated,
  onPick,
  settings
}) => {
  const translate = useTranslate()
  const games = isDrawnOnly
    ? shelvedGames.filter((game) => capabilitiesOf(game).servesItsOwnContent)
    : shelvedGames

  return (
    <ul aria-label={label} className='game-pick-list'>
      {games.map((game) => {
        const playsAloud = isPlayableAloud({ game, teams: settings.teams })
        const planned = settings.lineUp.filter(
          (entry) => entry.kind === game
        ).length

        return (
          <li
            key={game}
            style={{
              '--spine': `var(--spine-${game})`,
              '--spine-ink': `var(--on-spine-${game})`
            }}
          >
            <Button
              className='pick'
              isDisabled={isDisabled || !playsAloud}
              onPress={() => {
                onPick(game)
              }}
            >
              <span className='tile'>
                <GameIcon game={game} />
              </span>
              <span className='name'>{translate(gameNameKey(game))}</span>
              <span className='blurb'>
                {translate(
                  playsAloud ? gameTaglineKey(game) : 'team.aloud.needsScreens'
                )}
              </span>
              {planned > 0 ? (
                <span className='mark' data-planned>
                  {translate('host.evening.planned', { count: planned })}
                </span>
              ) : (
                isJudgedInEveryMode(game) && (
                  <span className='mark'>
                    {translate(
                      isSeated ? 'host.judgedMark.you' : 'host.judgedMark.host'
                    )}
                  </span>
                )
              )}
              <PlusIcon />
            </Button>
          </li>
        )
      })}
    </ul>
  )
}
