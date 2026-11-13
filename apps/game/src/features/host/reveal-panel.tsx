import type React from 'react'
import { useRef } from 'react'

import type { GameSettings } from '@melee/protocol/game'
import type { PlayerId } from '@melee/protocol/identifiers'
import type { PublicPlayer, RoundView } from '@melee/protocol/room'

import { cueOf, whatTheRoomNames } from '@melee/core/blindtest/typed-answer'
import { roundPlacingOf } from '@melee/core/scoring/scoreboard'

import { answerFitting } from '@/helpers/answer-fitting'
import {
  atlasContent,
  blackSquareContent,
  blindtestContent,
  estimateContent,
  higherLowerContent,
  innerclockContent,
  longestWordContent,
  makeNumberContent,
  matchsticksContent,
  mostLikelyContent,
  mysteryWordContent,
  petitBacContent,
  quizContent,
  reflexContent,
  revealedInOrder,
  swatchContent,
  timelineContent
} from '@/helpers/round-content'
import { BlackSquareReveal } from '@/presentation/components/black-square-reveal'
import { usePlaysOnTrack } from '@/presentation/components/board-kind'
import { CountedBoard } from '@/presentation/components/counted-board'
import { CountrySilhouette } from '@/presentation/components/country-silhouette'
import { EstimateLine } from '@/presentation/components/estimate-line'
import { EstimateQuestion } from '@/presentation/components/estimate-question'
import { FlagPicture } from '@/presentation/components/flag-picture'
import { HigherLowerPairs } from '@/presentation/components/higher-lower-pairs'
import { CheckIcon } from '@/presentation/components/icons'
import { MapReveal } from '@/presentation/components/map-reveal'
import { MatchsticksPrompt } from '@/presentation/components/matchsticks-prompt'
import { MostLikelyTally } from '@/presentation/components/most-likely-tally'
import { Pawn } from '@/presentation/components/pawn'
import { ReactionBoard } from '@/presentation/components/reaction-board'
import { RebusLine } from '@/presentation/components/rebus-line'
import { RevealedWord } from '@/presentation/components/revealed-word'
import { RoundPodium, useWordsOf } from '@/presentation/components/round-podium'
import { SwatchGuesses } from '@/presentation/components/swatch-guesses'
import { SwatchShown } from '@/presentation/components/swatch-shown'
import { ThisRoundHeading } from '@/presentation/components/this-round-heading'
import { TimelineStrip } from '@/presentation/components/timeline-strip'
import { useAnswerWords } from '@/presentation/components/use-distance-words'
import { useQuantityWords } from '@/presentation/components/use-quantity-words'
import { VisuallyHidden } from '@/presentation/components/visually-hidden'
import { useI18n, useTranslate } from '@/presentation/i18n/i18n-provider'

import { LongestWordBest } from './longest-word-best'
import { LongestWordRanking } from './longest-word-ranking'
import { MakeNumberRanking } from './make-number-ranking'
import { MakeNumberShortest } from './make-number-shortest'
import { MysteryWordGrids } from './mystery-word-grids'
import { PetitBacGrid, type PetitBacStrike } from './petit-bac-grid'
import { useFittedGrid } from './use-fitted-grid'
import { useWholeChips } from './use-whole-chips'

import './reveal-panel.sass'
import { shownPoints } from '@/helpers/shown-points'

