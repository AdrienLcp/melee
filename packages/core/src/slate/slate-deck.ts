/**
 * Everything wrong with a slate deck against the sheet its entry opens, each
 * problem led by its path: a deck with no key at all, and a key past
 * `itemCount`, which would wait on an item nobody added. Empty when the deck
 * holds.
 */
export const slateDeckProblems = ({
  itemCount,
  items,
  path
}: {
  itemCount: number
  items: readonly (string | null)[]
  path: string
}): string[] => {
  const lastKeyAt = items.findLastIndex((key) => key !== null)

  if (lastKeyAt === -1) {
    return [`${path}.items: the deck holds no key.`]
  }

  return lastKeyAt < itemCount
    ? []
    : [
        `${path}.items[${lastKeyAt}]: the entry's sheet opens with ${itemCount} items — raise its itemCount to ${lastKeyAt + 1} or drop the keys past it.`
      ]
}

/** The items of a slate deck that hold a key, which are what it counts and deals. */
export const keyedItemIndexes = (items: readonly (string | null)[]): number[] =>
  items.flatMap((key, index) => (key === null ? [] : [index]))
