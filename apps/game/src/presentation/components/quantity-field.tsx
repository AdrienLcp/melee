import { composeClassName } from '@adrienlcp/react-aria'
import type React from 'react'
import { useLayoutEffect, useRef, useState } from 'react'
import {
  Group,
  Input,
  Label,
  TextField as ReactAriaTextField,
  Text,
  useLocale
} from 'react-aria-components'

import { retypedNumber } from '@melee/core/helpers/typed-number'

import './quantity-field.sass'

type QuantityFieldProps = {
  /** Opens the keyboard on mount. */
  autoFocus?: boolean
  className?: string
  /**
   * The question already says what the number is counted in, so a slot too
   * narrow for the digits and the unit lets the unit go. Defaults to `false`.
   */
  isUnitAsked?: boolean
  label: string
  /** Defaults to `0`: a whole number. */
  maximumFractionDigits?: number
  /** A digit that would pass it is refused as it is typed. */
  maxValue: number
  /** The number the slot reads after every keystroke, `NaN` while it holds no digit. */
  onChange: (value: number) => void
  /** What the number is counted in, printed at the end of the slot and read as the field's description; `null` for a bare count. */
  unit: string | null
}

/**
 * A number too long for steps — a population, a river's length — typed into a
 * paper slot with its unit printed at the end of it. The locale's grouping is
 * drawn on every keystroke, because 124 000 000 must be readable before it is
 * sent: a number field grouping on blur showed it only once it was gone.
 */
export const QuantityField: React.FC<QuantityFieldProps> = ({
  autoFocus = false,
  className,
  isUnitAsked = false,
  label,
  maximumFractionDigits = 0,
  maxValue,
  onChange,
  unit
}) => {
  const { locale } = useLocale()
  const input = useRef<HTMLInputElement>(null)
  const [typed, setTyped] = useState({ caret: 0, text: '' })

  useLayoutEffect(() => {
    const node = input.current

    if (node !== null && node === document.activeElement) {
      node.setSelectionRange(typed.caret, typed.caret)
    }
  }, [typed])

  return (
    <ReactAriaTextField
      autoFocus={autoFocus}
      className={composeClassName(className, 'quantity-field')}
      onChange={(text) => {
        const caret = input.current?.selectionStart ?? text.length
        const retyped = retypedNumber({
          caret,
          locale,
          maximumFractionDigits,
          maxValue,
          previous: typed.text,
          text
        })

        if (retyped === null) {
          setTyped({
            caret: Math.max(0, caret - (text.length - typed.text.length)),
            text: typed.text
          })
          return
        }

        setTyped({ caret: retyped.caret, text: retyped.text })
        onChange(retyped.value)
      }}
      value={typed.text}
    >
      <Label>{label}</Label>
      <Group className='slot' data-unit-asked={isUnitAsked || undefined}>
        <Input
          autoComplete='off'
          enterKeyHint='send'
          inputMode='decimal'
          ref={input}
        />
        {unit !== null && (
          <Text className='unit' slot='description'>
            {unit}
          </Text>
        )}
      </Group>
    </ReactAriaTextField>
  )
}
