import type React from 'react'

import { LONGEST_WORD_LETTER_COUNT } from '@melee/protocol/longest-word'
import type { PublicPlayer, RoundView } from '@melee/protocol/room'

import { longestWordContent } from '@/helpers/round-content'
import { Pawn } from '@/presentation/components/pawn'
import { VisuallyHidden } from '@/presentation/components/visually-hidden'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { MOST_TOWERS_IN_A_ROW } from './mystery-word-towers'

import './longest-word-towers.sass'

const STEPS = Array.from({ length: LONGEST_WORD_LETTER_COUNT }, (_, at) => at)

type LongestWordTowersProps = {
  players: readonly PublicPlayer[]
  round: RoundView
}

/**
 * Every seat's longest word as a tower of face-down tiles the room reads from
 * across it: as tall as the word, its length on top, and never a letter.
 * Built on the mystery word's towers, which it shares a shape with.
 */
export const LongestWordTowers: React.FC<LongestWordTowersProps> = ({
  players,
  round
}) => {
  const translate = useTranslate()
  const content = longestWordContent(round)

  if (content === null) {
    return null
  }

  const seats = players
    .map((player, seat) => ({ player, seat }))
    .filter(
      ({ player }) => round.openedWithPlayerIds?.includes(player.id) ?? true
    )
  const rowCount = seats.length > MOST_TOWERS_IN_A_ROW ? 2 : 1

  return (
    <ol
      className='mystery-word-towers longest-word-towers'
      style={{
        '--tower-columns': Math.max(1, Math.ceil(seats.length / rowCount)),
        '--tower-rows': rowCount,
        '--tower-steps': LONGEST_WORD_LETTER_COUNT
      }}
    >
      {seats.map(({ player, seat }) => {
        const length =
          content.lengths.find((held) => held.playerId === player.id)?.length ??
          null

        return (
          <li
            className='tower'
            data-held={length !== null || undefined}
            key={player.id}
          >
            <div aria-hidden className='stack'>
              {/* Keyed on the length, so a longer word swaps the figure in. */}
              <span className='count' key={length ?? 0}>
                {length}
              </span>
              <ol className='tube'>
                {STEPS.map((step) => (
                  <li
                    data-on={(length !== null && step < length) || undefined}
                    key={step}
                    style={{ '--step': step }}
                  />
                ))}
              </ol>
            </div>
            <Pawn seat={seat} />
            <span aria-hidden className='name'>
              {player.nickname}
            </span>
            <VisuallyHidden elementType='span'>
              {length === null
                ? translate('longestword.tower.none', {
                    name: player.nickname
                  })
                : translate('longestword.tower.best', {
                    count: length,
                    name: player.nickname
                  })}
            </VisuallyHidden>
          </li>
        )
      })}
    </ol>
  )
}
