import type React from 'react'
import { useState } from 'react'

import type { PlayerRoomView } from '@melee/protocol/room'

import {
  type ClockEstimate,
  millisecondsUntil
} from '@melee/core/time/clock-sync'

import type { RevealHoldSpan } from '@/helpers/reveal-hold'
import { nowMs } from '@/infrastructure/clock'
import { CheckIcon } from '@/presentation/components/icons'
import { ToggleButton } from '@/presentation/components/toggle-button'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './back-at-the-table.sass'

type BackAtTheTableProps = {
  clock: ClockEstimate | null
  /** The wait every seat being ready armed, when the press draws it. */
  hold: RevealHoldSpan | null
  onReady: (isReady: boolean) => boolean
  view: PlayerRoomView
}

/**
 * The press that tells the table this seat is back: in the lobby, on every
 * reveal and on the final board. Every seat ready opens the game, the next
 * round, the final board or the game again after a short hold, and the host
 * still goes on whenever they like. The next game stays unnamed until its
 * countdown, so a planned line-up keeps its surprises. A room whose host
 * keeps every press folds it away, as does a lobby with no game chosen: a
 * press there would arm nothing.
 */
export const BackAtTheTable: React.FC<BackAtTheTableProps> = ({
  clock,
  hold,
  onReady,
  view
}) => {
  const translate = useTranslate()
  const you = view.players.find((player) => player.id === view.youId)

  if (you === undefined) {
    return null
  }

  const label = translate('player.lineUp.ready')
  const isAsked =
    !view.settings.hostOpensNextRound &&
    (view.phase !== 'lobby' || view.settings.game !== null)

  return (
    <div
      className='back-at-the-table'
      data-open={isAsked || undefined}
      inert={!isAsked}
    >
      <div>
        <ToggleButton
          isSelected={you.isReady}
          onChange={(isReady) => {
            onReady(isReady)
          }}
          size='large'
        >
          <span aria-hidden className='ready-mark'>
            <CheckIcon />
          </span>
          {label}
          <ReadyHoldFill clock={clock} hold={hold} label={label} />
        </ToggleButton>
      </div>
    </div>
  )
}

/**
 * The wait to what comes next, filling the Ready press from its leading edge
 * in the phase's ink. The label is printed again on the fill, so it reads over
 * both materials. Once shown it stays mounted, and a hold called off fades out.
 */
const ReadyHoldFill: React.FC<{
  clock: ClockEstimate | null
  hold: RevealHoldSpan | null
  label: string
}> = ({ clock, hold, label }) => {
  const [shown, setShown] = useState<
    (RevealHoldSpan & { remainingMs: number }) | null
  >(null)

  // Read once per hold: re-aiming a running animation rebases what it has
  // already played, and the fill would jump on every snapshot.
  if (hold !== null && hold.advancesAt !== shown?.advancesAt) {
    setShown({
      ...hold,
      remainingMs: Math.max(
        0,
        millisecondsUntil(clock, hold.advancesAt, nowMs())
      )
    })
  }

  if (shown === null) {
    return null
  }

  return (
    <span
      aria-hidden
      className='ready-hold-fill'
      data-filling={hold !== null || undefined}
      key={shown.advancesAt}
      style={{
        '--fill-duration': `${shown.remainingMs}ms`,
        '--unfilled-from': `${((shown.remainingMs / shown.holdMs) * 100).toFixed(1)}%`
      }}
    >
      <CheckIcon />
      <span className='control-label'>{label}</span>
    </span>
  )
}
