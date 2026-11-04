import type { Team } from '@melee/protocol/team'

import { TEAM_PAWN_HEAD } from '@melee/core/board/pawn-piece'
import { isRoundInPlay } from '@melee/core/room/room-phase'
import { teamOfSeat } from '@melee/core/team/team-board'

import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { protocolErrorKey } from '@/presentation/i18n/translation'
import { useRoomActions } from '@/presentation/room-actions/room-actions-provider'

import type { PawnPiecePickerProps } from './pawn-piece-picker'

export type OwnPawn = Omit<PawnPiecePickerProps, 'isLabelHidden'> & {
  /** The team the pawn is, when the seat sits in one: repainting it repaints them all. */
  team: Team | null
}

/**
 * This screen's own pawn, picked against every other pawn on the table: the
 * seat's piece, or its team's colour when it sits in one — a seat in a team
 * picking a piece of its own would change nothing on the track. `null` where
 * no seat is held.
 */
export const useOwnPawn = (): OwnPawn | null => {
  const { pawnRoom, recolourPawn, refusedRecolour } = useRoomActions()
  const translate = useTranslate()
  const you = pawnRoom?.players.find((player) => player.id === pawnRoom.youId)

  if (pawnRoom === null || recolourPawn === null || you === undefined) {
    return null
  }

  const team = teamOfSeat({ playerId: you.id, teams: pawnRoom.teams })
  const isInPlay = isRoundInPlay(pawnRoom.phase)

  return {
    description: isInPlay
      ? translate('pawn.betweenRounds')
      : team === null
        ? undefined
        : translate('pawn.teamHint'),
    errorMessage:
      refusedRecolour === null
        ? undefined
        : translate(protocolErrorKey(refusedRecolour)),
    holders:
      team === null
        ? pawnRoom.players
            .filter((player) => player.id !== you.id)
            .map((player) => ({
              name: player.nickname,
              piece: { colour: player.colour, head: player.head }
            }))
        : pawnRoom.teams
            .filter((other) => other.id !== team.id)
            .map((other) => ({
              name: other.name,
              piece: { colour: other.colour, head: TEAM_PAWN_HEAD }
            })),
    isDisabled: isInPlay,
    label: translate(team === null ? 'pawn.label.seat' : 'pawn.label.team'),
    onRecolour: recolourPawn,
    pawnOf: team === null ? 'seat' : 'team',
    piece:
      team === null
        ? { colour: you.colour, head: you.head }
        : { colour: team.colour, head: TEAM_PAWN_HEAD },
    team
  }
}
