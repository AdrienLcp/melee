import { useState } from 'react'

import type { ShelvedGame } from '@melee/protocol/game'

import {
  gamesOfLineUp,
  type ReadyMadeLineUpId,
  readyMadeLineUpsFor
} from '@melee/core/room/ready-made-line-ups'
import { gamesOfPlayedLineUp } from '@melee/core/room/recent-tables'
import type { SavedEvening } from '@melee/core/room/saved-evening'

import { createRoom } from '@/infrastructure/api/melee-api'
import {
  type HostArrival,
  hostArrivalState,
  hostPathFor,
  usePageNavigation
} from '@/infrastructure/router/navigation'
import { writeHostToken } from '@/infrastructure/storage/session-storage'
import { useI18n } from '@/presentation/i18n/i18n-provider'
import {
  apiErrorKey,
  type PlainTranslationKey
} from '@/presentation/i18n/translation'

/** Which front door pressed, so the spinner lands on that one alone. */
type OpeningDoor =
  | { door: 'game' }
  | { door: 'lineUp'; key: string }
  | { door: 'lobby' }
  | { door: 'readyMade'; id: ReadyMadeLineUpId }

type RoomOpening =
  | (OpeningDoor & { error: PlainTranslationKey; status: 'refused' })
  | (OpeningDoor & { status: 'opening' })
  | { status: 'idle' }

/**
 * The one trip to the network every front door makes, and the console it lands
 * on. A game's own page opens on that game; the host's door on the games
 * ticked on the home shelf, still decided in the lobby; a ready-made lid, or
 * a line-up this host kept or played, on its games, and it tells the console
 * which line-up it was so the lobby lays the whole of it out.
 *
 * It is one state and not a boolean beside an error, because the home page
 * draws a press per lid beside its door and the spinner, or the refusal, has
 * to appear on the one pressed. That is also what closes the second press: a room already
 * opening refuses to open another.
 */
export const useCreateRoom = () => {
  const navigate = usePageNavigation()
  const { locale } = useI18n()
  const [opening, setOpening] = useState<RoomOpening>({ status: 'idle' })

  const openRoom = async ({
    arrival,
    door,
    games
  }: {
    arrival?: HostArrival
    door: OpeningDoor
    games: readonly ShelvedGame[]
  }): Promise<void> => {
    if (opening.status === 'opening') {
      return
    }

    setOpening({ ...door, status: 'opening' })

    const created = await createRoom({
      games,
      locale
    })

    if (created.status === 'failure') {
      setOpening(
        created.error === 'aborted'
          ? { status: 'idle' }
          : { ...door, error: apiErrorKey(created.error), status: 'refused' }
      )

      return
    }

    writeHostToken({
      hostToken: created.data.hostToken,
      roomCode: created.data.code
    })

    await navigate(hostPathFor(created.data.code), { state: arrival })
  }

  return {
    isOpeningAny: opening.status === 'opening',
    /** The table the host's door asked for is opening. */
    isOpeningLobby: opening.status === 'opening' && opening.door === 'lobby',
    /** The home line-up a table is opening for, by its card's key, or `null`. */
    lineUpOpening:
      opening.status === 'opening' && opening.door === 'lineUp'
        ? opening.key
        : null,
    /** Opens a table on `games`, its console in the lobby with nobody seated. */
    open: ({ games }: { games: readonly ShelvedGame[] }): Promise<void> =>
      openRoom({ door: { door: 'game' }, games }),
    /**
     * Opens a table on a line-up this host kept or played, which the console
     * then lays out; `key` names the card pressed, for its spinner.
     */
    openLineUp: ({
      evening,
      key
    }: {
      evening: SavedEvening
      key: string
    }): Promise<void> =>
      openRoom({
        arrival: hostArrivalState({ evening }),
        door: { door: 'lineUp', key },
        games: gamesOfPlayedLineUp(evening)
      }),
    /** Opens the host's door table on `games`, none opening an empty lobby. */
    openLobby: ({ games }: { games: readonly ShelvedGame[] }): Promise<void> =>
      openRoom({ door: { door: 'lobby' }, games }),
    /** Opens a table on a ready-made line-up, which the console then lays out. */
    openReadyMade: ({ id }: { id: ReadyMadeLineUpId }): Promise<void> => {
      const lineUp = readyMadeLineUpsFor(locale).find(
        (readyMade) => readyMade.id === id
      )

      return openRoom({
        arrival: hostArrivalState({ readyMade: id }),
        door: { door: 'readyMade', id },
        games: lineUp === undefined ? [] : gamesOfLineUp(lineUp)
      })
    },
    /** The ready-made box a table is opening for, or `null` when none is. */
    readyMadeOpening:
      opening.status === 'opening' && opening.door === 'readyMade'
        ? opening.id
        : null,
    /**
     * Every cause is the room service rather than the game — a rate limit, a
     * dead network — so one message serves whichever press met it.
     */
    refusal: opening.status === 'refused' ? opening.error : null,
    /** Which door met the refusal, so the page shows it beside that press. */
    refusedDoor: opening.status === 'refused' ? opening.door : null
  }
}

/** What `useCreateRoom` hands a front door, for the pieces of it that press. */
export type CreateRoom = ReturnType<typeof useCreateRoom>
