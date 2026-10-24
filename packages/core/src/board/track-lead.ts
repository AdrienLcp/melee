type OnTrack = { board: { case: number }; id: string }

/**
 * Where a pawn stands against the front of the race: clear of it, level with
 * it, or behind whoever holds it and by how many cases — `null` while nobody
 * else is on the track to measure against.
 */
export type TrackLead<Pawn> =
  | { gap: number; kind: 'ahead' }
  | { kind: 'level' }
  | { gap: number; kind: 'behind'; leader: Pawn }

export const trackLeadOf = <Pawn extends OnTrack>({
  pawns,
  yours
}: {
  pawns: readonly Pawn[]
  yours: Pawn
}): TrackLead<Pawn> | null => {
  const leader = pawns
    .filter((pawn) => pawn.id !== yours.id)
    .toSorted((a, b) => b.board.case - a.board.case)[0]

  if (leader === undefined) {
    return null
  }

  const gap = yours.board.case - leader.board.case

  if (gap > 0) {
    return { gap, kind: 'ahead' }
  }

  return gap === 0 ? { kind: 'level' } : { gap: -gap, kind: 'behind', leader }
}
