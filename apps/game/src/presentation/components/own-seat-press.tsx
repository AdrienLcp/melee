import { classNames } from '@adrienlcp/react'
import type React from 'react'
import { DialogTrigger, Button as ReactAriaButton } from 'react-aria-components'

import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { ChevronIcon } from './icons'
import { Leaflet } from './leaflet'
import { PawnPiecePicker } from './pawn-piece-picker'
import { SeatNameForm } from './seat-name-form'
import { useOwnPawn } from './use-own-pawn'

import './own-seat-press.sass'

type OwnSeatPressProps = {
  /** The row as every other seat draws it: pawn, name and marks. */
  children: React.ReactNode
  /** The row's own class, which the press takes in its place. */
  className?: string
}

/**
 * This screen's own row on the lobby's roster, made the press that opens its
 * seat: one sheet holding the name it plays under and its pawn — the seat's
 * piece, or its team's colour when it sits in one. The row keeps the height
 * of every other row; a chevron at its end is all it adds. Picking a piece or
 * having a new name taken closes it. Drawn as the bare row where no seat is
 * held.
 */
export const OwnSeatPress: React.FC<OwnSeatPressProps> = ({
  children,
  className
}) => {
  const pawn = useOwnPawn()
  const translate = useTranslate()

  if (pawn === null) {
    return <span className={className}>{children}</span>
  }

  const { onRecolour, team: _team, ...picker } = pawn

  return (
    <DialogTrigger>
      <ReactAriaButton className={classNames(className, 'own-seat-press')}>
        {children}
        <ChevronIcon className='chevron' />
      </ReactAriaButton>
      <Leaflet
        aria-label={translate('pawn.press.sheet')}
        className='own-seat-leaflet'
        placement='bottom'
      >
        {({ close }) => (
          <>
            <SeatNameForm onRenamed={close} />
            <PawnPiecePicker
              {...picker}
              onRecolour={(piece) => {
                onRecolour(piece)
                close()
              }}
            />
          </>
        )}
      </Leaflet>
    </DialogTrigger>
  )
}
