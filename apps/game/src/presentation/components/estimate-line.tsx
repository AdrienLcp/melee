import type React from 'react'

import type { SentEstimate } from '@melee/protocol/estimate'
import type { PlayerId } from '@melee/protocol/identifiers'
import type { PublicPlayer } from '@melee/protocol/room'

import { OUT_OF_REACH_RATIO } from '@melee/core/estimate/estimate-pay'

import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { Pawn } from './pawn'

import './estimate-line.sass'

/** Where a guess past the factor-ten floor stands: just outside the paid stretch, on the end it overshot. */
const BEYOND_REACH = 1.12

/** How close two pins may stand, in percent of the line, before one climbs a lane. */
const PIN_SPACING = 5

/** The paid stretch takes this share of the line either side of the truth, leaving room for a pin out of reach at each end. */
const HALF_SPAN = 44

const TICKS = [
  { factor: 10, side: 'divided' },
  { factor: 2, side: 'divided' },
  { factor: 2, side: 'times' },
  { factor: 10, side: 'times' }
] as const

type EstimateLineProps = {
  guesses: readonly SentEstimate[]
  players: readonly PublicPlayer[]
  /** The true value, standing at the middle of the line. */
  value: number
  /** The reader's own seat, whose pin is ringed; `null` on a screen that holds none. */
  youId: PlayerId | null
}

type Pin = SentEstimate & { at: number; lane: number }

/** A guess's place along the line, in percent: logarithmic, so a guess twice too high stands as far from the truth as one half too low. */
const placeOf = (ratio: number): number => {
  const decades = Math.log10(ratio) / Math.log10(OUT_OF_REACH_RATIO)
  const clamped = Math.max(-BEYOND_REACH, Math.min(BEYOND_REACH, decades))

  return 50 + clamped * HALF_SPAN
}

const pinsOf = ({
  guesses,
  value
}: Pick<EstimateLineProps, 'guesses' | 'value'>): Pin[] => {
  const lanesEndAt: number[] = []

  return guesses
    .map((sent) => ({ ...sent, at: placeOf(sent.guess / value) }))
    .toSorted((left, right) => left.at - right.at)
    .map((placed) => {
      const free = lanesEndAt.findIndex((end) => placed.at - end >= PIN_SPACING)
      const lane = free === -1 ? lanesEndAt.length : free

      lanesEndAt[lane] = placed.at

      return { ...placed, lane }
    })
}

/**
 * Every seat's pin on a ruler centred on the truth, from ten times too low to
 * ten times too high, the stretch past either end dashed because nothing out
 * there is paid. Pins too close to share a spot climb onto lanes above each
 * other. The names and the numbers are the list's to say: the line is the
 * picture of who was near.
 */
export const EstimateLine: React.FC<EstimateLineProps> = ({
  guesses,
  players,
  value,
  youId
}) => {
  const translate = useTranslate()
  const pins = pinsOf({ guesses, value })
  const lanes = Math.max(1, ...pins.map((pin) => pin.lane + 1))

  return (
    <div
      aria-hidden='true'
      className='estimate-line'
      style={{ '--lanes': lanes }}
    >
      <ol className='pins'>
        {pins.map((pin) => (
          <li
            data-yours={pin.playerId === youId || undefined}
            key={pin.playerId}
            style={{ '--at': `${pin.at}%`, '--lane': pin.lane }}
          >
            <Pawn
              seat={players.findIndex((player) => player.id === pin.playerId)}
            />
          </li>
        ))}
      </ol>
      <div className='ruler'>
        <span className='truth' />
        {TICKS.map((tick) => (
          <span
            className='tick'
            key={`${tick.side}-${tick.factor}`}
            style={{
              '--at': `${placeOf(tick.side === 'times' ? tick.factor : 1 / tick.factor)}%`
            }}
          >
            {translate(`estimate.line.${tick.side}`, {
              factor: String(tick.factor)
            })}
          </span>
        ))}
      </div>
    </div>
  )
}
