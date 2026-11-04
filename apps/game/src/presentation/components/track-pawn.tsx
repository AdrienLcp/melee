import type React from 'react'

import type { PawnPiece } from '@melee/protocol/team'

import { TEAM_PAWN_HEAD } from '@melee/core/board/pawn-piece'
import type { TrackPawn } from '@melee/core/board/track-pawns'

import { useTeamName } from '@/presentation/i18n/use-team-name'

import { Pawn } from './pawn'

/**
 * A track pawn's piece: a seat on the track is one in a room with no teams, so
 * it walks as the piece it picked, and a team in its colour's round head.
 */
export const trackPawnPieceOf = (pawn: TrackPawn): PawnPiece =>
  pawn.kind === 'team'
    ? { colour: pawn.team.colour, head: TEAM_PAWN_HEAD }
    : { colour: pawn.player.colour, head: pawn.player.head }

/**
 * A track pawn's piece, drawn: on the track a pawn stands with no name beside
 * it, so its colour and its head are what tell it apart.
 */
export const TrackPawnPiece: React.FC<{ pawn: TrackPawn }> = ({ pawn }) => {
  const piece = trackPawnPieceOf(pawn)

  return <Pawn colour={piece.colour} head={piece.head} />
}

/** Whom a track pawn stands for: the team's name, or the seat's nickname. */
export const useTrackPawnName = (): ((pawn: TrackPawn) => string) => {
  const teamName = useTeamName()

  return (pawn) =>
    pawn.kind === 'team' ? teamName(pawn.team) : pawn.player.nickname
}
