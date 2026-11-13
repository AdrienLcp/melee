/**
 * The keys a list has drawn, in the order each was first drawn, with the
 * keys `next` adds after them. A list rendered in it never asks React to
 * move an element it already placed: moving one takes it out of the page
 * and puts it back, which restarts every animation inside it.
 */
export const firstDrawnOrder = ({
  drawn,
  next
}: {
  drawn: readonly string[]
  next: readonly string[]
}): readonly string[] => {
  const added = next.filter((key) => !drawn.includes(key))

  return added.length === 0 ? drawn : [...drawn, ...added]
}
