import { ScrollbarGutterRelease, SheetGrabber } from '@adrienlcp/react-aria'
import type React from 'react'
import {
  Dialog,
  type DialogProps,
  Modal,
  ModalOverlay
} from 'react-aria-components'

import './drawer.sass'

type DrawerProps = {
  /** Names the drawer for assistive technology; nothing on it repeats the name. */
  'aria-label': string
  /** The drawer's controls, or a function handed `close` for one that ends the visit. */
  children: DialogProps['children']
}

/**
 * What a trigger opens when its controls are a whole screen's worth, inside a
 * `DialogTrigger`: a panel along the start edge past the split, a sheet rising
 * from the bottom edge below it. The leaflet's popover hangs from its trigger
 * and runs out of height long before a host's every control is in it.
 *
 * The face is the stylesheet's to choose rather than a media query read here,
 * so the grabber is always mounted and drawn below the split alone.
 */
export const Drawer: React.FC<DrawerProps> = ({
  'aria-label': label,
  children
}) => (
  <ModalOverlay className='drawer-overlay' isDismissable>
    <Modal className='drawer'>
      {({ state }) => (
        <>
          <ScrollbarGutterRelease />
          <SheetGrabber onDismiss={state.close} />
          <Dialog aria-label={label}>{children}</Dialog>
        </>
      )}
    </Modal>
  </ModalOverlay>
)
