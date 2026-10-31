import type React from 'react'

import type { PublicPlayer, RoundView } from '@melee/protocol/room'

import { playersOfRound } from '@melee/core/round/round-roster'

import { Pawn } from '@/presentation/components/pawn'
import { VisuallyHidden } from '@/presentation/components/visually-hidden'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './answered-pawns.sass'

type RoundPawnsProps = {
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
export const AnsweredPawns: React.FC<RoundPawnsProps> = ({
  players,
  round
}) => {
  const translate = useTranslate()
  const answeredIds = new Set(round.answers.map((answer) => answer.playerId))

  return (
    <PawnTally
      isStanding={(player) => answeredIds.has(player.id)}
      label={(count, total) => translate('host.answered', { count, total })}
      players={players}
      round={round}
    />
  )
}

/**
 * Who may still take the floor, on a round the first buzz decides: standing
 * for in play, a dashed outline for out of it until the next round or until the
 * host lets everyone back in. With nobody buzzing yet it is the one thing the
 * room's screen has to say beside the card.
 */
export const BuzzerPawns: React.FC<RoundPawnsProps> = ({ players, round }) => {
  const translate = useTranslate()
  const lockedOutIds = new Set(round.lockedOutPlayerIds)

  return (
    <PawnTally
      isStanding={(player) => !lockedOutIds.has(player.id)}
      label={(count, total) => translate('host.inPlay', { count, total })}
      players={players}
      round={round}
    />
  )
}

type PawnTallyProps = RoundPawnsProps & {
  isStanding: (player: PublicPlayer) => boolean
  label: (count: number, total: number) => string
}

const PawnTally: React.FC<PawnTallyProps> = ({
  isStanding,
  label,
  players,
  round
}) => {
  const owed = playersOfRound({
    openedWithPlayerIds: round.openedWithPlayerIds,
    players
  })
  const standingCount = owed.filter(isStanding).length

  return (
    <section className='answered-pawns'>
      <p className='count' role='status'>
        {label(standingCount, owed.length)}
      </p>
      <ul style={{ '--pawns': owed.length }}>
        {owed.map((player) => (
          <li data-answered={isStanding(player) || undefined} key={player.id}>
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
