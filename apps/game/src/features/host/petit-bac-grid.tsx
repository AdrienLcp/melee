import type React from 'react'

import type { PublicPlayer, RoundView } from '@melee/protocol/room'

import { PETIT_BAC_POINTS } from '@melee/core/petitbac/sheet-pay'

import { petitBacCategoryId } from '@/features/player/petit-bac-sheet'
import { petitBacContent } from '@/helpers/round-content'
import { Pawn } from '@/presentation/components/pawn'
import { VisuallyHidden } from '@/presentation/components/visually-hidden'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { petitBacCategoryName } from '@/presentation/i18n/petit-bac-category-name'

import './petit-bac-grid.sass'
import { shownPoints } from '@/helpers/shown-points'

type PetitBacGridProps = {
  /** Needed to turn the lines' player ids into names and pawns. */
  players: readonly PublicPlayer[]
  round: RoundView
}

/**
 * Every sheet of the round turned over at once: a row per seat, best round
 * first, a column per category, each line painted with what the room made of
 * it, and what the round paid at the end of the row.
 */
export const PetitBacGrid: React.FC<PetitBacGridProps> = ({
  players,
  round
}) => {
  const translate = useTranslate()
  const content = petitBacContent(round)

  if (content === null) {
    return null
  }

  const { categories, letter, lines } = content
  const pointsOf = (playerId: string): number =>
    round.awards.find((award) => award.playerId === playerId)?.points ?? 0
  const playedIds = new Set(
    lines.flatMap((categoryLines) =>
      (categoryLines ?? []).map((line) => line.playerId)
    )
  )
  const seats = players
    .map((player, seat) => ({ player, seat }))
    .filter(({ player }) => playedIds.has(player.id))
    .toSorted(
      (left, right) => pointsOf(right.player.id) - pointsOf(left.player.id)
    )

  return (
    <div
      className='petit-bac-grid'
      style={{ '--categories': categories.length, '--seats': seats.length }}
    >
      <table>
        <caption>
          <VisuallyHidden elementType='span'>
            {translate('petitbac.wall.grid', { letter })}
          </VisuallyHidden>
        </caption>
        <thead>
          <tr>
            <th className='corner' scope='col'>
              <span aria-hidden className='letter-piece'>
                {letter}
              </span>
            </th>
            {categories.map((category) => (
              <th key={petitBacCategoryId(category)} scope='col'>
                {petitBacCategoryName({ category, translate })}
              </th>
            ))}
            <th className='total' scope='col'>
              {translate('petitbac.wall.roundTotal')}
            </th>
          </tr>
        </thead>
        <tbody>
          {seats.map(({ player, seat }) => {
            const points = pointsOf(player.id)

            return (
              <tr key={player.id}>
                <th className='seat' scope='row'>
                  <span>
                    <Pawn seat={seat} />
                    <span className='name'>{player.nickname}</span>
                  </span>
                </th>
                {categories.map((category, index) => {
                  const line =
                    lines[index]?.find(
                      (candidate) => candidate.playerId === player.id
                    ) ?? null
                  const outcome = line?.outcome ?? 'empty'

                  return (
                    <td
                      data-outcome={outcome}
                      key={petitBacCategoryId(category)}
                    >
                      {line?.text || (
                        <VisuallyHidden elementType='span'>
                          {translate('petitbac.reveal.outcome.empty')}
                        </VisuallyHidden>
                      )}
                    </td>
                  )
                })}
                <td className='total'>
                  {points > 0
                    ? translate('round.scored', { points: shownPoints(points) })
                    : '0'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className='legend'>
        <span data-outcome='unique'>
          <i />
          {translate('petitbac.reveal.outcome.unique')}
          <b>
            {translate('round.scored', {
              points: shownPoints(PETIT_BAC_POINTS.unique)
            })}
          </b>
        </span>
        <span data-outcome='shared'>
          <i />
          {translate('petitbac.reveal.outcome.shared')}
          <b>
            {translate('round.scored', {
              points: shownPoints(PETIT_BAC_POINTS.shared)
            })}
          </b>
        </span>
        <span data-outcome='refused'>
          <i />
          {translate('petitbac.wall.legendNothing', { letter })}
        </span>
      </p>
    </div>
  )
}
