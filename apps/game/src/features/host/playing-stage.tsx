import type React from 'react'

import type { BlackSquareCell } from '@melee/protocol/black-square'
import type { LeanAnswer } from '@melee/protocol/client-message'
import type { PlayerId } from '@melee/protocol/identifiers'
import type { HostRoomView, RoundView } from '@melee/protocol/room'
import type { ProtocolErrorMessage } from '@melee/protocol/server-message'

import type { ClockEstimate } from '@melee/core/time/clock-sync'

import {
  ChoiceAnswer,
  candidatesIn,
  longestChoiceLength,
  type PlayerAnswer,
  TypedAnswer
} from '@/features/player/answer-forms'
import { BlackSquareAnswer } from '@/features/player/black-square-answer'
import { EstimateAnswer } from '@/features/player/estimate-answer'
import { HigherLowerAnswer } from '@/features/player/higher-lower-answer'
import { LongestWordAnswer } from '@/features/player/longest-word-answer'
import { MakeNumberAnswer } from '@/features/player/make-number-answer'
import { MapAnswer } from '@/features/player/map-answer'
import { MatchsticksMove } from '@/features/player/matchsticks-move'
import { MostLikelyBallot } from '@/features/player/most-likely-ballot'
import { MysteryWordAnswer } from '@/features/player/mystery-word-answer'
import { PrintedChoices } from '@/features/player/printed-choices'
import { RoundQuestion } from '@/features/player/round-question'
import { SwatchRound } from '@/features/player/swatch-round'
import { ThinkAlikeAnswer } from '@/features/player/think-alike-answer'
import { TimelineAnswer } from '@/features/player/timeline-answer'
import {
  atlasContent,
  blackSquareContent,
  estimateContent,
  higherLowerContent,
  longestWordContent,
  makeNumberContent,
  matchsticksContent,
  mostLikelyContent,
  mysteryWordContent,
  swatchContent,
  thinkAlikeContent,
  timelineContent
} from '@/helpers/round-content'
import { BlackSquareSpoken } from '@/presentation/components/black-square-spoken'
import { EstimateQuestion } from '@/presentation/components/estimate-question'
import { HigherLowerPairs } from '@/presentation/components/higher-lower-pairs'
import { LetterCell } from '@/presentation/components/letter-cell'
import { LetterTile } from '@/presentation/components/letter-tile'
import { MapPrompt } from '@/presentation/components/map-prompt'
import { MarkLegend } from '@/presentation/components/mark-legend'
import { MatchsticksPrompt } from '@/presentation/components/matchsticks-prompt'
import { NumberTile } from '@/presentation/components/number-tile'
import { RoundProgress } from '@/presentation/components/round-progress'
import { ThinkAlikeTable } from '@/presentation/components/think-alike-table'
import { TimelineStrip } from '@/presentation/components/timeline-strip'
import { usePairAsks } from '@/presentation/components/use-pair-asks'
import { useShownColour } from '@/presentation/components/use-shown-colour'
import { VisuallyHidden } from '@/presentation/components/visually-hidden'
import { useI18n } from '@/presentation/i18n/i18n-provider'
import { currentDeadline } from '@/presentation/timing/last-seconds'

import { AnsweredPawns, BuzzerPawns } from './answered-pawns'
import { BlackSquareGauge } from './black-square-gauge'
import { LongestWordTowers } from './longest-word-towers'
import { MakeNumberLadder } from './make-number-ladder'
import { MysteryWordTowers } from './mystery-word-towers'

import './playing-stage.sass'

/** Past this a candidate is a sentence, and four of them read as four rows. */
const LONG_CHOICE_LENGTH = 60

type PlayingStageProps = {
  /**
   * The seat whose answer `onAnswer` sends: this console's own, or on the wall
   * the first seat of the team on turn, which holds the team's one answer.
   */
  answersAs: PlayerId | null
  /** What the host does to the round from beside the card — a challenge's placings — and nothing on the wall. */
  children?: React.ReactNode
  /** The offer to unmute this screen, or nothing when it owes the room none. */
  clipOffer: React.ReactNode
  /** What a shades round hides its colour on, the same estimate every seat reads. */
  clock: ClockEstimate | null
  /** Sends the seat's or the wall's answer, and says whether the socket took it; `null` when this screen answers nothing. */
  onAnswer: ((answer: PlayerAnswer) => boolean) | null
  /** Saves what the seat's screen holds before it is sent; `null` when this screen answers nothing. */
  onLean: ((answer: LeanAnswer | null) => boolean) | null
  /** Sends the seat's tick when it keeps a spoken black square's list; `null` when this screen keeps none. */
  onTick:
    | ((cell: BlackSquareCell | 'blackWord', isTicked: boolean) => boolean)
    | null
  /** The server's last refusal to this screen, which a seat answering a hidden word says under its grid. */
  refusal: ProtocolErrorMessage | null
  round: RoundView
  view: HostRoomView
}

