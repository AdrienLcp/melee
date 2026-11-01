import { useCallback, useEffect, useState } from 'react'

import type { ClientMessage } from '@melee/protocol/client-message'
import type { PlayerId } from '@melee/protocol/identifiers'
import type { ProtocolErrorMessage } from '@melee/protocol/server-message'
import type { TeamId } from '@melee/protocol/team'

import { teamOfSeat } from '@melee/core/team/team-board'

import { writeStoredPawnColour } from '@/infrastructure/storage/preferences-storage'

import type {
  PawnRoom,
  RecolourRefusal,
  RoomActions
} from './room-actions-provider'

const RECOLOUR_REFUSALS: readonly RecolourRefusal[] = [
  'colour_taken',
  'teams_locked',
  'wrong_phase'
]

type RecolourRequest = { colour: number; isTeam: boolean }

const recolourMessage = ({
  colour,
  role,
  teamId,
  youId
}: {
  colour: number
  role: 'host' | 'player'
  teamId: TeamId | null
  youId: PlayerId
}): ClientMessage => {
  if (role === 'player') {
    return teamId === null
      ? { colour, type: 'player.recolourSeat' }
      : { colour, type: 'player.recolourTeam' }
  }

  return teamId === null
    ? { colour, playerId: youId, type: 'host.recolourSeat' }
    : { colour, teamId, type: 'host.recolourTeam' }
}

/**
 * What a seated screen offers the menu for its pawn: the frame that repaints
 * it — its team's when it sits in one — the refusal that frame last met, and
 * the room it is picked against.
 *
 * The device keeps the seat's own colour once the room shows the one it asked
 * for, as it keeps the name the room accepted, so the next table's `hello` asks
 * for it again.
 */
export const useSeatPawn = ({
  clearError,
  error,
  role,
  send,
  view
}: {
  clearError: () => void
  error: ProtocolErrorMessage | null
  /** Which frames repaint the seat: a seated console speaks as the host. */
  role: 'host' | 'player'
  send: (message: ClientMessage) => boolean
  view: PawnRoom | null
}): Pick<RoomActions, 'pawnRoom' | 'recolourPawn' | 'refusedRecolour'> => {
  const [requested, setRequested] = useState<RecolourRequest | null>(null)
  const you = view?.players.find((player) => player.id === view.youId) ?? null
  const team =
    you === null || view === null
      ? null
      : teamOfSeat({ playerId: you.id, teams: view.teams })
  const youId = you?.id ?? null
  const teamId = team?.id ?? null
  const pawnColour = team?.colour ?? you?.colour ?? null
  const acceptedSeatColour =
    requested !== null && !requested.isTeam && requested.colour === you?.colour
      ? requested.colour
      : null

  useEffect(() => {
    if (acceptedSeatColour !== null) {
      writeStoredPawnColour(acceptedSeatColour)
    }
  }, [acceptedSeatColour])

  const recolourPawn = useCallback(
    (colour: number) => {
      if (youId === null) {
        return
      }

      clearError()
      setRequested({ colour, isTeam: teamId !== null })
      send(recolourMessage({ colour, role, teamId, youId }))
    },
    [clearError, role, send, teamId, youId]
  )

  const refusal = RECOLOUR_REFUSALS.find((code) => code === error?.code) ?? null

  return {
    pawnRoom: you === null ? null : view,
    recolourPawn: you === null ? null : recolourPawn,
    refusedRecolour:
      requested !== null && requested.colour !== pawnColour ? refusal : null
  }
}
