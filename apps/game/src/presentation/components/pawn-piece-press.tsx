import type React from 'react'
import { DialogTrigger } from 'react-aria-components'

import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { Button } from './button'
import { PaletteIcon } from './icons'
import { Leaflet } from './leaflet'
import { PawnPiecePicker, type PawnPiecePickerProps } from './pawn-piece-picker'

import './pawn-piece-press.sass'

type PawnPiecePressProps = Omit<PawnPiecePickerProps, 'isLabelHidden'> & {
  /**
   * The press's whole name for a screen reader — whose pawn it repaints —
   * starting with the word it prints. It names the sheet too.
   */
  'aria-label': string
}

/**
 * One press for a seat's pawn or a team's: the palette and the word *Colour*,
 * opening the pieces on a sheet that closes on the pick — a seat's thirty-six,
 * a team's twelve colours.
 */
export const PawnPiecePress: React.FC<PawnPiecePressProps> = ({
  'aria-label': ariaLabel,
  onRecolour,
  ...picker
}) => {
  const translate = useTranslate()

  return (
    <DialogTrigger>
      <Button
        aria-label={ariaLabel}
        className='pawn-piece-press'
        size='small'
        variant='outlined'
      >
        <PaletteIcon />
        {translate('pawn.press.label')}
      </Button>
      <Leaflet
        aria-label={ariaLabel}
        className='pawn-piece-leaflet'
        placement='bottom'
      >
        {({ close }) => (
          <PawnPiecePicker
            {...picker}
            onRecolour={(piece) => {
              onRecolour(piece)
              close()
            }}
          />
        )}
      </Leaflet>
    </DialogTrigger>
  )
}
