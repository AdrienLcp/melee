import type React from 'react'

import { RefusalNote } from '@/presentation/components/refusal-note'
import { Switch } from '@/presentation/components/switch'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import type { PlainTranslationKey } from '@/presentation/i18n/translation'

import {
  type MeasurementChoice,
  useMeasurementChoice
} from './use-measurement-choice'

import './measurement-switch.sass'

const NOTE_KEY_FOR = {
  counted: 'legal.measurement.counted',
  refused: 'legal.measurement.refused',
  'refused-by-browser': 'legal.measurement.refusedByBrowser',
  'storage-blocked': 'legal.measurement.storageBlocked'
} as const satisfies Record<MeasurementChoice, PlainTranslationKey>

/** Lets a visitor refuse audience measurement for this browser, and says what holds now. */
export const MeasurementSwitch: React.FC = () => {
  const translate = useTranslate()
  const { choice, hasSaveFailed, setCounted } = useMeasurementChoice()
  const isDecidedElsewhere =
    choice === 'refused-by-browser' || choice === 'storage-blocked'

  return (
    <div className='measurement-switch'>
      <Switch
        description={translate(NOTE_KEY_FOR[choice])}
        isDisabled={isDecidedElsewhere}
        isSelected={choice === 'counted'}
        label={translate('legal.measurement.switch')}
        onChange={setCounted}
      />
      <RefusalNote
        message={
          hasSaveFailed ? translate('legal.measurement.saveFailed') : null
        }
      />
    </div>
  )
}
