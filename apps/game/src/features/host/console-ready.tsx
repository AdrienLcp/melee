import type React from 'react'

import type { ClientMessage } from '@melee/protocol/client-message'
import type { HostRoomView } from '@melee/protocol/room'

import { asksReady } from '@melee/core/round/asks-ready'

import { CheckIcon } from '@/presentation/components/icons'
import { ToggleButton } from '@/presentation/components/toggle-button'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './console-ready.sass'

type ConsoleReadyProps = {
  isDisabled: boolean
  send: (message: ClientMessage) => boolean
  view: HostRoomView
}

/**
 * A seated host's word that they are back at the table, beside the press
 * that opens the next round without anyone: while the table drives the
 * evening, the room waits on the console's seat as on any other. Kept
 * mounted, and opened by whether the reveal asks for it.
 */
export const ConsoleReady: React.FC<ConsoleReadyProps> = ({
  isDisabled,
  send,
  view
}) => {
  const translate = useTranslate()
  const you = view.players.find((player) => player.id === view.youId)
  const round = view.round
  const isAsked =
    you !== undefined &&
    round != null &&
    !view.settings.hostOpensNextRound &&
    asksReady({ game: round.content.kind, isFinal: round.isFinal })

  return (
    <div
      className='console-ready'
      data-open={isAsked || undefined}
      inert={!isAsked}
    >
      <div>
        <ToggleButton
          isDisabled={isDisabled}
          isSelected={you?.isReady ?? false}
          onChange={(isReady) => {
            send({ isReady, type: 'player.ready' })
          }}
          size='large'
        >
          <span aria-hidden className='ready-mark'>
            <CheckIcon />
          </span>
          {translate('player.lineUp.ready')}
        </ToggleButton>
      </div>
    </div>
  )
}
