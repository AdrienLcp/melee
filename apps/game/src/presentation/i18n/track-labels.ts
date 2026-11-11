import {
  type CatalogueSource,
  GENRE_IDS,
  type GenreId,
  type TrackDecade,
  trackDecades
} from '@melee/protocol/track'

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

/** The catalogue's strands, in the order the picker offers them. */
export const CATALOGUE_STRANDS = ['charts', 'decades', 'filmScores'] as const

export type CatalogueStrand = (typeof CATALOGUE_STRANDS)[number]

export const STRAND_LABEL_KEYS = {
  charts: 'blindtest.source.chart',
  decades: 'blindtest.source.decades',
  filmScores: 'blindtest.source.film'
} as const satisfies Record<CatalogueStrand, `blindtest.source.${string}`>

const isDrawn = ({
  source,
  strand
}: {
  source: CatalogueSource
  strand: CatalogueStrand
}): boolean => {
  switch (strand) {
    case 'charts':
      return source.charts !== null
    case 'decades':
      return source.decades !== null
    case 'filmScores':
      return source.hasFilmScores
  }
}

/** The strands a catalogue draws from, in the picker's order. */
export const strandsOf = (source: CatalogueSource): CatalogueStrand[] =>
  CATALOGUE_STRANDS.filter((strand) => isDrawn({ source, strand }))
