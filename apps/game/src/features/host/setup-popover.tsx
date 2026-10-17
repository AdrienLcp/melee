import type React from 'react'
import { useId } from 'react'
import { DialogTrigger } from 'react-aria-components'

import type { RoomSettings } from '@melee/protocol/room'
import type { TrackSource } from '@melee/protocol/track'

import { Button } from '@/presentation/components/button'
import { Leaflet } from '@/presentation/components/leaflet'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { useSettingsSummary } from './use-settings-summary'

import './setup-popover.sass'

type SetupPopoverProps = {
  /** The setup's groups, and whatever a phase adds above them. */
  children: React.ReactNode
  /** The picker's uncommitted source, which the summary reads ahead of the room's. */
  draftSource: TrackSource | null
  settings: RoomSettings
}

/**
 * The settings behind one quiet press beside the stage's action, on a leaflet
 * over the stage — a sheet from the bottom edge below the split, a popover
 * above the press past it. Never unfolded into the page: a fold opened under
 * the launch made a 900px console 1 739px tall and carried the launch down
 * with it, and a stage held to the screen has nowhere for it to go at all.
 *
 * Past the split the summary sits under the press, so what the room is set to
 * play is read without opening anything; below it the footer cannot spare the
 * line, and the leaflet's own groups say it instead.
 */
export const SetupPopover: React.FC<SetupPopoverProps> = ({
  children,
  draftSource,
  settings
}) => {
  const translate = useTranslate()
  const summary = useSettingsSummary({ draftSource, settings })
  const summaryId = useId()

  return (
    <div className='setup-entry'>
      <DialogTrigger>
        <Button
          aria-describedby={summaryId}
          className='setup-trigger'
          size='small'
          variant='underlined'
        >
          {translate('host.setup.label')}
        </Button>
        <Leaflet
          aria-label={translate('host.setup.label')}
          className='setup-leaflet'
          placement='top start'
        >
          {children}
        </Leaflet>
      </DialogTrigger>
      <p className='setup-summary' id={summaryId}>
        {summary}
      </p>
    </div>
  )
}
