import { classNames } from '@adrienlcp/react'
import type React from 'react'
import { useRef, useState } from 'react'

import { useSizeGlideOnSwap } from './use-size-glide-on-swap'

import './refusal-note.sass'

type RefusalNoteProps = {
  className?: string
  /** What was refused, already in words, or `null` while nothing is. */
  message: string | null
}

type HeldRefusal = {
  isOpen: boolean
  message: string | null
  occurrence: number
}

/**
 * A refusal printed in danger ink under the press it answers. It stays
 * mounted and folds open and shut in its column, still saying the last
 * refusal while it folds away. A refusal replacing another while it is open
 * fades its text in as the badge eases to the new text's size. Each refusal
 * is new text in one live region, so the same refusal twice is heard twice.
 * Its column is a flex one, and sets `--refusal-note-gap` to its own gap.
 */
export const RefusalNote: React.FC<RefusalNoteProps> = ({
  className,
  message
}) => {
  const isOpen = message !== null
  const badge = useRef<HTMLParagraphElement>(null)
  const [held, setHeld] = useState<HeldRefusal>({
    isOpen,
    message,
    occurrence: 0
  })

  if (isOpen !== held.isOpen || (isOpen && message !== held.message)) {
    setHeld({
      isOpen,
      message: message ?? held.message,
      occurrence: held.occurrence + (isOpen ? 1 : 0)
    })
  }

  useSizeGlideOnSwap({ box: badge, swap: isOpen ? held.occurrence : null })

  return (
    <div
      className={classNames('refusal-note', className)}
      data-open={isOpen || undefined}
      inert={!isOpen}
    >
      <div>
        <p ref={badge} role='alert'>
          <span key={held.occurrence}>{message ?? held.message}</span>
        </p>
      </div>
    </div>
  )
}
