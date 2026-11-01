import type { PlayerId } from '@melee/protocol/identifiers'
import { PAWN_COLOUR_COUNT } from '@melee/protocol/team'

import type { Participant } from './room'

type StoredParticipant = Omit<Participant, 'colour'> &
  Partial<Pick<Participant, 'colour'>>

/**
 * The seats as the Durable Object stored them, which may predate a seat's own
 * colour: a room outlives a deploy, and a seat missing one put `undefined` on
 * a view the schema refuses. Each takes the colour its place in the roster
 * gave it until then, so no pawn changes colour across the deploy.
 */
export const withSeatColours = (
  players: ReadonlyMap<PlayerId, StoredParticipant>
): Map<PlayerId, Participant> =>
  new Map(
    [...players].map(([id, participant], seat) => [
      id,
      {
        ...participant,
        colour: participant.colour ?? (seat % PAWN_COLOUR_COUNT) + 1
      }
    ])
  )
