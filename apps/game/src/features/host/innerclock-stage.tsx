import type React from 'react'
import { useState } from 'react'

import type { PlayerId } from '@melee/protocol/identifiers'
import type { RoundView } from '@melee/protocol/room'

import { innerclockContent } from '@/helpers/round-content'
import { buzzFeedback } from '@/infrastructure/browser'
import { Button } from '@/presentation/components/button'
import { CountPrompt } from '@/presentation/components/count-prompt'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './innerclock-stage.sass'

type InnerclockStageProps = {
  /** `false` from the socket means the frame was never written. */
  onPress: (roundId: string) => boolean
  round: RoundView
  /** The seat this console holds, and `null` when it is only running the room. */
  youId: PlayerId | null
}

/**
 * The screen the room counts in front of, and still from the first frame to the
 * last: no clock, no bar, no name appearing as someone stops. Every one of those
 * would be a way to count by the screen rather than in your head.
 */
export const InnerclockStage: React.FC<InnerclockStageProps> = ({
  onPress,
  round,
  youId
}) => {
  const translate = useTranslate()
  const [claimedRoundId, setClaimedRoundId] = useState<string | null>(null)
  const content = innerclockContent(round)

  if (content === null) {
    return null
  }

  const hasPressed = content.hasPressed || claimedRoundId === round.id

  return (
    <div className='innerclock-stage'>
      <CountPrompt targetSeconds={content.targetSeconds} />
      <p className='go'>{translate('innerclock.go')}</p>
      {youId !== null && (
        // The same height pressed or not, so a console that stops moves
        // nothing on the screen the others are still counting in front of.
        <div className='yours' role='status'>
          {hasPressed ? (
            <p className='pressed'>{translate('innerclock.pressed')}</p>
          ) : (
            <Button
              onPress={() => {
                buzzFeedback('press')
                setClaimedRoundId(onPress(round.id) ? round.id : null)
              }}
              size='large'
            >
              {translate('innerclock.press')}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
