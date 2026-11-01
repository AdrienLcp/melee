import type { PlayerId } from '@melee/protocol/identifiers'

const graphemesOf = (nickname: string): string[] =>
  [...new Intl.Segmenter().segment(nickname.trim())].map(
    ({ segment }) => segment
  )

const initialOf = (graphemes: readonly string[]): string =>
  (graphemes[0] ?? '?').toLocaleUpperCase()

const twoLettersOf = (graphemes: readonly string[]): string =>
  `${initialOf(graphemes)}${(graphemes[1] ?? '').toLocaleLowerCase()}`

/**
 * What each seat's pawn carries on its head, so two seats sharing a colour
 * still stand apart on a track with no names: the initial, then its first two
 * letters where another pawn of that colour has the same initial, then the
 * initial and a count where those match too. Marks are compared across one
 * colour only — a red *A* and a blue *A* are already two pawns.
 */
export const pawnMarksOf = (
  seats: readonly { colour: number; id: PlayerId; nickname: string }[]
): ReadonlyMap<PlayerId, string> => {
  const candidates = seats.map(({ colour, id, nickname }) => {
    const graphemes = graphemesOf(nickname)

    return {
      colour,
      id,
      initial: initialOf(graphemes),
      twoLetters: twoLettersOf(graphemes)
    }
  })

  const marks = new Map<PlayerId, string>()
  const counted = new Map<string, number>()

  for (const candidate of candidates) {
    const sameColour = candidates.filter(
      (other) => other.colour === candidate.colour && other.id !== candidate.id
    )

    if (!sameColour.some((other) => other.initial === candidate.initial)) {
      marks.set(candidate.id, candidate.initial)
      continue
    }

    if (
      !sameColour.some((other) => other.twoLetters === candidate.twoLetters)
    ) {
      marks.set(candidate.id, candidate.twoLetters)
      continue
    }

    const key = `${candidate.colour}:${candidate.twoLetters}`
    const count = (counted.get(key) ?? 0) + 1

    counted.set(key, count)
    marks.set(candidate.id, `${candidate.initial}${count}`)
  }

  return marks
}
