import { composeClassName } from '@adrienlcp/react-aria'
import type React from 'react'
import { useContext, useState } from 'react'
import {
  DisclosurePanel,
  DisclosureStateContext,
  Heading,
  Button as ReactAriaButton,
  Disclosure as ReactAriaDisclosure,
  type DisclosureProps as ReactAriaDisclosureProps
} from 'react-aria-components'

import { ChevronIcon } from './icons'

import './disclosure.sass'

type DisclosureProps = Omit<ReactAriaDisclosureProps, 'children'> & {
  children: React.ReactNode
  /**
   * Draws the panel's content from its first opening on rather than folded
   * away from the start: for a long content in something opened often, like
   * the pawn picker that was four fifths of what the menu drew on every open.
   * A find in the page does not reach it until then.
   */
  drawsPanelOnOpen?: boolean
  /** A glyph printed before the label; decorative, the label stays the name. */
  icon?: React.ReactNode
  /** Names the section, in the trigger. */
  label: string
  /**
   * What the panel holds right now, read without opening it. It is what makes
   * the collapse honest: a section nobody can see the state of is a section
   * nobody knows to open.
   */
  summary: React.ReactNode
}

/**
 * A section the reader opens. The trigger is a ruled row rather than a block,
 * because a bordered control beside the one action on the screen reads as a
 * second one — see the three materials in `DESIGN.md`.
 */
export const Disclosure: React.FC<DisclosureProps> = ({
  children,
  className,
  drawsPanelOnOpen = false,
  icon,
  label,
  summary,
  ...props
}) => (
  <ReactAriaDisclosure
    {...props}
    className={composeClassName(className, 'disclosure')}
  >
    <Heading level={2}>
      <ReactAriaButton className='trigger' slot='trigger'>
        <span className='naming'>
          <span className='name'>
            {icon}
            {label}
          </span>
          <span className='summary'>{summary}</span>
        </span>
        <ChevronIcon className='chevron' />
      </ReactAriaButton>
    </Heading>
    {/*
      The inner element is what the animation needs: a grid row cannot collapse
      a box that sets its own padding, so the panel owns the row and this owns
      the layout.
    */}
    <DisclosurePanel className='panel'>
      <div className='panel-content'>
        {drawsPanelOnOpen ? <OnceOpened>{children}</OnceOpened> : children}
      </div>
    </DisclosurePanel>
  </ReactAriaDisclosure>
)

/**
 * Kept once drawn, so a fold closing still has its content to fold away. Read
 * from react-aria's state rather than an `onExpandedChange`, which a
 * controlled disclosure's parent may be the one to change.
 */
const OnceOpened: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isExpanded = useContext(DisclosureStateContext)?.isExpanded ?? true
  const [hasOpened, setHasOpened] = useState(isExpanded)

  if (isExpanded && !hasOpened) {
    setHasOpened(true)
  }

  return hasOpened ? children : null
}
