import { Result } from '@adrienlcp/result'

import type { BlindtestSettings, GameSettings } from '@melee/protocol/game'
import type {
  HostTrack,
  TrackIdentity,
  TrackSource
} from '@melee/protocol/track'

import {
  heardOnce,
  isUnheard,
  offeredAsDecoys,
  workOf
} from '@melee/core/blindtest/track-variety'
import { pickRandom, shuffled } from '@melee/core/helpers/random'

import type { Room } from '@/domain/room/room'
import {
  fetchHostTrack,
  fetchTracksFor
} from '@/infrastructure/music/deezer-client'
import {
  type MusicSourceFailure,
  type MusicSourceFault,
  NOTHING_PLAYABLE
} from '@/infrastructure/music/music-source'

/**
 * A drawn candidate can still turn out to have no preview in this country, and
 * the answer to that is another draw rather than a dead round. Bounded so a
 * source that is entirely unplayable fails instead of walking its whole pool.
 */
const MAX_DRAW_ATTEMPTS = 5

export const drawPlayableTrack = async ({
  room,
  settings
}: {
  room: Room
  settings: BlindtestSettings
}): Promise<
  Result<
    { faults: readonly MusicSourceFault[]; track: HostTrack },
    MusicSourceFailure
  >
> => {
  const faults: MusicSourceFault[] = []

  for (let attempt = 0; attempt < MAX_DRAW_ATTEMPTS; attempt++) {
    room.trackPool = room.trackPool.filter((track) =>
      isFresh({ room, settings, track })
    )

    const refilled = await refillWhenEmpty({ room, settings })

    if (refilled.status === 'failure') {
      return Result.failure({
        ...refilled.error,
        faults: [...faults, ...refilled.error.faults]
      })
    }

    faults.push(...refilled.data)

    const candidate = pickRandom(room.trackPool)

    if (candidate === null) {
      return Result.failure({ ...NOTHING_PLAYABLE, faults })
    }

    room.trackPool.splice(room.trackPool.indexOf(candidate), 1)

    room.playedContentIds.add(candidate.id)

    const resolved = await fetchHostTrack(candidate.id)

    if (resolved.status === 'success') {
      room.trackHistory = heardOnce({
        history: room.trackHistory,
        track: candidate
      })

      // The film is a fact about how the track was *found*, not about the
      // track: `/track/{id}` is asked for the preview URL and knows nothing of
      // the composer table the pool was drawn from.
      return Result.success({
        faults,
        track: { ...resolved.data, film: candidate.film }
      })
    }

    faults.push(...resolved.error.faults)
  }

  return Result.failure({ ...NOTHING_PLAYABLE, faults })
}

/**
 * What a round whose clip would not load opens on instead. A preview URL is
 * signed and expires, so the same track is asked for first; a URL that comes
 * back unchanged is the one that already failed, and another track is drawn.
 */
export const replacementTrackFor = async ({
  room,
  settings,
  track
}: {
  room: Room
  settings: BlindtestSettings
  track: HostTrack
}): Promise<
  Result<
    { faults: readonly MusicSourceFault[]; track: HostTrack },
    MusicSourceFailure
  >
> => {
  const refreshed = await fetchHostTrack(track.id)

  if (
    refreshed.status === 'success' &&
    refreshed.data.previewUrl !== track.previewUrl
  ) {
    return Result.success({
      faults: [],
      track: { ...refreshed.data, film: track.film }
    })
  }

  const drawn = await drawPlayableTrack({ room, settings })

  if (refreshed.status === 'success') {
    return drawn
  }

  return drawn.status === 'success'
    ? Result.success({
        ...drawn.data,
        faults: [...refreshed.error.faults, ...drawn.data.faults]
      })
    : Result.failure({
        ...drawn.error,
        faults: [...refreshed.error.faults, ...drawn.error.faults]
      })
}

/**
 * A pool left over from a source the host has just replaced would keep serving
 * the old catalogue for the rest of the game, so it is dropped — but only when
 * the source really changed, since refilling costs a request.
 *
 * A room that left the blind test altogether has no use for the pool either,
 * and one that comes back to it should not inherit the tracks a source chosen
 * two games ago put there.
 */
export const discardPoolIfStale = ({
  previousGame,
  room
}: {
  previousGame: GameSettings | null
  room: Room
}): void => {
  const game = room.settings.game

  const isStale =
    game?.kind !== 'blindtest' ||
    previousGame?.kind !== 'blindtest' ||
    !isSameSource(previousGame.source, game.source)

  if (isStale) {
    room.trackPool = []
  }
}

const isSameSource = (left: TrackSource, right: TrackSource): boolean => {
  switch (left.kind) {
    case 'catalogue':
      return (
        right.kind === 'catalogue' &&
        left.hasFilmScores === right.hasFilmScores &&
        holdsTheSameStrand({ left: left.charts, right: right.charts }) &&
        holdsTheSameStrand({ left: left.decades, right: right.decades })
      )
    case 'playlist':
      return right.kind === 'playlist' && left.playlistId === right.playlistId
    case 'search':
      return right.kind === 'search' && left.query === right.query
  }
}