/**
 * A round in play on the screen the room shares: the question card with the
 * round's sand draining along its top, the four tiles when there are four, and
 * the pawns still owing an answer. The standings are not here — the score
 * track around the screen already carries them.
 */
export const PlayingStage: React.FC<PlayingStageProps> = ({
  answersAs,
  children,
  clipOffer,
  clock,
  onAnswer,
  onLean,
  onTick,
  refusal,
  round,
  view
}) => {
  const { locale, translate } = useI18n()
  const asksOf = usePairAsks()
  const roundDurationMs = round.durationMs
  const mode = round.answerMode
  const choiceLength = longestChoiceLength(candidatesIn({ locale, round }))
  const blackSquare = blackSquareContent(round)
  const isTyping = mode === 'typed' && onAnswer !== null && blackSquare === null
  const atlas = atlasContent(round)
  const matchsticks = matchsticksContent(round)
  const timeline = timelineContent(round)
  const swatch = swatchContent(round)
  const mostLikely = mostLikelyContent(round)
  const estimate = estimateContent(round)
  const higherLower = higherLowerContent(round)
  const mysteryWord = mysteryWordContent(round)
  const longestWord = longestWordContent(round)
  const makeNumber = makeNumberContent(round)
  const thinkAlike = thinkAlikeContent(round)
  const shownColour = useShownColour({ clock, round })
  const closesInMs = currentDeadline({ clock, view })?.remainingMs ?? null
  const isMoving = matchsticks !== null && mode === 'move' && onAnswer !== null

  const roundCard = (sticks: React.ReactNode): React.ReactNode => (
    <section className='round-card'>
      {roundDurationMs !== null && (
        <RoundProgress
          durationMs={roundDurationMs}
          elapsedMs={view.roundElapsedMs}
        />
      )}
      {round.content.kind === 'quiz' || atlas?.shown != null ? (
        <RoundQuestion round={round} />
      ) : atlas?.target != null ? (
        <MapPrompt target={atlas.target} />
      ) : matchsticks !== null ? (
        <MatchsticksPrompt
          answerMode={round.answerMode}
          puzzle={matchsticks.puzzle}
        >
          {sticks}
        </MatchsticksPrompt>
      ) : timeline !== null ? (
        <p className='now timeline-question'>{translate('timeline.dealt')}</p>
      ) : swatch !== null ? (
        <p className='now swatch-line'>
          {translate(
            shownColour === null ? 'swatch.hidden' : 'swatch.remember'
          )}
        </p>
      ) : estimate !== null ? (
        <EstimateQuestion question={estimate.question} />
      ) : higherLower !== null ? (
        (sticks ?? (
          <p className='now higher-lower-line'>
            {higherLower.pairs.length === 1 && higherLower.pairs[0]
              ? asksOf(higherLower.pairs[0].ask)
              : translate('higherlower.dealt')}
          </p>
        ))
      ) : mysteryWord !== null ? (
        onAnswer === null && (
          <p className='now mystery-word-skeleton'>
            <VisuallyHidden elementType='span'>
              {translate('mysteryword.skeleton', {
                length: mysteryWord.length,
                letter: mysteryWord.firstLetter
              })}
            </VisuallyHidden>
            <span
              aria-hidden
              className='cells'
              style={{ '--grid-columns': mysteryWord.length }}
            >
              {Array.from({ length: mysteryWord.length }, (_, at) => at).map(
                (position) => (
                  <LetterCell
                    index={position}
                    key={position}
                    letter={position === 0 ? mysteryWord.firstLetter : ''}
                    mark={position === 0 ? 'given' : 'empty'}
                  />
                )
              )}
            </span>
          </p>
        )
      ) : longestWord !== null ? (
        onAnswer === null && (
          <p className='now longest-word-draw'>
            <VisuallyHidden elementType='span'>
              {translate('longestword.drawSaid', {
                letters: longestWord.letters.join(' ')
              })}
            </VisuallyHidden>
            <span aria-hidden className='tiles'>
              {[...longestWord.letters.keys()].map((position) => (
                <LetterTile
                  face='faceUp'
                  index={position}
                  key={position}
                  letter={longestWord.letters[position] ?? ''}
                />
              ))}
            </span>
          </p>
        )
      ) : makeNumber !== null ? (
        onAnswer === null && (
          <p className='now make-number-draw'>
            <VisuallyHidden elementType='span'>
              {translate('makenumber.tilesSaid', {
                target: makeNumber.target,
                tiles: makeNumber.tiles.join(', ')
              })}
            </VisuallyHidden>
            <span aria-hidden className='tiles'>
              {makeNumber.tiles
                .map((value, position) => ({ position, value }))
                .map(({ position, value }) => (
                  <NumberTile key={position} value={value} />
                ))}
            </span>
          </p>
        )
      ) : thinkAlike !== null ? (
        <p className='now think-alike-prompt'>{thinkAlike.prompt}</p>
      ) : mostLikely !== null ? (
        <p className='now most-likely-line'>{mostLikely.labels[locale]}</p>
      ) : blackSquare !== null ? (
        <h2 className='now black-square-theme'>{blackSquare.theme[locale]}</h2>
      ) : round.content.kind === 'challenge' ? (
        <>
          <p className='now challenge-line'>
            {round.content.labels?.[locale] ?? translate('challenge.untitled')}
          </p>
          <p className='challenge-where'>{translate('challenge.atTheTable')}</p>
        </>
      ) : (
        <p className='now'>
          {translate(
            round.content.kind === 'buzzer'
              ? 'buzzer.running'
              : 'blindtest.listening'
          )}
        </p>
      )}
    </section>
  )

  return (
    <div
      className='stage playing'
      data-answering={isTyping || undefined}
      data-black-square={
        blackSquare === null
          ? undefined
          : onAnswer === null
            ? 'watching'
            : 'answering'
      }
      data-choices={mode === 'choice' || undefined}
      data-estimate={
        estimate === null
          ? undefined
          : onAnswer === null
            ? 'watching'
            : 'answering'
      }
      data-higher-lower={
        higherLower === null
          ? undefined
          : onAnswer === null
            ? 'watching'
            : 'answering'
      }
      data-long-choices={choiceLength > LONG_CHOICE_LENGTH || undefined}
      data-longest-word={
        longestWord === null
          ? undefined
          : onAnswer === null
            ? 'watching'
            : 'answering'
      }
      data-make-number={
        makeNumber === null
          ? undefined
          : onAnswer === null
            ? 'watching'
            : 'answering'
      }
      data-map={(atlas?.target != null && onAnswer !== null) || undefined}
      data-map-question={atlas?.shown != null || undefined}
      data-most-likely={
        mostLikely === null
          ? undefined
          : onAnswer === null
            ? 'watching'
            : 'voting'
      }
      data-moving={isMoving || undefined}
      data-mystery-word={
        mysteryWord === null
          ? undefined
          : onAnswer === null
            ? 'watching'
            : 'answering'
      }
      data-swatch={
        swatch === null
          ? undefined
          : shownColour === null && onAnswer !== null
            ? 'answering'
            : 'shown'
      }
      data-think-alike={
        thinkAlike === null
          ? undefined
          : onAnswer === null
            ? 'watching'
            : 'answering'
      }
      data-timeline={
        timeline === null
          ? undefined
          : onAnswer === null
            ? 'dealt'
            : 'answering'
      }
      style={{ '--choice-length': choiceLength }}
    >
      {clipOffer}
      {isMoving && onAnswer !== null ? (
        <MatchsticksMove
          card={roundCard}
          key={round.id}
          onAnswer={onAnswer}
          round={round}
        />
      ) : higherLower !== null && onAnswer !== null ? (
        <HigherLowerAnswer
          card={roundCard}
          key={round.id}
          onAnswer={onAnswer}
          round={round}
          youId={answersAs}
        />
      ) : (
        roundCard(null)
      )}
      {higherLower !== null && onAnswer === null && (
        <HigherLowerPairs
          pairs={higherLower.pairs}
          players={view.players}
          sheets={[]}
          youId={null}
          yourPicks={null}
        />
      )}
      {mode === 'choice' &&
        (onAnswer === null ? (
          <PrintedChoices round={round} />
        ) : (
          <ChoiceAnswer
            key={round.id}
            onAnswer={onAnswer}
            round={round}
            youId={answersAs}
          />
        ))}
      {isTyping && (
        <TypedAnswer
          // A seated console is withheld the answer the same way a player
          // is, so it reads what the round asks for off the round too.
          asksForAFilm={
            round.content.kind === 'blindtest' && round.content.asksForAFilm
          }
          key={round.id}
          onAnswer={onAnswer}
          round={round}
          verdict={view.yourVerdict}
        />
      )}
      {atlas?.target != null && onAnswer !== null && (
        <MapAnswer
          closesInMs={closesInMs}
          key={round.id}
          onAnswer={onAnswer}
          onLean={onLean}
          round={round}
          seat={view.players.findIndex((player) => player.id === answersAs)}
          youId={answersAs}
        />
      )}
      {timeline !== null &&
        (onAnswer === null ? (
          <TimelineStrip
            aria-label={translate('timeline.dealt')}
            events={timeline.events}
            layout='dealt'
          />
        ) : (
          <TimelineAnswer
            closesInMs={closesInMs}
            key={round.id}
            onAnswer={onAnswer}
            onLean={onLean}
            round={round}
            youId={answersAs}
          />
        ))}
      {swatch !== null && (
        <SwatchRound
          clock={clock}
          closesInMs={closesInMs}
          isCaptioned={false}
          onAnswer={onAnswer}
          onLean={onLean}
          round={round}
          youId={answersAs}
        />
      )}
      {estimate !== null && onAnswer !== null && (
        <EstimateAnswer
          key={round.id}
          onAnswer={onAnswer}
          round={round}
          youId={answersAs}
        />
      )}
      {mysteryWord !== null &&
        (onAnswer === null ? (
          <>
            <MysteryWordTowers players={view.players} round={round} />
            <MarkLegend
              items={[
                {
                  label: translate('mysteryword.wallLegend'),
                  mark: 'placed'
                }
              ]}
            />
          </>
        ) : (
          <MysteryWordAnswer
            key={round.id}
            onAnswer={onAnswer}
            paysForSpeed={view.settings.paysForSpeed}
            players={view.players}
            refusal={refusal}
            round={round}
            youId={answersAs}
          />
        ))}
      {longestWord !== null &&
        (onAnswer === null ? (
          <LongestWordTowers players={view.players} round={round} />
        ) : (
          <LongestWordAnswer
            closesInMs={closesInMs}
            key={round.id}
            onAnswer={onAnswer}
            onLean={onLean}
            refusal={refusal}
            round={round}
          />
        ))}
      {makeNumber !== null &&
        (onAnswer === null ? (
          <MakeNumberLadder players={view.players} round={round} />
        ) : (
          <MakeNumberAnswer
            closesInMs={closesInMs}
            key={round.id}
            onAnswer={onAnswer}
            onLean={onLean}
            refusal={refusal}
            round={round}
          />
        ))}
      {thinkAlike !== null &&
        (onAnswer === null ? (
          <ThinkAlikeTable players={view.players} round={round} />
        ) : (
          <ThinkAlikeAnswer
            key={round.id}
            onAnswer={onAnswer}
            onLean={onLean}
            players={view.players}
            round={round}
            youId={answersAs}
          />
        ))}
      {mostLikely !== null && onAnswer !== null && (
        <MostLikelyBallot
          key={round.id}
          onAnswer={onAnswer}
          players={view.players}
          round={round}
          youId={answersAs}
        />
      )}
      {blackSquare !== null &&
        (onAnswer === null ? (
          <BlackSquareGauge
            cellTiers={blackSquare.cellTiers}
            foundCellCount={blackSquare.foundCellCount}
          />
        ) : blackSquare.spoken !== null ? (
          <BlackSquareSpoken
            cellTiers={blackSquare.cellTiers}
            key={round.id}
            onTick={onTick}
            players={view.players}
            seatId={answersAs}
            spoken={blackSquare.spoken}
            teams={view.teams}
          />
        ) : (
          <BlackSquareAnswer
            key={round.id}
            onAnswer={onAnswer}
            round={round}
            verdict={view.yourVerdict}
          />
        ))}
      {view.players.length > 0 &&
        mode !== 'spoken' &&
        mysteryWord === null &&
        longestWord === null &&
        makeNumber === null &&
        thinkAlike === null &&
        (mode !== 'buzzer' ? (
          <AnsweredPawns players={view.players} round={round} />
        ) : (
          round.content.kind !== 'challenge' && (
            <BuzzerPawns players={view.players} round={round} />
          )
        ))}
      {children}
    </div>
  )
}
