import type React from 'react'

import { MYSTERY_WORD_TRY_COUNT } from '@melee/protocol/mystery-word'
import type { PublicPlayer, RoundView } from '@melee/protocol/room'

import {
  foundOnTryOf,
  mostPlacedOf
} from '@melee/core/mysteryword/grid-reading'

import { mysteryWordContent } from '@/helpers/round-content'
import { CrownIcon } from '@/presentation/components/icons'
import { MarkShape } from '@/presentation/components/letter-cell'
import { Pawn } from '@/presentation/components/pawn'
import { VisuallyHidden } from '@/presentation/components/visually-hidden'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './mystery-word-towers.sass'

/** Past this many seats the towers stand in two rows: twelve abreast is as narrow as a name on two lines allows. */
const MOST_TOWERS_IN_A_ROW = 12

type MysteryWordTowersProps = {
  players: readonly PublicPlayer[]
  round: RoundView
}

/**
 * Every seat's search as a tower the room reads from across it: one step in
 * the place mark per letter in place on its best try, full and crowned once
 * found, its tries used under the name — and never a letter.
 */
export const MysteryWordTowers: React.FC<MysteryWordTowersProps> = ({
  players,
  round
}) => {
  const translate = useTranslate()
  const content = mysteryWordContent(round)

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
      className='mystery-word-towers'
      style={{
        '--tower-columns': Math.max(1, Math.ceil(seats.length / rowCount)),
        '--tower-rows': rowCount,
        '--tower-steps': content.length
      }}
    >
      {seats.map(({ player, seat }) => {
        const rows =
          content.grids.find((grid) => grid.playerId === player.id)?.rows ?? []
        const foundOnTry = foundOnTryOf(rows)
        const steps = foundOnTry === null ? mostPlacedOf(rows) : content.length

        return (
          <li
            className='tower'
            data-found={foundOnTry !== null || undefined}
            data-out={
              (foundOnTry === null && rows.length >= MYSTERY_WORD_TRY_COUNT) ||
              undefined
            }
            key={player.id}
          >
            <div aria-hidden className='stack'>
              <CrownIcon className='crown' />
              <ol className='tube'>
                {Array.from({ length: content.length }, (_, step) => step).map(
                  (step) => (
                    <li
                      data-on={step < steps || undefined}
                      key={step}
                      style={{ '--step': step }}
                    >
                      <MarkShape mark='placed' />
                    </li>
                  )
                )}
              </ol>
            </div>
            <Pawn seat={seat} />
            <span aria-hidden className='name'>
              {player.nickname}
            </span>
            <span aria-hidden className='tries'>
              {translate('mysteryword.tower.tries', {
                count: MYSTERY_WORD_TRY_COUNT,
                used: rows.length
              })}
            </span>
            <VisuallyHidden elementType='span'>
              {foundOnTry === null
                ? translate('mysteryword.tower.searching', {
                    count: rows.length,
                    name: player.nickname,
                    placed: steps
                  })
                : translate('mysteryword.tower.found', {
                    count: foundOnTry,
                    name: player.nickname
                  })}
            </VisuallyHidden>
          </li>
        )
      })}
    </ol>
  )
}
