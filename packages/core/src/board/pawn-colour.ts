import type { PlayerId } from '@melee/protocol/identifiers'
import { PAWN_COLOUR_COUNT } from '@melee/protocol/team'

const PAWN_COLOURS = Array.from(
  { length: PAWN_COLOUR_COUNT },
  (_, index) => index + 1
)

/**
 * Whether a seat may take `colour` beside the colours the other seats hold:
 * one nobody else holds, or any once all of them are held — past the last
 * colour two seats share one, and the initial on the pawn tells them apart.
 */
export const isPawnColourFree = ({
  colour,
  heldByOthers
}: {
  colour: number
  heldByOthers: readonly number[]
}): boolean =>
  !heldByOthers.includes(colour) ||
  PAWN_COLOURS.every((candidate) => heldByOthers.includes(candidate))

/**
 * The colour an arriving seat takes: the one its screen asks for when that is
 * free, else the one the fewest seats hold, the lowest first — so a full table
 * spreads its repeats rather than piling them on one hue.
 */
export const pawnColourForArrival = ({
  asked,
  heldByOthers
}: {
  asked: number | null
  heldByOthers: readonly number[]
}): number => {
  if (asked !== null && isPawnColourFree({ colour: asked, heldByOthers })) {
    return asked
  }

  const holdersOf = (colour: number): number =>
    heldByOthers.filter((held) => held === colour).length

  return PAWN_COLOURS.reduce((fewest, colour) =>
    holdersOf(colour) < holdersOf(fewest) ? colour : fewest
  )
}

/** The colour a seat's pawn is drawn in: its team's when it sits in one, its own otherwise. */
export const pawnColourOf = ({
  player,
  teams
}: {
  player: { colour: number; id: PlayerId }
  teams: readonly { colour: number; seatIds: readonly PlayerId[] }[]
}): number =>
  teams.find((team) => team.seatIds.includes(player.id))?.colour ??
  player.colour
