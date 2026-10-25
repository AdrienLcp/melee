const sameText = (line: { text: string }) =>
  line.text.trim().toLocaleLowerCase()

/**
 * The host's own lines with `imported` folded in from another machine: a line
 * already written here, case and edges aside, stays as it is, and the rest are
 * added after the ones already here, up to `max`.
 */
export const withOwnLinesImported = <Line extends { text: string }>({
  imported,
  lines,
  max
}: {
  imported: readonly Line[]
  lines: readonly Line[]
  /** The most lines a host keeps. */
  max: number
}): Line[] => {
  const written = new Set(lines.map(sameText))
  const added = imported.filter((line) => {
    const text = sameText(line)

    if (written.has(text)) {
      return false
    }

    written.add(text)

    return true
  })

  return [...lines, ...added].slice(0, max)
}
