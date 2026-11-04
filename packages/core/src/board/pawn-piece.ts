import type { PlayerId } from '@melee/protocol/identifiers'
import {
  PAWN_COLOUR_COUNT,
  PAWN_HEADS,
  type PawnHead,
  type PawnPiece
} from '@melee/protocol/team'

const PAWN_COLOURS = Array.from(
  { length: PAWN_COLOUR_COUNT },
  (_, index) => index + 1
)

/** The head a team's pawn wears: a team is told apart by its colour and its name. */
export const TEAM_PAWN_HEAD: PawnHead = 'round'

/** Whether two pieces are one: the same colour wearing the same head. */
export const isSamePawnPiece = ({
  other,
  piece
}: {
  other: PawnPiece
  piece: PawnPiece
}): boolean => piece.colour === other.colour && piece.head === other.head

/** Whether a seat may take `piece` beside the pieces the other seats hold: one nobody else holds. */
export const isPawnPieceFree = ({
  heldByOthers,
  piece
}: {
  heldByOthers: readonly PawnPiece[]
  piece: PawnPiece
}): boolean =>
  !heldByOthers.some((held) => isSamePawnPiece({ other: held, piece }))

/**
 * The piece an arriving seat takes: the one its screen asks for when that is
 * free, else the colour the fewest seats hold, the lowest first, in its first
 * free head — so a table of twelve stands in twelve round heads, and the
 * thirteenth seat takes the first square one.
 */
export const pawnPieceForArrival = ({
  asked,
  heldByOthers
}: {
  asked: PawnPiece | null
  heldByOthers: readonly PawnPiece[]
}): PawnPiece => {
  if (asked !== null && isPawnPieceFree({ heldByOthers, piece: asked })) {
    return asked
  }

  const holdersOf = (colour: number): number =>
    heldByOthers.filter((held) => held.colour === colour).length
  const colour = PAWN_COLOURS.reduce((fewest, candidate) =>
    holdersOf(candidate) < holdersOf(fewest) ? candidate : fewest
  )
  // The colour held least is held at most once while a room seats fewer than
  // twelve times three, so one of its heads is always free.
  const head =
    PAWN_HEADS.find((candidate) =>
      isPawnPieceFree({ heldByOthers, piece: { colour, head: candidate } })
    ) ?? 'round'

  return { colour, head }
}

/**
 * The piece a seat's pawn is drawn as: its team's colour in a round head when
 * it sits in one — a team's pawn wears no other — its own otherwise.
 */
export const pawnPieceOf = ({
  player,
  teams
}: {
  player: PawnPiece & { id: PlayerId }
  teams: readonly { colour: number; seatIds: readonly PlayerId[] }[]
}): PawnPiece => {
  const team = teams.find((candidate) => candidate.seatIds.includes(player.id))

  return team === undefined
    ? { colour: player.colour, head: player.head }
    : { colour: team.colour, head: TEAM_PAWN_HEAD }
}
