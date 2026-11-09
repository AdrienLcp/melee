import type React from 'react'

import type { PlayerId } from '@melee/protocol/identifiers'
import type { PublicPlayer, RoundView } from '@melee/protocol/room'

import { roundPlacingOf } from '@melee/core/scoring/scoreboard'

import { revealedColoursInOrder, swatchContent } from '@/helpers/round-content'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { Pawn } from './pawn'
import { AwardFigure } from './round-podium'
import { SwatchChip } from './swatch-chip'
import { VisuallyHidden } from './visually-hidden'

import './swatch-guesses.sass'

type SwatchGuessesProps = {
  /**
   * `grid` deals the chips across a box its owner fits them into, the name
   * and points under each — the wall and the console; `rows` is one seat a
   * line, read down a page that scrolls — a player's screen.
   */
  layout: 'grid' | 'rows'
  /** Needed to turn the colours' player ids into names and pawns. */
  players: readonly PublicPlayer[]
  /** The list itself, for an owner that measures it. */
  ref?: React.Ref<HTMLOListElement>
  round: RoundView
  /** The seat this screen holds, in the keyline; `null` on a screen nobody sits at. */
  youId: PlayerId | null
}

/** Places past this are read off the order, not printed. */
const PLACES_PRINTED = 3

/**
 * Every seat's rebuilt colour on a chip split with the one shown, nearest
 * first, each under its pawn and name with what the round paid it. A shades
 * round pays nothing for speed, so nearest first is the round's own order and
 * the first three carry their place: this is the round's podium, whole.
 */
export const SwatchGuesses: React.FC<SwatchGuessesProps> = ({
  layout,
  players,
  ref,
  round,
  youId
}) => {
  const translate = useTranslate()
  const shown = swatchContent(round)?.colour ?? null

  if (shown === null) {
    return null
  }

  const seatOf = (playerId: string): number =>
    players.findIndex((player) => player.id === playerId)

  return (
    <ol
      aria-label={translate('swatch.reveal.table')}
      className='swatch-guesses'
      data-layout={layout}
      ref={ref}
    >
      {revealedColoursInOrder(round).map((guess, order) => {
        const award = round.awards.find(
          (each) => each.playerId === guess.playerId
        )
        const placing = roundPlacingOf({
          awards: round.awards,
          playerId: guess.playerId
        })
        const isYours = guess.playerId === youId

        return (
          <li
            className={isYours ? 'you' : undefined}
            key={guess.playerId}
            style={{ '--order': order }}
          >
            <span className='slot'>
              <SwatchChip against={shown} colour={guess.colour} />
            </span>
            <span className='seat'>
              {placing !== null && placing <= PLACES_PRINTED && (
                <span className='place'>{placing}</span>
              )}
              <Pawn seat={seatOf(guess.playerId)} />
              <span className='nickname'>
                {players[seatOf(guess.playerId)]?.nickname ?? '—'}
              </span>
              {isYours && (
                <VisuallyHidden elementType='span'>
                  {` (${translate('player.you')})`}
                </VisuallyHidden>
              )}
            </span>
            {award !== undefined && award.points > 0 ? (
              <AwardFigure
                award={award}
                walked={players[seatOf(guess.playerId)]?.board?.move ?? null}
              />
            ) : (
              <span className='points'>0</span>
            )}
          </li>
        )
      })}
    </ol>
  )
}
