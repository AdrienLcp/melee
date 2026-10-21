import type React from 'react'

import type { PublicPlayer, RoundView } from '@melee/protocol/room'

import { buildCountedBoard } from '@melee/core/innerclock/counted-board'

import { innerclockContent } from '@/helpers/round-content'
import { CountPrompt } from '@/presentation/components/count-prompt'
import { Pawn } from '@/presentation/components/pawn'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './reaction-board.sass'
import './counted-board.sass'

type CountedBoardProps = {
  /** Needed to turn the presses' player ids into names and pawns. */
  players: readonly PublicPlayer[]
  round: RoundView
}

const SECOND_MS = 1_000

/**
 * What a count turned out to be: the target, then every seat closest first —
 * the time it stopped at, how far off, and what that paid — and under them the
 * seats that never pressed. Drawn on the reflex board's chips, because it is
 * the same act read the same way: a finishing order with a number on each row.
 */
export const CountedBoard: React.FC<CountedBoardProps> = ({
  players,
  round
}) => {
  const translate = useTranslate()
  const content = innerclockContent(round)

  if (content === null) {
    return null
  }

  const rows = buildCountedBoard({
    openedWithPlayerIds: round.openedWithPlayerIds ?? [],
    presses: content.revealedPresses ?? [],
    startsAt: round.startsAt,
    targetSeconds: content.targetSeconds
  })

  const nameOf = (playerId: string): string =>
    players.find((player) => player.id === playerId)?.nickname ?? '—'

  const seatOf = (playerId: string): number =>
    players.findIndex((player) => player.id === playerId)

  const paidTo = (playerId: string): number =>
    round.awards.find((award) => award.playerId === playerId)?.points ?? 0

  return (
    <div className='counted-board'>
      <CountPrompt isCompact targetSeconds={content.targetSeconds} />
      {rows.every((row) => row.kind === 'silent') ? (
        <p className='nobody'>{translate('innerclock.nobody')}</p>
      ) : (
        <ol
          className='reaction-board'
          style={{ '--outcome-rows': rows.length }}
        >
          {rows.map((row, place) => (
            <li
              className={
                row.kind === 'silent'
                  ? 'jumped'
                  : place === 0
                    ? 'first'
                    : 'pressed'
              }
              key={row.playerId}
            >
              <span aria-hidden='true' className='place'>
                {row.kind === 'silent' ? null : place + 1}
              </span>
              <Pawn seat={seatOf(row.playerId)} />
              <span className='nickname'>{nameOf(row.playerId)}</span>
              {row.kind === 'silent' ? (
                <span className='reaction'>
                  {translate('innerclock.silent')}
                </span>
              ) : (
                <>
                  <span className='reaction'>
                    {translate('innerclock.counted', {
                      seconds: row.countedMs / SECOND_MS
                    })}
                  </span>
                  <span className='gap'>
                    {translate('innerclock.gap', {
                      seconds: row.gapMs / SECOND_MS
                    })}
                  </span>
                  <span className='paid'>
                    {translate('round.scored', {
                      points: paidTo(row.playerId)
                    })}
                  </span>
                </>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
