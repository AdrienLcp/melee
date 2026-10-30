import { type TrackDecade, trackDecades } from '@melee/protocol/track'

/**
 * Deezer's own genre ids, hand-picked down to the ones a party actually asks
 * for. Each is a hundred charting tracks, so the whole list is a few thousand
 * songs a room will recognise — see the rank floor in `deezer-client.ts`.
 *
 * Deezer's all-genres chart is id `0`, and it is deliberately not here: picking
 * nothing already means everything, and a stamp that says "all" beside the rest
 * is a second way to express the same state.
 *
 * Twelve, not eleven: the strip is a grid whose column count follows the width,
 * and twelve divides by two, three, four and six. Eleven left a dead cell
 * showing the strip's own ground at every width that is not a factor of it.
 */
export const GENRE_IDS = [
  132, 116, 152, 113, 165, 106, 52, 169, 464, 144, 197, 129
] as const

export type GenreId = (typeof GENRE_IDS)[number]

/**
 * The literal return type is load-bearing: adding an id above without adding
 * its label to both dictionaries stops compiling.
 */
export const genreLabelKey = (genreId: GenreId): `blindtest.genre.${GenreId}` =>
  `blindtest.genre.${genreId}`

export const asGenreId = (value: string | number): GenreId | undefined =>
  GENRE_IDS.find((id) => String(id) === String(value))

/**
 * The same literal-return trick as the genres: a decade added to the protocol
 * without a label in both dictionaries stops compiling.
 */
export const decadeLabelKey = (
  decade: TrackDecade
): `blindtest.decade.${TrackDecade}` => `blindtest.decade.${decade}`

export const asDecade = (value: string | number): TrackDecade | undefined =>
  trackDecades.find((decade) => decade === value)
