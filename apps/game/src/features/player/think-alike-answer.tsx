import type React from 'react'
import { useState } from 'react'
import { Form } from 'react-aria-components'

import type { LeanAnswer } from '@melee/protocol/client-message'
import type { PlayerId } from '@melee/protocol/identifiers'
import type { PublicPlayer, RoundView } from '@melee/protocol/room'
import { THINK_ALIKE_ANSWER_MAX_LENGTH } from '@melee/protocol/think-alike'

import { fadeOffACopyOfTheForm } from '@/features/player/form-leaving-copy'
import { thinkAlikeContent } from '@/helpers/round-content'
import { Button } from '@/presentation/components/button'
import { Pawn } from '@/presentation/components/pawn'
import { TextField } from '@/presentation/components/text-field'
import { ThinkAlikeTable } from '@/presentation/components/think-alike-table'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import type { PlayerAnswer } from './answer-forms'

import './think-alike-answer.sass'

/** The card wraps a long line, so Enter is refused a line break by the field and sends the form instead. */
const sendOnEnter = (event: { key: string; target: EventTarget }): void => {
  if (event.key === 'Enter' && event.target instanceof HTMLTextAreaElement) {
    event.target.form?.requestSubmit()
  }
}

type ThinkAlikeAnswerProps = {
  /** `false` from the socket means the frame was never written. */
  onAnswer: (answer: PlayerAnswer) => boolean
  /** Holds the line still in the field, which the round sends for the seat if the clock runs out first. */
  onLean: ((answer: LeanAnswer | null) => boolean) | null
  players: readonly PublicPlayer[]
  round: RoundView
  /** The seat answering: a player's or a seated console's. */
  youId: PlayerId | null
}

/**
 * The seat's answer written on a paper card — the field is the card — and
 * sent once. Sent, the card is laid face down, slightly askew, its back
 * carrying the seat's pawn and its own line, over the table where the others'
 * cards land as they send.
 *
 * Mounted under `key={round.id}`, so every round opens on a blank card.
 */
export const ThinkAlikeAnswer: React.FC<ThinkAlikeAnswerProps> = ({
  onAnswer,
  onLean,
  players,
  round,
  youId
}) => {
  const translate = useTranslate()
  const [draft, setDraft] = useState('')
  const [sentAnswer, setSentAnswer] = useState<string | null>(null)
  const content = thinkAlikeContent(round)
  const seat = players.findIndex((player) => player.id === youId)
  // The server's record is what survives a reload, and it carries the line back with it.
  const sent = sentAnswer ?? content?.yourAnswer ?? null
  const hasAnswered =
    sent !== null || round.answers.some((answer) => answer.playerId === youId)

  if (content === null) {
    return null
  }

  if (hasAnswered) {
    return (
      <section className='answer-form think-alike-answer' data-sent>
        <div className='held-card'>
          {seat >= 0 && (
            <span className='disc'>
              <Pawn seat={seat} />
            </span>
          )}
          {sent !== null && <p className='line'>{sent}</p>}
        </div>
        <p className='hint' role='status'>
          {translate('thinkalike.answer.sent')}
        </p>
        <ThinkAlikeTable isCompact players={players} round={round} />
      </section>
    )
  }

  const write = (text: string): void => {
    setDraft(text)

    const line = text.trim()
    onLean?.(line.length > 0 ? { answer: line, kind: 'match' } : null)
  }

  return (
    <section className='answer-form think-alike-answer'>
      <Form
        onSubmit={(event) => {
          event.preventDefault()

          const answer = draft.trim()

          if (answer.length > 0 && onAnswer({ answer, kind: 'match' })) {
            fadeOffACopyOfTheForm(event.currentTarget)
            setSentAnswer(answer)
          }
        }}
      >
        <div className='paper-card'>
          <div aria-hidden className='card-head'>
            {seat >= 0 && <Pawn seat={seat} />}
            <span className='length'>
              {translate('thinkalike.answer.length', {
                length: draft.length,
                max: THINK_ALIKE_ANSWER_MAX_LENGTH
              })}
            </span>
          </div>
          <TextField
            // The form only ever mounts on `playing`, so this opens the keyboard
            // when the round does and never over a countdown.
            autoFocus
            enterKeyHint='send'
            isMultiline
            label={translate('thinkalike.answer.label')}
            maxLength={THINK_ALIKE_ANSWER_MAX_LENGTH}
            onChange={write}
            onKeyDown={sendOnEnter}
            value={draft}
          />
        </div>
        <Button
          isDisabled={draft.trim().length === 0}
          size='large'
          type='submit'
        >
          {translate('thinkalike.answer.send')}
        </Button>
      </Form>
    </section>
  )
}
