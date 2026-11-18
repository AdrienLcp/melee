import { composeClassName } from '@adrienlcp/react-aria'
import type React from 'react'
import {
  Group,
  Input,
  Label,
  NumberField as ReactAriaNumberField,
  type NumberFieldProps as ReactAriaNumberFieldProps,
  Text
} from 'react-aria-components'

import './quantity-field.sass'

type QuantityFieldProps = Omit<ReactAriaNumberFieldProps, 'children'> & {
  label: string
  /** What the number is counted in, printed at the end of the slot and read as the field's description; `null` for a bare count. */
  unit: string | null
  /**
   * The question already says what the number is counted in, so a slot too
   * narrow for the digits and the unit lets the unit go. Defaults to `false`.
   */
  isUnitAsked?: boolean
}

/**
 * A number too long for steps — a population, a river's length — typed into a
 * paper slot with its unit printed at the end of it. The locale's grouping is
 * drawn while it is typed, because 124 000 000 must be readable before it is
 * sent.
 */
export const QuantityField: React.FC<QuantityFieldProps> = ({
  className,
  isUnitAsked = false,
  label,
  unit,
  ...props
}) => (
  <ReactAriaNumberField
    {...props}
    className={composeClassName(className, 'quantity-field')}
  >
    <Label>{label}</Label>
    <Group className='slot' data-unit-asked={isUnitAsked || undefined}>
      <Input enterKeyHint='send' inputMode='decimal' />
      {unit !== null && (
        <Text className='unit' slot='description'>
          {unit}
        </Text>
      )}
    </Group>
  </ReactAriaNumberField>
)
