import type React from 'react'

import type { PublicPlayer, RoundView } from '@melee/protocol/room'

import { cueOf, whatTheRoomNames } from '@melee/core/blindtest/typed-answer'

import { answerFitting } from '@/helpers/answer-fitting'
import {
  blindtestContent,
  innerclockContent,
  matchsticksContent,
  quizContent,
  reflexContent,
  revealedInOrder,
  timelineContent,
  worldmapContent
} from '@/helpers/round-content'
import { CountedBoard } from '@/presentation/components/counted-board'
import { FlagPicture } from '@/presentation/components/flag-picture'
import { CheckIcon } from '@/presentation/components/icons'
import { MapReveal } from '@/presentation/components/map-reveal'
import { MatchstickRow } from '@/presentation/components/matchstick-row'
import { MatchsticksPrompt } from '@/presentation/components/matchsticks-prompt'
import { Pawn } from '@/presentation/components/pawn'
import { ReactionBoard } from '@/presentation/components/reaction-board'
import { RebusLine } from '@/presentation/components/rebus-line'
import { TimelineStrip } from '@/presentation/components/timeline-strip'
import { useAnswerWords } from '@/presentation/components/use-distance-words'
import { VisuallyHidden } from '@/presentation/components/visually-hidden'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './reveal-panel.sass'

type RevealPanelProps = {
  /** Needed to turn the awards' player ids into names and pawns. */
  players: readonly PublicPlayer[]
  round: RoundView
}

/** Past this a list deals into a second column, and past twelve a third. */
const ROWS_PER_SINGLE_COLUMN = 4
const ROWS_PER_DOUBLE_COLUMN = 12

/**
 * How a list of `count` rows is dealt, published for the stylesheet: a row's
 * type is the height of its column divided by the rows in it, and only the
 * component knows how many rows there are.
 */
const dealtRows = (count: number): React.CSSProperties => {
  const columns =
    count <= ROWS_PER_SINGLE_COLUMN
      ? 1
      : count <= ROWS_PER_DOUBLE_COLUMN
        ? 2
        : 3

  return {
    '--outcome-columns': columns,
    '--outcome-rows': Math.ceil(count / columns)
  }
}

type RevealedAnswer = RoundView['revealedAnswers'][number]

type SaidTogether = {
  isCorrect: boolean
  key: string
  playerIds: string[]
  said: string
}

/**
 * The table's answers folded to one per distinct line, right ones first and
 * then the most said: on a console held in a hand the room reads *who said the
 * same thing*, and each player's points are already on the score track above.
 */
const saidTogether = (answers: readonly RevealedAnswer[]): SaidTogether[] => {
  const groups = new Map<string, SaidTogether>()

  for (const answer of answers) {
    const key = `${answer.isCorrect}:${answer.said.trim().toLowerCase()}`
    const group = groups.get(key)

    if (group === undefined) {
      groups.set(key, {
        isCorrect: answer.isCorrect,
        key,
        playerIds: [answer.playerId],
        said: answer.said.trim()
      })
    } else {
      group.playerIds.push(answer.playerId)
    }
  }

  return [...groups.values()].toSorted(
    (left, right) =>
      Number(right.isCorrect) - Number(left.isCorrect) ||
      right.playerIds.length - left.playerIds.length
  )
}

/**
 * How the round went, for the screen the room is looking at. A game that served
 * something reveals it here and nowhere else; one whose question the room owns
 * has nothing to give away, and the panel is the scoreline alone.
 */
export const RevealPanel: React.FC<RevealPanelProps> = ({ players, round }) => {
  const translate = useTranslate()
  const track = blindtestContent(round)?.revealedTrack ?? null
  const question = quizContent(round)?.revealedQuestion ?? null
  const flag = quizContent(round)?.prompt.flag ?? null
  const rebus = quizContent(round)?.prompt.rebus ?? null
  if (track !== null) {
    return (
      <section className='reveal-panel with-cover' data-game='blindtest'>
        <div className='head'>
          {track.coverUrl === null ? (
            <div className='cover placeholder' />
          ) : (
            <img
              alt=''
              className='cover'
              height={250}
              src={track.coverUrl}
              width={250}
            />
          )}

          <div
            className='identity'
            style={answerFitting(whatTheRoomNames(track))}
          >
            <p className='title'>
              <VisuallyHidden elementType='span'>
                {`${translate('blindtest.reveal.title')} `}
              </VisuallyHidden>
              {whatTheRoomNames(track)}
            </p>
            <p className='artist'>{track.artist}</p>
            {cueOf(track) !== null && <p className='note'>{cueOf(track)}</p>}
          </div>
        </div>

        <Outcome players={players} round={round} />
      </section>
    )
  }

  // The question card turned over: the answer is printed on the same paper the
  // question was, so the room reads it as the back of the card it just played.
  if (question !== null) {
    return (
      <section className='reveal-panel' data-game='quiz'>
        <div className='head'>
          <div className='identity' style={answerFitting(question.answer)}>
            {flag !== null && <FlagPicture file={flag} isNamedBeside />}
            {rebus !== null && <RebusLine isNamedBeside rebus={rebus} />}
            <p className='title'>
              <VisuallyHidden elementType='span'>
                {`${translate('quiz.reveal.title')} `}
              </VisuallyHidden>
              {question.answer}
            </p>
            {question.note !== null && <p className='note'>{question.note}</p>}
          </div>
        </div>

        <Outcome players={players} round={round} />
      </section>
    )
  }

  const solved = matchsticksContent(round)

  if (solved !== null && solved.revealedSolution !== null) {
    return (
      <section className='reveal-panel' data-game='matchsticks'>
        <div className='head'>
          <MatchsticksPrompt
            puzzle={solved.puzzle}
            solution={solved.revealedSolution}
          />
        </div>

        <Outcome players={players} round={round} />
      </section>
    )
  }

  const dated = timelineContent(round)?.revealedEvents ?? null

  // The cards strung along the line in the order they happened, each with its
  // year, and the table fewest pairs swapped first.
  if (dated !== null) {
    return (
      <section className='reveal-panel' data-game='timeline'>
        <div className='head'>
          <TimelineStrip
            aria-label={translate('timeline.reveal.title')}
            events={dated}
            layout='ordered'
          />
        </div>

        <Outcome players={players} round={round} />
      </section>
    )
  }

  // The map turned over, and the table nearest first.
  if (worldmapContent(round) !== null) {
    return (
      <section className='reveal-panel' data-game='worldmap'>
        <MapReveal players={players} round={round} />
        <Outcome players={players} round={round} />
      </section>
    )
  }

  // The times *are* the reveal here — this is the one game where nothing was
  // ever withheld — so the board replaces the scoreline rather than sitting
  // under it, and it already names who took the round by putting them first.
  if (reflexContent(round) !== null) {
    return (
      <section className='reveal-panel bare'>
        <ReactionBoard players={players} round={round} />
      </section>
    )
  }

  // The same for a count: the board is the result, closest first.
  if (innerclockContent(round) !== null) {
    return (
      <section className='reveal-panel bare'>
        <CountedBoard players={players} round={round} />
      </section>
    )
  }

  return (
    <section className='reveal-panel bare'>
      <Outcome players={players} round={round} />
    </section>
  )
}