type RevealPanelProps = {
  /** The room's line-up, which names the round's block after the entry it was opened from. */
  lineUp: readonly GameSettings[]
  /** The console striking a Petit Bac word out; absent wherever the reveal is only read. */
  onStrike?: (strike: PetitBacStrike) => void
  /** Needed to turn the awards' player ids into names and pawns. */
  players: readonly PublicPlayer[]
  round: RoundView
  /** The seated host's own seat, whose result opens the round's block; `null` on a screen nobody sits at. */
  youId: PlayerId | null
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
  lineUp,
  onStrike,
  players,
  round,
  youId
}) => {
  const { locale, translate } = useI18n()
  const quantityWords = useQuantityWords()
  const track = blindtestContent(round)?.revealedTrack ?? null
  const question = quizContent(round)?.revealedQuestion ?? null
  const asked = quizContent(round)?.prompt.prompt ?? null
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

        <Outcome
          lineUp={lineUp}
          players={players}
          round={round}
          youId={youId}
        />
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
            {asked !== null && <p className='asked'>{asked}</p>}
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

        <Outcome
          lineUp={lineUp}
          players={players}
          round={round}
          youId={youId}
        />
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

        <Outcome
          lineUp={lineUp}
          players={players}
          round={round}
          youId={youId}
        />
      </section>
    )
  }

  const mysteryWord = mysteryWordContent(round)

  // The word dealt letter by letter, and every grid spelled out under it in
  // the order the word was found: the grids are the podium, whole.
  if (mysteryWord?.revealedWord != null) {
    return (
      <section className='reveal-panel' data-game='mysteryword'>
        <div className='head'>
          <RevealedWord word={mysteryWord.revealedWord} />
        </div>

        <ThisRoundHead
          lineUp={lineUp}
          players={players}
          round={round}
          youId={youId}
        />
        <MysteryWordGrids players={players} round={round} youId={youId} />
      </section>
    )
  }

  const longestWord = longestWordContent(round)

  // The draw's longest word turned over, and every seat's laid under it,
  // longest first: the ranking is the podium, whole.
  if (longestWord?.revealedWords != null) {
    return (
      <section className='reveal-panel' data-game='longestword'>
        <div className='head'>
          <LongestWordBest bestWords={longestWord.bestWords ?? []} />
        </div>

        <ThisRoundHead
          lineUp={lineUp}
          players={players}
          round={round}
          youId={youId}
        />
        <LongestWordRanking players={players} round={round} youId={youId} />
      </section>
    )
  }

  const makeNumber = makeNumberContent(round)

  // The shortest calculation written out, and every seat's under it, nearest
  // first: the ranking is the podium, whole.
  if (makeNumber?.solution != null) {
    return (
      <section className='reveal-panel' data-game='makenumber'>
        <div className='head'>
          <MakeNumberShortest
            solution={makeNumber.solution}
            target={makeNumber.target}
            tiles={makeNumber.tiles}
          />
        </div>

        <ThisRoundHead
          lineUp={lineUp}
          players={players}
          round={round}
          youId={youId}
        />
        <MakeNumberRanking players={players} round={round} youId={youId} />
      </section>
    )
  }

  const shades = swatchContent(round)

  // The colour back on its chip, and every seat's held against it under its
  // name, nearest first: the grid is the podium, whole.
  if (shades?.colour != null && shades.revealedColours !== null) {
    return (
      <section className='reveal-panel' data-game='swatch'>
        <div className='head'>
          <SwatchShown
            caption={translate('swatch.reveal.title')}
            colour={shades.colour}
          />
        </div>

        <ThisRoundHead
          lineUp={lineUp}
          players={players}
          round={round}
          youId={youId}
        />
        {shades.revealedColours.length > 0 ? (
          <FittedGuesses players={players} round={round} youId={youId} />
        ) : (
          <RoundPodium players={players} round={round} youId={youId} />
        )}
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
            {quantityWords(estimate.value, estimate.question)}
          </p>
          <EstimateLine
            guesses={estimate.revealedGuesses}
            players={players}
            value={estimate.value}
            youId={null}
          />
        </div>

        <Outcome
          lineUp={lineUp}
          players={players}
          round={round}
          youId={youId}
        />
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

        <Outcome
          lineUp={lineUp}
          players={players}
          round={round}
          youId={youId}
        />
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
          <>
            <ThisRoundHead
              lineUp={lineUp}
              players={players}
              round={round}
              youId={youId}
            />
            <RoundPodium players={players} round={round} youId={youId} />
          </>
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

        <Outcome
          lineUp={lineUp}
          players={players}
          round={round}
          youId={youId}
        />
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
        <Outcome
          lineUp={lineUp}
          players={players}
          round={round}
          youId={youId}
        />
      </section>
    )
  }

  // The times *are* the reveal here — this is the one game where nothing was
  // ever withheld — so the board replaces the scoreline rather than sitting
  // under it, and it already names who took the round by putting them first.
  if (reflexContent(round) !== null) {
    return (
      <section className='reveal-panel bare'>
        <ThisRoundHead
          lineUp={lineUp}
          players={players}
          round={round}
          youId={youId}
        />
        <ReactionBoard players={players} round={round} />
      </section>
    )
  }

  // The same for a count: the board is the result, closest first.
  if (innerclockContent(round) !== null) {
    return (
      <section className='reveal-panel bare'>
        <ThisRoundHead
          lineUp={lineUp}
          players={players}
          round={round}
          youId={youId}
        />
        <CountedBoard players={players} round={round} />
      </section>
    )
  }

  return (
    <section className='reveal-panel bare'>
      <Outcome lineUp={lineUp} players={players} round={round} youId={youId} />
    </section>
  )
}

/** How much taller than wide a guess is: its chip, then its name and its points. */
const GUESS_ASPECT = 1.7

