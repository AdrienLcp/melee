import type { PlayerId } from '@melee/protocol/identifiers'

/** Who may refuse a row: the seats the round opened on, its own authors excepted. */
export const rowVoters = ({
  authors,
  roster
}: {
  authors: readonly PlayerId[]
  roster: ReadonlySet<PlayerId>
}): Set<PlayerId> =>
  new Set([...roster].filter((playerId) => !authors.includes(playerId)))

/**
 * A row falls when strictly more than half of its voters refused it, so a tie
 * keeps it. A refusal from a seat that may not vote on it counts for nothing,
 * and a row every seat wrote has no voter and stands.
 */
export const isRowRefused = ({
  authors,
  refusedBy,
  roster
}: {
  authors: readonly PlayerId[]
  refusedBy: ReadonlySet<PlayerId>
  roster: ReadonlySet<PlayerId>
}): boolean => {
  const voters = rowVoters({ authors, roster })
  const refusals = [...refusedBy].filter((playerId) =>
    voters.has(playerId)
  ).length

  return refusals * 2 > voters.size
}
