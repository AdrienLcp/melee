import type { ColourHex } from '@melee/protocol/swatch'

/** A colour in OKLab: `lightness` from 0 to 1, `a` and `b` around nought. */
export type Oklab = { a: number; b: number; lightness: number }

/** In OKLCH terms, the polar form of OKLab a draw is easiest to state in. */
export type Oklch = { chroma: number; hueRadians: number; lightness: number }

const linearFromEncoded = (channel: number): number =>
  channel <= 0.040_45 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4

const encodedFromLinear = (channel: number): number =>
  channel <= 0.003_130_8
    ? 12.92 * channel
    : 1.055 * channel ** (1 / 2.4) - 0.055

const linearChannelAt = ({
  hex,
  offset
}: {
  hex: ColourHex
  offset: number
}): number =>
  linearFromEncoded(Number.parseInt(hex.slice(offset, offset + 2), 16) / 255)

/** The matrices OKLab is defined by, from its published reference. */
export const oklabOf = (hex: ColourHex): Oklab => {
  const red = linearChannelAt({ hex, offset: 1 })
  const green = linearChannelAt({ hex, offset: 3 })
  const blue = linearChannelAt({ hex, offset: 5 })
  const long = Math.cbrt(
    0.412_221_470_8 * red + 0.536_332_536_3 * green + 0.051_445_992_9 * blue
  )
  const medium = Math.cbrt(
    0.211_903_498_2 * red + 0.680_699_545_1 * green + 0.107_396_956_6 * blue
  )
  const short = Math.cbrt(
    0.088_302_461_9 * red + 0.281_718_837_6 * green + 0.629_978_700_5 * blue
  )

  return {
    a:
      1.977_998_495_1 * long - 2.428_592_205 * medium + 0.450_593_709_9 * short,
    b:
      0.025_904_037_1 * long + 0.782_771_766_2 * medium - 0.808_675_766 * short,
    lightness:
      0.210_454_255_3 * long + 0.793_617_785 * medium - 0.004_072_046_8 * short
  }
}

/** The sRGB channels, each in `[0, 1]` when the colour is inside the gamut and outside it when not. */
export const srgbChannelsOf = ({ a, b, lightness }: Oklab): number[] => {
  const long = (lightness + 0.396_337_777_4 * a + 0.215_803_757_3 * b) ** 3
  const medium = (lightness - 0.105_561_345_8 * a - 0.063_854_172_8 * b) ** 3
  const short = (lightness - 0.089_484_177_5 * a - 1.291_485_548 * b) ** 3

  return [
    4.076_741_662_1 * long - 3.307_711_591_3 * medium + 0.230_969_929_2 * short,
    -1.268_438_004_6 * long +
      2.609_757_401_1 * medium -
      0.341_319_396_5 * short,
    -0.004_196_086_3 * long - 0.703_418_614_7 * medium + 1.707_614_701 * short
  ].map(encodedFromLinear)
}

const GAMUT_TOLERANCE = 1e-6

export const isInSrgbGamut = (colour: Oklab): boolean =>
  srgbChannelsOf(colour).every(
    (channel: number) =>
      channel >= -GAMUT_TOLERANCE && channel <= 1 + GAMUT_TOLERANCE
  )

export const oklabFromOklch = ({
  chroma,
  hueRadians,
  lightness
}: Oklch): Oklab => ({
  a: chroma * Math.cos(hueRadians),
  b: chroma * Math.sin(hueRadians),
  lightness
})

const hexPairOf = (channel: number): string =>
  Math.round(Math.min(Math.max(channel, 0), 1) * 255)
    .toString(16)
    .padStart(2, '0')

/** Clamped into the gamut channel by channel, which a drawn colour never needs. */
export const hexOf = (colour: Oklab): ColourHex =>
  `#${srgbChannelsOf(colour).map(hexPairOf).join('')}`

/**
 * How far apart two colours look, as the straight line between them in
 * OKLab — the space was built so that this tracks what an eye sees, which an
 * RGB or HSL distance does not: two blues a picker puts far apart can look
 * alike, and a yellow and a green it puts close cannot.
 */
export const colourDistance = ({
  shown,
  sent
}: {
  sent: ColourHex
  shown: ColourHex
}): number => {
  const from = oklabOf(shown)
  const to = oklabOf(sent)

  return Math.hypot(from.lightness - to.lightness, from.a - to.a, from.b - to.b)
}
