import { composeClassName } from '@adrienlcp/react-aria'
import type React from 'react'
import {
  Button,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Select as ReactAriaSelect,
  type SelectProps as ReactAriaSelectProps,
  SelectValue
} from 'react-aria-components'

import { ChevronIcon } from './icons'

import './select.sass'

/** One choice of a `Select`: the key it is picked by and what it says. */
export type SelectOption = { id: string; label: string }

type SelectProps = Omit<
  ReactAriaSelectProps<SelectOption>,
  'children' | 'items'
> & {
  label: string
  /** Every choice, in the order the list shows them. */
  options: readonly SelectOption[]
}

/**
 * One value picked from a closed list too long for a `SegmentedControl` strip:
 * a field-shaped press that opens the list in a leaflet beside it.
 */
export const Select: React.FC<SelectProps> = ({
  className,
  label,
  options,
  ...props
}) => (
  <ReactAriaSelect {...props} className={composeClassName(className, 'select')}>
    <Label>{label}</Label>
    <Button className='select-button'>
      <SelectValue className='select-value' />
      <ChevronIcon aria-hidden />
    </Button>
    <Popover className='select-popover'>
      <ListBox className='select-list' items={options}>
        {(option) => (
          <ListBoxItem className='select-option' textValue={option.label}>
            {option.label}
          </ListBoxItem>
        )}
      </ListBox>
    </Popover>
  </ReactAriaSelect>
)
