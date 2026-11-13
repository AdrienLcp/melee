/** What a calculation line under a name costs a row, in folded rows. */
const STEP_LINE_ROWS = 1.1
const SEARCH_STEPS = 24

export type RankingFold = {
  columns: 1 | 2
  /** How many rows, from the nearest, keep their calculation under the name. */
  fullCount: number
  /** Each row's height in pixels, in rank order. */
  heights: number[]
  /** A folded row's height, in pixels, which every size in a row is a share of. */
  rowPx: number
}

/** Whether rows of these heights, laid top to bottom, fill no more than `columns` columns of `height`. */
const packs = ({
  columns,
  height,
  heights
}: {
  columns: number
  height: number
  heights: readonly number[]
}): boolean => {
  let column = 1
  let used = 0

  for (const row of heights) {
    if (used + row > height + 0.5) {
      column += 1
      used = 0
    }

    used += row

    if (column > columns || used > height + 0.5) {
      return false
    }
  }

  return true
}

/**
 * How a ranking gives way in its box rather than scroll: every row keeps its
 * calculation while the height holds, then the furthest rows fold to one
 * line, then — where the box may — the list takes two columns, filled top to
 * bottom, and at the floor every row shares what is left.
 *
 * `stepLinesFor` says, for each row in rank order, how many lines its
 * calculation takes in a column of that many — 0 for a seat that sent none.
 */
export const rankingFold = ({
  canSplit,
  ceilingRowPx,
  count: rowCount,
  floorRowPx,
  height,
  stepLinesFor
}: {
  canSplit: boolean
  ceilingRowPx: number
  count: number
  floorRowPx: number
  height: number
  stepLinesFor: (columns: 1 | 2) => readonly number[]
}): RankingFold => {
  const count = Math.max(1, rowCount)
  const columnCounts: (1 | 2)[] = canSplit && count > 12 ? [1, 2] : [1]

  const laidOut = columnCounts.map((columns) => {
    const stepLines = stepLinesFor(columns)
    const heightsFor = ({
      fullCount,
      rowPx
    }: {
      fullCount: number
      rowPx: number
    }): number[] =>
      Array.from(
        { length: count },
        (_, rank) =>
          rowPx *
          (1 + (rank < fullCount ? (stepLines[rank] ?? 0) * STEP_LINE_ROWS : 0))
      )
    const largestRowPx = (fullCount: number): number => {
      let low = 0
      let high = ceilingRowPx

      for (let step = 0; step < SEARCH_STEPS; step += 1) {
        const middle = (low + high) / 2

        if (
          packs({
            columns,
            height,
            heights: heightsFor({ fullCount, rowPx: middle })
          })
        ) {
          low = middle
        } else {
          high = middle
        }
      }

      return low
    }
    const fullCount =
      Array.from({ length: count + 1 }, (_, at) => count - at).find(
        (full) => largestRowPx(full) >= floorRowPx
      ) ?? 0
    const rowPx = largestRowPx(fullCount)

    return {
      columns,
      fullCount,
      heights: heightsFor({ fullCount, rowPx }),
      rowPx
    }
  })

  // More calculations kept wins; then one column while its rows hold the
  // floor, since a column of half the width cuts names; then the larger rows.
  return laidOut.reduce((chosen, fold) => {
    if (fold.fullCount !== chosen.fullCount) {
      return fold.fullCount > chosen.fullCount ? fold : chosen
    }

    return chosen.rowPx >= floorRowPx || fold.rowPx <= chosen.rowPx
      ? chosen
      : fold
  })
}
