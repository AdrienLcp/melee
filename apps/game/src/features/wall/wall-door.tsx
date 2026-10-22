import type React from 'react'

import { paths } from '@/infrastructure/router/navigation'
import { ScreenIcon } from '@/presentation/components/icons'
import { Link } from '@/presentation/components/link'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

/**
 * The front door for a screen that will show a table rather than run or join
 * one: a television, a projector, a laptop turned to face the sofa. It grants
 * nothing on its own — the screen it opens shows a code, and only the device
 * holding the table's token can answer it.
 *
 * Under the shelf rather than beside the two doors, because it is a rare
 * job — and spelled out rather than folded, because a folded title is all a
 * visitor reads of it, and the title alone never said what the press does.
 */
export const WallDoor: React.FC<{
  /** Set while the page is already opening a room, which is where it is about to go. */
  isDisabled: boolean
}> = ({ isDisabled }) => {
  const translate = useTranslate()

  return (
    <section className='wall-door'>
      <h3>
        <ScreenIcon />
        {translate('wall.door.label')}
      </h3>
      <p className='description'>{translate('wall.door.description')}</p>
      <Link href={paths.wallPairing} isDisabled={isDisabled} variant='outlined'>
        {translate('wall.door.action')}
      </Link>
    </section>
  )
}
