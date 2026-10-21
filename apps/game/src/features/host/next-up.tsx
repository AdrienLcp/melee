import type React from 'react'

import type { GameSettings } from '@melee/protocol/game'
import type { PublicPlayer } from '@melee/protocol/room'

import { GameIcon } from '@/presentation/components/icons'
import { Pawn } from '@/presentation/components/pawn'
import { VisuallyHidden } from '@/presentation/components/visually-hidden'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { useLineUpEntryNames } from '@/presentation/i18n/line-up-entry-names'

import './next-up.sass'

type NextUpProps = {
  /** The entry the next round is played on — drawn, or picked by the host since. */
  at: number
  lineUp: readonly GameSettings[]
  players: readonly PublicPlayer[]
}

/**
 * What an evening does next, under the reveal the room is still reading: the
 * game the next round is on, as the lid of its box, and who is back at the
 * table — the pawns of the seats that pressed *ready*, standing, beside the
 * outlines of the ones still away. It says who, never waits on them: the host
 * starts when they like.
 */
export const NextUp: React.FC<NextUpProps> = ({ at, lineUp, players }) => {
  const translate = useTranslate()
  const name = useLineUpEntryNames(lineUp)[at]
  const game = lineUp[at]?.kind
  const readyCount = players.filter((player) => player.isReady).length

  if (game === undefined) {
    return null
  }

  return (
    <section className='next-up'>
      <p className='next-game' style={{ '--spine': `var(--spine-${game})` }}>
        <span className='then'>{translate('host.lineUp.next')}</span>
        <span className='name'>
          <GameIcon game={game} />
          {name}
        </span>
      </p>
      {players.length > 0 && (
        <div className='ready'>
          <p className='count' role='status'>
            {translate('host.lineUp.ready', {
              count: readyCount,
              total: players.length
            })}
          </p>
          <ul>
            {players.map((player, seat) => (
              <li data-ready={player.isReady || undefined} key={player.id}>
                <Pawn seat={seat} />
                <VisuallyHidden elementType='span'>
                  {player.nickname}
                </VisuallyHidden>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
