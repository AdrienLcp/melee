import type React from 'react'
import { useRef } from 'react'

import type { PlayerId } from '@melee/protocol/identifiers'
import type { PublicPlayer, RoundView } from '@melee/protocol/room'
import type { ThinkAlikeGroup } from '@melee/protocol/think-alike'

import { playersOfRound } from '@melee/core/round/round-roster'

import { thinkAlikeContent } from '@/helpers/round-content'
import { shownPoints } from '@/helpers/shown-points'
import { Pawn } from '@/presentation/components/pawn'
import { useChangedSinceFirstDraw } from '@/presentation/components/use-changed-since-first-draw'
import { useLeavingRows } from '@/presentation/components/use-leaving-rows'
import { useRowsTravel } from '@/presentation/components/use-rows-travel'
import { VisuallyHidden } from '@/presentation/components/visually-hidden'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './think-alike-piles.sass'

/** How many lone cards stand one over the other beside the piles before another column starts. */
const LONE_ROWS_BESIDE_PILES = 5

const LEAVING_ANIMATION = 'page-leave'

type ThinkAlikePilesProps = {
  players: readonly PublicPlayer[]
  round: RoundView
  /** The seat this screen holds, whose pile is framed; `null` on the wall. */
  youId: PlayerId | null
}

/** The letters of an answer's longest word, which its card is sized by so no word has to break. */
const longestWordOf = (text: string): number =>
  Math.max(4, ...text.split(/\s+/u).map((word) => word.length))

/** A seat's name and pawn, under a pile or a lone card. */
const Author: React.FC<{ player: PublicPlayer; seat: number }> = ({
  player,
  seat
}) => (
  <li>
    <Pawn seat={seat} />
    <span className='name'>{player.nickname}</span>
  </li>
)

/**
 * The round's reveal on the screen the room shares: the blank seats and the
 * lone answers as small flat cards first, then every answer two or more
 * wrote as a pile, smallest to biggest, gathered face down and turned over
 * one by one — the top card's word large, the pile as thick as its authors,
 * a card edge a pawn, what each of them was paid and who they are under it.
 */
export const ThinkAlikePiles: React.FC<ThinkAlikePilesProps> = ({
  players,
  round,
  youId
}) => {
  const translate = useTranslate()
  const section = useRef<HTMLElement>(null)
  const dealt = thinkAlikeContent(round)?.groups ?? []
  const isRegrouped = useChangedSinceFirstDraw(
    dealt.map(({ authors, key }) => `${key}:${authors.length}`).join(' ')
  )
  const { endExitOf, rows: groups } = useLeavingRows({
    exitAnimation: LEAVING_ANIMATION,
    rows: dealt.map((group) => ({ ...group, id: group.key }))
  })
  const writers = new Set(groups.flatMap((group) => group.authors))
  const blanks = playersOfRound({
    openedWithPlayerIds: round.openedWithPlayerIds,
    players
  }).filter((player) => !writers.has(player.id))
  const singles = groups.filter((group) => group.authors.length === 1)
  const piles = groups.filter((group) => group.authors.length > 1)
  const seatOf = (id: PlayerId): number =>
    players.findIndex((player) => player.id === id)
  const authorsOf = (group: ThinkAlikeGroup) =>
    group.authors.flatMap((id) => {
      const player = players.find((seated) => seated.id === id)

      return player === undefined ? [] : [player]
    })
  const payOf = (group: ThinkAlikeGroup): number =>
    round.awards.find((award) => group.authors.includes(award.playerId))
      ?.points ?? 0
  const loneCount = singles.length + blanks.length

  useRowsTravel({
    list: section,
    order: piles.map((pile) => pile.key).join(' '),
    pace: 'reorder'
  })
  const columnCount = piles.length + (loneCount > 0 ? 1 : 0)

  return (
    <section
      className='think-alike-piles'
      data-lone={loneCount > 0 || undefined}
      data-regrouped={isRegrouped || undefined}
      ref={section}
      style={{
        '--columns': columnCount,
        '--columns-template': [
          ...(loneCount > 0
            ? [
                `minmax(min-content, ${Math.min(6, Math.ceil(Math.sqrt(loneCount)) * 1.3)}fr)`
              ]
            : []),
          ...piles.map(
            (pile) => `minmax(0, ${3 + pile.authors.length * 0.6}fr)`
          )
        ].join(' '),
        '--lone-columns':
          piles.length > 0
            ? Math.ceil(loneCount / LONE_ROWS_BESIDE_PILES)
            : Math.ceil(Math.sqrt(loneCount * 1.8)),
        '--most-authors': Math.max(
          2,
          ...piles.map((pile) => pile.authors.length)
        )
      }}
    >
      {loneCount > 0 && (
        <ul className='lone'>
          {blanks.map((player) => (
            <li className='lone-card' data-blank key={player.id}>
              <span className='face'>
                <span className='word'>
                  <VisuallyHidden elementType='span'>
                    {translate('thinkalike.reveal.blank')}
                  </VisuallyHidden>
                </span>
              </span>
              <ul className='authors'>
                <Author player={player} seat={seatOf(player.id)} />
              </ul>
            </li>
          ))}
          {singles.map((group) => (
            <li
              className='lone-card'
              data-leaving={group.isLeaving || undefined}
              data-yours={
                (youId !== null && group.authors.includes(youId)) || undefined
              }
              key={group.key}
              onAnimationEnd={
                group.isLeaving ? endExitOf(group.key) : undefined
              }
              style={{ '--letters': longestWordOf(group.text) }}
            >
              <span className='face'>
                <span className='word'>{group.text}</span>
              </span>
              <ul className='authors'>
                {authorsOf(group).map((player) => (
                  <Author
                    key={player.id}
                    player={player}
                    seat={seatOf(player.id)}
                  />
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
      {piles.map((pile, turn) => {
        const points = payOf(pile)
        const authors = authorsOf(pile)

        return (
          <div
            className='pile'
            data-key={pile.key}
            data-leaving={pile.isLeaving || undefined}
            data-yours={
              (youId !== null && pile.authors.includes(youId)) || undefined
            }
            key={pile.key}
            onAnimationEnd={pile.isLeaving ? endExitOf(pile.key) : undefined}
            style={{
              '--authors': pile.authors.length,
              '--letters': longestWordOf(pile.text),
              '--turn': turn + 1
            }}
          >
            <div className='stack'>
              <div className='top'>
                <div aria-hidden className='back' />
                <div className='front'>
                  <span aria-hidden className='count'>
                    {pile.authors.length}
                  </span>
                  <p className='word'>
                    {pile.text}
                    <VisuallyHidden elementType='span'>
                      {`, ${translate('thinkalike.reveal.crowd', { count: pile.authors.length })}`}
                    </VisuallyHidden>
                  </p>
                </div>
              </div>
              <ol aria-hidden className='edges'>
                {authors.map((player) => (
                  <li key={player.id}>
                    <Pawn seat={seatOf(player.id)} />
                  </li>
                ))}
              </ol>
            </div>
            <p className='pay' data-paid={points > 0 || undefined} key={points}>
              {points > 0
                ? translate('round.scored', { points: shownPoints(points) })
                : 0}
            </p>
            <ul className='authors'>
              {authors.map((player) => (
                <Author
                  key={player.id}
                  player={player}
                  seat={seatOf(player.id)}
                />
              ))}
            </ul>
          </div>
        )
      })}
    </section>
  )
}
