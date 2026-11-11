import type React from 'react'

import type { PlayerId } from '@melee/protocol/identifiers'
import type { PublicPlayer, RoundView } from '@melee/protocol/room'

import { longestWordContent } from '@/helpers/round-content'
import { shownPoints } from '@/helpers/shown-points'
import { DrawnWordTiles } from '@/presentation/components/drawn-word-tiles'
import { Pawn } from '@/presentation/components/pawn'
import { VisuallyHidden } from '@/presentation/components/visually-hidden'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './longest-word-ranking.sass'

/** Past this many seats the ranking stands in two columns, as every list on the wall does. */
const MOST_ROWS_IN_A_COLUMN = 12

type LongestWordRankingProps = {
  players: readonly PublicPlayer[]
  round: RoundView
  /** The seated host's own row, marked among the others; `null` on a screen nobody sits at. */
  youId: PlayerId | null
}

/**
 * Every seat's longest word laid face up at the reveal, longest first: a
 * rank two words of one length share, the word in the draw's nine slots and
 * the pay. Twelve rows a column, so a full table stands in two and the wall
 * never scrolls.
 */
export const LongestWordRanking: React.FC<LongestWordRankingProps> = ({
  players,
  round,
  youId
}) => {
  const translate = useTranslate()
  const content = longestWordContent(round)

  if (content === null) {
    return null
  }

  const ranked = players
    .map((player, seat) => ({
      player,
      points:
        round.awards.find((award) => award.playerId === player.id)?.points ?? 0,
      seat,
      word:
        content.revealedWords?.find((held) => held.playerId === player.id)
          ?.word ?? null
    }))
    .filter(
      ({ player }) => round.openedWithPlayerIds?.includes(player.id) ?? true
    )
    .toSorted(
      (left, right) =>
        (right.word?.length ?? 0) - (left.word?.length ?? 0) ||
        right.points - left.points ||
        left.seat - right.seat
    )
  const columnCount = ranked.length > MOST_ROWS_IN_A_COLUMN ? 2 : 1

  return (
    <ol
      aria-label={translate('longestword.ranking')}
      className='longest-word-ranking'
      style={{
        '--rank-columns': columnCount,
        '--rank-count': Math.max(1, ranked.length),
        '--rank-rows': Math.max(1, Math.ceil(ranked.length / columnCount))
      }}
    >
      {ranked.map(({ player, points, seat, word }, index) => {
        const length = word?.length ?? 0
        const rank =
          ranked.findIndex((other) => (other.word?.length ?? 0) === length) + 1

        return (
          <li
            className='rank-row'
            data-best={
              (length > 0 && length === content.bestLength) || undefined
            }
            data-yours={player.id === youId || undefined}
            key={player.id}
            style={{ '--rank': index }}
          >
            <span className='rank'>{word === null ? '' : rank}</span>
            <Pawn seat={seat} />
            <span className='name'>{player.nickname}</span>
            <span className='word'>
              <DrawnWordTiles face='faceUp' word={word ?? ''} />
              <VisuallyHidden elementType='span'>
                {word ?? translate('longestword.noWord')}
              </VisuallyHidden>
            </span>
            <b className='pay' data-paid={points > 0 || undefined}>
              {points > 0
                ? translate('round.scored', { points: shownPoints(points) })
                : '0'}
            </b>
          </li>
        )
      })}
    </ol>
  )
}
