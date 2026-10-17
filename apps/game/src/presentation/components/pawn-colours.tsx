import type React from 'react'
import { createContext, useContext } from 'react'

import type { PublicPlayer } from '@melee/protocol/room'
import type { Team } from '@melee/protocol/team'

/** Seat index to its team's pawn number, for the seats that sit in a team. */
const PawnColoursContext = createContext<ReadonlyMap<number, number>>(new Map())

type PawnColoursProviderProps = {
  children: React.ReactNode
  /**
   * The room's seats and teams; `null` before the first view, and a room with
   * no teams leaves every pawn its seat's colour.
   */
  view: { players: readonly PublicPlayer[]; teams: readonly Team[] } | null
}

/**
 * A room playing in teams stands every seat's pawn in its team's colour, on
 * every screen at once: a pawn is what a board game hands a team, and the
 * every place a pawn is drawn already say *who* by the name beside it. One
 * provider per page rather than a colour threaded through each of them.
 */
export const PawnColoursProvider: React.FC<PawnColoursProviderProps> = ({
  children,
  view
}) => {
  const colours = new Map(
    (view?.players ?? []).flatMap((player, seat) => {
      const team = view?.teams.find((candidate) =>
        candidate.seatIds.includes(player.id)
      )

      return team === undefined ? [] : [[seat, team.colour] as const]
    })
  )

  return (
    <PawnColoursContext.Provider value={colours}>
      {children}
    </PawnColoursContext.Provider>
  )
}

export const useTeamPawnNumber = (seat: number): number | undefined =>
  useContext(PawnColoursContext).get(seat)
