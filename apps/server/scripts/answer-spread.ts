import {
  type ContentTier,
  contentTiers
} from '@melee/core/round/difficulty-draw'

/** The fewest answers a Wikidata theme pools: a round on nine deals every one. */
export const LEAST_POOLED_ANSWERS = 9

/**
 * The most. A list deeper than this is cut, never sampled: sampling drops
 * answers a table says first, and the twenty-fourth best-known American state
 * or Oscar-winning actor is already one a table finds last.
 */
export const MOST_POOLED_ANSWERS = 24

/**
 * How far down a theme's list a table still names an answer, as a share of
 * the views of a typical answer among its nine best known. Measured within the
 * theme, because views cannot compare a laureate with an album: a quarter
 * reaches Gerald Ford among the American presidents and *Munich* among
 * Spielberg's films, and stops before Chester Arthur and *1941*.
 */
export const DEPTH_SHARE = 1 / 4

export type SpreadAnswer<TAnswer> = { answer: TAnswer; tier: ContentTier }

const medianOf = (values: readonly number[]): number =>
  values.toSorted((left, right) => left - right)[
    Math.floor(values.length / 2)
  ] ?? 0

/**
 * A theme's pool from its answers ranked most read first: every answer down
 * to the depth a table still reaches, at least nine and at most twenty-four,
 * tiered by thirds of that depth. Keeping the nine most read gave an easy
 * theme no hard cell — the nine best-known presidents are all obvious — so
 * the rare third comes from the bottom of what a table can name, not from the
 * bottom of the nine.
 */
export const spreadAnswers = <TAnswer>({
  ranked,
  viewsOf
}: {
  /** The answers, most read first. */
  ranked: readonly TAnswer[]
  viewsOf: (answer: TAnswer) => number
}): SpreadAnswer<TAnswer>[] => {
  const floor =
    DEPTH_SHARE * medianOf(ranked.slice(0, LEAST_POOLED_ANSWERS).map(viewsOf))
  const reached = ranked.filter((answer) => viewsOf(answer) >= floor).length
  const pool = ranked.slice(
    0,
    Math.min(Math.max(reached, LEAST_POOLED_ANSWERS), MOST_POOLED_ANSWERS)
  )

  return pool.map((answer, rank) => ({
    answer,
    tier:
      contentTiers[Math.floor((rank * contentTiers.length) / pool.length)] ??
      'hard'
  }))
}
