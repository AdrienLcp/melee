import type React from 'react'

import type { PlayerId } from '@melee/protocol/identifiers'
import type { PublicPlayer, RoundView } from '@melee/protocol/room'

import { playersOfRound } from '@melee/core/round/round-roster'

import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { Pawn } from './pawn'
import { VisuallyHidden } from './visually-hidden'

import './think-alike-table.sass'

/** How far a laid card leans and strays from the middle of its place, at most. */
const MOST_TILT_DEGREES = 7
const MOST_STRAY_PERCENT = 9

/** A number from 0 to 1 that a seat's id always gives, so a card lies the same way on every screen and every frame. */
const fractionOf = ({ id, salt }: { id: PlayerId; salt: number }): number => {
  let hash = salt * 2_654_435_761

  for (const character of id) {
    hash = Math.imul(hash ^ character.charCodeAt(0), 2_246_822_519)
    hash ^= hash >>> 13
  }

  return ((hash >>> 0) % 1000) / 999
}

const spread = (fraction: number, most: number): number =>
  Math.round((fraction * 2 - 1) * most * 10) / 10

/** As square a grid as the table's shape allows, wider than tall. */
const columnsFor = ({
  count,
  isCompact
}: {
  count: number
  isCompact: boolean
}): number => Math.max(1, Math.ceil(Math.sqrt(count * (isCompact ? 1.5 : 2.2))))

type ThinkAlikeTableProps = {
  /** A seat's own copy under its laid card: smaller, and without the names still writing. */
  isCompact?: boolean
  players: readonly PublicPlayer[]
  round: RoundView
}

/**
 * The table the round's cards are laid on, face down, each marked with its
 * seat's pawn and landing where that seat's place is as it sends — and, on
 * the room's screen, the names still writing beside it. It says _who_, never
 * _what_: nothing on it is a word.
 */
export const ThinkAlikeTable: React.FC<ThinkAlikeTableProps> = ({
  isCompact = false,
  players,
  round
}) => {
  const translate = useTranslate()
  const owed = playersOfRound({
    openedWithPlayerIds: round.openedWithPlayerIds,
    players
  })
  const sentIds = new Set(round.answers.map((answer) => answer.playerId))
  const laidCount = owed.filter((player) => sentIds.has(player.id)).length
  const waitingCount = owed.length - laidCount
  const columns = columnsFor({ count: owed.length, isCompact })

  return (
    <section
      className='think-alike-table'
      data-compact={isCompact || undefined}
    >
      <div className='cloth'>
        <VisuallyHidden elementType='p'>
          {translate('thinkalike.table', {
            count: laidCount,
            total: owed.length
          })}
        </VisuallyHidden>
        <ol
          aria-hidden
          className='places'
          style={{
            '--columns': columns,
            '--rows': Math.max(1, Math.ceil(owed.length / columns))
          }}
        >
          {owed.map((player) => (
            <li key={player.id}>
              {sentIds.has(player.id) && (
                <span
                  className='laid-card'
                  style={{
                    '--stray-x': `${spread(fractionOf({ id: player.id, salt: 1 }), MOST_STRAY_PERCENT)}%`,
                    '--stray-y': `${spread(fractionOf({ id: player.id, salt: 2 }), MOST_STRAY_PERCENT)}%`,
                    '--tilt': `${spread(fractionOf({ id: player.id, salt: 3 }), MOST_TILT_DEGREES)}deg`
                  }}
                >
                  <span className='disc'>
                    <Pawn seat={players.indexOf(player)} />
                  </span>
                </span>
              )}
            </li>
          ))}
        </ol>
        {isCompact && (
          <p aria-hidden className='laid-count'>
            {laidCount}
            <span className='of'>/{owed.length}</span>
          </p>
        )}
      </div>
      {!isCompact && (
        <div className='writing'>
          <p className='waiting' role='status'>
            {translate('thinkalike.waiting', { count: waitingCount })}
          </p>
          <ul>
            {owed.map((player) => (
              <li
                data-sent={sentIds.has(player.id) || undefined}
                key={player.id}
              >
                <span className='name-chip'>
                  <Pawn seat={players.indexOf(player)} />
                  <span className='name'>{player.nickname}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
