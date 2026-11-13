import type React from 'react'

import type { PlayerId } from '@melee/protocol/identifiers'
import type { PublicPlayer, RoundView } from '@melee/protocol/room'

import { playersOfRound } from '@melee/core/round/round-roster'

import { thinkAlikeContent } from '@/helpers/round-content'
import { shownPoints } from '@/helpers/shown-points'
import { Pawn } from '@/presentation/components/pawn'
import { VisuallyHidden } from '@/presentation/components/visually-hidden'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './think-alike-revealed.sass'

type Row = {
  authorIds: readonly PlayerId[]
  key: string
  /** `null` for the seats that wrote nothing. */
  text: string | null
}

/** A pile in miniature: its top card with its count, and a card edge under it per author. */
const MiniPile: React.FC<{ count: number; text: string | null }> = ({
  count,
  text
}) => (
  <span aria-hidden className='mini-pile' style={{ '--authors': count }}>
    <span className='top' data-blank={text === null || undefined}>
      {text === null ? '' : count}
    </span>
    {Array.from({ length: Math.min(count, 8) - 1 }, (_, at) => at).map(
      (edge) => (
        <span className='edge' key={edge} />
      )
    )}
  </span>
)

/**
 * A seat's reveal: its own pile large with what it paid and its authors'
 * pawns, then every pile in the order the room's screen turned them over,
 * its own framed. What the round paid overall is the round's block below, as
 * in every game.
 */
export const ThinkAlikeRevealed: React.FC<{
  players: readonly PublicPlayer[]
  round: RoundView
  youId: PlayerId | null
}> = ({ players, round, youId }) => {
  const translate = useTranslate()
  const groups = thinkAlikeContent(round)?.groups

  if (groups == null) {
    return null
  }

  const writers = new Set(groups.flatMap((group) => group.authors))
  const blankIds = playersOfRound({
    openedWithPlayerIds: round.openedWithPlayerIds,
    players
  })
    .filter((player) => !writers.has(player.id))
    .map((player) => player.id)
  const rows: Row[] = [
    ...(blankIds.length > 0
      ? [{ authorIds: blankIds, key: '', text: null }]
      : []),
    ...groups.map((group) => ({
      authorIds: group.authors,
      key: group.key,
      text: group.text
    }))
  ]
  const yours =
    youId === null
      ? null
      : (rows.find((row) => row.authorIds.includes(youId)) ?? null)
  const pointsOf = (row: Row): number =>
    row.text === null
      ? 0
      : (round.awards.find((award) => row.authorIds.includes(award.playerId))
          ?.points ?? 0)
  const pawnsOf = (row: Row): React.ReactNode =>
    row.authorIds.map((id) => {
      const seat = players.findIndex((player) => player.id === id)

      return seat === -1 ? null : (
        <span className='pawn-of' key={id}>
          <Pawn seat={seat} />
          <VisuallyHidden elementType='span'>
            {players[seat]?.nickname}
          </VisuallyHidden>
        </span>
      )
    })

  return (
    <div className='think-alike-revealed' data-game='thinkalike'>
      {yours !== null && (
        <section className='answer-card yours'>
          <h2 className='title'>{translate('thinkalike.reveal.yours')}</h2>
          <div className='big-pile'>
            <MiniPile count={yours.authorIds.length} text={yours.text} />
            <p className='word' data-blank={yours.text === null || undefined}>
              {yours.text ?? translate('thinkalike.reveal.blank')}
            </p>
          </div>
          <p className='pay' data-paid={pointsOf(yours) > 0 || undefined}>
            {pointsOf(yours) > 0
              ? translate('round.scored', {
                  points: shownPoints(pointsOf(yours))
                })
              : 0}
          </p>
          <p className='pawns'>{pawnsOf(yours)}</p>
        </section>
      )}
      <section className='answer-card every-pile'>
        <ol>
          {rows.map((row, index) => (
            <li
              data-yours={row === yours || undefined}
              key={row.key}
              style={{ '--row-index': index }}
            >
              <MiniPile count={row.authorIds.length} text={row.text} />
              <p className='word' data-blank={row.text === null || undefined}>
                {row.text ?? translate('thinkalike.reveal.blank')}
              </p>
              <p className='pawns'>{pawnsOf(row)}</p>
              <p className='pay' data-paid={pointsOf(row) > 0 || undefined}>
                {pointsOf(row) > 0
                  ? translate('round.scored', {
                      points: shownPoints(pointsOf(row))
                    })
                  : 0}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
