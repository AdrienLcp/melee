import type { PlayerId } from '@melee/protocol/identifiers'
import type { PublicPlayer } from '@melee/protocol/room'

/**
 * Who sat down between two snapshots of the roster. The first snapshot a
 * screen receives is the room as it found it rather than anybody arriving,
 * so `before` being `null` names nobody.
 */
export const arrivedPlayers = ({
  after,
  before
}: {
  after: readonly PublicPlayer[]
  before: readonly PlayerId[] | null
}): PublicPlayer[] =>
  before === null ? [] : after.filter((player) => !before.includes(player.id))
