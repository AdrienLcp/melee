import type React from 'react'
import { useRef } from 'react'

import type { PlayerId } from '@melee/protocol/identifiers'
import type { Calculation } from '@melee/protocol/make-number'
import type { PublicPlayer, RoundView } from '@melee/protocol/room'

import {
  calculationLines,
  calculationValue,
  OPERATOR_SIGNS
} from '@melee/core/makenumber/calculation-check'

import { nameWithin, wordsOf } from '@/helpers/make-number-ladder'
import { makeNumberContent } from '@/helpers/round-content'
import { shownPoints } from '@/helpers/shown-points'
import { CheckIcon } from '@/presentation/components/icons'
import { Pawn } from '@/presentation/components/pawn'
import { VisuallyHidden } from '@/presentation/components/visually-hidden'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { useRankingFold } from './use-ranking-fold'

import './make-number-ranking.sass'

const writtenSteps = ({
  steps,
  tiles
}: {
  steps: Calculation | null
  tiles: readonly number[]
}): string[] =>
  steps === null
    ? []
    : (calculationLines({ steps, tiles }) ?? []).map(
        (line) =>
          `${line.left} ${OPERATOR_SIGNS[line.operator]} ${line.right} = ${line.result}`
      )

type MakeNumberRankingProps = {
  players: readonly PublicPlayer[]
  round: RoundView
  /** The seated host's own row, marked among the others; `null` on a screen nobody sits at. */
  youId: PlayerId | null
}

/**
 * Every seat's kept calculation laid out at the reveal, nearest first — the
 * clock settling a tie — each with its value, how far it fell and the pay.
 * On the wall it gives way rather than scroll: the furthest rows fold to
 * their name and value first, then two columns where the shape allows.
 */
export const MakeNumberRanking: React.FC<MakeNumberRankingProps> = ({
  players,
  round,
  youId
}) => {
  const translate = useTranslate()
  const list = useRef<HTMLOListElement>(null)
  const content = makeNumberContent(round)
  const tiles = content?.tiles ?? []
  const target = content?.target ?? 0
  const ranked = players
    .map((player, seat) => {
      const award = round.awards.find((paid) => paid.playerId === player.id)
      const steps =
        content?.revealedCalculations?.find(
          (held) => held.playerId === player.id
        )?.steps ?? null
      const value = steps === null ? null : calculationValue({ steps, tiles })

      return {
        distance: value === null ? null : Math.abs(value - target),
        isUnsent: award?.isUnsent ?? false,
        player,
        points: award?.points ?? 0,
        seat,
        steps: writtenSteps({ steps, tiles }),
        value
      }
    })
    .filter(
      ({ player }) => round.openedWithPlayerIds?.includes(player.id) ?? true
    )
    .toSorted(
      (left, right) =>
        (left.distance ?? Number.POSITIVE_INFINITY) -
          (right.distance ?? Number.POSITIVE_INFINITY) ||
        right.points - left.points ||
        left.seat - right.seat
    )
  const stepCharacters = ranked.map(({ steps }) =>
    steps.length === 0 ? 0 : steps.join('   ').length
  )
  const fold = useRankingFold({ list, stepCharacters })

  if (content === null) {
    return null
  }

  return (
    <ol
      aria-label={translate('makenumber.reveal.ranking')}
      className='make-number-ranking'
      data-columns={fold?.columns}
      ref={list}
      style={
        fold === null
          ? {}
          : {
              '--rank-columns': fold.columns,
              '--row-unit': `${fold.rowPx}px`,
              '--steps-room': `${fold.stepsRoom}px`
            }
      }
    >
      {ranked.map(
        ({ distance, isUnsent, player, points, seat, steps, value }, index) => {
          const rank =
            ranked.findIndex(
              (other) => other.distance === distance && other.points === points
            ) + 1
          const isFull =
            steps.length > 0 && (fold === null || index < fold.fullCount)

          return (
            <li
              className='rank-row'
              data-exact={distance === 0 || undefined}
              data-full={isFull || undefined}
              data-yours={player.id === youId || undefined}
              key={player.id}
              style={{
                '--rank': index,
                '--row-height':
                  fold === null
                    ? 'auto'
                    : `${Math.floor(fold.heights[index] ?? 0)}px`,
                '--step-characters': Math.max(1, stepCharacters[index] ?? 1),
                '--step-lines': Math.max(1, fold?.stepLines[index] ?? 1)
              }}
            >
              <span className='rank'>{distance === null ? '' : rank}</span>
              <Pawn seat={seat} />
              <span aria-hidden className='name'>
                {wordsOf(
                  fold === null
                    ? player.nickname
                    : nameWithin({
                        name: player.nickname,
                        roomEm: fold.nameRoomEm
                      })
                )
                  .map((word, position) => ({ position, word }))
                  .map(({ position, word }) => (
                    <span key={position}>{word}</span>
                  ))}
              </span>
              <VisuallyHidden elementType='span'>
                {player.nickname}
              </VisuallyHidden>
              {value === null ? (
                <span className='value' data-none>
                  {translate('makenumber.reveal.none')}
                </span>
              ) : (
                <span className='value'>
                  <b className='figure'>{value}</b>
                  {distance === 0 ? (
                    <CheckIcon
                      aria-label={translate('makenumber.exact')}
                      className='stamp'
                    />
                  ) : (
                    <span className='distance'>
                      {translate('makenumber.distance', {
                        distance: distance ?? 0
                      })}
                    </span>
                  )}
                </span>
              )}
              <b className='pay' data-paid={points > 0 || undefined}>
                {points > 0
                  ? translate('round.scored', { points: shownPoints(points) })
                  : '0'}
              </b>
              {steps.length > 0 && (
                <span className='steps'>
                  {steps
                    .map((step, at) => ({ at, step }))
                    .map(({ at, step }) => (
                      <span className='step' key={at}>
                        {step}
                      </span>
                    ))}
                  {isUnsent && (
                    <em className='unsent'>
                      {translate('makenumber.reveal.unsent')}
                    </em>
                  )}
                </span>
              )}
            </li>
          )
        }
      )}
    </ol>
  )
}
