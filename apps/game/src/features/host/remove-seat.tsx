import type React from 'react'

import { Button } from '@/presentation/components/button'
import { CrossIcon } from '@/presentation/components/icons'
import { typedName } from '@/presentation/components/typed-name'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { RichText } from '@/presentation/i18n/rich-text'

import './remove-seat.sass'

type RemoveSeatProps = {
  /** Says what it does beside its cross, inside a leaflet; the cross alone on a row. */
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

  if (isWorded) {
    return (
      <Button
        className='remove-seat'
        data-worded
        icon={<CrossIcon />}
        onPress={onRemove}
        variant='underlined'
      >
        <RichText
          parts={translate.rich('host.players.removeNamed', {
            name: typedName,
            nickname
          })}
        />
      </Button>
    )
  }

  return (
    <Button
      aria-label={translate
        .rich('host.players.removeNamed', {
          name: (name) => name,
          nickname
        })
        .join('')}
      className='remove-seat'
      onPress={onRemove}
      variant='underlined'
    >
      <CrossIcon />
    </Button>
  )
}
