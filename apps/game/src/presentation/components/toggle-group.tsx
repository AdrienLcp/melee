import { composeClassName } from '@adrienlcp/react-aria'
import type React from 'react'
import { useId, useRef } from 'react'
import {
  Label,
  ToggleButton,
  ToggleButtonGroup,
  type ToggleButtonGroupProps
} from 'react-aria-components'

import { CheckIcon } from './icons'
import { useSelectionIndicator } from './use-selection-indicator'

import './toggle-group.sass'

type ToggleGroupOption = {
  label: string
  value: string
}

type ToggleGroupProps = Omit<
  ToggleButtonGroupProps,
  'children' | 'selectionMode'
> & {
  /** Shown above the segments; a group without one is unreachable by name. */
  label: string
  /** Rendered in order, one segment each. */
  options: readonly ToggleGroupOption[]
  /**
   * `single` is for one answer that may also be none — pressing the chosen
   * segment again lets go of it, which a radio group cannot do. Without that
   * empty state the question belongs to `SegmentedControl`.
   */
  selectionMode?: 'multiple' | 'single'
}

/**
 * `SegmentedControl`'s sibling, for a question with more than one answer. This
 * is the case `ToggleButtonGroup` was built for — several independent toggles —
 * where the segmented control deliberately uses a radio group instead, because
 * a screen reader announces the difference and one answer is not several.
 *
 * They wear the same tray: `styles/_strip.sass` holds it, and both include
 * it. A strip holding several answers inks each ticked stamp and checks it
 * rather than lifting it out, so *several* never reads as *the* answer.
 */
export const ToggleGroup: React.FC<ToggleGroupProps> = ({
  className,
  label,
  options,
  selectionMode = 'multiple',
  ...props
}) => {
  // `RadioGroup` hands its `Label` an id through context and `ToggleButtonGroup`
  // does not, so the association is made here rather than assumed.
  const labelId = useId()
  const indicator = useRef<HTMLSpanElement>(null)
  const holdsOneAnswer = selectionMode === 'single'

  useSelectionIndicator({
    indicator,
    segmentKeys: holdsOneAnswer
      ? options.map((option) => option.value).join(' ')
      : ''
  })

  return (
    <ToggleButtonGroup
      {...props}
      aria-labelledby={labelId}
      className={composeClassName(className, 'toggle-group')}
      selectionMode={selectionMode}
    >
      <Label id={labelId}>{label}</Label>
      <div className='segments'>
        {holdsOneAnswer && (
          <span aria-hidden className='indicator' ref={indicator} />
        )}
        {options.map((option) => (
          <ToggleButton
            className='segment'
            id={option.value}
            key={option.value}
          >
            {!holdsOneAnswer && <CheckIcon className='tick' />}
            {option.label}
          </ToggleButton>
        ))}
      </div>
    </ToggleButtonGroup>
  )
}
