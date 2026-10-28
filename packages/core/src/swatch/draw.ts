import type { ColourHex } from '@melee/protocol/swatch'

import { randomUnit } from '../helpers/random'
import { hexOf, isInSrgbGamut, type Oklab, oklabFromOklch } from './oklab'

/**
 * The lightness a drawn colour sits between. Darker, every hue reads as
 * brown or navy; lighter, as a pastel — either way the round is about
 * remembering a word rather than a colour.
 */
export const MIN_DRAWN_LIGHTNESS = 0.45
export const MAX_DRAWN_LIGHTNESS = 0.85

/**
 * The least chroma a drawn colour carries, so it always *has* a hue to
 * remember: a near-grey would make sending a grey the right answer.
 */
export const MIN_DRAWN_CHROMA = 0.08

const CHROMA_STEP = 0.005
const CHROMA_CEILING = 0.4

const maxChromaInGamut = ({
  hueRadians,
  lightness
}: {
  hueRadians: number
  lightness: number
}): number => {
  let chroma = 0

  while (
    chroma + CHROMA_STEP < CHROMA_CEILING &&
    isInSrgbGamut(
      oklabFromOklch({ chroma: chroma + CHROMA_STEP, hueRadians, lightness })
    )
  ) {
    chroma += CHROMA_STEP
  }

  return chroma
}

/**
 * A colour for a round, uniform in hue and lightness across the band above
 * and in chroma from `MIN_DRAWN_CHROMA` to the most sRGB holds at that hue and
 * lightness. A pairing that cannot reach the floor — a dark yellow — is drawn
 * again rather than nudged, so no hue is dealt more often than another.
 */
export const drawSwatchColour = (
  random: () => number = randomUnit
): ColourHex => {
  for (;;) {
    const lightness =
      MIN_DRAWN_LIGHTNESS +
      random() * (MAX_DRAWN_LIGHTNESS - MIN_DRAWN_LIGHTNESS)
    const hueRadians = random() * 2 * Math.PI
    const ceiling = maxChromaInGamut({ hueRadians, lightness })

    if (ceiling >= MIN_DRAWN_CHROMA) {
      const chroma = MIN_DRAWN_CHROMA + random() * (ceiling - MIN_DRAWN_CHROMA)
      const colour: Oklab = oklabFromOklch({ chroma, hueRadians, lightness })

      return hexOf(colour)
    }
  }
}
