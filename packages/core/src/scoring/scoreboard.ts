import type { PlayerId } from '@melee/protocol/identifiers'
import type { PublicPlayer } from '@melee/protocol/room'
import type { Award } from '@melee/protocol/scoring'

import { compareText } from '../helpers/collation'

export type ScoreboardEntry = {
  player: PublicPlayer
  /** Standard competition ranking: two players level in 2nd are both 2nd, and the next is 4th. */
  rank: number
}

/**
 * Whether a board has anything to rank. Before the first point every player is
 * first on nothing, so the screens that would say so drop the claim instead:
 * the roster loses its rank and score columns, the player is told no placing,
 * and the final board names nobody.
 */
export const hasAnybodyScored = (players: readonly PublicPlayer[]): boolean =>
  players.some((player) => standingOfSeat(player) > 0)

/**
 * What a seat is ranked on: its case on a track, its score on points, never
 * both — a score breaking a tie between two pawns on one case is a figure the
 * table never sees deciding a place it does.
 */
const standingOfSeat = (player: PublicPlayer): number =>
  player.board === null ? player.score : player.board.case

/**
 * Highest standing first, a tie sharing the place. Ties order on nickname so
 * the board does not reshuffle itself between two renders of the same
 * standings — the players are watching it on a wall.
 */
export const buildScoreboard = (
  players: readonly PublicPlayer[]
): ScoreboardEntry[] => {
  const ordered = players.toSorted(
    (left, right) =>
      standingOfSeat(right) - standingOfSeat(left) ||
      compareText(left.nickname, right.nickname)
  )

  let currentRank = 0
  let previous: PublicPlayer | null = null

  return ordered.map((player, index) => {
    if (
      previous === null ||
      standingOfSeat(player) !== standingOfSeat(previous)
    ) {
      currentRank = index + 1
      previous = player
    }

    return { player, rank: currentRank }
  })
}

/**
 * Who has sat down, by name, everyone sharing first: what `buildScoreboard`
 * returns before anybody has scored, kept by a roster whatever the scores say,
 * because a list may never order on a figure it does not print.
 */
export const buildRoster = (
  players: readonly PublicPlayer[]
): ScoreboardEntry[] =>
  players
    .toSorted((left, right) => compareText(left.nickname, right.nickname))
    .map((player) => ({ player, rank: 1 }))

/**
 * Who won, or who shares the win: everyone on the top rank, in the board's
 * order. Empty while nobody has scored, because first place on nought is not
 * a win anybody can be told about.
 */
export const winnersOf = (players: readonly PublicPlayer[]): PublicPlayer[] =>
  hasAnybodyScored(players)
    ? buildScoreboard(players)
        .filter((entry) => entry.rank === 1)
        .map((entry) => entry.player)
    : []

export type Standing = {
  rank: number
  roomSize: number
}

/**
 * Where one player stands, in the two facts that are true at *every* phase — a
 * place and the size of the room. That is what the persistent strip on a
 * player's screen carries, and it is why the strip rather than the reveal is
 * where a place belongs: a board is only true once a round has revealed.
 *
 * `null` wherever the board has nothing to say — the same threshold every other
 * ranked surface uses, so a lobby does not announce a first place on nought.
 */
export const standingOf = ({
  players,
  youId
}: {
  players: readonly PublicPlayer[]
  youId: PlayerId | null
}): Standing | null => {
  if (youId === null || !hasAnybodyScored(players)) {
    return null
  }

  const board = buildScoreboard(players)
  const yours = board.find((entry) => entry.player.id === youId)

  if (yours === undefined) {
    return null
  }

  return { rank: yours.rank, roomSize: players.length }
}

/**
 * Where one seat placed in the round just revealed, among the seats it paid —
 * the fastest right answer, the closest pawn — with ties sharing a place as the
 * board ranks them. `null` for a seat the round paid nothing, which placed
 * nowhere rather than last.
 */
export const roundPlacingOf = ({
  awards,
  playerId
}: {
  awards: readonly Pick<Award, 'playerId' | 'points'>[]
  playerId: PlayerId | null
}): number | null => {
  const yours = awards.find((award) => award.playerId === playerId)

  if (yours === undefined || yours.points === 0) {
    return null
  }

  return 1 + awards.filter((award) => award.points > yours.points).length
}
