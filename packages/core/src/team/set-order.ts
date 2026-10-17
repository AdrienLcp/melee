import type { TeamId } from '@melee/protocol/team'

/**
 * The order a set's teams play in: the room's own order, turned by one place
 * for every set already played. Going first means answering blind of every
 * other team's round, so the first turn passes round the table rather than
 * sitting with the first team for the whole evening.
 */
export const setOrder = ({
  setsPlayed,
  teamIds
}: {
  setsPlayed: number
  teamIds: readonly TeamId[]
}): TeamId[] => {
  if (teamIds.length === 0) {
    return []
  }

  const first = setsPlayed % teamIds.length

  return [...teamIds.slice(first), ...teamIds.slice(0, first)]
}
