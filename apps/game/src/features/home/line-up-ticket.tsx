import type React from 'react'
import { useEffect, useRef } from 'react'
import { Button, ToggleButton } from 'react-aria-components'

import { Button as ControlButton } from '@/presentation/components/button'
import { CrossIcon, StarIcon } from '@/presentation/components/icons'
import { Spinner } from '@/presentation/components/spinner'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './line-up-ticket.sass'

/** The star a host puts on a ticket to keep its line-up at the head of the row. */
export type TicketStar = {
  isOn: boolean
  onChange: (isOn: boolean) => void
}

/**
 * How a ticket is taken off the row and put back. A removed ticket keeps its
 * place as a socket offering it back, so nothing beside it moves.
 */
export type TicketRemoval = {
  isRemoved: boolean
  onPutBack: () => void
  onRemove: () => void
}

/**
 * Where a ticket the folded row hides stands among the hidden ones: `order`
 * from the first, `fromEnd` from the last, so they arrive in reading order and
 * leave the other way round.
 */
export type TicketUnfolding = {
  fromEnd: number
  order: number
}

type LineUpTicketProps = {
  /** Another table is opening. */
  isDisabled: boolean
  /** This ticket's table is opening: a spinner opens beside its name. */
  isOpening: boolean
  /** When its last table was played, or `null` for a line-up never played. */
  meta: string | null
  name: string
  onOpen: () => void
  removal: TicketRemoval
  star: TicketStar
  /** `null` for a ticket the folded row shows. */
  unfolding: TicketUnfolding | null
}

/**
 * One of the host's own line-ups as a paper ticket: the star that keeps it,
 * its name and when it was last played — one press opens a table on it — and
 * the cross that takes it off the row. Each is a press of its own, side by
 * side, so a host aiming at one cannot land on another.
 */
export const LineUpTicket: React.FC<LineUpTicketProps> = ({
  isDisabled,
  isOpening,
  meta,
  name,
  onOpen,
  removal,
  star,
  unfolding
}) => {
  const translate = useTranslate()
  const openRef = useRef<HTMLButtonElement>(null)
  const putBackRef = useRef<HTMLDivElement>(null)
  const wasRemoved = useRef(removal.isRemoved)

  // The press that removed or put back the ticket has just gone invisible
  // under the finger, so the focus follows to what took its place.
  useEffect(() => {
    if (wasRemoved.current === removal.isRemoved) {
      return
    }

    wasRemoved.current = removal.isRemoved
    const takesFocus = removal.isRemoved
      ? putBackRef.current?.querySelector('button')
      : openRef.current
    takesFocus?.focus()
  }, [removal.isRemoved])

  return (
    <li
      className='line-up-ticket'
      data-opening={isOpening || undefined}
      data-removed={removal.isRemoved || undefined}
      data-unfolds={unfolding !== null || undefined}
      style={
        unfolding === null
          ? undefined
          : {
              '--fold-order': unfolding.fromEnd,
              '--unfold-order': unfolding.order
            }
      }
    >
      <ToggleButton
        aria-label={translate('home.saveLineUp', { name })}
        className='token keep'
        isDisabled={isDisabled}
        isSelected={star.isOn}
        onChange={star.onChange}
      >
        <StarIcon />
      </ToggleButton>
      <Button
        className='open'
        isDisabled={isDisabled}
        onPress={onOpen}
        ref={openRef}
      >
        <span className='name'>{name}</span>
        {meta !== null && <span className='meta'>{meta}</span>}
        <span className='busy'>
          <Spinner />
        </span>
      </Button>
      <Button
        aria-label={translate('home.yourLineUps.remove', { name })}
        className='token remove'
        isDisabled={isDisabled}
        onPress={removal.onRemove}
      >
        <CrossIcon />
      </Button>
      <div className='removed' ref={putBackRef}>
        <p>{translate('home.yourLineUps.removed', { name })}</p>
        <ControlButton
          isDisabled={isDisabled}
          onPress={removal.onPutBack}
          size='small'
          variant='underlined'
        >
          {translate('home.yourLineUps.putBack')}
        </ControlButton>
      </div>
    </li>
  )
}
