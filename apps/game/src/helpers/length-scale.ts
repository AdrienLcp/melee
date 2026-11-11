/**
 * How much smaller a text longer than `lengthAtFullSize` is drawn so it covers
 * the area a text of that length would: its area grows with its length, so its
 * size shrinks by the square root. A shorter text keeps its full size, `1`.
 */
export const scaleForLength = ({
  length,
  lengthAtFullSize
}: {
  length: number
  lengthAtFullSize: number
}): number => Math.min(1, Math.sqrt(lengthAtFullSize / Math.max(length, 1)))
