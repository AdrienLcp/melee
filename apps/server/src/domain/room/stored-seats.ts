import type { PlayerId } from '@melee/protocol/identifiers'
import { PAWN_COLOUR_COUNT } from '@melee/protocol/team'

import type { Participant } from './room'

type StoredParticipant = Omit<Participant, 'colour' | 'head'> &
  Partial<Pick<Participant, 'colour' | 'head'>>

/**
 * The seats as the Durable Object stored them, which may predate a seat's own
 * piece: a room outlives a deploy, and a seat missing a field put `undefined`
 * on a view the schema refuses. A seat with no colour takes the one its place
 * in the roster gave it until then, and a seat with no head the round one it
 * was drawn in, so no pawn changes looks across the deploy. Two seats the
 * sharing rule before heads left in one piece keep it until one of them
 * repaints.
 */
export const withSeatPieces = (
  players: ReadonlyMap<PlayerId, StoredParticipant>
): Map<PlayerId, Participant> =>
  new Map(
    [...players].map(([id, participant], seat) => [
      id,
      {
        ...participant,
        colour: participant.colour ?? (seat % PAWN_COLOUR_COUNT) + 1,
        head: participant.head ?? 'round'
      }
    ])
  )
