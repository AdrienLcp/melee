import type React from 'react'
import { DialogTrigger } from 'react-aria-components'

import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { Button } from './button'
import { PaletteIcon } from './icons'
import { Leaflet } from './leaflet'
import {
  PawnColourPicker,
  type PawnColourPickerProps
} from './pawn-colour-picker'

import './pawn-colour-press.sass'

type PawnColourPressProps = Omit<PawnColourPickerProps, 'isLabelHidden'> & {
  /**
   * The press's whole name for a screen reader — whose pawn it repaints —
   * starting with the word it prints. It names the sheet too.
   */
  'aria-label': string
}

/**
 * One press for a seat's pawn or a team's: the palette and the word *Colour*,
 * opening the twelve pawns on a sheet that closes on the pick.
 */
export const PawnColourPress: React.FC<PawnColourPressProps> = ({
  'aria-label': ariaLabel,
  onRecolour,
  ...picker
}) => {
  const translate = useTranslate()

  return (
    <DialogTrigger>
      <Button
        aria-label={ariaLabel}
        className='pawn-colour-press'
        size='small'
        variant='outlined'
      >
        <PaletteIcon />
        {translate('pawn.press.label')}
      </Button>
      <Leaflet
        aria-label={ariaLabel}
        className='pawn-colour-leaflet'
        placement='bottom'
      >
        {({ close }) => (
          <PawnColourPicker
            {...picker}
            onRecolour={(colour) => {
              onRecolour(colour)
              close()
            }}
          />
        )}
      </Leaflet>
    </DialogTrigger>
  )
}
