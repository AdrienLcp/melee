import type React from 'react'
import { ToggleButton } from 'react-aria-components'

import type { PetitBacSettledLine } from '@melee/protocol/petit-bac'
import type { PublicPlayer, RoundView } from '@melee/protocol/room'

import { PETIT_BAC_POINTS } from '@melee/core/petitbac/sheet-pay'
import { answerGroupKey } from '@melee/core/round/answer-groups'

import { petitBacCategoryId } from '@/features/player/petit-bac-sheet'
import { petitBacContent } from '@/helpers/round-content'
import { shownPoints } from '@/helpers/shown-points'
import { Pawn } from '@/presentation/components/pawn'
import { VisuallyHidden } from '@/presentation/components/visually-hidden'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { petitBacCategoryName } from '@/presentation/i18n/petit-bac-category-name'

import './petit-bac-grid.sass'

/** A word the console strikes out over the votes, or puts back. */
export type PetitBacStrike = {
  categoryIndex: number
  isStruck: boolean
  rowKey: string
}

type PetitBacGridProps = {
  /** Present on the console alone: every word on the letter becomes a press that strikes it out or puts it back. */
  onStrike?: (strike: PetitBacStrike) => void
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
  onStrike,
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
                      {onStrike !== undefined &&
                      line !== null &&
                      canBeStruck(line) ? (
                        <ToggleButton
                          aria-label={translate('petitbac.reveal.strike', {
                            answer: line.text
                          })}
                          className='strike'
                          isSelected={line.isStruck}
                          onChange={(isStruck) =>
                            onStrike({
                              categoryIndex: index,
                              isStruck,
                              rowKey: answerGroupKey(line.text)
                            })
                          }
                        >
                          {line.text}
                        </ToggleButton>
                      ) : line?.text ? (
                        <span className='answer'>{line.text}</span>
                      ) : (
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
        {onStrike !== undefined && (
          <span className='strike-hint'>
            {translate('petitbac.reveal.strikeHint')}
          </span>
        )}
      </p>
    </div>
  )
}

/**
 * A word the room kept, or one the console struck: a word the vote refused
 * stays the vote's, and a blank or off-the-letter line was never a word.
 */
const canBeStruck = (line: PetitBacSettledLine): boolean =>
  line.isStruck || line.outcome === 'unique' || line.outcome === 'shared'
