import { useState } from 'react'
import { useNavigate } from 'react-router'

import type { ShelvedGame } from '@melee/protocol/game'

import { createRoom } from '@/infrastructure/api/melee-api'
import { hostPathFor } from '@/infrastructure/router/navigation'
import { readStoredLineUpGames } from '@/infrastructure/storage/preferences-storage'
import { writeHostToken } from '@/infrastructure/storage/session-storage'
import { useI18n } from '@/presentation/i18n/i18n-provider'
import {
  apiErrorKey,
  type PlainTranslationKey
} from '@/presentation/i18n/translation'

const storedLineUpGamesOrNone = (): readonly ShelvedGame[] => {
  const stored = readStoredLineUpGames()

  return stored.status === 'success' ? stored.data : []
}

type RoomOpening =
  | { error: PlainTranslationKey; status: 'refused' }
  | {
      games: readonly ShelvedGame[]
      /** Opened from the home tray, on the games of the last evening rather than on one game. */
      isLobby: boolean
      status: 'opening'
    }
  | { status: 'idle' }

/**
 * The one trip to the network every front door makes, and the console it lands
 * on. It carries the game a spine or a game's own page opens for, because that
 * host has already answered the question. The home tray carries the games this
 * host last played an evening of, ticked again in the lobby where the table
 * still decides — none until they have played one.
 *
 * It is one state and not a boolean beside an error, because the home page
 * draws a press per game beside its tray and the spinner has to appear on the
 * one pressed.
 * That is also what closes the second press: a room already opening refuses to
 * open another.
 */
export const useCreateRoom = () => {
  const navigate = useNavigate()
  const { locale } = useI18n()
  const [opening, setOpening] = useState<RoomOpening>({ status: 'idle' })

  const openRoom = async ({
    games,
    isLobby
  }: {
    games: readonly ShelvedGame[]
    isLobby: boolean
  }): Promise<void> => {
    if (opening.status === 'opening') {
      return
    }

    setOpening({ games, isLobby, status: 'opening' })

    const created = await createRoom({
      games,
      locale
    })

    if (created.status === 'failure') {
      setOpening(
        created.error === 'aborted'
          ? { status: 'idle' }
          : { error: apiErrorKey(created.error), status: 'refused' }
      )

      return
    }

    writeHostToken({
      hostToken: created.data.hostToken,
      roomCode: created.data.code
    })

    await navigate(hostPathFor(created.data.code))
  }

  return {
    isOpeningAny: opening.status === 'opening',
    /** The home tray's table is opening. */
    isOpeningLobby: opening.status === 'opening' && opening.isLobby,
    /** Opens a table on `games`, its console in the lobby with nobody seated. */
    open: ({ games }: { games: readonly ShelvedGame[] }): Promise<void> =>
      openRoom({ games, isLobby: false }),
    /** The game a door is opening a table for, or `null` when none is. */
    openingFor:
      opening.status === 'opening' && !opening.isLobby ? opening.games : null,
    /** Opens the home tray's table, on the games of the host's last line-up. */
    openLobby: (): Promise<void> =>
      openRoom({ games: storedLineUpGamesOrNone(), isLobby: true }),
    /**
     * Every cause is the room service rather than the game — a rate limit, a
     * dead network — so one message serves whichever press met it.
     */
    refusal: opening.status === 'refused' ? opening.error : null
  }
}

/** What `useCreateRoom` hands a front door, for the pieces of it that press. */
export type CreateRoom = ReturnType<typeof useCreateRoom>
