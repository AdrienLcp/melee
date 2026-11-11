import { normalizeAnswer } from '../round/answer-matching'

/**
 * Everything wrong with a deck of lines, each problem led by its path: a line
 * given twice, which the evening would deal twice. Empty when the deck holds.
 */
export const lineDeckProblems = ({
  items,
  path
}: {
  items: readonly string[]
  path: string
}): string[] => {
  const keys = items.map(normalizeAnswer)

  return items.flatMap((line, index) =>
    keys.indexOf(keys[index] ?? '') < index
      ? [`${path}.items[${index}]: “${line}” is another line again.`]
      : []
  )
}
