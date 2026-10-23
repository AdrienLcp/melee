import { useState } from 'react'
import { useNavigate } from 'react-router'

import type { ShelvedGame } from '@melee/protocol/game'
import type { Nickname } from '@melee/protocol/identifiers'

import { canPlayRightAway } from '@melee/core/room/play-right-away'

import { createRoom } from '@/infrastructure/api/melee-api'
import {
  hostPathFor,
  playRightAwayNavigation
} from '@/infrastructure/router/navigation'
import { writeStoredNickname } from '@/infrastructure/storage/preferences-storage'
import {
  writeHostToken,
  writeSeatNickname
} from '@/infrastructure/storage/session-storage'
import { useI18n } from '@/presentation/i18n/i18n-provider'
import {
  apiErrorKey,
  type PlainTranslationKey
} from '@/presentation/i18n/translation'

type RoomOpening =
  | { error: PlainTranslationKey; status: 'refused' }
  | { seatAs: Nickname | null; status: 'opening' }
  | { status: 'idle' }

/**
 * A seated host cannot take a seat under a game they must judge, and a line-up
 * opens on its first entry — so a game somebody can play goes first.
 */
const playableFirst = (games: readonly ShelvedGame[]): readonly ShelvedGame[] =>
  games.toSorted(
    (a, b) => Number(canPlayRightAway(b)) - Number(canPlayRightAway(a))
  )

/**
 * The one trip to the network every front door makes, and the console it lands
 * on. It carries the games ticked — none, one or several — because a host who
 * ticked them has already answered the question the lobby would ask.
 *
 * It is one state and not a boolean beside an error, because a game's own page
 * draws two presses on it and the spinner has to appear on the one pressed.
 * That is also what closes the second press: a room already opening refuses to
 * open another.
 */
export const useCreateRoom = () => {
  const navigate = useNavigate()
  const { locale } = useI18n()
  const [opening, setOpening] = useState<RoomOpening>({ status: 'idle' })

  return {
    /** The table is opening for the group, with nobody seated. */
    isOpening: opening.status === 'opening' && opening.seatAs === null,
    isOpeningAny: opening.status === 'opening',
    /** The table is opening with whoever pressed already seated. */
    isStartingRightAway:
      opening.status === 'opening' && opening.seatAs !== null,
    /**
     * Opens a table on `games`. With `seatAs`, the console it lands on takes
     * the host's seat under that name — written where the console's `hello`
     * reads it — and with exactly one game it starts the first round itself,
     * through the navigation the console consumes once. Several wait in the
     * lobby with the host already at the table.
     */
    open: async ({
      games,
      seatAs = null
    }: {
      games: readonly ShelvedGame[]
      seatAs?: Nickname | null
    }): Promise<void> => {
      if (opening.status === 'opening') {
        return
      }

      setOpening({ seatAs, status: 'opening' })

      const created = await createRoom({
        games: seatAs === null ? games : playableFirst(games),
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

      if (seatAs === null) {
        await navigate(hostPathFor(created.data.code))

        return
      }

      writeStoredNickname(seatAs)
      writeSeatNickname({
        nickname: seatAs,
        role: 'host',
        roomCode: created.data.code
      })
      await navigate(
        hostPathFor(created.data.code),
        games.length === 1 ? playRightAwayNavigation : undefined
      )
    },
    /**
     * Every cause is the room service rather than the game — a rate limit, a
     * dead network — so one message serves whichever press met it.
     */
    refusal: opening.status === 'refused' ? opening.error : null
  }
}

/** What `useCreateRoom` hands a front door, for the pieces of it that press. */
export type CreateRoom = ReturnType<typeof useCreateRoom>