/** Every seat's guess dealt into the box the panel leaves, the wall never scrolling. */
const FittedGuesses: React.FC<
  Omit<RevealPanelProps, 'lineUp' | 'onStrike'>
> = ({ players, round, youId }) => {
  const grid = useRef<HTMLOListElement>(null)

  useFittedGrid({
    aspect: GUESS_ASPECT,
    count: swatchContent(round)?.revealedColours?.length ?? 0,
    grid
  })

  return (
    <SwatchGuesses
      layout='grid'
      players={players}
      ref={grid}
      round={round}
      youId={youId}
    />
  )
}

const Outcome: React.FC<Omit<RevealPanelProps, 'onStrike'>> = ({
  lineUp,
  players,
  round,
  youId
}) => {
  const translate = useTranslate()
  const tally = useRef<HTMLUListElement>(null)

  useWholeChips({ list: tally })
  const answerWords = useAnswerWords(round)
  const answers = revealedInOrder(round).map((answer) => ({
    ...answer,
    said: answerWords(answer).text
  }))

  const wordsOf = useWordsOf(round)

  const nameOf = (playerId: string): string =>
    players.find((player) => player.id === playerId)?.nickname ?? '—'

  const seatOf = (playerId: string): number =>
    players.findIndex((player) => player.id === playerId)

  if (answers.length > 0) {
    return (
      <>
        <ThisRoundHead
          lineUp={lineUp}
          players={players}
          round={round}
          youId={youId}
        />
        <RoundPodium
          players={players}
          round={round}
          wordsOf={wordsOf}
          youId={youId}
        />
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

  return (
    <>
      <ThisRoundHead
        lineUp={lineUp}
        players={players}
        round={round}
        youId={youId}
      />
      <RoundPodium players={players} round={round} youId={youId} />
    </>
  )
}

/**
 * The round's block opening under the answer: its name ruled across the
 * panel, the seated host's own result at the rule's end — the way a player's
 * screen says theirs, which a host who also plays reads nowhere else — and in
 * the heading's row, so it costs the stage no line of its own.
 */
const ThisRoundHead: React.FC<Omit<RevealPanelProps, 'onStrike'>> = ({
  lineUp,
  players,
  round,
  youId
}) => {
  const seat = players.findIndex((player) => player.id === youId)
  // A seat that sat the round out to judge was never stamped on it.
  const isStamped =
    youId !== null && (round.openedWithPlayerIds?.includes(youId) ?? true)

  return (
    <ThisRoundHeading
      aside={
        youId === null || seat === -1 || !isStamped ? null : (
          <SeatedResult
            round={round}
            seat={seat}
            walked={players[seat]?.board?.move ?? null}
            youId={youId}
          />
        )
      }
      className='this-round-head'
      lineUp={lineUp}
      round={round}
    />
  )
}

/** What the round paid the seat this console holds, beside its pawn. */
const SeatedResult: React.FC<{
  round: RoundView
  /** The seat's index, which colours its pawn. */
  seat: number
  /** The squares the seat's own pawn walked this round; `null` with no pawn of its own. */
  walked: number | null
  youId: PlayerId
}> = ({ round, seat, walked, youId }) => {
  const translate = useTranslate()
  const isOnTrack = usePlaysOnTrack()
  const award = round.awards.find((each) => each.playerId === youId)
  const points = award?.points ?? 0

  if (isOnTrack) {
    // A seat whose team walks has no squares of its own: its answer says
    // whether it counted, and the team's move is the standings' to print.
    const hasCounted =
      walked === null ? points - (award?.speedBonus ?? 0) > 0 : walked > 0

    return (
      <span className={hasCounted ? 'seated-result scored' : 'seated-result'}>
        <Pawn seat={seat} />
        <span className='who'>{translate('player.you')}</span>
        {walked !== null && walked > 0 && (
          <span className='payout'>
            {translate('board.walkedSquares', { count: walked })}
          </span>
        )}
        {!hasCounted && (
          <span className='placing'>{translate('round.missed')}</span>
        )}
      </span>
    )
  }

  const placing = roundPlacingOf({ awards: round.awards, playerId: youId })

  return (
    <span className={points > 0 ? 'seated-result scored' : 'seated-result'}>
      <Pawn seat={seat} />
      <span className='who'>{translate('player.you')}</span>
      <span className='payout'>
        {points > 0
          ? translate('round.scored', { points: shownPoints(points) })
          : '0'}
      </span>
      <span className='placing'>
        {placing === null
          ? translate('round.missed')
          : translate('player.standing.ofRound', { rank: placing })}
      </span>
    </span>
  )
}
