import type React from 'react'
import { DialogTrigger } from 'react-aria-components'

import { Button } from '@/presentation/components/button'
import {
  ChevronIcon,
  MinusIcon,
  PlusIcon
} from '@/presentation/components/icons'
import { Leaflet } from '@/presentation/components/leaflet'
import type { PointsRow } from '@/presentation/components/points-rows'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { RemoveSeat } from './remove-seat'

import './seat-standing.sass'

type SeatStandingProps = {
  /** Whether a press reaches the room: a closed socket greys the presses out. */
  isLive: boolean
  nickname: string
  /** Takes the seat off the table, `null` on this console's own seat. */
  onRemove: (() => void) | null
  onStep: (direction: 1 | -1) => void
  row: PointsRow
  /** The score or the case, as the row prints it. */
  standing: React.ReactNode
}

/**
 * A seat's standing as the press that changes it: the leaflet it opens holds
 * the `−` and `+` and, for anybody but this console, the seat's removal — so
 * the row keeps one control and its name the room to be read.
 */
export const SeatStanding: React.FC<SeatStandingProps> = ({
  isLive,
  nickname,
  onRemove,
  onStep,
  row,
  standing
}) => {
  const translate = useTranslate()
  const label = translate('host.podium.actions', {
    nickname,
    standing: row.standing
  })

  return (
    <DialogTrigger>
      <Button
        aria-label={label}
        className='seat-standing-chip'
        icon={<ChevronIcon />}
        size='small'
        variant='outlined'
      >
        {standing}
      </Button>
      <Leaflet
        aria-label={label}
        className='seat-standing-leaflet'
        placement='bottom end'
      >
        {({ close }) => (
          <div className='seat-standing-sheet'>
            <p className='seat-standing-name'>{nickname}</p>
            <div className='seat-standing-stepper'>
              <Button
                aria-label={row.takeLabel}
                isDisabled={!isLive || !row.canTake}
                onPress={() => {
                  onStep(-1)
                }}
                variant='outlined'
              >
                <MinusIcon />
              </Button>
              <span className='seat-standing-figure'>{standing}</span>
              <Button
                aria-label={row.giveLabel}
                isDisabled={!isLive || !row.canGive}
                onPress={() => {
                  onStep(1)
                }}
                variant='outlined'
              >
                <PlusIcon />
              </Button>
            </div>
            {onRemove !== null && (
              <RemoveSeat
                isWorded
                nickname={nickname}
                onRemove={() => {
                  close()
                  onRemove()
                }}
              />
            )}
          </div>
        )}
      </Leaflet>
    </DialogTrigger>
  )
}
