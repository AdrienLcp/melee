import { useEffect } from 'react'

import type { HostClientMessage } from '@melee/protocol/client-message'
import type { OwnLinesGame } from '@melee/protocol/deck'
import type { HostRoomView } from '@melee/protocol/room'

import {
  markOwnLinePlayed,
  unplayedOwnLinesOf,
  useOwnLines
} from './use-own-lines'

/** The line a round put on the wall, for a game a host writes lines for. */
const dealtLineOf = (
  view: HostRoomView | null
): { game: OwnLinesGame; text: string } | null => {
  const content = view?.round?.content

  if (content?.kind === 'mostlikely') {
    return { game: 'mostlikely', text: content.labels.en }
  }

  if (content?.kind === 'challenge' && content.labels !== null) {
    return { game: 'challenge', text: content.labels.en }
  }

  return null
}

/**
 * Keeps the room dealing this host's own lines: every unplayed one is sent
 * once the room answers and again after each edit, and a line the room put on
 * the wall is marked played here, on a round nobody pressed as much as on a
 * picked one — an own line reads the same in every locale.
 */
export const useOwnLinesInRoom = ({
  send,
  view
}: {
  send: (message: HostClientMessage) => void
  view: HostRoomView | null
}): void => {
  const challenge = useOwnLines('challenge')
  const mostlikely = useOwnLines('mostlikely')
  const hasRoom = view !== null
  const dealt = dealtLineOf(view)
  const dealtGame = dealt?.game ?? null
  const dealtText = dealt?.text ?? null

  useEffect(() => {
    if (hasRoom) {
      send({
        ownLines: unplayedOwnLinesOf({ challenge, mostlikely }),
        type: 'host.setOwnLines'
      })
    }
  }, [challenge, hasRoom, mostlikely, send])

  useEffect(() => {
    if (dealtGame === null || dealtText === null) {
      return
    }

    markOwnLinePlayed({
      game: dealtGame,
      lines: dealtGame === 'challenge' ? challenge : mostlikely,
      text: dealtText
    })
  }, [challenge, dealtGame, dealtText, mostlikely])
}
