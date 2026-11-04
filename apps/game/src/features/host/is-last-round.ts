import type { HostRoomView } from '@melee/protocol/room'

import { endsTheEvening } from '@melee/core/room/next-game'

/**
 * Whether the round on screen is the evening's last, on the rule the server
 * ends on — so the console never offers *Next round* where the server would
 * answer with the final board.
 */
export const isLastRound = (view: HostRoomView): boolean =>
  endsTheEvening({
    pawns: [...view.teams, ...view.players],
    played: view.lineUpPlayed,
    roundIndex: view.round?.index ?? 0,
    settings: view.settings
  })
