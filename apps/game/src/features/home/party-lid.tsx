import type React from 'react'
import { Button } from 'react-aria-components'

import type { ReadyMadeLineUpId } from '@melee/core/room/ready-made-line-ups'

import { ArrowIcon } from '@/presentation/components/icons'
import { Spinner } from '@/presentation/components/spinner'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './party-lid.sass'

type PartyLidProps = {
  caption: string
  /** Which ready-made line-up it opens, which also picks its fill. */
  id: ReadyMadeLineUpId
  /** Another table is opening. */
  isDisabled: boolean
  /** The lid set apart over the others: its name set large, its picture beside its words. */
  isFeatured: boolean
  /** This lid's table is opening: the pill's arrow turns into the spinner. */
  isOpening: boolean
  name: string
  onOpen: () => void
  /** What the lid shows past its words, drawn in the lid's own colours. */
  picture: React.ReactNode
}

/**
 * One ready-made line-up as a lid printed in its own colour: its name, a
 * caption, an _Open →_ pill in the lid's ink and a picture of what it plays.
 * One press opens a table on it.
 */
export const PartyLid: React.FC<PartyLidProps> = ({
  caption,
  id,
  isDisabled,
  isFeatured,
  isOpening,
  name,
  onOpen,
  picture
}) => {
  const translate = useTranslate()

  return (
    <Button
      className='party-lid'
      data-featured={isFeatured || undefined}
      data-opening={isOpening || undefined}
      data-party={id}
      isDisabled={isDisabled}
      onPress={onOpen}
    >
      <span className='words'>
        <span className='name'>{name}</span>
        <span className='caption'>{caption}</span>
        <span className='go'>
          {translate('readyMade.open')}
          <span className='go-mark'>
            <ArrowIcon />
            <Spinner />
          </span>
        </span>
      </span>
      {picture}
    </Button>
  )
}
