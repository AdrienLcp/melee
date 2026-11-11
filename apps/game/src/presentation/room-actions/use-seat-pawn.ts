import { useCallback, useEffect, useState } from 'react'

import type { ClientMessage } from '@melee/protocol/client-message'
import type { PlayerId } from '@melee/protocol/identifiers'
import type { ProtocolErrorMessage } from '@melee/protocol/server-message'
import type { PawnPiece, TeamId } from '@melee/protocol/team'

import { isSamePawnPiece, TEAM_PAWN_HEAD } from '@melee/core/board/pawn-piece'
import { teamOfSeat } from '@melee/core/team/team-board'

import { writeStoredPawnPiece } from '@/infrastructure/storage/preferences-storage'

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

type RecolourRequest = { isTeam: boolean; piece: PawnPiece }

const recolourMessage = ({
  piece: { colour, head },
  role,
  teamId,
  youId
}: {
  piece: PawnPiece
  role: 'host' | 'player'
  teamId: TeamId | null
  youId: PlayerId
}): ClientMessage => {
  if (role === 'player') {
    return teamId === null
      ? { colour, head, type: 'player.recolourSeat' }
      : { colour, type: 'player.recolourTeam' }
  }

  return teamId === null
    ? { colour, head, playerId: youId, type: 'host.recolourSeat' }
    : { colour, teamId, type: 'host.recolourTeam' }
}

/**
 * What a seated screen offers the menu for its pawn: the frame that changes
 * it — its team's colour when it sits in one — the refusal that frame last
 * met, and the room it is picked against.
 *
 * The device keeps the seat's own piece once the room shows the one it asked
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
  const pawnPiece: PawnPiece | null =
    team === null ? you : { colour: team.colour, head: TEAM_PAWN_HEAD }
  const acceptedSeatPiece =
    requested !== null &&
    !requested.isTeam &&
    you !== null &&
    isSamePawnPiece({ other: you, piece: requested.piece })
      ? requested.piece
      : null

  const refusal = RECOLOUR_REFUSALS.find((code) => code === error?.code) ?? null
  const isRequestShown =
    requested !== null &&
    pawnPiece !== null &&
    isSamePawnPiece({ other: pawnPiece, piece: requested.piece })

  useEffect(() => {
    if (acceptedSeatPiece !== null) {
      writeStoredPawnPiece(acceptedSeatPiece)
    }
  }, [acceptedSeatPiece])

  const recolourPawn = useCallback(
    (piece: PawnPiece) => {
      if (youId === null) {
        return
      }

      clearError()
      setRequested({ isTeam: teamId !== null, piece })
      send(recolourMessage({ piece, role, teamId, youId }))
    },
    [clearError, role, send, teamId, youId]
  )

  return {
    pawnRoom:
      you === null || view === null
        ? null
        : {
            phase: view.phase,
            players: view.players,
            teams: view.teams,
            youId: view.youId
          },
    recolourPawn: you === null ? null : recolourPawn,
    refusedRecolour: requested !== null && !isRequestShown ? refusal : null
  }
}