const holdsTheSameStrand = <TItem>({
  left,
  right
}: {
  left: readonly TItem[] | null
  right: readonly TItem[] | null
}): boolean =>
  left === null || right === null ? left === right : holdsTheSame(left, right)

/**
 * Order is not part of the question: a strip hands back what is selected in the
 * order it was clicked, and two hosts who picked rock and then pop are asking
 * for what one who picked pop and then rock is asking for.
 */
const holdsTheSame = <TItem>(
  left: readonly TItem[],
  right: readonly TItem[]
): boolean => {
  const held = new Set(left)
  const wanted = new Set(right)

  return (
    held.size === wanted.size && [...wanted].every((item) => held.has(item))
  )
}

/**
 * How many pools a draw may fetch before it gives up on finding one round it
 * has not heard. A pool of the film scores is eight composers out of the
 * table, and late in an evening all eight may have opened their two rounds.
 */
const MAX_REFILL_ATTEMPTS = 3

const refillWhenEmpty = async ({
  room,
  settings
}: {
  room: Room
  settings: BlindtestSettings
}): Promise<Result<readonly MusicSourceFault[], MusicSourceFailure>> => {
  if (room.trackPool.length > 0) {
    return Result.success([])
  }

  const faults: MusicSourceFault[] = []

  for (let attempt = 0; attempt < MAX_REFILL_ATTEMPTS; attempt++) {
    const fetched = await fetchTracksFor({
      difficulty: settings.difficulty,
      source: settings.source
    })

    if (fetched.status === 'failure') {
      return Result.failure({
        ...fetched.error,
        faults: [...faults, ...fetched.error.faults]
      })
    }

    faults.push(...fetched.data.faults)

    const fresh = fetched.data.tracks.filter((track) =>
      isFresh({ room, settings, track })
    )

    if (fresh.length > 0) {
      room.trackPool = fresh

      return Result.success(faults)
    }
  }

  return Result.failure({ ...NOTHING_PLAYABLE, faults })
}

/**
 * Whether a round may still open on `track`: never one already played, and
 * from the curated catalogue never a work already heard nor an artist heard
 * twice. A host's own playlist or search is theirs to repeat an artist in.
 */
const isFresh = ({
  room,
  settings,
  track
}: {
  room: Room
  settings: BlindtestSettings
  track: TrackIdentity
}): boolean =>
  !room.playedContentIds.has(track.id) &&
  (settings.source.kind !== 'catalogue' ||
    isUnheard({ history: room.trackHistory, track }))

/** Four is the shape of the question: enough to be a guess, few enough to read. */
const CHOICES_PER_ROUND = 4

/**
 * The decoys come from the room's own pool, which is the genres the host chose.
 * Drawing them from anywhere else hands the answer over for free — three
 * seventies soul tracks beside one chart pop song is not a question, it is a
 * spot-the-odd-one-out.
 *
 * The pool is read rather than drained: a decoy is still an unplayed track, and
 * spending it here would burn the catalogue three times as fast. So the same
 * decoy could be offered every round, and a work the evening has not offered
 * yet goes first. None is the round's own work under another release, which
 * would be a second right answer.
 */
export const drawChoices = ({
  room,
  track
}: {
  room: Room
  track: HostTrack
}): { choices: TrackIdentity[]; correctIndex: number } => {
  const answer: TrackIdentity = {
    artist: track.artist,
    coverUrl: track.coverUrl,
    film: track.film,
    id: track.id,
    title: track.title
  }

  const answerWork = workOf(answer)
  const others = shuffled(
    room.trackPool.filter(
      (candidate) =>
        candidate.id !== track.id && workOf(candidate) !== answerWork
    )
  ).toSorted(
    (left, right) =>
      Number(room.trackHistory.decoyWorks.has(workOf(left))) -
      Number(room.trackHistory.decoyWorks.has(workOf(right)))
  )
  // A pool of every catalogue holds score cues beside singles, and one film
  // among three songs is the odd one out. A thin film half lends what it lacks
  // rather than dealing fewer than four.
  const decoys = readingApart([
    answer,
    ...others.filter((candidate) => isFilm(candidate) === isFilm(track)),
    ...others.filter((candidate) => isFilm(candidate) !== isFilm(track))
  ])
    .slice(1)
    .slice(0, CHOICES_PER_ROUND - 1)

  const choices = shuffled([answer, ...decoys])

  room.trackHistory = offeredAsDecoys({
    decoys,
    history: room.trackHistory
  })

  return {
    choices,
    correctIndex: choices.findIndex((choice) => choice.id === track.id)
  }
}

const isFilm = (track: TrackIdentity): boolean => track.film !== null

/**
 * A choice reads as what the round asks for, so two cues of *Interstellar* are
 * the same button twice — and a decoy that reads as the answer is a second
 * right one. The first of each reading is kept, the answer leading.
 */
const readingApart = (tracks: TrackIdentity[]): TrackIdentity[] => [
  ...new Map(
    tracks.map((track) => [
      JSON.stringify([track.film ?? track.title, track.artist]),
      track
    ])
  ).values()
]
