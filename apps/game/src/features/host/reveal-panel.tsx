import type React from 'react'
import { useRef } from 'react'

import { UNIT_OF_FAMILY } from '@melee/protocol/estimate'
import type { PublicPlayer, RoundView } from '@melee/protocol/room'

import { cueOf, whatTheRoomNames } from '@melee/core/blindtest/typed-answer'

import { answerFitting } from '@/helpers/answer-fitting'
import {
  atlasContent,
  blackSquareContent,
  blindtestContent,
  estimateContent,
  higherLowerContent,
  innerclockContent,
  matchsticksContent,
  mostLikelyContent,
  petitBacContent,
  quizContent,
  reflexContent,
  revealedInOrder,
  swatchContent,
  timelineContent
} from '@/helpers/round-content'
import { BlackSquareReveal } from '@/presentation/components/black-square-reveal'
import { CountedBoard } from '@/presentation/components/counted-board'
import { CountrySilhouette } from '@/presentation/components/country-silhouette'
import { EstimateLine } from '@/presentation/components/estimate-line'
import { EstimateQuestion } from '@/presentation/components/estimate-question'
import { FlagPicture } from '@/presentation/components/flag-picture'
import { HigherLowerPairs } from '@/presentation/components/higher-lower-pairs'
import { CheckIcon } from '@/presentation/components/icons'
import { MapReveal } from '@/presentation/components/map-reveal'
import { MatchstickRow } from '@/presentation/components/matchstick-row'
import { MatchsticksPrompt } from '@/presentation/components/matchsticks-prompt'
import { MostLikelyTally } from '@/presentation/components/most-likely-tally'
import { Pawn } from '@/presentation/components/pawn'
import { ReactionBoard } from '@/presentation/components/reaction-board'
import { RebusLine } from '@/presentation/components/rebus-line'
import { SwatchChip } from '@/presentation/components/swatch-chip'
import { SwatchShown } from '@/presentation/components/swatch-shown'
import { TimelineStrip } from '@/presentation/components/timeline-strip'
import { useAnswerWords } from '@/presentation/components/use-distance-words'
import { useQuantityWords } from '@/presentation/components/use-quantity-words'
import { VisuallyHidden } from '@/presentation/components/visually-hidden'
import { useI18n, useTranslate } from '@/presentation/i18n/i18n-provider'

import { PetitBacGrid, type PetitBacStrike } from './petit-bac-grid'
import { useWholeChips } from './use-whole-chips'

import './reveal-panel.sass'
import { shownPoints } from '@/helpers/shown-points'

type RevealPanelProps = {
  /** The console striking a Petit Bac word out; absent wherever the reveal is only read. */
  onStrike?: (strike: PetitBacStrike) => void
  /** Needed to turn the awards' player ids into names and pawns. */
  players: readonly PublicPlayer[]
  round: RoundView
}

/**
 * Past this a Petit Bac grid takes the whole width and the standings go under
 * it: ten columns beside them broke a seven-letter word on a 1280px wall.
 */
