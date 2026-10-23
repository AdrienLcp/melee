import type { GameKind, GameSettings } from '@melee/protocol/game'

import { capabilitiesOf } from './game-capabilities'
import { kindsInLineUp } from './line-up'

/**
 * How many of an evening's rounds are left to the draw once every entry still
 * owed has had its turn:
 * - `endless` — no count, so the games that serve their own content go on
 *   until the host stops
 * - `closed` — no game in the line-up serves its own, so the evening ends once
 *   its entries are played, whatever the count says
 * - `counted` — `count` rounds drawn among `fillers`, `0` when every round
 *   left is already an entry
 * - `over` — `excess` entries more than the count can hold; every entry is
 *   played at least once, so the count has to reach `needed`
 */
export type EveningChance =
  | { fillers: GameKind[]; kind: 'endless' }
  | { kind: 'closed' }
  | { count: number; fillers: GameKind[]; kind: 'counted' }
  | { excess: number; kind: 'over'; needed: number }

export const eveningChance = ({
  lineUp,
  played,
  roundCount,
  roundsOpened
}: {
  lineUp: readonly GameSettings[]
  /** How many rounds each entry has opened, by index. */
  played: readonly number[]
  roundCount: number | null
  /** The rounds this game has opened so far, the one on screen included. */
  roundsOpened: number
}): EveningChance => {
  const fillers = kindsInLineUp(
    lineUp.filter((entry) => capabilitiesOf(entry.kind).servesItsOwnContent)
  )
  const owed = lineUp.filter((_entry, index) => (played[index] ?? 0) === 0)
  const needed = roundsOpened + owed.length

  if (roundCount !== null && needed > roundCount) {
    return { excess: needed - roundCount, kind: 'over', needed }
  }

  if (fillers.length === 0) {
    return { kind: 'closed' }
  }

  return roundCount === null
    ? { fillers, kind: 'endless' }
    : { count: roundCount - needed, fillers, kind: 'counted' }
}
