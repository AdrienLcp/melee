const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Every key of `given` the parse dropped, by its path: what a protocol arm,
 * plain `z.object` all the way down, strips without a word. Read off the
 * parse's own output, so it holds for every arm of every union without a
 * strict copy of each.
 */
export const unknownKeysOf = ({
  given,
  kept,
  path = ''
}: {
  given: unknown
  kept: unknown
  path?: string
}): string[] => {
  if (Array.isArray(given) && Array.isArray(kept)) {
    return given.flatMap((item, index) =>
      unknownKeysOf({
        given: item,
        kept: kept[index],
        path: `${path}[${index}]`
      })
    )
  }

  if (!isPlainObject(given) || !isPlainObject(kept)) {
    return []
  }

  return Object.entries(given).flatMap(([key, value]) => {
    const at = path === '' ? key : `${path}.${key}`

    return key in kept
      ? unknownKeysOf({ given: value, kept: kept[key], path: at })
      : [at]
  })
}
