import type { GameKind, GameSettings } from '@melee/protocol/game'

/**
 * `entries` in the order that keeps each game as far from its last round as
 * the cycle allows. A game holding `n` of the cycle's `N` entries is owed a
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
  const kindAt = (at: number | null): GameKind | undefined =>
    at === null ? undefined : lineUp[at]?.kind
  const gapOf = (kind: GameKind | undefined) =>
    Math.floor(
      entries.length / entries.filter((at) => kindAt(at) === kind).length
    )
  const dealt: number[] = []
  const left = [...entries]

  const roundsSince = (isOpened: (at: number | null) => boolean) => {
    const before = [...opened, ...dealt]
    const last = before.findLastIndex(isOpened)

    return last === -1 ? Number.POSITIVE_INFINITY : before.length - last
  }
  const roomLeftFor = (kind: GameKind | undefined) => {
    const owed = left.filter((at) => kindAt(at) === kind).length

    return left.length - ((owed - 1) * gapOf(kind) + 1)
  }
  const waitOf = (kind: GameKind | undefined) =>
    roundsSince((at) => kindAt(at) === kind) - gapOf(kind)
  const tightestOf = (kinds: readonly (GameKind | undefined)[]) => {
    const tightest = Math.min(...kinds.map(roomLeftFor))
    const tight = kinds.filter((kind) => roomLeftFor(kind) === tightest)
    const longestWait = Math.max(...tight.map(waitOf))

    return tight.filter((kind) => waitOf(kind) === longestWait)
  }
  const restOf = (kind: GameKind | undefined) =>
    roundsSince((at) => kindAt(at) === kind) / gapOf(kind)
  const nearestRestedOf = (kinds: readonly (GameKind | undefined)[]) => {
    const nearest = Math.max(...kinds.map(restOf))

    return kinds.filter((kind) => restOf(kind) === nearest)
  }

  while (left.length > 0) {
    const previous = kindAt(dealt.at(-1) ?? opened.at(-1) ?? null)
    const waiting = [...new Set(left.map(kindAt))]
    const others = waiting.filter((kind) => kind !== previous)
    const rested = others.filter((kind) => waitOf(kind) >= 0)
    const game = pickOne({
      candidates:
        rested.length > 0
          ? tightestOf(rested)
          : nearestRestedOf(others.length > 0 ? others : waiting),
      random
    })
    const variants = left.filter((at) => kindAt(at) === game)
    const longestAgo = Math.max(
      ...variants.map((at) => roundsSince((row) => row === at))
    )
    const drawn = pickOne({
      candidates: variants.filter(
        (at) => roundsSince((row) => row === at) === longestAgo
      ),
      random
    })

    if (drawn === undefined) {
      break
    }

    dealt.push(drawn)
    left.splice(left.indexOf(drawn), 1)
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
