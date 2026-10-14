import type React from 'react'
import { useEffect, useRef, useState } from 'react'

import type { PlayerId } from '@taverla/protocol/identifiers'
import type { HostRoomView } from '@taverla/protocol/room'

import { arrivedPlayers } from '@taverla/core/room/arrivals'
import { isGameInPlay } from '@taverla/core/room/room-phase'

import { Pawn } from '@/presentation/components/pawn'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './arrival-notice.sass'

/** Long enough to read a name, short enough to be gone by the next question. */
const ARRIVAL_SHOWN_MS = 4_500

/** Who just sat down, and the place on the roster that picks their pawn. */
export type Arrival = { nickname: string; seat: number }

/**
 * The latest seat taken while a game runs, for as long as it is worth saying.
 * Held by the console rather than by the notice, so a round turning into its
 * reveal — two different screens — neither forgets the roster it compared
 * against nor cuts the line short.
 */
export const useArrival = (view: HostRoomView | null): Arrival | null => {
  const seen = useRef<PlayerId[] | null>(null)
  const [arrival, setArrival] = useState<Arrival | null>(null)

  useEffect(() => {
    if (view === null) {
      return
    }

    const arrived = arrivedPlayers({
      after: view.players,
      before: seen.current
    }).filter((player) => player.id !== view.youId)

    seen.current = view.players.map((player) => player.id)

    const newcomer = arrived.at(-1)

    if (newcomer !== undefined && isGameInPlay(view.phase)) {
      setArrival({
        nickname: newcomer.nickname,
        seat: view.players.indexOf(newcomer)
      })
    }
  }, [view])

  useEffect(() => {
    if (arrival === null) {
      return
    }

    const timer = window.setTimeout(() => {
      setArrival(null)
    }, ARRIVAL_SHOWN_MS)

    return () => {
      window.clearTimeout(timer)
    }
  }, [arrival])

  return arrival
}

/**
 * Somebody sat down while a game runs, said once inside the header line, in
 * place of the round and the score, and let go: nothing to accept and nothing
 * to press. Rendered as a child of that line — `RoundChrome`'s `notice`, or the
 * console's own header. The answer tally already leaves them out of the round
 * in front of the console, so the name and one word are the whole of it, at
 * every width.
 *
 * The live region is mounted empty and stays mounted, because one that
 * appears with its first message is a message nobody hears.
 */
export const ArrivalNotice: React.FC<{ arrival: Arrival | null }> = ({
  arrival
}) => {
  const translate = useTranslate()

  return (
    <p
      aria-live='polite'
      className='arrival-notice'
      data-shown={arrival !== null || undefined}
      role='status'
    >
      {arrival !== null && (
        <>
          <Pawn seat={arrival.seat} />
          <span className='words'>
            {translate('host.arrival', { nickname: arrival.nickname })}
          </span>
        </>
      )}
    </p>
  )
}
