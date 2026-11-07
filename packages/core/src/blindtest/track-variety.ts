import type { TrackIdentity } from '@melee/protocol/track'

import {
  normalizeAnswer,
  withoutCatalogueNoise
} from '../round/answer-matching'

type Heard = Pick<TrackIdentity, 'artist' | 'film' | 'title'>

/**
 * How many rounds of one evening a single artist — or composer — may open. A
 * table that hears the same name a third time reads it as a thin catalogue,
 * which is what a curated one must never sound like.
 */
export const MOST_ROUNDS_PER_ARTIST = 2

/**
 * What one pool lends a single artist, before any round is drawn. It is the
 * evening's own cap: a pool holding a composer's whole top would fill a mix
 * with one name, and the decoys beside it with the same.
 */
const MOST_TRACKS_PER_ARTIST_IN_A_POOL = MOST_ROUNDS_PER_ARTIST

/**
 * What an evening of curated catalogue has already heard. A track id is not
 * enough: Deezer files the same score cue, or the same song remastered, under
 * as many ids as it has releases, and *The Last of Us* came back round after
 * round on a different one each time.
 */
export type TrackHistory = {
  /** How many rounds each artist has opened, keyed by `artistOf`. */
  artists: ReadonlyMap<string, number>
  /** Every work already offered as a decoy, keyed by `workOf`, reached for last. */
  decoyWorks: ReadonlySet<string>
  /** Every work a round has opened on, keyed by `workOf`. */
  works: ReadonlySet<string>
}

export const NOTHING_HEARD: TrackHistory = {
  artists: new Map(),
  decoyWorks: new Set(),
  works: new Set()
}

const artistOf = (track: Heard): string => normalizeAnswer(track.artist)

/**
 * The thing a round asks the table to name: a score cue's film, or a song as
 * its artist recorded it, whatever edit or remaster the catalogue filed it as.
 */
export const workOf = (track: Heard): string =>
  track.film === null
    ? `song:${normalizeAnswer(withoutCatalogueNoise(track.title))}:${artistOf(track)}`
    : `film:${normalizeAnswer(track.film)}`

/** Whether a round may still open on `track` this evening. */
export const isUnheard = ({
  history,
  track
}: {
  history: TrackHistory
  track: Heard
}): boolean =>
  !history.works.has(workOf(track)) &&
  (history.artists.get(artistOf(track)) ?? 0) < MOST_ROUNDS_PER_ARTIST

export const heardOnce = ({
  history,
  track
}: {
  history: TrackHistory
  track: Heard
}): TrackHistory => {
  const artist = artistOf(track)

  return {
    ...history,
    artists: new Map(history.artists).set(
      artist,
      (history.artists.get(artist) ?? 0) + 1
    ),
    works: new Set(history.works).add(workOf(track))
  }
}

export const offeredAsDecoys = ({
  decoys,
  history
}: {
  decoys: readonly Heard[]
  history: TrackHistory
}): TrackHistory => ({
  ...history,
  decoyWorks: new Set([...history.decoyWorks, ...decoys.map(workOf)])
})

/**
 * The tracks in the order given, keeping the first of each work and the first
 * `MOST_TRACKS_PER_ARTIST_IN_A_POOL` of each artist. A composer's top and a
 * chart both lead with what is best known, which is what a round should open on.
 */
export const variedPool = <TTrack extends Heard>(
  tracks: readonly TTrack[]
): TTrack[] => {
  const works = new Set<string>()
  const perArtist = new Map<string, number>()

  return tracks.filter((track) => {
    const work = workOf(track)
    const artist = artistOf(track)
    const lent = perArtist.get(artist) ?? 0

    if (works.has(work) || lent >= MOST_TRACKS_PER_ARTIST_IN_A_POOL) {
      return false
    }

    works.add(work)
    perArtist.set(artist, lent + 1)

    return true
  })
}
