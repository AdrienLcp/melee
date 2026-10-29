import type React from 'react'

import type { BlackSquareCell } from '@melee/protocol/black-square'
import type { PlayerId } from '@melee/protocol/identifiers'
import type { HostRoomView, RoundView } from '@melee/protocol/room'

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
import { MapAnswer } from '@/features/player/map-answer'
import { MatchsticksMove } from '@/features/player/matchsticks-move'
import { MostLikelyBallot } from '@/features/player/most-likely-ballot'
import { PrintedChoices } from '@/features/player/printed-choices'
import { RoundQuestion } from '@/features/player/round-question'
import { SwatchRound } from '@/features/player/swatch-round'
import { TimelineAnswer } from '@/features/player/timeline-answer'
import {
  atlasContent,
  blackSquareContent,
  estimateContent,
  higherLowerContent,
  matchsticksContent,
  mostLikelyContent,
  swatchContent,
  timelineContent
} from '@/helpers/round-content'
import { BlackSquareSpoken } from '@/presentation/components/black-square-spoken'
import { EstimateQuestion } from '@/presentation/components/estimate-question'
import { HigherLowerPairs } from '@/presentation/components/higher-lower-pairs'
import { MapPrompt } from '@/presentation/components/map-prompt'
import { MatchsticksPrompt } from '@/presentation/components/matchsticks-prompt'
import { RoundProgress } from '@/presentation/components/round-progress'
import { TimelineStrip } from '@/presentation/components/timeline-strip'
import { useShownColour } from '@/presentation/components/use-shown-colour'
import { useI18n } from '@/presentation/i18n/i18n-provider'

import { AnsweredPawns, BuzzerPawns } from './answered-pawns'
import { BlackSquareGauge } from './black-square-gauge'

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
  /** Sends the seat's tick when it keeps a spoken black square's list; `null` when this screen keeps none. */
  onTick:
    | ((cell: BlackSquareCell | 'blackWord', isTicked: boolean) => boolean)
    | null
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
  onTick,
  round,
  view
}) => {
  const { locale, translate } = useI18n()
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
  const shownColour = useShownColour({ clock, round })
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
        <MatchsticksPrompt puzzle={matchsticks.puzzle}>
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
            {translate('higherlower.dealt')}
          </p>
        ))
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
      data-swatch={
        swatch === null
          ? undefined
          : shownColour === null && onAnswer !== null
            ? 'answering'
            : 'shown'
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
          key={round.id}
          onAnswer={onAnswer}
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
            key={round.id}
            onAnswer={onAnswer}
            round={round}
            youId={answersAs}
          />
        ))}
      {swatch !== null && (
        <SwatchRound
          clock={clock}
          isCaptioned={false}
          onAnswer={onAnswer}
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
            answerCount={blackSquare.answerCount}
            foundCellCount={blackSquare.foundCellCount}
          />
        ) : blackSquare.spoken !== null ? (
          <BlackSquareSpoken
            answerCount={blackSquare.answerCount}
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
