import type React from 'react'

import type { PublicPlayer, RoundView } from '@melee/protocol/room'

import { playersOfRound } from '@melee/core/round/round-roster'

import { Pawn } from '@/presentation/components/pawn'
import { VisuallyHidden } from '@/presentation/components/visually-hidden'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './answered-pawns.sass'

type AnsweredPawnsProps = {
  players: readonly PublicPlayer[]
  round: RoundView
}

/**
 * Who is in and who the room is still waiting on, as the pawns the score track
 * already taught the table to read: standing for an answer sent, a dashed
 * outline for one still owed. It says *that*, never *what* — the room shares
 * this screen. A seat taken after the round opened is owed nothing this round,
 * so it is neither counted nor drawn.
 */
export const AnsweredPawns: React.FC<AnsweredPawnsProps> = ({
  players,
  round
}) => {
  const translate = useTranslate()
  const answeredIds = new Set(round.answers.map((answer) => answer.playerId))
  const owed = playersOfRound({
    openedWithPlayerIds: round.openedWithPlayerIds,
    players
  })
  const answeredCount = owed.filter((player) =>
    answeredIds.has(player.id)
  ).length

  return (
    <section className='answered-pawns'>
      <p className='count' role='status'>
        {translate('host.answered', {
          count: answeredCount,
          total: owed.length
        })}
      </p>
      <ul>
        {owed.map((player) => (
          <li
            data-answered={answeredIds.has(player.id) || undefined}
            key={player.id}
          >
            <Pawn seat={players.indexOf(player)} />
            <VisuallyHidden elementType='span'>
              {player.nickname}
            </VisuallyHidden>
          </li>
        ))}
      </ul>
    </section>
  )
}
