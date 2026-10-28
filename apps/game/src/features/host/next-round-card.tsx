import type React from 'react'

import type { HostRoomView } from '@melee/protocol/room'

import { endsTheEvening } from '@melee/core/room/next-game'

import { GameIcon } from '@/presentation/components/icons'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { useLineUpEntryNames } from '@/presentation/i18n/line-up-entry-names'

import { EveningStamp } from './evening-stamp'

import './next-round-card.sass'

type NextRoundCardProps = {
  /** What the host presses to go on: the reveal's actions. */
  children: React.ReactNode
  view: HostRoomView
}

/**
 * The round after the one on screen, on the podium, at the reveal: named,
 * stamped next, and holding the presses that open it — so the card the room
 * just read stays a result, and what comes next is read where it is listed.
 */
export const NextRoundCard: React.FC<NextRoundCardProps> = ({
  children,
  view
}) => {
  const translate = useTranslate()
  const { lineUp, lineUpAt } = view.settings
  const names = useLineUpEntryNames(lineUp)
  const name = lineUpAt === null ? undefined : names[lineUpAt]
  const game = lineUpAt === null ? undefined : lineUp[lineUpAt]?.kind
  // The next press ends the game rather than opening a round: nothing to name.
  const isEveningOver = endsTheEvening({
    lineUp,
    played: view.lineUpPlayed,
    roundCount: view.settings.roundCount,
    roundIndex: view.round?.index ?? 0
  })

  return (
    <section
      className='next-round-card'
      style={
        game === undefined ? undefined : { '--spine': `var(--spine-${game})` }
      }
    >
      {!isEveningOver && game !== undefined && name !== undefined && (
        <div className='headline'>
          <h3>
            <GameIcon game={game} />
            {translate('host.evening.roundNamed', {
              name,
              number: (view.round?.index ?? 0) + 1
            })}
          </h3>
          <EveningStamp kind='next' played={0} />
        </div>
      )}
      {children}
    </section>
  )
}
