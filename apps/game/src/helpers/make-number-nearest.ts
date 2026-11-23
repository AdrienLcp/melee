import { MISS_THAT_PAYS_NOTHING } from '@melee/core/makenumber/calculation-pay'

/**
 * How near a seat stands, which colours its row: on the target, close
 * enough to be paid, past what pays anything, or holding no number yet.
 */
export type NearestBand = 'close' | 'exact' | 'far' | 'owed'

export type NearestSeat = {
  id: string
  /** The seat's place at the table, which settles a tie nobody saw arrive. */
  seat: number
  value: number | null
}

/** When each seat's current value was first drawn, counted up from one draw to the next. */
export type Arrivals = ReadonlyMap<string, { at: number; value: number }>

export type NearestRow<Seat extends NearestSeat> = Seat & {
  band: NearestBand
  distance: number | null
  /** The row's place in the list, nearest first, every waiting seat last. */
  rank: number
}

export const bandOf = (distance: number | null): NearestBand => {
  if (distance === null) {
    return 'owed'
  }

  if (distance === 0) {
    return 'exact'
  }

  return distance < MISS_THAT_PAYS_NOTHING ? 'close' : 'far'
}

/**
 * The arrivals carried over to this draw: a seat keeps its stamp while its
 * value holds, and a seat whose value is new or changed takes the next one.
 * Hands back the same map when nothing moved, so it can be held in state.
 */
export const arrivalsOf = ({
  arrivals,
  seats
}: {
  arrivals: Arrivals
  seats: readonly NearestSeat[]
}): Arrivals => {
  let next = Math.max(0, ...[...arrivals.values()].map(({ at }) => at)) + 1
  let isChanged = false
  const kept = new Map<string, { at: number; value: number }>()

  for (const { id, value } of seats) {
    if (value === null) {
      continue
    }

    const held = arrivals.get(id)

    if (held?.value === value) {
      kept.set(id, held)
      continue
    }

    kept.set(id, { at: next, value })
    next += 1
    isChanged = true
  }

  return isChanged || kept.size !== arrivals.size ? kept : arrivals
}

/**
 * Every seat ranked by how far its value stands from the target, the exact
 * ones first: a tie goes to whoever reached that value first on this screen,
 * then to the table's order, and the seats holding no number wait at the end
 * in the table's order.
 */
export const nearestFirst = <Seat extends NearestSeat>({
  arrivals,
  seats,
  target
}: {
  arrivals: Arrivals
  seats: readonly Seat[]
  target: number
}): NearestRow<Seat>[] =>
  seats
    .map((seat) => ({
      arrivedAt: arrivals.get(seat.id)?.at ?? Number.POSITIVE_INFINITY,
      distance: seat.value === null ? null : Math.abs(seat.value - target),
      seat
    }))
    .toSorted(
      (one, other) =>
        (one.distance ?? Number.POSITIVE_INFINITY) -
          (other.distance ?? Number.POSITIVE_INFINITY) ||
        (one.distance === null ? 0 : one.arrivedAt - other.arrivedAt) ||
        one.seat.seat - other.seat.seat
    )
    .map(({ distance, seat }, rank) => ({
      ...seat,
      band: bandOf(distance),
      distance,
      rank
    }))

/** A row's type against its height: what the room reads from across it. */
const FONT_OF_ROW_HEIGHT = 0.3
/**
 * A row's width in its own font size that keeps a name readable: the pawn,
 * a three-digit figure, the gap's pill, the padding, and a dozen letters.
 */
const ROW_WIDTH_EM = 20
/** A name's line height, `typography.title`'s, against the row's font size. */
const NAME_LINE_EM = 1.05
/** The share of a row's height a name may wrap into. */
const NAME_ROOM_OF_ROW = 0.85
const MOST_NAME_LINES = 2
const MOST_COLUMNS = 4

export type NearestLayout = {
  columns: number
  fontPx: number
  /** How many lines of a name its row holds. */
  nameLines: number
  rows: number
}

/**
 * How the rows fill a box: in as many columns — up to four, filled top to
 * bottom — as give them the largest type, each row as tall as its share of
 * the height up to `rowCapPx`, its type a share of that height or of its
 * column's width, whichever runs out first, between the floor and the cap.
 * Fewer columns win a tie.
 */
export const nearestLayoutOf = ({
  columnGap,
  count,
  fontCapPx,
  fontFloorPx,
  height,
  rowCapPx,
  rowGap,
  width
}: {
  columnGap: number
  count: number
  fontCapPx: number
  fontFloorPx: number
  height: number
  rowCapPx: number
  rowGap: number
  width: number
}): NearestLayout => {
  const seats = Math.max(1, count)
  const fits = Array.from(
    { length: Math.min(MOST_COLUMNS, seats) },
    (_, at) => at + 1
  ).map((columns) => {
    const rows = Math.ceil(seats / columns)
    const rowHeight = Math.min(
      rowCapPx,
      Math.max(0, (height - (rows - 1) * rowGap) / rows)
    )
    const columnWidth = Math.max(
      0,
      (width - (columns - 1) * columnGap) / columns
    )
    const fontPx = Math.min(
      rowHeight * FONT_OF_ROW_HEIGHT,
      columnWidth / ROW_WIDTH_EM
    )

    return { columns, fontPx, rowHeight, rows }
  })
  const best = fits.reduce((chosen, fit) =>
    fit.fontPx > chosen.fontPx ? fit : chosen
  )
  const fontPx = Math.min(fontCapPx, Math.max(fontFloorPx, best.fontPx))

  return {
    columns: best.columns,
    fontPx,
    nameLines: Math.min(
      MOST_NAME_LINES,
      Math.max(
        1,
        Math.floor(
          (best.rowHeight * NAME_ROOM_OF_ROW) / (fontPx * NAME_LINE_EM)
        )
      )
    ),
    rows: best.rows
  }
}