const Outcome: React.FC<RevealPanelProps> = ({ players, round }) => {
  const translate = useTranslate()
  const answerWords = useAnswerWords(round)
  const scorers = round.awards.filter((award) => award.points > 0)
  const answers = revealedInOrder(round).map((answer) => ({
    ...answer,
    said: answerWords(answer)
  }))

  const moves = matchsticksContent(round)?.revealedMoves ?? []

  const nameOf = (playerId: string): string =>
    players.find((player) => player.id === playerId)?.nickname ?? '—'

  // A moved stick is drawn rather than spelled: `6+4=10` in type is not what
  // anybody looked at for a minute.
  const wordsOf = (playerId: string, said: string): React.ReactNode => {
    const sent = moves.find((move) => move.playerId === playerId)

    return sent === undefined ? (
      said
    ) : (
      <MatchstickRow glyphs={sent.glyphs} isStill move={sent.move} />
    )
  }

  const seatOf = (playerId: string): number =>
    players.findIndex((player) => player.id === playerId)

  if (answers.length > 0) {
    return (
      <>
        <ul className='said' style={dealtRows(answers.length)}>
          {answers.map((answer) => {
            const paid = scorers.find(
              (award) => award.playerId === answer.playerId
            )

            return (
              <li
                className={answer.isCorrect ? 'right' : 'wrong'}
                key={answer.playerId}
              >
                <Pawn seat={seatOf(answer.playerId)} />
                <span className='nickname'>{nameOf(answer.playerId)}</span>
                <span className='words'>
                  {wordsOf(answer.playerId, answer.said)}
                </span>
                {/* A round nobody took spends nothing on a column of blanks; one
                  somebody took keeps the box on every row, or the answers above
                  and below a miss end on two different right edges. */}
                {scorers.length > 0 && (
                  <span className='points'>
                    {paid === undefined
                      ? null
                      : paid.speedBonus > 0
                        ? translate('round.awardWithSpeed', {
                            answer: paid.points - paid.speedBonus,
                            speed: paid.speedBonus
                          })
                        : translate('round.award', { points: paid.points })}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
        <ul className='tally'>
          {saidTogether(answers).map((group) => (
            <li className={group.isCorrect ? 'right' : 'wrong'} key={group.key}>
              {group.isCorrect && <CheckIcon />}
              <span className='words'>
                {wordsOf(group.playerIds[0] ?? '', group.said)}
              </span>
              <span aria-hidden='true' className='pawns'>
                {group.playerIds.map((playerId) => (
                  <Pawn key={playerId} seat={seatOf(playerId)} />
                ))}
              </span>
              <VisuallyHidden elementType='span'>
                {`${group.isCorrect ? ` (${translate('host.verdict.right')})` : ''} — ${group.playerIds.map(nameOf).join(', ')}`}
              </VisuallyHidden>
            </li>
          ))}
        </ul>
      </>
    )
  }

  // A table answering aloud holds no seat, and its scores are the teams'.
  if (scorers.length === 0) {
    return players.length === 0 ? null : (
      <p className='nobody'>{translate('round.nobody')}</p>
    )
  }

  return (
    <ul className='scorers' style={dealtRows(scorers.length)}>
      {scorers.map((award) => (
        <li key={award.playerId}>
          <Pawn seat={seatOf(award.playerId)} />
          <span className='nickname'>{nameOf(award.playerId)}</span>
          <span className='points'>
            {translate('round.scored', { points: award.points })}
          </span>
        </li>
      ))}
    </ul>
  )
}
