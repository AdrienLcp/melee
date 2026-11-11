import type React from 'react'
import { useRef } from 'react'

import type { PlayerId } from '@melee/protocol/identifiers'
import type { PublicPlayer, RoundView } from '@melee/protocol/room'

import {
  foundOnTryOf,
  mostPlacedOf
} from '@melee/core/mysteryword/grid-reading'

import { mysteryWordContent } from '@/helpers/round-content'
import { shownPoints } from '@/helpers/shown-points'
import { LetterGrid } from '@/presentation/components/letter-grid'
import { Pawn } from '@/presentation/components/pawn'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { useFittedGrid } from './use-fitted-grid'

import './mystery-word-grids.sass'

/** A card's head over its grid, as a share of the card's width: a pawn, two lines of name and the pay. */
const CARD_HEAD_ASPECT = 0.42

type MysteryWordGridsProps = {
  players: readonly PublicPlayer[]
  round: RoundView
  /** The seated host's own grid, ringed among the others; `null` on a screen nobody sits at. */
  youId: PlayerId | null
}

/**
 * Every grid spelled out at the reveal, ordered by the try that found the
 * word and then by how close a seat came, each under its name and its pay:
 * the table reads what everyone typed for the first time. Dealt into the box
 * the panel leaves, the wall never scrolling.
 */
export const MysteryWordGrids: React.FC<MysteryWordGridsProps> = ({
  players,
  round,
  youId
}) => {
  const translate = useTranslate()
  const list = useRef<HTMLOListElement>(null)
  const content = mysteryWordContent(round)
  const ranked = players
    .map((player, seat) => {
      const tries =
        content?.revealedGrids?.find((grid) => grid.playerId === player.id)
          ?.tries ?? []
      const rows = tries.map((spelled) => spelled.marks)

      return {
        foundOnTry: foundOnTryOf(rows),
        mostPlaced: mostPlacedOf(rows),
        player,
        points:
          round.awards.find((award) => award.playerId === player.id)?.points ??
          0,
        seat,
        tries
      }
    })
    .filter(
      ({ player }) => round.openedWithPlayerIds?.includes(player.id) ?? true
    )
    .toSorted(
      (left, right) =>
        (left.foundOnTry ?? Number.MAX_SAFE_INTEGER) -
          (right.foundOnTry ?? Number.MAX_SAFE_INTEGER) ||
        right.mostPlaced - left.mostPlaced ||
        left.seat - right.seat
    )
  const length = content?.length ?? 0
  const aspect = length === 0 ? 1 : 6 / length + CARD_HEAD_ASPECT

  useFittedGrid({
    aspect,
    count: ranked.length,
    grid: list
  })

  if (content === null) {
    return null
  }

  return (
    <ol
      className='mystery-word-grids'
      ref={list}
      style={{ '--card-aspect': aspect }}
    >
      {ranked.map(({ player, points, seat, tries }, rank) => (
        <li
          className='grid-card'
          data-yours={player.id === youId || undefined}
          key={player.id}
          style={{ '--rank': rank }}
        >
          <header>
            <Pawn seat={seat} />
            <span className='name'>{player.nickname}</span>
            <b className='pay' data-paid={points > 0 || undefined}>
              {points > 0
                ? translate('round.scored', { points: shownPoints(points) })
                : '0'}
            </b>
          </header>
          <LetterGrid
            firstLetter={null}
            label={player.nickname}
            length={length}
            tries={tries}
            typing={null}
          />
        </li>
      ))}
    </ol>
  )
}
