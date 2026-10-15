import type React from 'react'
import { Dialog, DialogTrigger, Popover } from 'react-aria-components'

import { Button } from '@/presentation/components/button'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './setup-popover.sass'

type SetupPopoverProps = {
  /** What the fold and the strips beside it hold on a screen with room for them. */
  children: React.ReactNode
}

/**
 * The settings on a console held in a hand, where the stage is held to the
 * screen and a fold opening under it would have nowhere to go: one quiet press
 * beside the stage's action, and the same controls on a leaflet over it. Drawn
 * only where the console's stylesheet folds the setup away.
 */
export const SetupPopover: React.FC<SetupPopoverProps> = ({ children }) => {
  const translate = useTranslate()

  return (
    <DialogTrigger>
      <Button className='setup-trigger' size='small' variant='underlined'>
        {translate('host.setup.label')}
      </Button>
      <Popover className='setup-popover' placement='top'>
        <Dialog aria-label={translate('host.setup.label')}>{children}</Dialog>
      </Popover>
    </DialogTrigger>
  )
}
