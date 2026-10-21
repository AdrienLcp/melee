import type React from 'react'

import type { PlayerId } from '@melee/protocol/identifiers'
import type { HostRoomView, RoundView } from '@melee/protocol/room'

import {
  ChoiceAnswer,
  longestChoiceLength,
  type PlayerAnswer,
  TypedAnswer
} from '@/features/player/answer-forms'
import { MapAnswer } from '@/features/player/map-answer'
import { quizContent, worldmapContent } from '@/helpers/round-content'
import { AskedQuestion } from '@/presentation/components/asked-question'
import { MapPrompt } from '@/presentation/components/map-prompt'
import { RoundProgress } from '@/presentation/components/round-progress'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { AnsweredPawns, BuzzerPawns } from './answered-pawns'
import { PrintedChoices } from './printed-choices'

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
  /** Sends the seat's or the wall's answer, and says whether the socket took it; `null` when this screen answers nothing. */
  onAnswer: ((answer: PlayerAnswer) => boolean) | null
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
  onAnswer,
  round,
  view
}) => {
  const translate = useTranslate()
  const roundDurationMs = round.durationMs
  const mode = round.answerMode
  const choiceLength = longestChoiceLength(round)
  const isTyping = mode === 'typed' && onAnswer !== null
  const teamOnTurn = view.teams.find(
    (team) => team.id === round.turn?.teamIds[0]
  )
  const worldmap = worldmapContent(round)

  return (
    <div
      className='stage playing'
      data-answering={isTyping || undefined}
      data-choices={mode === 'choice' || undefined}
      data-long-choices={choiceLength > LONG_CHOICE_LENGTH || undefined}
      data-map={(worldmap !== null && onAnswer !== null) || undefined}
      data-turn={teamOnTurn !== undefined || undefined}
      style={{
        '--choice-length': choiceLength,
        '--team':
          teamOnTurn === undefined
            ? undefined
            : `var(--pawn-${teamOnTurn.colour})`
      }}
    >
      {clipOffer}
      <section className='round-card'>
        {roundDurationMs !== null && (
          <RoundProgress
            durationMs={roundDurationMs}
            elapsedMs={view.roundElapsedMs}
          />
        )}
        {round.content.kind === 'quiz' ? (
          <AskedQuestion prompt={quizContent(round)?.prompt ?? null} />
        ) : worldmap !== null ? (
          <MapPrompt countryCode={worldmap.countryCode} />
        ) : round.content.kind === 'challenge' ? (
          <>
            <p className='now challenge-line'>
              {round.content.text ?? translate('challenge.untitled')}
            </p>
            <p className='challenge-where'>
              {translate('challenge.atTheTable')}
            </p>
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
          // is, so it reads what the round asks for off the settings too.
          asksForAFilm={
            view.settings.game?.kind === 'blindtest' &&
            view.settings.game.source.kind === 'film'
          }
          key={round.id}
          onAnswer={onAnswer}
          round={round}
          verdict={view.yourVerdict}
        />
      )}
      {worldmap !== null && onAnswer !== null && (
        <MapAnswer
          key={round.id}
          onAnswer={onAnswer}
          round={round}
          seat={view.players.findIndex((player) => player.id === answersAs)}
          youId={answersAs}
        />
      )}
      {view.players.length > 0 &&
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
