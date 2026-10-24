import { composeClassName } from '@adrienlcp/react-aria'
import type React from 'react'
import {
  Label,
  RadioButton,
  RadioField,
  RadioGroup,
  type RadioGroupProps
} from 'react-aria-components'

import './choice-list.sass'

type ChoiceListOption = {
  /** A control beside the option and outside its press, acting on that option alone. */
  aside?: React.ReactNode
  /** Drawn as the socket a choice of nothing sits in, rather than a piece. */
  isRecessed?: boolean
  /** What the option says; absent, the press is its dot alone and `textValue` names it. */
  label?: React.ReactNode
  /** Its accessible name, required when `label` is absent. */
  textValue?: string
  value: string
}

type ChoiceListProps = Omit<RadioGroupProps, 'children' | 'orientation'> & {
  /** Set above the options, and the group's name. */
  label: string
  /** One row each, in order. */
  options: readonly ChoiceListOption[]
}

/**
 * A radio group of rows long enough to read — a line, not a word, which
 * `SegmentedControl`'s stamps cannot hold. Each row may carry a control of its
 * own beside its press, which is why the press is a `RadioButton` inside the
 * field rather than the whole row: a button inside a button is no button.
 */
export const ChoiceList: React.FC<ChoiceListProps> = ({
  className,
  label,
  options,
  ...props
}) => (
  <RadioGroup
    {...props}
    className={composeClassName(className, 'choice-list')}
    orientation='vertical'
  >
    <Label className='legend'>{label}</Label>
    <div className='choices'>
      {options.map((option) => (
        <RadioField
          className='choice'
          data-recessed={option.isRecessed === true || undefined}
          key={option.value}
          value={option.value}
        >
          <RadioButton aria-label={option.textValue} className='press'>
            <span aria-hidden='true' className='dot' />
            {option.label !== undefined && (
              <span className='choice-label'>{option.label}</span>
            )}
          </RadioButton>
          {option.aside !== undefined && (
            <div className='aside'>{option.aside}</div>
          )}
        </RadioField>
      ))}
    </div>
  </RadioGroup>
)
