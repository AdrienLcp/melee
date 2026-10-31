import type React from 'react'

import type { TrackPawn } from '@melee/core/board/track-pawns'

import { useTeamName } from '@/presentation/i18n/use-team-name'

import { Pawn, pawnNumberOf } from './pawn'

/**
 * A track pawn's piece: its team's colour, or its seat's with the seat's mark
 * on its head — on the track a seat's pawn stands with no name beside it, and
 * past the last colour two seats share one.
 */
export const TrackPawnPiece: React.FC<{ pawn: TrackPawn }> = ({ pawn }) => (
  <Pawn
    colour={trackPawnNumberOf(pawn)}
    {...(pawn.kind === 'seat' && { mark: pawn.mark })}
  />
)

/**
 * A track pawn's colour, 1-based: a seat on the track is one in a room with no
 * teams, so its own colour needs no context.
 */
export const trackPawnNumberOf = (pawn: TrackPawn): number =>
  pawn.kind === 'team' ? pawn.team.colour : pawnNumberOf(pawn.seat)

/** Whom a track pawn stands for: the team's name, or the seat's nickname. */
export const useTrackPawnName = (): ((pawn: TrackPawn) => string) => {
  const teamName = useTeamName()

  return (pawn) =>
    pawn.kind === 'team' ? teamName(pawn.team) : pawn.player.nickname
}
