import type { ColourVerdict } from '@melee/protocol/scoring'
import type { ColourHex } from '@melee/protocol/swatch'

import { drawSwatchColour } from '@melee/core/swatch/draw'
import { colourDistance } from '@melee/core/swatch/oklab'

import type { Round } from '@/domain/room/room'

type SwatchContent = Extract<Round['content'], { kind: 'swatch' }>

/** A round on a freshly drawn colour, shown for `showMs` once its clock starts. */
export const swatchContent = (showMs: number): SwatchContent => ({
  colour: drawSwatchColour(),
  kind: 'swatch',
  sent: [],
  showMs
})

/** When every screen hides the colour, and `null` until the round's clock has a start. */
export const hidesAtOf = (round: Round): number | null =>
  round.content.kind !== 'swatch' || round.startsAt === null
    ? null
    : round.startsAt + round.content.showMs

/**
 * Whether the colour is on screen at `now`: from the round's start until it
 * hides, and again once the round is revealed. A countdown shows nothing, so
 * the colour is never up for longer than the room was told.
 */
export const isColourShown = ({
  now,
  round
}: {
  now: number
  round: Round
}): boolean => {
  if (round.revealed) {
    return true
  }

  const hidesAt = hidesAtOf(round)

  return (
    hidesAt !== null &&
    round.startsAt !== null &&
    now >= round.startsAt &&
    now < hidesAt
  )
}

export const gradeColour = ({
  content,
  sent
}: {
  content: SwatchContent
  sent: ColourHex
}): ColourVerdict => ({
  distance: colourDistance({ sent, shown: content.colour }),
  kind: 'colour'
})
