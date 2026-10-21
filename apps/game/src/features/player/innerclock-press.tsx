import { classNames } from '@adrienlcp/react'
import type React from 'react'
import { useState } from 'react'
import { Button as ReactAriaButton } from 'react-aria-components'

import type { RoundView } from '@melee/protocol/room'

import { innerclockContent } from '@/helpers/round-content'
import { buzzFeedback } from '@/infrastructure/browser'
import { CountPrompt } from '@/presentation/components/count-prompt'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './innerclock-press.sass'

type InnerclockPressProps = {
  /** `false` from the socket means the frame was never written. */
  onPress: (roundId: string) => boolean
  round: RoundView
}

/**
 * A player's count: the target on its card, and the one piece to press when
 * they think they are there. Pressed, the piece leaves the box and says so, and
 * nothing else changes — not the time, which the room learns at the reveal.
 */
export const InnerclockPress: React.FC<InnerclockPressProps> = ({
  onPress,
  round
}) => {
  const translate = useTranslate()
  const [claimedRoundId, setClaimedRoundId] = useState<string | null>(null)
  const content = innerclockContent(round)

  if (content === null) {
    return null
  }

  const hasPressed = content.hasPressed || claimedRoundId === round.id

  return (
    <section className='player-round innerclock-press buzzer-area'>
      <CountPrompt isCompact targetSeconds={content.targetSeconds} />
      <div className='press'>
        <ReactAriaButton
          className={classNames('buzzer', hasPressed && 'claimed')}
          isDisabled={hasPressed}
          onPressStart={() => {
            buzzFeedback('press')
            setClaimedRoundId(onPress(round.id) ? round.id : null)
          }}
        >
          <span className='word'>{translate('innerclock.press')}</span>
        </ReactAriaButton>
        <p className='hint' role='status'>
          {translate(hasPressed ? 'innerclock.pressed' : 'innerclock.hint')}
        </p>
      </div>
    </section>
  )
}
