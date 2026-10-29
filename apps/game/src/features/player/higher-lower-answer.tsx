import type React from 'react'
import { useState } from 'react'

import {
  HIGHER_LOWER_PAIR_COUNT,
  type HigherLowerSide
} from '@melee/protocol/higher-lower'
import type { PlayerId } from '@melee/protocol/identifiers'
import type { RoundView } from '@melee/protocol/room'

import { higherLowerContent } from '@/helpers/round-content'
import { AnswerTile } from '@/presentation/components/answer-tile'
import { HigherLowerPairs } from '@/presentation/components/higher-lower-pairs'
import { useI18n } from '@/presentation/i18n/i18n-provider'

import type { PlayerAnswer } from './answer-forms'

import './higher-lower-answer.sass'

const SIDES = ['left', 'right'] as const satisfies readonly HigherLowerSide[]

type HigherLowerAnswerProps = {
  /** Lays the pair's question on the caller's own card, which is the round's, sand and all. */
  card: (prompt: React.ReactNode) => React.ReactNode
  /** `false` from the socket means the frame was never written. */
  onAnswer: (answer: PlayerAnswer) => boolean
  round: RoundView
  /** The seat answering: a player's or a seated console's. */
  youId: PlayerId | null
}

/**
 * One pair at a time, its two names on two tiles: a press picks one and deals
 * the next, and the fifth sends the sheet whole. There is no way back — a pick
 * is final once the next pair shows, which is the whole game.
 *
 * Mounted under `key={round.id}`, so every round opens on its first pair.
 */
export const HigherLowerAnswer: React.FC<HigherLowerAnswerProps> = ({
  card,
  onAnswer,
  round,
  youId
}) => {
  const { locale, translate } = useI18n()
  const [picks, setPicks] = useState<HigherLowerSide[]>([])
  const [sentPicks, setSentPicks] = useState<HigherLowerSide[] | null>(null)
  const content = higherLowerContent(round)

  if (content === null) {
    return null
  }

  // The server's record is what survives a reload, and it carries the sheet
  // back with it.
  const sent = sentPicks ?? content.yourPicks
  const hasAnswered =
    sent !== null || round.answers.some((answer) => answer.playerId === youId)

  if (hasAnswered) {
    return (
      <>
        {card(
          <p className='higher-lower-sent' role='status'>
            {translate('higherlower.answer.sent')}
          </p>
        )}
        {sent !== null && (
          <section className='answer-form higher-lower-answer' data-sent>
            <HigherLowerPairs
              pairs={content.pairs}
              players={[]}
              sheets={[]}
              youId={youId}
              yourPicks={sent}
            />
          </section>
        )}
      </>
    )
  }

  const pair = content.pairs[picks.length]

  if (pair === undefined) {
    return null
  }

  const pick = (side: HigherLowerSide): void => {
    const next = [...picks, side]

    if (next.length < HIGHER_LOWER_PAIR_COUNT) {
      setPicks(next)
      return
    }

    if (onAnswer({ kind: 'pairs', picks: next })) {
      setSentPicks(next)
    }
  }

  return (
    <>
      {card(
        <hgroup className='higher-lower-prompt'>
          <p className='counter'>
            {translate('higherlower.answer.counter', {
              count: HIGHER_LOWER_PAIR_COUNT,
              index: picks.length + 1
            })}
          </p>
          <h2 className='asks'>
            {translate(`higherlower.asks.${pair.family}`)}
          </h2>
        </hgroup>
      )}
      <section
        aria-label={translate(`higherlower.asks.${pair.family}`)}
        className='answer-form higher-lower-answer'
      >
        <ul className='pair' key={picks.length}>
          {SIDES.map((side, index) => (
            <li key={side}>
              <AnswerTile
                index={index}
                onPress={() => {
                  pick(side)
                }}
                subtitle={null}
                title={pair[side][locale]}
              />
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
