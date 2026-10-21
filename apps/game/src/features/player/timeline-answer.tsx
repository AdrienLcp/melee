import type React from 'react'
import { useState } from 'react'

import type { PlayerId } from '@melee/protocol/identifiers'
import type { RoundView } from '@melee/protocol/room'
import type { TimelineEventId } from '@melee/protocol/timeline'

import { timelineContent } from '@/helpers/round-content'
import { Button } from '@/presentation/components/button'
import { TimelineOrderList } from '@/presentation/components/timeline-order-list'
import { TimelineStrip } from '@/presentation/components/timeline-strip'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import type { PlayerAnswer } from './answer-forms'

import './timeline-answer.sass'

type TimelineAnswerProps = {
  /** `false` from the socket means the frame was never written. */
  onAnswer: (answer: PlayerAnswer) => boolean
  round: RoundView
  /** The seat answering: a player's, a seated console's, or the wall's team. */
  youId: PlayerId | null
}

/**
 * The five cards, put in order as often as the player likes, and sent once by
 * the press under them: an order is one shot a seat, like a pick.
 *
 * Mounted under `key={round.id}`, so the order is about this round alone.
 */
export const TimelineAnswer: React.FC<TimelineAnswerProps> = ({
  onAnswer,
  round,
  youId
}) => {
  const translate = useTranslate()
  const events = timelineContent(round)?.events ?? []
  const [order, setOrder] = useState<TimelineEventId[]>(() =>
    events.map((event) => event.id)
  )
  const [isSent, setIsSent] = useState(false)

  // The server's record is what survives a reload; the order itself does not,
  // since no screen is told what anyone sent before the reveal.
  const hasAnswered =
    isSent || round.answers.some((answer) => answer.playerId === youId)
  const showsCards = !hasAnswered || isSent
  const ordered = order
    .map((id) => events.find((event) => event.id === id))
    .filter((event) => event !== undefined)

  return (
    <section
      className='answer-form timeline-answer'
      data-sent={hasAnswered || undefined}
    >
      {showsCards && (
        <p aria-hidden='true' className='end earliest'>
          {translate('timeline.answer.earliest')}
        </p>
      )}
      {hasAnswered ? (
        isSent && (
          <TimelineStrip
            aria-label={translate('timeline.answer.label')}
            events={ordered}
            layout='ordered'
          />
        )
      ) : (
        <TimelineOrderList
          aria-label={translate('timeline.answer.label')}
          events={ordered}
          onReorder={setOrder}
        />
      )}
      {showsCards && (
        <p aria-hidden='true' className='end latest'>
          {translate('timeline.answer.latest')}
        </p>
      )}
      {hasAnswered ? (
        <p className='hint' role='status'>
          {translate('timeline.answer.sent')}
        </p>
      ) : (
        <Button
          onPress={() => {
            if (onAnswer({ eventIds: order, kind: 'order' })) {
              setIsSent(true)
            }
          }}
          size='large'
        >
          {translate('timeline.answer.send')}
        </Button>
      )}
    </section>
  )
}
