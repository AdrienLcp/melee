import type { Team } from '@melee/protocol/team'

import { isRoundInPlay } from '@melee/core/room/room-phase'
import { teamOfSeat } from '@melee/core/team/team-board'

import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { protocolErrorKey } from '@/presentation/i18n/translation'
import { useRoomActions } from '@/presentation/room-actions/room-actions-provider'

import type { PawnColourPickerProps } from './pawn-colour-picker'

export type OwnPawn = Omit<PawnColourPickerProps, 'isLabelHidden'> & {
  /** The team the pawn is, when the seat sits in one: repainting it repaints them all. */
  team: Team | null
}

/**
 * This screen's own pawn, picked against every other pawn on the table: the
 * seat's, or its team's when it sits in one — a seat in a team picking a colour
 * of its own would change nothing on the track. `null` where no seat is held.
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
    colour: team?.colour ?? you.colour,
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
            .map((player) => ({ colour: player.colour, name: player.nickname }))
        : pawnRoom.teams
            .filter((other) => other.id !== team.id)
            .map((other) => ({ colour: other.colour, name: other.name })),
    isDisabled: isInPlay,
    label: translate(team === null ? 'pawn.label.seat' : 'pawn.label.team'),
    onRecolour: recolourPawn,
    sharesWhenFull: team === null,
    team
  }
}
