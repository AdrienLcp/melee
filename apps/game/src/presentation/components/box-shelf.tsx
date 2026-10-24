import { classNames } from '@adrienlcp/react'
import { composeClassName } from '@adrienlcp/react-aria'
import type React from 'react'
import {
  Button,
  Checkbox,
  CheckboxGroup,
  type CheckboxGroupProps,
  Label
} from 'react-aria-components'

import { CheckIcon } from './icons'

import './box-shelf.sass'

type TickShelfOption = {
  /** A word printed on the box's band — which of several ticked comes first. */
  badge?: string
  /** One short line under the name, printed on the box's lid. */
  description: string
  /** A glyph printed before the name; decorative, the name stays the label. */
  icon?: React.ReactNode
  /** Kept as it is while the rest of the shelf stays pressable — a tick that cannot be taken out, a game the room cannot play. */
  isDisabled?: boolean
  label: string
  /** A word stamped on the lid under the description: what the game asks of the table. */
  mark?: string
  /** The colour of the box's spine, as a CSS colour — usually a `var()`. */
  spine: string
  value: string
}

type ShelfProps = {
  /** Shown above the boxes; a group without one is unreachable by name. */
  label: string
  /** Rendered in order, one box each. */
  options: readonly TickShelfOption[]
}

type TickShelfProps = Omit<CheckboxGroupProps, 'children'> & ShelfProps

const BoxFace: React.FC<{ option: TickShelfOption }> = ({ option }) => (
  <>
    <span className='band'>
      {option.badge !== undefined && (
        <span className='badge'>{option.badge}</span>
      )}
    </span>
    <span className='lid'>
      <span className='name'>
        {option.icon}
        {option.label}
      </span>
      <span className='description'>{option.description}</span>
      {option.mark !== undefined && <span className='mark'>{option.mark}</span>}
    </span>
    <span className='tick'>
      <CheckIcon />
    </span>
  </>
)

/**
 * A choice of several drawn as boxes on a shelf: every box ticked is pulled
 * forward out of the row, and the tick its lid carries is the checkbox's own.
 */
export const TickShelf: React.FC<TickShelfProps> = ({
  className,
  label,
  options,
  ...props
}) => (
  <CheckboxGroup
    {...props}
    className={composeClassName(className, 'box-shelf')}
  >
    <Label>{label}</Label>
    <div className='boxes'>
      {options.map((option) => (
        <Checkbox
          className='box'
          isDisabled={option.isDisabled}
          key={option.value}
          style={{ '--spine': option.spine }}
          value={option.value}
        >
          <BoxFace option={option} />
        </Checkbox>
      ))}
    </div>
  </CheckboxGroup>
)

type PickShelfProps = ShelfProps & {
  className?: string
  /** Every box is held, whatever each option says. */
  isDisabled?: boolean
  /** Called with the value of the box pressed. */
  onPick: (value: string) => void
}

/**
 * The same shelf for a choice that is an action rather than a state: each box
 * is a press that takes one off the shelf, so nothing is ticked and a screen
 * reader hears buttons, never checkboxes it could leave checked.
 */
export const PickShelf: React.FC<PickShelfProps> = ({
  className,
  isDisabled = false,
  label,
  onPick,
  options
}) => {
  return (
    <fieldset className={classNames(className, 'box-shelf')}>
      <legend className='shelf-label'>{label}</legend>
      <div className='boxes'>
        {options.map((option) => (
          <Button
            className='box'
            isDisabled={isDisabled || option.isDisabled}
            key={option.value}
            onPress={() => {
              onPick(option.value)
            }}
            style={{ '--spine': option.spine }}
          >
            <BoxFace option={option} />
          </Button>
        ))}
      </div>
    </fieldset>
  )
}
