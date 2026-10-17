import type { PlayerId } from '@melee/protocol/identifiers'

import { shuffled } from '../helpers/random'

/**
 * The console's deal: the seats shuffled, then dealt round the table one at a
 * time, which is what keeps every team within one seat of every other. The
 * server does not trust it — `isFairDeal` is the rule — but a console that
 * deals this way is never refused.
 */
export const dealTeams = ({
  count,
  seatIds
}: {
  count: number
  seatIds: readonly PlayerId[]
}): PlayerId[][] => {
  const teams = Array.from({ length: count }, (): PlayerId[] => [])

  shuffled(seatIds).forEach((seatId, index) => {
    teams[index % count]?.push(seatId)
  })

  return teams
}

/**
 * Whether an assignment is one the room can play: every seat in exactly one
 * team, no seat that is not in the room, no empty team, and no team more than
 * one seat bigger than another. A deal is the console's, and a socket is
 * whatever its owner makes it — this is what refuses the one that put the four
 * strongest players together.
 */
export const isFairDeal = ({
  assignment,
  seatIds
}: {
  assignment: readonly (readonly PlayerId[])[]
  seatIds: readonly PlayerId[]
}): boolean => {
  const dealt = assignment.flat()
  const sizes = assignment.map((team) => team.length)

  return (
    dealt.length === seatIds.length &&
    new Set(dealt).size === dealt.length &&
    dealt.every((seatId) => seatIds.includes(seatId)) &&
    Math.min(...sizes) > 0 &&
    Math.max(...sizes) - Math.min(...sizes) <= 1
  )
}
