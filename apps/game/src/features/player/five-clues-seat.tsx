import type React from 'react'
import { useState } from 'react'
import { Form } from 'react-aria-components'

import { FIVE_CLUES_CLUE_COUNT } from '@melee/protocol/five-clues'
import type { PlayerId } from '@melee/protocol/identifiers'
import type {
  PublicPlayer,
  RoundContent,
  RoundView
} from '@melee/protocol/room'

import type { ClockEstimate } from '@melee/core/time/clock-sync'

import { ChoiceAnswer, type PlayerAnswer } from '@/features/player/answer-forms'
import { fiveCluesContent } from '@/helpers/round-content'
import { Button } from '@/presentation/components/button'
import { FiveCluesLadder } from '@/presentation/components/five-clues-ladder'
import { FiveCluesWindow } from '@/presentation/components/five-clues-window'
import { CheckIcon } from '@/presentation/components/icons'
import { Pawn } from '@/presentation/components/pawn'
import { TextField } from '@/presentation/components/text-field'
import { useLastShown } from '@/presentation/components/use-last-shown'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import type { Translate } from '@/presentation/i18n/translation'

import './five-clues-seat.sass'

type FiveCluesContent = Extract<RoundContent, { kind: 'fiveclues' }>

const LAST_CLUE_INDEX = FIVE_CLUES_CLUE_COUNT - 1

type FiveCluesSeatLadderProps = {
  clock: ClockEstimate | null
  content: FiveCluesContent
  players: readonly PublicPlayer[]
  /** The seat climbing, whose pawn stands on its rung; `null` draws no pawn. */
  youId: PlayerId | null
}

/**
 * The climb as one seat sees it: the clues open so far, the window's bar on
 * the open one, and the seat's own pawn on the rung it stands on — the open
 * one while it races, the one it dared once it found, gone once it is out.
 * Every lane holds the pawn and the rung it stands on shows it, so a climb
 * is the pawn leaving one rung and rising onto the next.
 */
export const FiveCluesSeatLadder: React.FC<FiveCluesSeatLadderProps> = ({
  clock,
  content,
  players,
  youId
}) => {
  const seat = players.findIndex((player) => player.id === youId)
  const standing = content.yourStanding
  const standsOn =
    standing === null || seat === -1
      ? null
      : standing.status === 'found'
        ? standing.clueIndex
        : standing.status === 'racing'
          ? content.openClueIndex
          : null

  return (
    <FiveCluesLadder
      clues={content.clues}
      laneOf={(clueIndex) =>
        seat === -1 ? null : (
          <span
            className='climber'
            data-found={
              (standing?.status === 'found' && standsOn === clueIndex) ||
              undefined
            }
            data-here={standsOn === clueIndex || undefined}
          >
            <Pawn seat={seat} />
            <span className='found-mark'>
              <CheckIcon />
            </span>
          </span>
        )
      }
      openClueIndex={content.openClueIndex}
      size='seat'
      window={<FiveCluesWindow clock={clock} content={content} />}
    />
  )
}

/** What the seat's own standing says between the climb and its answer, or `null` while it is free to answer. */
const standingLine = ({
  content,
  translate
}: {
  content: FiveCluesContent
  translate: Translate
}): string | null => {
  const standing = content.yourStanding

  if (standing === null) {
    return null
  }

  switch (standing.status) {
    case 'found':
      return translate('fiveclues.you.found', {
        index: standing.clueIndex + 1
      })
    case 'out':
      return translate('fiveclues.you.out')
    case 'racing':
      if (standing.guessedOnClue !== content.openClueIndex) {
        return null
      }

      return content.openClueIndex === LAST_CLUE_INDEX
        ? translate('fiveclues.you.heldLast')
        : translate('fiveclues.you.held', {
            index: content.openClueIndex + 2
          })
  }
}

type FiveCluesSeatProps = {
  clock: ClockEstimate | null
  /** Sends the answer, and says whether the socket took it. */
  onAnswer: (answer: PlayerAnswer) => boolean
  players: readonly PublicPlayer[]
  round: RoundView
  youId: PlayerId | null
}

/**
 * A seat's climb in a `choice` or `typed` round: the ladder down to the
 * field, then the seat's own standing said plainly — held until the next
 * clue after a wrong guess, found on which clue, out after a wrong pick —
 * then the four names or the one field.
 */
export const FiveCluesSeat: React.FC<FiveCluesSeatProps> = ({
  clock,
  onAnswer,
  players,
  round,
  youId
}) => {
  const translate = useTranslate()
  const content = fiveCluesContent(round)
  const line = content === null ? null : standingLine({ content, translate })
  const shownLine = useLastShown(line)

  if (content === null) {
    return null
  }

  const standing = content.yourStanding
  const isFound = standing?.status === 'found'

  return (
    <section
      className='player-round five-clues-seat'
      data-mode={round.answerMode}
    >
      <FiveCluesSeatLadder
        clock={clock}
        content={content}
        players={players}
        youId={youId}
      />
      <div className='ground'>
        <div
          className='fold'
          data-open={line !== null || undefined}
          inert={line === null}
        >
          <p
            className='standing'
            data-standing={
              isFound ? 'found' : standing?.status === 'out' ? 'out' : 'held'
            }
            role='status'
          >
            {shownLine}
          </p>
        </div>
        {round.answerMode === 'choice' ? (
          <ChoiceAnswer
            key={round.id}
            onAnswer={onAnswer}
            round={round}
            youId={youId}
          />
        ) : (
          <FiveCluesGuess
            content={content}
            key={round.id}
            onAnswer={onAnswer}
          />
        )}
      </div>
    </section>
  )
}

/** One field and one guess a clue, closed while the seat is held, once it found and once it is out. */
const FiveCluesGuess: React.FC<{
  content: FiveCluesContent
  onAnswer: (answer: PlayerAnswer) => boolean
}> = ({ content, onAnswer }) => {
  const translate = useTranslate()
  const [guess, setGuess] = useState('')
  const standing = content.yourStanding
  const isClosed =
    standing === null ||
    standing.status !== 'racing' ||
    standing.guessedOnClue === content.openClueIndex
  const isEmpty = guess.trim() === ''

  return (
    <Form
      className='five-clues-guess'
      onSubmit={(event) => {
        event.preventDefault()

        if (!isEmpty && onAnswer({ guess: guess.trim(), kind: 'typed' })) {
          setGuess('')
        }
      }}
    >
      <TextField
        autoComplete='off'
        autoFocus
        enterKeyHint='send'
        isDisabled={isClosed}
        label={translate('fiveclues.answer.label')}
        onChange={setGuess}
        placeholder={translate('fiveclues.answer.label')}
        value={guess}
      />
      <Button isDisabled={isClosed || isEmpty} size='large' type='submit'>
        {translate('round.answer.submit')}
      </Button>
    </Form>
  )
}
