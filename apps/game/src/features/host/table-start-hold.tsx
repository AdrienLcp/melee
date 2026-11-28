import type React from 'react'
import { useState } from 'react'

import type { HostRoomView } from '@melee/protocol/room'

import type { ClockEstimate } from '@melee/core/time/clock-sync'

import { type RevealHoldSpan, tableStartHoldOf } from '@/helpers/reveal-hold'
import { OpeningRefusalNotice } from '@/presentation/components/opening-refusal-notice'
import { RevealHold } from '@/presentation/components/round-progress'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './table-start-hold.sass'

type TableStartHoldProps = {
  /** This device's estimate of the server clock; `null` before the first pong. */
  clock: ClockEstimate | null
  view: Pick<HostRoomView, 'openingRefusedFor' | 'readyStartsAt' | 'settings'>
}

/**
 * The wait a table all ready armed in the lobby or on the final board, counted
 * down on the screens the room reads, so nobody is surprised by the game
 * opening on its own. Kept mounted: it opens with the wait and folds away when
 * a seat takes its ready back, still drawing the wait it was counting while it
 * closes. Above it, why nothing opened when the table was ready.
 */
export const TableStartHold: React.FC<TableStartHoldProps> = ({
  clock,
  view
}) => {
  const translate = useTranslate()
  const hold = tableStartHoldOf({
    readyStartsAt: view.readyStartsAt,
    settings: view.settings
  })
  const [lastHold, setLastHold] = useState<RevealHoldSpan | null>(hold)

  if (hold !== null && hold.advancesAt !== lastHold?.advancesAt) {
    setLastHold(hold)
  }

  const drawn = hold ?? lastHold

  return (
    <>
      <OpeningRefusalNotice refusal={view.openingRefusedFor} />
      <div className='table-start-hold' data-open={hold !== null || undefined}>
        <div>
          {drawn !== null && (
            <RevealHold
              clock={clock}
              label={translate('host.ready.everyone')}
              {...drawn}
            />
          )}
        </div>
      </div>
    </>
  )
}
