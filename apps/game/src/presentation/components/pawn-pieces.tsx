import type React from 'react'
import { createContext, useContext } from 'react'

import type { PublicPlayer } from '@melee/protocol/room'
import type { PawnPiece, Team } from '@melee/protocol/team'

import { pawnPieceOf } from '@melee/core/board/pawn-piece'

/** Seat index to the piece it stands as. */
const PawnPiecesContext = createContext<ReadonlyMap<number, PawnPiece>>(
  new Map()
)

/**
 * What a seat no provider knows stands as — an empty socket's, drawn round
 * and dashed: nothing on screen that stands for a player should be one.
 */
const UNKNOWN_SEAT_PIECE: PawnPiece = { colour: 1, head: 'round' }

type PawnPiecesProviderProps = {
  children: React.ReactNode
  /** The room's seats and teams; `null` before the first view, which seats nobody. */
  view: { players: readonly PublicPlayer[]; teams: readonly Team[] } | null
}

/**
 * Every seat's piece, on every screen at once: the one the seat picked, or
 * its team's colour in a round head when it sits in one — a pawn is what a
 * board game hands a team. One provider per page rather than a piece threaded
 * through each place a pawn is drawn.
 */
export const PawnPiecesProvider: React.FC<PawnPiecesProviderProps> = ({
  children,
  view
}) => {
  const pieces = new Map(
    (view?.players ?? []).map(
      (player, seat) =>
        [seat, pawnPieceOf({ player, teams: view?.teams ?? [] })] as const
    )
  )

  return (
    <PawnPiecesContext.Provider value={pieces}>
      {children}
    </PawnPiecesContext.Provider>
  )
}

/** The piece the seat at this place in the roster stands as. */
export const useSeatPawnPiece = (seat: number): PawnPiece =>
  useContext(PawnPiecesContext).get(seat) ?? UNKNOWN_SEAT_PIECE
