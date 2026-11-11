import { classNames } from '@adrienlcp/react'
import type React from 'react'
import { useState } from 'react'

import type { ClockEstimate } from '@melee/core/time/clock-sync'

import type { SocketStatus } from '@/infrastructure/messaging/use-room-socket'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import type { PlainTranslationKey } from '@/presentation/i18n/translation'

import './connection-status.sass'

/**
 * A literal template rather than a lookup, for the same reason as
 * `protocolErrorKey`: adding a state to `SocketStatus` fails to compile until
 * every locale has named it.
 */
export const connectionStatusKey = (
  status: SocketStatus
): PlainTranslationKey => `connection.${status}`

type ConnectionDotProps = {
  /** Told apart by hue, and by shape and motion inside an ink ring — a hue alone vanishes on the amber trigger. */
  status: SocketStatus
}

/** Decorative alone: whatever renders it also renders the word beside it. */
export const ConnectionDot: React.FC<ConnectionDotProps> = ({ status }) => (
  <span aria-hidden='true' className={classNames('connection-dot', status)} />
)

type ConnectionStatusProps = {
  /** `null` until the first exchange completes; the one-way latency is shown once it lands. */
  clock: ClockEstimate | null
  status: SocketStatus
}

/**
 * The socket's state in words, and its one-way latency while it is open. The
 * latency stays mounted and folds in and out beside the word, still reading
 * the last figure while it folds: the figure of a socket that dropped is the
 * delay of a line that is no longer there.
 */
export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  clock,
  status
}) => {
  const translate = useTranslate()
  const latencyMs = clock === null ? null : Math.round(clock.roundTripMs / 2)
  const isLatencyShown = status === 'open' && latencyMs !== null
  const [shownLatencyMs, setShownLatencyMs] = useState(latencyMs)

  if (isLatencyShown && latencyMs !== shownLatencyMs) {
    setShownLatencyMs(latencyMs)
  }

  return (
    <p className='connection-status'>
      <ConnectionDot status={status} />
      <span className='said' key={status}>
        {translate(connectionStatusKey(status))}
      </span>
      <span
        aria-hidden={!isLatencyShown}
        className='latency'
        data-shown={isLatencyShown || undefined}
      >
        <span>
          {shownLatencyMs !== null &&
            translate('connection.latency', {
              milliseconds: shownLatencyMs
            })}
        </span>
      </span>
    </p>
  )
}
