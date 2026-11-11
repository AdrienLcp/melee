import type { GameKind, GameSettings } from '@melee/protocol/game'

type GameFamily = 'clockRaces' | 'numbers' | 'wordSheets'

/**
 * Games the table feels as one: two word sheets, two races against the
 * clock or two numbers to weigh in a row read as the same round twice, so the
 * dealer spaces a family as it spaces a game.
 */
const FAMILY_OF: Partial<Record<GameKind, GameFamily>> = {
  blacksquare: 'wordSheets',
  estimate: 'numbers',
  higherlower: 'numbers',
  innerclock: 'clockRaces',
  longestword: 'wordSheets',
  mysteryword: 'wordSheets',
  petitbac: 'wordSheets',
  reflex: 'clockRaces'
}

type SpacingKey = GameKind | GameFamily

export const spacingKeyOf = (kind: GameKind): SpacingKey =>
  FAMILY_OF[kind] ?? kind

/**
 * `entries` in the order that keeps each game — each family, for the games
 * in one (`FAMILY_OF`) — as far from its last round as the cycle allows. A game holding `n` of the cycle's `N` entries is owed a
 * gap of `⌊N / n⌋` rounds, counted from its last round — the rounds in
 * `opened` included, so the seam with what came before is spaced too. Each
 * row goes to a game whose gap has run out, the one with the least room left
 * to fit what it still owes first — so the games holding the most entries
 * never fall behind and pile up at the end — then the one past its gap the
 * longest. When none has rested its gap, the one nearest to it plays. Never
 * two rounds of one game run back to back while another game is left, and of
 * the game drawn, the entry played longest ago takes the row.
 *
 * On a cycle dealt whole, every ready-made evening keeps the gap for every
 * game (`spaced-cycle.test.ts`).
 */
export const spacedCycle = ({
  entries,
  lineUp,
  opened,
  random
}: {
  /** The line-up indices to deal, each once. */
  entries: readonly number[]
  lineUp: readonly GameSettings[]
  /** The entry each round before the cycle opened on, oldest first, `null` for one no longer in the line-up. */
  opened: readonly (number | null)[]
  /** In `[0, 1)`, as `Math.random`. */
  random: () => number
}): number[] => {
  const keyAt = (at: number | null): SpacingKey | undefined => {
    const kind = at === null ? undefined : lineUp[at]?.kind

    return kind === undefined ? undefined : spacingKeyOf(kind)
  }
  const countByKey = (rows: readonly number[]) => {
    const counts = new Map<SpacingKey | undefined, number>()

    for (const at of rows) {
      counts.set(keyAt(at), (counts.get(keyAt(at)) ?? 0) + 1)
    }

    return counts
  }
  const shareByKey = countByKey(entries)
  const owedByKey = countByKey(entries)
  const gapOf = (kind: SpacingKey | undefined) =>
    Math.floor(entries.length / (shareByKey.get(kind) ?? 0))
  const dealt: number[] = []
  const left = [...entries]
  const lastRowOfKey = new Map<SpacingKey | undefined, number>()
  const lastRowOfEntry = new Map<number, number>()
  const markPlayed = ({ at, row }: { at: number | null; row: number }) => {
    lastRowOfKey.set(keyAt(at), row)

    if (at !== null) {
      lastRowOfEntry.set(at, row)
    }
  }

  for (const [row, at] of opened.entries()) {
    markPlayed({ at, row })
  }

  const roundsSince = (lastRow: number | undefined) =>
    lastRow === undefined
      ? Number.POSITIVE_INFINITY
      : opened.length + dealt.length - lastRow
  const roomLeftFor = (kind: SpacingKey | undefined) =>
    left.length - (((owedByKey.get(kind) ?? 0) - 1) * gapOf(kind) + 1)
  const waitOf = (kind: SpacingKey | undefined) =>
    roundsSince(lastRowOfKey.get(kind)) - gapOf(kind)
  const tightestOf = (kinds: readonly (SpacingKey | undefined)[]) => {
    const tightest = Math.min(...kinds.map(roomLeftFor))
    const tight = kinds.filter((kind) => roomLeftFor(kind) === tightest)
    const longestWait = Math.max(...tight.map(waitOf))

    return tight.filter((kind) => waitOf(kind) === longestWait)
  }
  const restOf = (kind: SpacingKey | undefined) =>
    roundsSince(lastRowOfKey.get(kind)) / gapOf(kind)
  const nearestRestedOf = (kinds: readonly (SpacingKey | undefined)[]) => {
    const nearest = Math.max(...kinds.map(restOf))

    return kinds.filter((kind) => restOf(kind) === nearest)
  }

  while (left.length > 0) {
    const previous = keyAt(dealt.at(-1) ?? opened.at(-1) ?? null)
    const waiting = [...new Set(left.map(keyAt))]
    const others = waiting.filter((kind) => kind !== previous)
    const rested = others.filter((kind) => waitOf(kind) >= 0)
    const game = pickOne({
      candidates:
        rested.length > 0
          ? tightestOf(rested)
          : nearestRestedOf(others.length > 0 ? others : waiting),
      random
    })
    const variants = left.filter((at) => keyAt(at) === game)
    const entryRest = (at: number) => roundsSince(lastRowOfEntry.get(at))
    const longestAgo = Math.max(...variants.map(entryRest))
    const drawn = pickOne({
      candidates: variants.filter((at) => entryRest(at) === longestAgo),
      random
    })

    if (drawn === undefined) {
      break
    }

    markPlayed({ at: drawn, row: opened.length + dealt.length })
    dealt.push(drawn)
    left.splice(left.indexOf(drawn), 1)
    owedByKey.set(game, (owedByKey.get(game) ?? 0) - 1)
  }

  return dealt
}

const pickOne = <T>({
  candidates,
  random
}: {
  candidates: readonly T[]
  random: () => number
}): T | undefined => candidates[Math.floor(random() * candidates.length)]
