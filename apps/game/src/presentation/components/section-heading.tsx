import { classNames } from '@adrienlcp/react'
import type React from 'react'

import './section-heading.sass'

type SectionHeadingProps = {
  /**
   * Printed at the far end of the rule, outside the heading: the reader's own
   * place in what the block holds. Omitted or `null`, the rule runs to the edge.
   */
  aside?: React.ReactNode
  /** The block's name. */
  children: React.ReactNode
  className?: string
  /** What the block's `section` points its `aria-labelledby` at. */
  id?: string
}

/**
 * A block's name ruled off to the block's far edge: what tells a reveal's two
 * blocks apart on every screen — the round just played, and the game so far.
 * An `h2`, in full ink at a modest step, so it divides the page rather than
 * competing with the answer above it.
 */
export const SectionHeading: React.FC<SectionHeadingProps> = ({
  aside,
  children,
  className,
  id
}) => (
  <div className={classNames('section-heading', className)}>
    <h2 id={id}>{children}</h2>
    {aside != null && <p className='aside'>{aside}</p>}
  </div>
)
