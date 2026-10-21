import type React from 'react'

import {
  MAX_INNERCLOCK_TARGET_SECONDS,
  MIN_INNERCLOCK_TARGET_SECONDS
} from '@melee/protocol/innerclock'

import { drawTargetSeconds } from '@melee/core/innerclock/target'

import { Button } from '@/presentation/components/button'
import { DiceIcon } from '@/presentation/components/icons'
import { NumberField } from '@/presentation/components/number-field'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './innerclock-target-field.sass'

/** The count an inner clock round opens on, held on the console until the press that sends it. */
export type InnerclockTarget = {
  onChange: (seconds: number) => void
  /** `NaN` while the field is empty, which sends nothing and lets the server draw. */
  seconds: number
}

type InnerclockTargetFieldProps = InnerclockTarget & {
  isDisabled: boolean
}

/** How long the table is about to count, typed or drawn beside the press that opens the round. */
export const InnerclockTargetField: React.FC<InnerclockTargetFieldProps> = ({
  isDisabled,
  onChange,
  seconds
}) => {
  const translate = useTranslate()

  return (
    <div className='innerclock-target-field'>
      <NumberField
        isDisabled={isDisabled}
        label={translate('innerclock.target.label')}
        maxValue={MAX_INNERCLOCK_TARGET_SECONDS}
        minValue={MIN_INNERCLOCK_TARGET_SECONDS}
        onChange={onChange}
        value={seconds}
      />
      <Button
        aria-label={translate('innerclock.target.draw')}
        className='draw'
        isDisabled={isDisabled}
        onPress={() => {
          onChange(drawTargetSeconds())
        }}
        variant='outlined'
      >
        <DiceIcon />
      </Button>
      <p className='description'>
        {translate('innerclock.target.description')}
      </p>
    </div>
  )
}

/** What the press sends: the typed count, or nothing for the server to draw one. */
export const targetToSend = (
  target: InnerclockTarget | null
): number | undefined =>
  target === null || Number.isNaN(target.seconds) ? undefined : target.seconds
