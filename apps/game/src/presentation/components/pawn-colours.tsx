import type React from 'react'
import { createContext, useContext } from 'react'

import type { PublicPlayer } from '@melee/protocol/room'
import type { Team } from '@melee/protocol/team'

import { pawnColourOf } from '@melee/core/board/pawn-colour'

/** Seat index to the pawn number it stands in. */
const PawnColoursContext = createContext<ReadonlyMap<number, number>>(new Map())

/** What a seat no provider knows stands in: nothing on screen should be one. */
const UNKNOWN_SEAT_PAWN = 1

type PawnColoursProviderProps = {
  children: React.ReactNode
  /** The room's seats and teams; `null` before the first view, which seats nobody. */
  view: { players: readonly PublicPlayer[]; teams: readonly Team[] } | null
}

/**
 * Every seat's pawn colour, on every screen at once: the one the seat picked,
 * or its team's when it sits in one — a pawn is what a board game hands a
 * team. One provider per page rather than a colour threaded through each place
 * a pawn is drawn.
 */
export const PawnColoursProvider: React.FC<PawnColoursProviderProps> = ({
  children,
  view
}) => {
  const colours = new Map(
    (view?.players ?? []).map(
      (player, seat) =>
        [seat, pawnColourOf({ player, teams: view?.teams ?? [] })] as const
    )
  )

  return (
    <PawnColoursContext.Provider value={colours}>
      {children}
    </PawnColoursContext.Provider>
  )
}

/** The pawn number the seat at this place in the roster stands in. */
export const useSeatPawnColour = (seat: number): number =>
  useContext(PawnColoursContext).get(seat) ?? UNKNOWN_SEAT_PAWN
