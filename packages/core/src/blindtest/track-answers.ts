import type { TrackSource } from '@melee/protocol/track'

/**
 * What a blind test's rounds ask for: a song's title and artist, a score's film
 * and composer, or either, round by round, from a catalogue mixing the two.
 */
export type TrackAnswers = 'films' | 'mixed' | 'songs'

/**
 * Read off the source rather than off a round, for the screens that describe
 * the game before any track is drawn. A playlist or a search asks for songs
 * even when it holds a score, because only the composer table names a film.
 */
export const trackAnswersOf = (source: TrackSource): TrackAnswers => {
  if (source.kind !== 'catalogue' || !source.hasFilmScores) {
    return 'songs'
  }

  return source.charts === null && source.decades === null ? 'films' : 'mixed'
}
