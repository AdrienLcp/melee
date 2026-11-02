/**
 * The fewest columns that deal `count` seats into a box `height` tall with no
 * row under `rowHeight`: every seat in view, each as wide as the box allows,
 * so a name gets the most of a line before it has to wrap.
 */
export const seatColumns = ({
  count,
  gap,
  height,
  rowHeight
}: {
  count: number
  gap: number
  height: number
  rowHeight: number
}): number => {
  const rows = Math.max(1, Math.floor((height + gap) / (rowHeight + gap)))

  return Math.max(1, Math.ceil(count / rows))
}

/**
 * How many lines of a name a seat's row holds once the rows are dealt: what
 * its height leaves after its padding, never under one and never over
 * `most`, so a long name wraps as far as the row allows before it is cut.
 */
export const seatNameLines = ({
  lineHeight,
  most,
  rowHeight
}: {
  lineHeight: number
  most: number
  rowHeight: number
}): number => Math.min(most, Math.max(1, Math.floor(rowHeight / lineHeight)))
