import { useEffect, useState } from 'react'

import type { RoundView } from '@melee/protocol/room'
import type { ColourHex } from '@melee/protocol/swatch'

import {
  type ClockEstimate,
  millisecondsUntil
} from '@melee/core/time/clock-sync'

import { swatchContent } from '@/helpers/round-content'
import { nowMs } from '@/infrastructure/clock'

/**
 * The colour a shades round is showing on this screen right now, and `null`
 * once it has hidden.
 *
 * Hidden on this device's own estimate of the server clock, as the reflex race
 * flips: every screen goes blank at once rather than when a frame lands, and
 * the snapshot after `hidesAt` carries no colour anyway, so a late screen
 * never sees it at all.
 */
export const useShownColour = ({
  clock,
  round
}: {
  clock: ClockEstimate | null
  round: RoundView | null
}): ColourHex | null => {
  const content = swatchContent(round)
  const hidesAt = content?.hidesAt ?? null
  const [hiddenFor, setHiddenFor] = useState<number | null>(null)

  useEffect(() => {
    if (hidesAt === null) {
      return
    }

    const timeout = setTimeout(
      () => {
        setHiddenFor(hidesAt)
      },
      millisecondsUntil(clock, hidesAt, nowMs())
    )

    return () => {
      clearTimeout(timeout)
    }
  }, [clock, hidesAt])

  return hiddenFor !== null && hiddenFor === hidesAt
    ? null
    : (content?.colour ?? null)
}
