import type React from 'react'
import {
  Dialog,
  Heading,
  Modal,
  ModalOverlay,
  Button as ReactAriaButton
} from 'react-aria-components'

import { CrossIcon } from './icons'

import './sheet.sass'

type SheetProps = {
  children: React.ReactNode
  /** Names the close press, which shows only a glyph. */
  closeLabel: string
  /** Its title, and the dialog's name. */
  heading: string
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

/**
 * A panel risen from the foot of a narrow screen over what it sets up, closed
 * by its cross, a press outside it or Escape. Controlled, because what opens
 * it is a press somewhere else on the page.
 */
export const Sheet: React.FC<SheetProps> = ({
  children,
  closeLabel,
  heading,
  isOpen,
  onOpenChange
}) => (
  <ModalOverlay
    className='sheet-overlay'
    isDismissable
    isOpen={isOpen}
    onOpenChange={onOpenChange}
  >
    <Modal className='sheet'>
      <Dialog className='sheet-dialog'>
        {({ close }) => (
          <>
            <div className='sheet-head'>
              <Heading slot='title'>{heading}</Heading>
              <ReactAriaButton
                aria-label={closeLabel}
                className='sheet-close'
                onPress={close}
              >
                <CrossIcon />
              </ReactAriaButton>
            </div>
            <div className='sheet-body'>{children}</div>
          </>
        )}
      </Dialog>
    </Modal>
  </ModalOverlay>
)
