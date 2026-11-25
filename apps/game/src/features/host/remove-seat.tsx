import type React from 'react'

import { Button } from '@/presentation/components/button'
import { CrossIcon } from '@/presentation/components/icons'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './remove-seat.sass'

type RemoveSeatProps = {
  /** Says its verb beside its cross, inside a leaflet under the seat's name; the cross alone on a row. */
  isWorded?: boolean
  nickname: string
  onRemove: () => void
}

/**
 * Takes a seat off the table: the row's own press while it is the seat's one
 * action, the leaflet's last line once the standing opens beside it.
 */
export const RemoveSeat: React.FC<RemoveSeatProps> = ({
  isWorded = false,
  nickname,
  onRemove
}) => {
  const translate = useTranslate()
  const label = translate
    .rich('host.players.removeNamed', {
      name: (name) => name,
      nickname
    })
    .join('')

  if (isWorded) {
    return (
      <Button
        aria-label={label}
        className='remove-seat'
        data-worded
        icon={<CrossIcon />}
        onPress={onRemove}
        variant='underlined'
      >
        {translate('host.players.remove')}
      </Button>
    )
  }

  return (
    <Button
      aria-label={label}
      className='remove-seat'
      onPress={onRemove}
      variant='underlined'
    >
      <CrossIcon />
    </Button>
  )
}
