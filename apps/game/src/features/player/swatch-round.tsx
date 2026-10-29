import type React from 'react'

import type { PlayerId } from '@melee/protocol/identifiers'
import type { RoundView } from '@melee/protocol/room'

import type { ClockEstimate } from '@melee/core/time/clock-sync'

import { SwatchShown } from '@/presentation/components/swatch-shown'
import { useShownColour } from '@/presentation/components/use-shown-colour'

import type { PlayerAnswer } from './answer-forms'
import { SwatchAnswer } from './swatch-answer'

type SwatchRoundProps = {
  clock: ClockEstimate | null
  /** `false` where a card above already says what the round is doing. */
  isCaptioned?: boolean
  /** Sends the seat's colour, and `null` on a screen that answers nothing. */
  onAnswer: ((answer: PlayerAnswer) => boolean) | null
  round: RoundView
  youId: PlayerId | null
}

/**
 * A shades round in play: the colour while it is up, then the picker on a
 * screen holding a seat, and the empty socket on one that only watches.
 */
export const SwatchRound: React.FC<SwatchRoundProps> = ({
  clock,
  isCaptioned,
  onAnswer,
  round,
  youId
}) => {
  const shown = useShownColour({ clock, round })

  if (shown !== null || onAnswer === null) {
    return <SwatchShown colour={shown} isCaptioned={isCaptioned} />
  }

  return (
    <SwatchAnswer
      isCaptioned={isCaptioned}
      key={round.id}
      onAnswer={onAnswer}
      round={round}
      youId={youId}
    />
  )
}
