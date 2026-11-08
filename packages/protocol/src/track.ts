import { z } from 'zod'

import { type Difficulty, difficultySchema } from './difficulty'

/**
 * What the players are trying to guess. It exists on the wire in exactly two
 * situations: inside a host-only message, and inside `round.revealed` once the
 * round is over. A player socket that receives it earlier has been handed the
 * answer — see `host-message.ts` for how the type system prevents that.
 */
export const trackIdentitySchema = z.object({
  artist: z.string(),
  coverUrl: z.url().nullable(),
  /**
   * The film or the series the track was written for, and `null` on every
   * source but the one that goes looking for composers.
   *
   * Where it is set it is the half the round asks for **in the title's place**,
   * and the reveal shows all three. A score cue's own title is `Cornfield
   * Chase`, `Day One`, `Concerning Hobbits` — the one thing at the table nobody
   * can produce, where the film is what the room shouts.
   */
  film: z.string().nullable(),
  id: z.string(),
  title: z.string()
})

/**
 * The identity plus the audio the host browser plays. Deezer signs preview URLs
 * with an expiry (~24h), so this is resolved when the round starts, never when
 * the track pool is built — a pool assembled at lobby time and played an hour
 * later would 403 on a stale signature.
 */
export const hostTrackSchema = trackIdentitySchema.extend({
  previewUrl: z.url()
})

export const trackDecades = [
  '1970s',
  '1980s',
  '1990s',
  '2000s',
  '2010s',
  '2020s'
] as const

/**
 * The generations a table is made of. Deezer cannot filter by year — its
 * advanced search takes an artist, an album, a label and a duration, and no
 * date — so a decade resolves to curated playlists, and which ones is a
 * catalogue fact only `deezer-client.ts` may hold. Named the way the room says
 * it for the same reason the track difficulty is: a catalogue that *could* filter
 * by year would keep these six words.
 */
export const trackDecadeSchema = z.enum(trackDecades)

/**
 * The catalogues this product curates, drawn from side by side: Deezer's genre
 * charts, its editors' decade playlists and a table of film composers. Each
 * strand is in or out, and a room opens on all three, because a host who has
 * not chosen yet has not narrowed anything.
 *
 * At least one strand is in: a catalogue of nothing is not a choice a host can
 * make, and the picker refuses to untick the last.
 */
const catalogueSourceSchema = z
  .object({
    /**
     * Deezer genre charts, merged, by the ids Deezer publishes at `/genre`:
     * each is a hundred tracks that are charting, the cheapest definition of
     * "a song people know". `null` leaves the charts out; **empty is every
     * genre**, the all-genres chart — a host who wants everything is the
     * default state, and lighting twelve stamps to say so would be the wrong
     * way round.
     */
    charts: z.array(z.number().int().nonnegative()).nullable(),
    /** `null` leaves the decades out; **empty is every decade**, as for the charts. */
    decades: z.array(trackDecadeSchema).nullable(),
    /**
     * Film and series music, drawn from a table of **composers** and never
     * from the soundtrack charts. A song used in a film is not a film's score:
     * *Shallow* or *Eye of the Tiger* under this name would be a label the
     * room catches out on its second round, and they are already playable
     * under the other strands. Which composers is a catalogue fact only
     * `deezer-client.ts` may hold, and a composer who scores a series does the
     * same job under the same name, so series ride along with no control of
     * their own.
     */
    hasFilmScores: z.boolean(),
    kind: z.literal('catalogue')
  })
  .refine(
    ({ charts, decades, hasFilmScores }) =>
      charts !== null || decades !== null || hasFilmScores,
    { message: 'A catalogue draws from at least one strand' }
  )

const NO_STRAND = {
  charts: null,
  decades: null,
  hasFilmScores: false,
  kind: 'catalogue'
} as const

/**
 * A catalogue on the strands named and no other: `{ hasFilmScores: true }` is
 * film scores alone, `{ decades: ['1980s'] }` the eighties alone.
 */
export const catalogueOf = (
  strands: Partial<Omit<CatalogueSource, 'kind'>>
): CatalogueSource => ({ ...NO_STRAND, ...strands })

/** Every chart, every decade and the film scores: what a room opens on. */
export const EVERY_STRAND: CatalogueSource = catalogueOf({
  charts: [],
  decades: [],
  hasFilmScores: true
})

/**
 * The four arms the catalogue replaced (protocol 66), read as the strands they
 * drew: a host's setup, a saved line-up and an exported file outlive a deploy,
 * and a blind test stored on `all` is the same evening on all three strands.
 */
const asCatalogue = (stored: unknown): unknown => {
  if (typeof stored !== 'object' || stored === null || !('kind' in stored)) {
    return stored
  }

  switch (stored.kind) {
    case 'all':
      return EVERY_STRAND
    case 'chart':
      return {
        ...NO_STRAND,
        charts: 'genreIds' in stored ? stored.genreIds : []
      }
    case 'decade':
      return {
        ...NO_STRAND,
        decades: 'decades' in stored ? stored.decades : []
      }
    case 'film':
      return { ...NO_STRAND, hasFilmScores: true }
    default:
      return stored
  }
}

/**
 * Where a room's tracks come from. Every variant resolves, server-side, to a
 * list of Deezer track ids; the browser never talks to Deezer directly, because
 * `api.deezer.com` answers without `Access-Control-Allow-Origin`.
 *
 * A playlist or a query is a list somebody named, so it stays an arm of its
 * own and is never mixed with the catalogue.
 */
export const trackSourceSchema = z.preprocess(
  asCatalogue,
  z.discriminatedUnion('kind', [
    catalogueSourceSchema,
    z.object({ kind: z.literal('playlist'), playlistId: z.string().min(1) }),
    z.object({
      kind: z.literal('search'),
      query: z.string().trim().min(1).max(120)
    })
  ])
)

const DIFFICULTY_OF_RETIRED_TRACK_LEVEL: Readonly<Record<string, Difficulty>> =
  { obscure: 'hard', wellKnown: 'easy' }

const asDifficulty = (value: unknown): unknown =>
  typeof value === 'string'
    ? (DIFFICULTY_OF_RETIRED_TRACK_LEVEL[value] ?? value)
    : value

/**
 * How obscure a track may be and still be worth guessing — a popularity
 * floor, not a tier draw, and only `deezer-client.ts` may know what number each
 * level costs. A second catalogue with a different scale keeps these words.
 *
 * Still reads `wellKnown` and `obscure`, the blind test's own words before
 * every game shared one vocabulary, from a host's stored setup and from a tab
 * loaded before the change.
 */
export const trackDifficultySchema = z.preprocess(
  asDifficulty,
  difficultySchema
)

export type TrackIdentity = z.infer<typeof trackIdentitySchema>
export type HostTrack = z.infer<typeof hostTrackSchema>
export type TrackDecade = z.infer<typeof trackDecadeSchema>
export type TrackSource = z.infer<typeof trackSourceSchema>
export type CatalogueSource = Extract<TrackSource, { kind: 'catalogue' }>
