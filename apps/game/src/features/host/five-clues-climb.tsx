import type React from 'react'
import { useState } from 'react'

import type { CluesStanding } from '@melee/protocol/five-clues'
import type { PlayerId } from '@melee/protocol/identifiers'
import type { PublicPlayer, RoundView } from '@melee/protocol/room'

import type { ClockEstimate } from '@melee/core/time/clock-sync'

import { PrintedChoices } from '@/features/player/printed-choices'
import { fiveCluesContent } from '@/helpers/round-content'
import {
  FiveCluesLadder,
  type RungState
} from '@/presentation/components/five-clues-ladder'
import { FiveCluesWindow } from '@/presentation/components/five-clues-window'
import { LockIcon } from '@/presentation/components/icons'
import { Pawn } from '@/presentation/components/pawn'
import { VisuallyHidden } from '@/presentation/components/visually-hidden'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './five-clues-climb.sass'

/** Past this many finders a rung prints their pawns alone, the names in the accessible text: the wall never scrolls. */
const MOST_NAMED_ON_A_RUNG = 6

type FiveCluesClimbProps = {
  clock: ClockEstimate | null
  /**
   * The climb drawn again over one the room was already watching — under a
   * floor, and once it is handed back: what stood on the ladder stays put
   * rather than landing and hopping on a second time, and only what changes
   * after moves.
   */
  isResumed: boolean
  players: readonly PublicPlayer[]
  round: RoundView
}

type Climber = { player: PublicPlayer; seat: number }

/**
 * The climb on the room's screen: the five rungs, each finder standing on
 * the rung it found on, the crowd still climbing on the open one — a seat
 * the floor locked out marked so until the next clue — and the seats out in
 * a box of their own. Never a guess: the standings carry none.
 */
export const FiveCluesClimb: React.FC<FiveCluesClimbProps> = ({
  clock,
  isResumed,
  players,
  round
}) => {
  const translate = useTranslate()
  const content = fiveCluesContent(round)
  const [stillThrough] = useState(() =>
    isResumed ? (content?.openClueIndex ?? -1) : -1
  )
  const [stillFinders] = useState(
    () =>
      new Set(
        isResumed
          ? (content?.standings ?? [])
              .filter((standing) => standing.status === 'found')
              .map((standing) => standing.playerId)
          : []
      )
  )

  if (content === null) {
    return null
  }

  const climberOf = (playerId: PlayerId): Climber | null => {
    const seat = players.findIndex((player) => player.id === playerId)
    const player = players[seat]

    return player === undefined ? null : { player, seat }
  }
  const climbersWhere = (
    isWhere: (standing: CluesStanding) => boolean
  ): Climber[] =>
    content.standings
      .filter(isWhere)
      .map((standing) => climberOf(standing.playerId))
      .filter((climber) => climber !== null)
  const racing = climbersWhere((standing) => standing.status === 'racing')
  const out = climbersWhere((standing) => standing.status === 'out')
  const stamped = climbersWhere(() => true)
  const racingIds = new Set(racing.map(({ player }) => player.id))
  const outIds = new Set(out.map(({ player }) => player.id))

  const peopleOf = (clueIndex: number, state: RungState): React.ReactNode => {
    const finders = climbersWhere(
      (standing) =>
        standing.status === 'found' && standing.clueIndex === clueIndex
    )

    return (
      <div
        className='rung-people'
        data-crowded={finders.length > MOST_NAMED_ON_A_RUNG || undefined}
      >
        {finders.length > 0 && (
          <ul className='finders'>
            {finders.map(({ player, seat }) => (
              <li
                className='finder'
                data-still={stillFinders.has(player.id) || undefined}
                key={player.id}
              >
                <Pawn seat={seat} />
                <span className='name'>{player.nickname}</span>
              </li>
            ))}
          </ul>
        )}
        <div
          className='crowd fold'
          data-open={state === 'open' || undefined}
          data-still={clueIndex <= stillThrough || undefined}
          inert={state !== 'open'}
        >
          <p>
            <span aria-hidden className='pawns'>
              {stamped.map(({ player, seat }, at) => (
                <span
                  className='climbing'
                  data-left={!racingIds.has(player.id) || undefined}
                  data-locked={
                    round.lockedOutPlayerIds.includes(player.id) || undefined
                  }
                  key={player.id}
                  style={{ '--climber-at': at }}
                >
                  <Pawn seat={seat} />
                  <span className='lock'>
                    <LockIcon />
                  </span>
                </span>
              ))}
            </span>
            <span className='count'>{racing.length}</span>
            <VisuallyHidden elementType='span'>
              {translate('fiveclues.climbing', { count: racing.length })}
            </VisuallyHidden>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='five-clues-climb' data-mode={round.answerMode}>
      <FiveCluesLadder
        clues={content.clues}
        openClueIndex={content.openClueIndex}
        peopleOf={peopleOf}
        size='wall'
        stillThrough={stillThrough}
        subject={content.subject}
        window={<FiveCluesWindow clock={clock} content={content} />}
      />
      <div className='foot'>
        {round.answerMode === 'choice' && <PrintedChoices round={round} />}
        <p className='out' data-open={out.length > 0 || undefined}>
          <span aria-hidden className='pawns'>
            {stamped.map(({ player, seat }) => (
              <span
                className='gone'
                data-left={!outIds.has(player.id) || undefined}
                key={player.id}
              >
                <Pawn seat={seat} />
              </span>
            ))}
          </span>
          <span className='count'>{out.length}</span>
          <VisuallyHidden elementType='span'>
            {translate('fiveclues.outCount', { count: out.length })}
          </VisuallyHidden>
        </p>
      </div>
    </div>
  )
}
