import { pickRandom } from '../helpers/random'

/** One line nobody in the room has been dealt; `null` once nothing is left. */
export const dealLine = <TLine extends { id: string }>({
  lines,
  playedIds
}: {
  lines: readonly TLine[]
  playedIds: ReadonlySet<string>
}): TLine | null => pickRandom(lines.filter(({ id }) => !playedIds.has(id)))
