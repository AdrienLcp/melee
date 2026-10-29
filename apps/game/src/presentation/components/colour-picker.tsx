import { classNames } from '@adrienlcp/react'
import type React from 'react'
import { useState } from 'react'
import {
  type Color,
  ColorArea,
  ColorSlider,
  ColorThumb,
  parseColor,
  SliderTrack
} from 'react-aria-components'

import type { ColourHex } from '@melee/protocol/swatch'

import './colour-picker.sass'

type ColourPickerProps = {
  className?: string
  /** The hue strip's name. */
  hueLabel: string
  /** Every colour the thumbs land on, in the hex every screen sends. */
  onChange: (colour: ColourHex) => void
  /** The square's name: how saturated and how bright, at the strip's hue. */
  toneLabel: string
}

/**
 * The neutral the picker opens on. Never the answer, and never a random colour
 * that could land close by luck: a mid grey is equally far from every hue.
 */
export const PICKER_START_COLOUR: ColourHex = '#808080'

const START = parseColor('hsb(0, 0%, 50%)')

const hexOf = (colour: Color): ColourHex => colour.toString('hex').toLowerCase()

/**
 * A square of saturation against brightness over a strip of hue, in HSB
 * because that is the space a thumb moves through predictably.
 *
 * It holds its own `Color` rather than taking a hex back: a grey has no hue,
 * and a value round-tripped through hex would snap the strip to red the moment
 * the square touched its left edge.
 */
export const ColourPicker: React.FC<ColourPickerProps> = ({
  className,
  hueLabel,
  onChange,
  toneLabel
}) => {
  const [colour, setColour] = useState<Color>(START)

  const change = (next: Color): void => {
    setColour(next)
    onChange(hexOf(next))
  }

  return (
    <div className={classNames('colour-picker', className)}>
      <div className='slot'>
        <ColorArea
          aria-label={toneLabel}
          className='tone'
          colorSpace='hsb'
          onChange={change}
          value={colour}
          xChannel='saturation'
          yChannel='brightness'
        >
          <ColorThumb />
        </ColorArea>
      </div>
      <ColorSlider
        aria-label={hueLabel}
        channel='hue'
        className='hue'
        colorSpace='hsb'
        onChange={change}
        value={colour}
      >
        <SliderTrack>
          <ColorThumb />
        </SliderTrack>
      </ColorSlider>
    </div>
  )
}
