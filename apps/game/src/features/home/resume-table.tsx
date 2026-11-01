import type React from 'react'

import { hostPathFor } from '@/infrastructure/router/navigation'
import { ArrowIcon } from '@/presentation/components/icons'
import { Link } from '@/presentation/components/link'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { useOpenHostedRooms } from '@/presentation/room-actions/use-open-hosted-rooms'

import './resume-table.sass'

type ResumeTableProps = {
  /** A table is opening, and no other press may land. */
  isDisabled: boolean
}

/**
 * The way back to the last table this device opened, under the wordmark,
 * while it is still open. A player needs none: typing the code again finds the
 * seat it already holds. Its line is held while the server is asked, so the
 * rows under it do not jump when the answer lands.
 */
export const ResumeTable: React.FC<ResumeTableProps> = ({ isDisabled }) => {
  const translate = useTranslate()
  const openHosted = useOpenHostedRooms()
  const lastHosted = openHosted?.[0] ?? null

  if (lastHosted === null) {
    return openHosted === null ? (
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
