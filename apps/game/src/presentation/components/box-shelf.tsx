import { composeClassName } from '@adrienlcp/react-aria'
import type React from 'react'
import {
  Checkbox,
  CheckboxGroup,
  type CheckboxGroupProps,
  Label,
  RadioButton,
  RadioField,
  RadioGroup,
  type RadioGroupProps
} from 'react-aria-components'

import { CheckIcon } from './icons'

import './box-shelf.sass'

type BoxShelfOption = {
  /** A word printed on the box's band — which of several ticked comes first. */
  badge?: string
  /** One short line under the name, printed on the box's lid. */
  description: string
  /** A glyph printed before the name; decorative, the name stays the label. */
  icon?: React.ReactNode
  /** Kept as it is while the rest of the shelf stays pressable — a tick that cannot be taken out. */
  isDisabled?: boolean
  label: string
  /** The colour of the box's spine, as a CSS colour — usually a `var()`. */
  spine: string
  value: string
}

type ShelfProps = {
  /** Beside the label, on the shelf's own row — a control that changes how the shelf is chosen from. */
  aside?: React.ReactNode
  /** Shown above the boxes; a group without one is unreachable by name. */
  label: string
  /** Rendered in order, one box each. */
  options: readonly BoxShelfOption[]
}

type BoxShelfProps = Omit<RadioGroupProps, 'children' | 'orientation'> &
  ShelfProps

type TickShelfProps = Omit<CheckboxGroupProps, 'children'> & ShelfProps

const ShelfLabel: React.FC<Pick<ShelfProps, 'aside' | 'label'>> = ({
  aside,
  label
}) =>
  aside === undefined ? (
    <Label>{label}</Label>
  ) : (
    <div className='shelf-head'>
      <Label>{label}</Label>
      {aside}
    </div>
  )

const BoxFace: React.FC<{ option: BoxShelfOption }> = ({ option }) => (
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
    </span>
    <span className='tick'>
      <CheckIcon />
    </span>
  </>
)

/**
 * A radio group drawn as boxes on a shelf: the chosen one is pulled forward
 * out of the row. The same semantics as `SegmentedControl`, for a choice whose
 * options each need a line of their own.
 */
export const BoxShelf: React.FC<BoxShelfProps> = ({
  aside,
  className,
  label,
  options,
  ...props
}) => (
  <RadioGroup
    {...props}
    className={composeClassName(className, 'box-shelf')}
    orientation='horizontal'
  >
    <ShelfLabel aside={aside} label={label} />
    <div className='boxes'>
      {options.map((option) => (
        <RadioField
          className='box-field'
          key={option.value}
          value={option.value}
        >
          <RadioButton className='box' style={{ '--spine': option.spine }}>
            <BoxFace option={option} />
          </RadioButton>
        </RadioField>
      ))}
    </div>
  </RadioGroup>
)

/**
 * The same shelf for a choice of several: every box ticked is pulled forward,
 * and the tick its lid already carries is the checkbox's own.
 */
export const TickShelf: React.FC<TickShelfProps> = ({
  aside,
  className,
  label,
  options,
  ...props
}) => (
  <CheckboxGroup
    {...props}
    className={composeClassName(className, 'box-shelf')}
  >
    <ShelfLabel aside={aside} label={label} />
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
