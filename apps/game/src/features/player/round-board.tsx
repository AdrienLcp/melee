import type React from 'react'

import type { PlayerRoomView, RoundView } from '@melee/protocol/room'

import {
  buildScoreboard,
  hasAnybodyScored
} from '@melee/core/scoring/scoreboard'

import {
  atlasContent,
  nearnessOf,
  timelineContent
} from '@/helpers/round-content'
import { Pawn } from '@/presentation/components/pawn'
import { useAnswerWords } from '@/presentation/components/use-distance-words'
import { VisuallyHidden } from '@/presentation/components/visually-hidden'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './round-board.sass'
import { shownPoints } from '@/helpers/shown-points'

type RoundBoardProps = {
  /** The round as it revealed: what everyone said, and what it paid them. */
  round: RoundView
  /** The whole room — a board listing only the players who answered is not a
   *  standing, and where a round leaves everybody is half of what it is for. */
  view: PlayerRoomView
}

/**
 * The room's round on a player's screen: one row per player, ranked by where
 * the round left them, carrying what they said and what it paid. The console
 * draws those as two blocks side by side — the answers beside the reveal, the
 * standings beside that — because it is read across four metres by a group.
 * This is the same two things folded into the one list a screen read at forty
 * centimetres can hold, and it exists because the console is often somebody
 * else's.
 *
 * Each row is a chip, filled where the round was answered right and an empty
 * outline where it was not; your own carries a keyline rather than a repeat of
 * the payout above it.
 */
export const RoundBoard: React.FC<RoundBoardProps> = ({ round, view }) => {
  const translate = useTranslate()
  const answerWords = useAnswerWords(round)
  const isRanked = hasAnybodyScored(view.players)
  // The same rule the room's screen follows: a round nobody was paid for spends
  // nothing on a column of blanks, and one somebody was paid for keeps the box
  // on every row, or two answers end on two different right edges.
  const isPaying = round.awards.some((award) => award.points > 0)

  // Nobody has scored yet and nobody typed, so every column this board is made
  // of is empty and what is left is a roster — which is the one thing a reveal
  // is not for. The round's whole truth is then the answer above it and the
  // line under that.
  if (!isRanked && round.revealedAnswers.length === 0) {
    return null
  }

  return (
    <ol
      className={['round-board', isRanked && 'ranked', isPaying && 'paying']
        .filter(Boolean)
        .join(' ')}
      data-inline-words={
        atlasContent(round)?.direction === 'place' ||
        timelineContent(round) !== null ||
        undefined
      }
      // How many rows the screen's budget is divided by. The room's size rather
      // than the list's own length, because they are the same number here and
      // the room is the fact the stage is budgeting for.
      style={{ '--board-rows': view.players.length }}
    >
      {/* Level on the board, the nearer pawn first — on every game but the
          map and the timeline nobody is near or far and the roster's order
          stands. */}
      {buildScoreboard(view.players)
        .toSorted(
          (left, right) =>
            left.rank - right.rank ||
            nearnessOf(round, left.player.id) -
              nearnessOf(round, right.player.id)
        )
        .map(({ player, rank }) => {
          const answer = round.revealedAnswers.find(
            (revealed) => revealed.playerId === player.id
          )
          const award = round.awards.find(
            (entry) => entry.playerId === player.id
          )

          return (
            <li
              className={[
                player.id === view.youId && 'you',
                answer === undefined
                  ? 'silent'
                  : answer.isCorrect
                    ? 'right'
                    : 'wrong'
              ]
                .filter(Boolean)
                .join(' ')}
              key={player.id}
            >
              {isRanked && <span className='rank'>{rank}</span>}
              <span className='nickname'>
                <Pawn
                  seat={view.players.findIndex(
                    (seated) => seated.id === player.id
                  )}
                />
                <span className='name'>{player.nickname}</span>
                {player.id === view.youId && (
                  <VisuallyHidden elementType='span'>
                    {` (${translate('player.you')})`}
                  </VisuallyHidden>
                )}
              </span>
              {isPaying && (
                <span className='points'>
                  {award === undefined ||
                  award.points === 0 ? null : award.speedBonus > 0 ? (
                    <>
                      <span className='answer-half'>
                        {translate('round.award', {
                          points: shownPoints(award.points - award.speedBonus)
                        })}
                      </span>
                      <span className='speed-half'>
                        {translate('round.speedHalf', {
                          points: shownPoints(award.speedBonus)
                        })}
                      </span>
                    </>
                  ) : (
                    translate('round.award', {
                      points: shownPoints(award.points)
                    })
                  )}
                </span>
              )}
              {isRanked && (
                <span className='score'>
                  {translate('player.score', {
                    points: shownPoints(player.score)
                  })}
                </span>
              )}
              {answer !== undefined && (
                <span className='words'>{answerWords(answer)}</span>
              )}
            </li>
          )
        })}
    </ol>
  )
}
