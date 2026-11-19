import type React from 'react'
import { useEffect, useRef, useState } from 'react'

import type { PlayerId } from '@melee/protocol/identifiers'
import type { LightsSeatCount } from '@melee/protocol/lights'
import type { PublicPlayer, RoundView } from '@melee/protocol/room'

import {
  LIGHTS_PUBLISH_TICK_MS,
  TRAP_FREEZE_MS
} from '@melee/core/lights/counted-tap'
import type { ClockEstimate } from '@melee/core/time/clock-sync'

import { lightsContent } from '@/helpers/round-content'
import { nowMs } from '@/infrastructure/clock'
import { CrossIcon } from '@/presentation/components/icons'
import { Pawn } from '@/presentation/components/pawn'
import { RoundProgress } from '@/presentation/components/round-progress'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import {
  lightsElapsedMsOf,
  useLightsWindow
} from '@/presentation/theme/use-lights-window'

import './lights-race.sass'

/**
 * The fewest hits a full bar stands for: the first hit of the round would
 * otherwise fill every lane that has one.
 */
const LEAST_BAR_SCALE = 10

/** Past this many lanes the race takes two columns, lying down. */
export const MOST_LANES_IN_ONE_COLUMN = 12

/**
 * The seats whose trap count rose in the last `TRAP_FREEZE_MS`, which is how
 * long their own board is dark: the wall lays their pawn down for as long.
 */
const useTrappedSeats = (
  seats: readonly LightsSeatCount[]
): ReadonlySet<PlayerId> => {
  const lastTraps = useRef<ReadonlyMap<PlayerId, number>>(new Map())
  const [downUntil, setDownUntil] = useState<ReadonlyMap<PlayerId, number>>(
    () => new Map()
  )

  useEffect(() => {
    const fallen = seats.filter(
      (seat) =>
        seat.traps > (lastTraps.current.get(seat.playerId) ?? seat.traps)
    )

    lastTraps.current = new Map(
      seats.map((seat) => [seat.playerId, seat.traps])
    )

    if (fallen.length === 0) {
      return
    }

    const until = nowMs() + TRAP_FREEZE_MS

    setDownUntil(
      (current) =>
        new Map([
          ...current,
          ...fallen.map((seat) => [seat.playerId, until] as const)
        ])
    )
  }, [seats])

  useEffect(() => {
    if (downUntil.size === 0) {
      return
    }

    const timer = setTimeout(
      () => {
        const now = nowMs()

        setDownUntil(
          (current) => new Map([...current].filter(([, until]) => until > now))
        )
      },
      Math.max(0, Math.min(...downUntil.values()) - nowMs())
    )

    return () => clearTimeout(timer)
  }, [downUntil])

  return new Set(downUntil.keys())
}

type LightsRaceProps = {
  clock: ClockEstimate | null
  players: readonly PublicPlayer[]
  round: RoundView
  /** The seat this screen plays for, underlined in its lane; `null` on a wall. */
  youId: PlayerId | null
}

/**
 * The room's race: one lane a seat, its bar climbing a hit at a time. The
 * lanes keep seat order while the window runs — a bar jumping rows four times
 * a second cannot be followed — and each bar eases over the quarter second
 * between two counts. A trap hatches its seat's bar and lays its pawn down
 * for the second that seat's board is dark. A duel is its two lanes alone,
 * across the whole stage.
 */
export const LightsRace: React.FC<LightsRaceProps> = ({
  clock,
  players,
  round,
  youId
}) => {
  const translate = useTranslate()
  const content = lightsContent(round)
  const opensAt = content?.opensAt ?? null
  const closesAt = content?.closesAt ?? null
  const windowState = useLightsWindow({ clock, closesAt, opensAt })
  const seats = content?.seats ?? []
  const trapped = useTrappedSeats(seats)

  if (content === null || opensAt === null || closesAt === null) {
    return null
  }

  const windowMs = closesAt - opensAt
  const duelSeats = round.duel?.seatIds ?? null
  const lanes = players.flatMap((player, seat) => {
    const count = seats.find((entry) => entry.playerId === player.id)

    return count === undefined ||
      (duelSeats !== null && !duelSeats.includes(player.id))
      ? []
      : [{ count, player, seat }]
  })
  const scale = Math.max(
    LEAST_BAR_SCALE,
    ...lanes.map((lane) => lane.count.hits)
  )

  return (
    <section
      aria-label={translate('lights.race')}
      className='lights-race'
      data-duel={duelSeats !== null || undefined}
    >
      <RoundProgress
        durationMs={windowMs}
        elapsedMs={lightsElapsedMsOf({ state: windowState, windowMs })}
      />
      <ol
        className='lanes'
        data-two-columns={lanes.length > MOST_LANES_IN_ONE_COLUMN || undefined}
        style={{
          '--lanes': lanes.length,
          '--tick-duration': `${LIGHTS_PUBLISH_TICK_MS}ms`
        }}
      >
        {lanes.map(({ count, player, seat }) => (
          <li
            className='lane'
            data-trapped={trapped.has(player.id) || undefined}
            data-you={player.id === youId || undefined}
            key={player.id}
            style={{
              '--hits': count.hits,
              '--share': (count.hits / scale).toFixed(3)
            }}
          >
            <span className='lane-pawn'>
              <Pawn seat={seat} />
            </span>
            <span className='name'>{player.nickname}</span>
            <span className='track'>
              <i aria-hidden='true' className='bar' />
              <b className='count'>{count.hits}</b>
              <CrossIcon aria-hidden='true' className='trap-mark' />
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}
