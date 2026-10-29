import { classNames } from '@adrienlcp/react'
import type React from 'react'

import type { ColourHex } from '@melee/protocol/swatch'

import './swatch-chip.sass'

type SwatchChipProps = {
  className?: string
  /** The colour printed on the chip, or `null` for the empty socket a hidden colour leaves. */
  colour: ColourHex | null
  /** What a screen reader hears in place of the colour; a chip without one is decoration. */
  label?: string
}

/**
 * A paint chip out of the shades box: a printed card with the colour laid on
 * it and a paper margin under it, the way a fan deck holds one. Hidden, it is
 * the socket the colour sat in, so the round keeps its shape while every
 * screen rebuilds it.
 *
 * The colour is the round's content rather than the design's, which is why it
 * arrives through `--swatch` and is never a token.
 */
export const SwatchChip: React.FC<SwatchChipProps> = ({
  className,
  colour,
  label
}) => {
  const chip = {
    className: classNames('swatch-chip', className),
    'data-empty': colour === null || undefined,
    style: colour === null ? undefined : { '--swatch': colour }
  }

  return label === undefined ? (
    <span aria-hidden='true' {...chip}>
      <span className='field' />
    </span>
  ) : (
    <span aria-label={label} role='img' {...chip}>
      <span className='field' />
    </span>
  )
}
