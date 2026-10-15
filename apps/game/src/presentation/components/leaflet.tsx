import { classNames } from '@adrienlcp/react'
import type React from 'react'
import {
  Dialog,
  type DialogProps,
  Modal,
  ModalOverlay,
  Popover,
  type PopoverProps
} from 'react-aria-components'

import { useMediaQuery } from '@/infrastructure/browser'
import { WIDE_SCREEN_QUERY } from '@/presentation/styles/wide-screen'

import { SheetGrabber } from './sheet-grabber'

import './leaflet.sass'

type LeafletProps = {
  /** Names the leaflet for assistive technology; nothing on it repeats the name. */
  'aria-label': string
  /** The leaflet's controls, or a function handed `close` for one that ends the visit. */
  children: DialogProps['children']
  /** The surface's own class, on the popover and the sheet alike. */
  className: string
  /** The popover's tallest, in pixels, on a wide screen. The sheet stops short of the screen's top instead. */
  maxHeight?: PopoverProps['maxHeight']
  /** Where the popover opens from its trigger on a wide screen. */
  placement: PopoverProps['placement']
}

/**
 * The rulebook leaflet a trigger opens, inside a `DialogTrigger`: a popover
 * beside the trigger on a wide screen, a sheet rising from the bottom edge on a
 * narrow one, where a box hung from a corner is out of a thumb's reach and too
 * narrow for the controls it holds. The sheet is pulled down by its grabber,
 * or put away by a press on the board above it.
 *
 * A plain modal with its own rise rather than react-aria's `Sheet`: that one
 * enters through the browser's smooth scroll, whose length no stylesheet sets,
 * and at over half a second it read as lag after the press.
 */
export const Leaflet: React.FC<LeafletProps> = ({
  'aria-label': label,
  children,
  className,
  maxHeight,
  placement
}) => {
  const isWideScreen = useMediaQuery(WIDE_SCREEN_QUERY)
  const dialog = <Dialog aria-label={label}>{children}</Dialog>

  if (isWideScreen) {
    return (
      <Popover
        className={classNames('leaflet-popover', className)}
        maxHeight={maxHeight}
        placement={placement}
      >
        {dialog}
      </Popover>
    )
  }

  return (
    <ModalOverlay className='leaflet-overlay' isDismissable>
      <Modal className={classNames('leaflet-sheet', className)}>
        {({ state }) => (
          <>
            <SheetGrabber onDismiss={state.close} />
            {dialog}
          </>
        )}
      </Modal>
    </ModalOverlay>
  )
}
