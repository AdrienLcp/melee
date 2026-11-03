import type React from 'react'
import { useState } from 'react'

import { hostPathFor } from '@/infrastructure/router/navigation'
import { ArrowIcon } from '@/presentation/components/icons'
import { Link } from '@/presentation/components/link'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { useOpenHostedRooms } from '@/presentation/room-actions/use-open-hosted-rooms'
import { useIsPrerendering } from '@/presentation/use-is-prerendering'

import './resume-table.sass'

type ResumeTableProps = {
  /** A table is opening, and no other press may land. */
  isDisabled: boolean
}

/**
 * The way back to the last table this device opened, under the wordmark,
 * while it is still open. A player needs none: typing the code again finds the
 * seat it already holds.
 *
 * Its line is held from the first paint whenever the device remembers a table
 * — by the served page when the script ahead of it finds a host token, by the
 * app while the server is asked — and stays held for the page's life when every
 * table turns out closed, so nothing under it moves either way. The store is
 * pruned by that answer, so the next visit holds nothing.
 */
export const ResumeTable: React.FC<ResumeTableProps> = ({ isDisabled }) => {
  const isPrerendering = useIsPrerendering()
  const translate = useTranslate()
  const openHosted = useOpenHostedRooms()
  const [isLineHeld] = useState(openHosted === null)
  const lastHosted = openHosted?.[0] ?? null

  if (isPrerendering) {
    return <span aria-hidden='true' className='resume-table' data-held />
  }

  if (lastHosted === null) {
    return isLineHeld ? (
      <span aria-hidden='true' className='resume-table' />
    ) : null
  }

  return (
    <Link
      className='resume-table'
      href={hostPathFor(lastHosted)}
      isDisabled={isDisabled}
      size='small'
      variant='underlined'
    >
      <span className='label'>
        {translate('home.resume')} <span className='code'>{lastHosted}</span>
      </span>
      <ArrowIcon />
    </Link>
  )
}
