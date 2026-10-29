import type React from 'react'

import type { ColourHex } from '@melee/protocol/swatch'

import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { SwatchChip } from './swatch-chip'

import './swatch-shown.sass'

type SwatchShownProps = {
  /** What the chip is called once the round says what it was, as a reveal does. */
  caption?: string
  /** The colour still up, or `null` once it has hidden on this screen. */
  colour: ColourHex | null
  /** `false` where a card above already says it, as the room's screen does. */
  isCaptioned?: boolean
}

/**
 * A shades round as every screen draws it before anyone answers: the chip as
 * large as the round allows while the colour is up, then its empty socket and
 * the word to rebuild it.
 */
export const SwatchShown: React.FC<SwatchShownProps> = ({
  caption: givenCaption,
  colour,
  isCaptioned = true
}) => {
  const translate = useTranslate()
  const caption =
    givenCaption ??
    translate(colour === null ? 'swatch.hidden' : 'swatch.remember')

  return (
    <figure className='swatch-shown'>
      <div className='slot'>
        <SwatchChip colour={colour} label={isCaptioned ? undefined : caption} />
      </div>
      {isCaptioned && <figcaption>{caption}</figcaption>}
    </figure>
  )
}
