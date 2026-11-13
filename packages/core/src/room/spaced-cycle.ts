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
  makenumber: 'numbers',
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
 * longest, a game not played yet counting as played the row before the first.
 * Never two rounds of one game run back to back while another game is left,
 * and of the game drawn, the entry played longest ago takes the row.
 *
 * That first choice can strand the last rows with no game rested, so the
 * dealer backs out of a dead end and tries the next choice, skipping any deal
 * that can no longer fill every row with a rested game. When no order spaces
 * every game within its tries, the row-by-row deal stands, a row with no
 * rested game having gone to the one nearest to it.
 *
 * A cycle that `loops` comes back to the order's first row after its last,
 * so that row's game is dealt its last round early enough to rest its gap
 * before it comes round again.
 *
 * On a cycle dealt whole, every ready-made evening keeps the gap for every
 * game (`spaced-cycle.test.ts`).
 */
export const spacedCycle = ({
  entries,
  lineUp,
  loops = false,
  opened,
  random
}: {
  /** The line-up indices to deal, each once. */
  entries: readonly number[]
  lineUp: readonly GameSettings[]
  /**
   * Whether the cycle closes an order played round again: its last row is
   * followed by the order's first — `opened`'s first entry, or the cycle's own
   * first row when `opened` holds none. `false` when absent.
   */
  loops?: boolean
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
  const loop = [...new Set(opened.filter((at) => at !== null)), ...entries]
  const shareOfLoopByKey = countByKey(loop)
  const gapOf = (kind: SpacingKey | undefined) =>
    Math.floor(entries.length / (shareByKey.get(kind) ?? 0))
  const loopGapOf = (kind: SpacingKey | undefined) =>
    isLoopedBackTo(kind)
      ? Math.floor(loop.length / (shareOfLoopByKey.get(kind) ?? 0))
      : gapOf(kind)
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

  let loopsBackToAt = loops ? (opened.find((at) => at !== null) ?? null) : null
  const isLoopedBackTo = (kind: SpacingKey | undefined) =>
    loopsBackToAt !== null && keyAt(loopsBackToAt) === kind

  const roundsSince = (lastRow: number | undefined) =>
    lastRow === undefined
      ? Number.POSITIVE_INFINITY
      : opened.length + dealt.length - lastRow
  const rowsOpenTo = (kind: SpacingKey | undefined) =>
    isLoopedBackTo(kind) ? left.length - loopGapOf(kind) + 1 : left.length
  const roomLeftFor = (kind: SpacingKey | undefined) =>
    rowsOpenTo(kind) - (((owedByKey.get(kind) ?? 0) - 1) * gapOf(kind) + 1)
  const waitOf = (kind: SpacingKey | undefined) =>
    roundsSince(lastRowOfKey.get(kind)) -
    (roomLeftFor(kind) > 0 ? gapOf(kind) : loopGapOf(kind))
  const waitCountedFromTheStartOf = (kind: SpacingKey | undefined) =>
    lastRowOfKey.has(kind)
      ? waitOf(kind)
      : opened.length + dealt.length + 1 - gapOf(kind)
  const tightestOf = (kinds: readonly (SpacingKey | undefined)[]) => {
    const tightest = Math.min(...kinds.map(roomLeftFor))
    const tight = kinds.filter((kind) => roomLeftFor(kind) === tightest)
    const longestWait = Math.max(...tight.map(waitCountedFromTheStartOf))

    return tight.filter(
      (kind) => waitCountedFromTheStartOf(kind) === longestWait
    )
  }
  const restOf = (kind: SpacingKey | undefined) =>
    roundsSince(lastRowOfKey.get(kind)) / gapOf(kind)
  const nearestRestedOf = (kinds: readonly (SpacingKey | undefined)[]) => {
    const nearest = Math.max(...kinds.map(restOf))

    return kinds.filter((kind) => restOf(kind) === nearest)
  }

  const previousKey = () => keyAt(dealt.at(-1) ?? opened.at(-1) ?? null)
  const waitingKeys = () => [...new Set(left.map(keyAt))]
  const restedOf = (kinds: readonly (SpacingKey | undefined)[]) =>
    kinds.filter((kind) => waitOf(kind) >= 0)
  const othersThanPrevious = () =>
    waitingKeys().filter((kind) => kind !== previousKey())

  const variantDrawnOf = (game: SpacingKey | undefined) => {
    const variants = left.filter((at) => keyAt(at) === game)
    const entryRest = (at: number) => roundsSince(lastRowOfEntry.get(at))
    const longestAgo = Math.max(...variants.map(entryRest))

    return pickOne({
      candidates: variants.filter((at) => entryRest(at) === longestAgo),
      random
    })
  }

  const play = (drawn: number) => {
    const game = keyAt(drawn)
    const leftAt = left.indexOf(drawn)
    const keyRowBefore = lastRowOfKey.get(game)
    const entryRowBefore = lastRowOfEntry.get(drawn)
    const loopsBackToBefore = loopsBackToAt

    markPlayed({ at: drawn, row: opened.length + dealt.length })

    if (loops && loopsBackToAt === null) {
      loopsBackToAt = drawn
    }

    dealt.push(drawn)
    left.splice(leftAt, 1)
    owedByKey.set(game, (owedByKey.get(game) ?? 0) - 1)

    return () => {
      owedByKey.set(game, (owedByKey.get(game) ?? 0) + 1)
      left.splice(leftAt, 0, drawn)
      dealt.pop()
      loopsBackToAt = loopsBackToBefore
      restoreRow({ key: game, map: lastRowOfKey, row: keyRowBefore })
      restoreRow({ key: drawn, map: lastRowOfEntry, row: entryRowBefore })
    }
  }

  const canStillBeSpaced = () =>
    isEveryRowFillable({
      owing: waitingKeys().map((kind) => {
        const gap = gapOf(kind)

        return {
          firstRow: Math.max(0, gap - roundsSince(lastRowOfKey.get(kind))),
          gap,
          lastFirstRow: roomLeftFor(kind),
          owed: owedByKey.get(kind) ?? 0
        }
      }),
      rowsLeft: left.length
    })

  let triesLeft = SEARCH_TRIES_PER_ENTRY * entries.length

  const isSpacedToTheEnd = (): boolean => {
    if (left.length === 0) {
      return true
    }

    if (triesLeft <= 0 || !canStillBeSpaced()) {
      return false
    }

    triesLeft -= 1

    const untried = restedOf(othersThanPrevious())

    while (untried.length > 0) {
      const game = pickOne({ candidates: tightestOf(untried), random })
      const drawn = variantDrawnOf(game)

      untried.splice(untried.indexOf(game), 1)

      if (drawn !== undefined) {
        const undo = play(drawn)

        if (isSpacedToTheEnd()) {
          return true
        }

        undo()
      }
    }

    return false
  }

  const dealtRowByRow = () => {
    const takeBacks: (() => void)[] = []
    let isEveryRowRested = true

    while (left.length > 0) {
      const others = othersThanPrevious()
      const rested = restedOf(others)
      const drawn = variantDrawnOf(
        pickOne({
          candidates:
            rested.length > 0
              ? tightestOf(rested)
              : nearestRestedOf(others.length > 0 ? others : waitingKeys()),
          random
        })
      )

      if (drawn === undefined) {
        break
      }

      isEveryRowRested &&= rested.length > 0
      takeBacks.push(play(drawn))
    }

    return {
      isEveryRowRested,
      undo: () => {
        for (const takeBack of takeBacks.toReversed()) {
          takeBack()
        }
      }
    }
  }

  const rowByRow = dealtRowByRow()

  if (rowByRow.isEveryRowRested) {
    return dealt
  }

  const nearestFirst = [...dealt]

  rowByRow.undo()

  return isSpacedToTheEnd() ? dealt : nearestFirst
}

/**
 * How many rows per entry the dealer may try looking for an order that spaces
 * every game, before the row-by-row deal stands: a line-up with no such order would
 * otherwise try every order there is. Eight keeps a sixty-entry line-up with
 * none under ten milliseconds a deal.
 */
const SEARCH_TRIES_PER_ENTRY = 8

const restoreRow = <TKey>({
  key,
  map,
  row
}: {
  key: TKey
  map: Map<TKey, number>
  row: number | undefined
}) => {
  if (row === undefined) {
    map.delete(key)
  } else {
    map.set(key, row)
  }
}

type Owing = {
  /** The first row, counted from the next, its gap lets it play. */
  firstRow: number
  gap: number
  /** The last row, counted from the next, it can play and still fit what it owes after. */
  lastFirstRow: number
  owed: number
}

/**
 * Whether the rows left can still be dealt with every gap kept: each game can
 * make its last row at all, and over every stretch from the next row there are
 * enough games able to play to fill it, and no more rounds owed in it than it
 * holds.
 */
const isEveryRowFillable = ({
  owing,
  rowsLeft
}: {
  owing: readonly Owing[]
  rowsLeft: number
}): boolean => {
  if (owing.some(({ firstRow, lastFirstRow }) => lastFirstRow < firstRow)) {
    return false
  }

  for (let rows = 1; rows <= rowsLeft; rows++) {
    let fittable = 0
    let due = 0

    for (const { firstRow, gap, lastFirstRow, owed } of owing) {
      if (firstRow < rows) {
        fittable += Math.min(owed, Math.ceil((rows - firstRow) / gap))
      }

      if (lastFirstRow < rows) {
        due += Math.min(owed, Math.floor((rows - 1 - lastFirstRow) / gap) + 1)
      }
    }

    if (fittable < rows || due > rows) {
      return false
    }
  }

  return true
}

const pickOne = <T>({
  candidates,
  random
}: {
  candidates: readonly T[]
  random: () => number
}): T | undefined => candidates[Math.floor(random() * candidates.length)]
