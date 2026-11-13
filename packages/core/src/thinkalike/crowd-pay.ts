import type { PlayerId } from '@melee/protocol/identifiers'
import type { ThinkAlikeGroup } from '@melee/protocol/think-alike'

import { paidShare } from '../scoring/round-share'

/** How many of the other seats wrote a seat's answer, and how many others there were. */
export type CrowdMatch = {
  matched: number
  others: number
}

/**
 * A seat's share of the round is the share of the *other* seats that wrote its
 * answer: every other seat pays the whole round, a lone answer nothing. Paid
 * against every other seat rather than the biggest crowd, so a table split
 * into pairs is a poor round for all of them, never a perfect one.
 */
export const pointsForMatch = ({ matched, others }: CrowdMatch): number =>
  others <= 0 ? 0 : paidShare(matched / others)

/** Whether the whole table wrote one answer, the one perfect round. */
export const isWholeTable = ({ matched, others }: CrowdMatch): boolean =>
  others > 0 && matched === others

/**
 * Every seat the round opened on, matched against the groups. A seat that
 * wrote nothing, or left before the close, matched nobody; a seat that left
 * is still counted among the others, because it was there to be matched.
 */
export const matchesOf = ({
  groups,
  roster
}: {
  groups: readonly ThinkAlikeGroup[]
  roster: ReadonlySet<PlayerId>
}): Map<PlayerId, CrowdMatch> => {
  const others = Math.max(roster.size - 1, 0)
  const matches = new Map<PlayerId, CrowdMatch>(
    [...roster].map((playerId) => [playerId, { matched: 0, others }])
  )

  for (const { authors } of groups) {
    const seated = authors.filter((playerId) => roster.has(playerId))

    for (const playerId of seated) {
      matches.set(playerId, { matched: seated.length - 1, others })
    }
  }

  return matches
}