const MOST_CATEGORIES_BESIDE_STANDINGS = 7

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
export const RevealPanel: React.FC<RevealPanelProps> = ({
  onStrike,
  players,
  round
}) => {
  const { locale, translate } = useI18n()
  const quantityWords = useQuantityWords()
  const track = blindtestContent(round)?.revealedTrack ?? null
  const question = quizContent(round)?.revealedQuestion ?? null
  const flag = quizContent(round)?.prompt.flag ?? null
  const silhouette = quizContent(round)?.prompt.silhouette ?? null
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
            {silhouette !== null && (
              <CountrySilhouette file={silhouette} isNamedBeside />
            )}
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

  const shades = swatchContent(round)

  // The colour back on its chip, and every seat's beside its name under it,
  // nearest first.
  if (shades?.colour != null && shades.revealedColours !== null) {
    return (
      <section className='reveal-panel' data-game='swatch'>
        <div className='head'>
          <SwatchShown
            caption={translate('swatch.reveal.title')}
            colour={shades.colour}
          />
        </div>

        <Outcome players={players} round={round} />
      </section>
    )
  }

  const estimate = estimateContent(round)

  // The question with its true value, every seat's pin on the line under it,
  // and the table nearest first.
  if (estimate?.value != null && estimate.revealedGuesses !== null) {
    return (
      <section className='reveal-panel' data-game='estimate'>
        <div className='head'>
          <EstimateQuestion question={estimate.question} />
          <p className='estimate-truth'>
            {quantityWords(
              estimate.value,
              UNIT_OF_FAMILY[estimate.question.family]
            )}
          </p>
          <EstimateLine
            guesses={estimate.revealedGuesses}
            players={players}
            value={estimate.value}
            youId={null}
          />
        </div>

        <Outcome players={players} round={round} />
      </section>
    )
  }

  const higherLower = higherLowerContent(round)

  // The five pairs with both values, every seat's pawn under the side it
  // picked, and the table most right first.
  if (
    higherLower?.revealedPairs != null &&
    higherLower.revealedSheets !== null
  ) {
    return (
      <section className='reveal-panel' data-game='higherlower'>
        <div className='head'>
          <HigherLowerPairs
            pairs={higherLower.revealedPairs}
            players={players}
            sheets={higherLower.revealedSheets}
            youId={null}
            yourPicks={null}
          />
        </div>

        <Outcome players={players} round={round} />
      </section>
    )
  }

  const tallied = mostLikelyContent(round)

  // The line read again over the count, and who voted with the table under
  // it: the scoreline, since no seat's words were ever its answer. A table
  // that chose nobody is said by the count, not a second time under it.
  if (tallied?.tally != null) {
    return (
      <section className='reveal-panel' data-game='mostlikely'>
        <div className='head'>
          <p className='most-likely-line'>{tallied.labels[locale]}</p>
          <MostLikelyTally
            players={players}
            tally={tallied.tally}
            yourBallot={tallied.yourBallot}
          />
        </div>

        {round.awards.some((award) => award.points > 0) && (
          <RoundPodium players={players} round={round} />
        )}
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

  const blackSquare = blackSquareContent(round)

  // The grid is the scoreline: who found each cell stands on it, and what it
  // paid them is on the score track.
  if (blackSquare?.revealed != null) {
    return (
      <section className='reveal-panel' data-game='blacksquare'>
        <h2 className='black-square-theme'>{blackSquare.theme[locale]}</h2>
        <BlackSquareReveal
          players={players}
          revealed={blackSquare.revealed}
          youId={null}
        />
      </section>
    )
  }

  const petitBac = petitBacContent(round)

  if (petitBac !== null) {
    return (
      <section
        className='reveal-panel'
        data-game='petitbac'
        data-long-sheet={
          petitBac.categories.length > MOST_CATEGORIES_BESIDE_STANDINGS ||
          undefined
        }
      >
        <PetitBacGrid onStrike={onStrike} players={players} round={round} />
      </section>
    )
  }

  // The map turned over, and the table nearest first.
  if (atlasContent(round) !== null) {
    return (
      <section className='reveal-panel' data-game='atlas'>
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
  const tally = useRef<HTMLUListElement>(null)

  useWholeChips(tally)
  const answerWords = useAnswerWords(round)
  const answers = revealedInOrder(round).map((answer) => ({
    ...answer,
    said: answerWords(answer)
  }))

  const matchsticks = matchsticksContent(round)
  const moves = matchsticks?.revealedMoves ?? []
  const isShades = swatchContent(round) !== null

  const nameOf = (playerId: string): string =>
    players.find((player) => player.id === playerId)?.nickname ?? '—'

  // A moved stick is drawn rather than spelled: `6+4=10` in type is not what
  // anybody looked at for a minute.
  const wordsOf = (playerId: string, said: string): React.ReactNode => {
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

  const seatOf = (playerId: string): number =>
    players.findIndex((player) => player.id === playerId)

  if (answers.length > 0) {
    return (
      <>
        <RoundPodium players={players} round={round} wordsOf={wordsOf} />
        <ul className='tally' ref={tally}>
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

  return <RoundPodium players={players} round={round} />
}

type RoundPodiumProps = Omit<RevealPanelProps, 'onStrike'> & {
  /** Draws a seat's own answer beside its name; omitted where nobody's words were the answer. */
  wordsOf?: (playerId: string, said: string) => React.ReactNode
}

const PODIUM_PLACES = 3

/**
 * The round's podium: the seats it paid the most, each with what it said, over
 * how many of those it opened on scored. The standings beside it carry every
 * other seat's gain, so it never grows past three — on a short stage it keeps
 * the first and counts the rest, then keeps the count alone.
 */
const RoundPodium: React.FC<RoundPodiumProps> = ({
  players,
  round,
  wordsOf
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

  // A table answering aloud holds no seat, and its scores are the teams'.
  if (players.length === 0) {
    return null
  }

  if (scorers.length === 0) {
    return <p className='nobody'>{translate('round.nobody')}</p>
  }

  return (
    <div className='round-podium'>
      <ol className='podium'>
        {podium.map((award) => {
          const answer = answers.find(
            (said) => said.playerId === award.playerId
          )

          return (
            <li key={award.playerId}>
              <Pawn seat={seatOf(award.playerId)} />
              <span className='nickname'>{nameOf(award.playerId)}</span>
              {wordsOf !== undefined && answer !== undefined && (
                <span className='words'>
                  {wordsOf(award.playerId, answerWords(answer))}
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
      </p>
    </div>
  )
}
