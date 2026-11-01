import type React from 'react'

import type { PlayerId } from '@melee/protocol/identifiers'
import type { PublicPlayer, RoundView } from '@melee/protocol/room'

import { roundPlacingOf } from '@melee/core/scoring/scoreboard'

import {
  matchsticksContent,
  revealedInOrder,
  swatchContent
} from '@/helpers/round-content'
import { shownPoints } from '@/helpers/shown-points'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { MatchstickRow } from './matchstick-row'
import { Pawn } from './pawn'
import { SwatchChip } from './swatch-chip'
import { useAnswerWords } from './use-distance-words'
import { VisuallyHidden } from './visually-hidden'

import './round-podium.sass'

type RoundPodiumProps = {
  /** Needed to turn the awards' player ids into names and pawns. */
  players: readonly PublicPlayer[]
  round: RoundView
  /** Draws a seat's own answer beside its name; omitted where nobody's words were the answer. */
  wordsOf?: (playerId: string, said: string) => React.ReactNode
  /** The seat this screen holds, in the keyline; omitted or `null` on a screen nobody sits at. */
  youId?: PlayerId | null
}

const PODIUM_PLACES = 3

/**
 * What a seat said, drawn the way the round showed it: a rebuilt colour on a
 * chip, a moved stick on its slip — `6+4=10` in type is not what anybody
 * looked at for a minute — and the words everywhere else.
 */
export const useWordsOf = (
  round: RoundView
): ((playerId: string, said: string) => React.ReactNode) => {
  const matchsticks = matchsticksContent(round)
  const moves = matchsticks?.revealedMoves ?? []
  const isShades = swatchContent(round) !== null

  return (playerId, said) => {
    if (isShades) {
      return <SwatchChip colour={said} />
    }

    const sent = moves.find((move) => move.playerId === playerId)

    return sent === undefined ? (
      said
    ) : (
      <MatchstickRow
        glyphs={matchsticks?.puzzle.glyphs ?? ''}
        isStill
        move={sent.move}
      />
    )
  }
}

/**
 * The round's podium: the seats it paid the most, each at its place in the
 * round with what it said, over how many of those it opened on scored. Every
 * figure on it is the round's — the game so far is the standings' — so it
 * never grows past three.
 */
export const RoundPodium: React.FC<RoundPodiumProps> = ({
  players,
  round,
  wordsOf,
  youId
}) => {
  const translate = useTranslate()
  const answerWords = useAnswerWords(round)
  const scorers = round.awards
    .filter((award) => award.points > 0)
    .toSorted((left, right) => right.points - left.points)
  const podium = scorers.slice(0, PODIUM_PLACES)
  const answers = revealedInOrder(round)
  const stampedCount = round.openedWithPlayerIds?.length ?? players.length

  const nameOf = (playerId: string): string =>
    players.find((player) => player.id === playerId)?.nickname ?? '—'

  const seatOf = (playerId: string): number =>
    players.findIndex((player) => player.id === playerId)

  const unsentScorers = scorers
    .filter((award) => award.isUnsent)
    .map((award) => award.playerId)

  // A table answering aloud holds no seat, and its scores are the teams'.
  if (players.length === 0) {
    return null
  }

  if (scorers.length === 0) {
    return <p className='round-nobody'>{translate('round.nobody')}</p>
  }

  return (
    <div className='round-podium'>
      <ol className='podium'>
        {podium.map((award) => {
          const answer = answers.find(
            (said) => said.playerId === award.playerId
          )
          const words = answer === undefined ? null : answerWords(answer)

          return (
            <li
              className={award.playerId === youId ? 'you' : undefined}
              key={award.playerId}
            >
              <span className='place'>
                {roundPlacingOf({
                  awards: round.awards,
                  playerId: award.playerId
                })}
              </span>
              <Pawn seat={seatOf(award.playerId)} />
              <span className='nickname'>{nameOf(award.playerId)}</span>
              {award.playerId === youId && (
                <VisuallyHidden elementType='span'>
                  {` (${translate('player.you')})`}
                </VisuallyHidden>
              )}
              {wordsOf !== undefined && words !== null && (
                <span
                  className='words'
                  data-figure={words.isFigure || undefined}
                >
                  {wordsOf(award.playerId, words.text)}
                </span>
              )}
              <span className='points'>
                {award.speedBonus > 0
                  ? translate('round.awardWithSpeed', {
                      answer: shownPoints(award.points - award.speedBonus),
                      speed: shownPoints(award.speedBonus)
                    })
                  : translate('round.scored', {
                      points: shownPoints(award.points)
                    })}
              </span>
            </li>
          )
        })}
      </ol>
      <p className='found'>
        {scorers.length > 1 && (
          <span className='others'>
            {translate('round.othersScored', { count: scorers.length - 1 })}
          </span>
        )}
        <span>
          {translate('round.found', {
            found: scorers.length,
            total: stampedCount
          })}
        </span>
        {unsentScorers.length > 0 && (
          <span className='unsent'>
            {translate('round.unsentSeats', {
              names: unsentScorers.map(nameOf).join(', ')
            })}
          </span>
        )}
      </p>
    </div>
  )
}
