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
import { useFirstDrawnOrder } from '@/presentation/components/use-first-drawn-order'
import { useLeavingRows } from '@/presentation/components/use-leaving-rows'
import { useRowsTravel } from '@/presentation/components/use-rows-travel'
import { useSizeGlideOnSwap } from '@/presentation/components/use-size-glide-on-swap'
import { VisuallyHidden } from '@/presentation/components/visually-hidden'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { useFittedFont } from './use-fitted-font'

import './think-alike-piles.sass'

/** A chip leaving fades, then closes its width, and goes once that is shut. */
const CHIP_LEAVING_ANIMATION = 'think-alike-chip-closes'
/** A row leaving fades, then closes its room, and goes once that is shut. */
const ROW_LEAVING_ANIMATION = 'row-closes'
const ALONE_ROW = 'alone'
const BLANK_ROW = 'blank'

type ThinkAlikePilesProps = {
  /**
   * Drawn whole from the first frame: the console coming back from the
   * sorting rows to a table the room already watched fill. `false` by default.
   */
  isFaceUp?: boolean
  players: readonly PublicPlayer[]
  round: RoundView
  /** The seat this screen holds, whose answer is framed; `null` on the wall. */
  youId: PlayerId | null
}

/** One chip on a row: a seat's pawn and name, and the word it wrote alone. */
type Chip = {
  id: string
  isYours: boolean
  nickname: string
  seat: number
  word: string | null
}

/**
 * What an answer's authors were each paid, on a pill that stays through a
 * regroup: its width eases to the new figure's, the figure alone stamped again.
 */
const PayPill: React.FC<{ points: number }> = ({ points }) => {
  const translate = useTranslate()
  const pill = useRef<HTMLParagraphElement>(null)

  useSizeGlideOnSwap({ box: pill, swap: points })

  return (
    <p className='pay' data-paid={points > 0 || undefined} ref={pill}>
      <span className='points' key={points}>
        {points > 0
          ? translate('round.scored', { points: shownPoints(points) })
          : 0}
      </span>
    </p>
  )
}

/**
 * A row's authors, wrapping inside it: a chip joining opens its width and
 * fades in, one leaving fades and closes its width, so the chips beside it
 * slide rather than jump, and the row's height eases to the lines they take.
 */
const Chips: React.FC<{ chips: readonly Chip[] }> = ({ chips }) => {
  const list = useRef<HTMLUListElement>(null)
  const { endExitOf, rows: drawn } = useLeavingRows({
    exitAnimation: CHIP_LEAVING_ANIMATION,
    rows: chips
  })

  const drawnIds = drawn.map((chip) => chip.id).join(' ')

  // The row grows or shrinks by a line as chips come and go, and the rows
  // under it follow its height rather than jump.
  useSizeGlideOnSwap({ box: list, swap: drawnIds })

  return (
    <ul className='authors' ref={list}>
      {drawn.map((chip, at) => (
        <li
          data-arriving={chip.isArriving || undefined}
          data-key={chip.id}
          data-leaving={chip.isLeaving || undefined}
          data-yours={chip.isYours || undefined}
          key={chip.id}
          onAnimationEnd={chip.isLeaving ? endExitOf(chip.id) : undefined}
          style={{ '--at': at }}
        >
          {chip.word !== null && <b className='alone-word'>{chip.word}</b>}
          <Pawn seat={chip.seat} />
          <span className='name'>{chip.nickname}</span>
        </li>
      ))}
    </ul>
  )
}

/**
 * The round's reveal on the screen the room shares, as a table: a row for
 * every answer two or more wrote, the most shared on top — how many, the
 * word, who wrote it and what each was paid — then one dashed row of every
 * answer written alone, and the seats that wrote nothing. The rows come in
 * one by one from the foot, the biggest crowd last, and the whole table is
 * set at the largest size its box holds: the wall never scrolls.
 */
export const ThinkAlikePiles: React.FC<ThinkAlikePilesProps> = ({
  isFaceUp = false,
  players,
  round,
  youId
}) => {
  const translate = useTranslate()
  const section = useRef<HTMLElement>(null)
  const table = useRef<HTMLOListElement>(null)
  const dealt = thinkAlikeContent(round)?.groups ?? []
  const isRegrouped = useChangedSinceFirstDraw(
    dealt.map(({ authors, key }) => `${key}:${authors.length}`).join(' ')
  )
  const payOf = (group: ThinkAlikeGroup): number =>
    round.awards.find((award) => group.authors.includes(award.playerId))
      ?.points ?? 0
  const { endExitOf, rows: shared } = useLeavingRows({
    exitAnimation: ROW_LEAVING_ANIMATION,
    rows: dealt
      .filter((group) => group.authors.length > 1)
      .map((group) => ({ ...group, id: group.key, points: payOf(group) }))
  })
  const singles = dealt.filter((group) => group.authors.length === 1)
  const writers = new Set(dealt.flatMap((group) => group.authors))
  const blanks = playersOfRound({
    openedWithPlayerIds: round.openedWithPlayerIds,
    players
  }).filter((player) => !writers.has(player.id))
  const firstDrawnAt = useFirstDrawnOrder(shared.map((row) => row.key))
  const byFirstDrawn = (one: ThinkAlikeGroup, other: ThinkAlikeGroup): number =>
    firstDrawnAt(one.key) - firstDrawnAt(other.key)
  const ranked = shared.toSorted(
    (one, other) =>
      other.authors.length - one.authors.length || byFirstDrawn(one, other)
  )
  const chipOf = ({
    id,
    word
  }: {
    id: PlayerId
    word: string | null
  }): Chip[] => {
    const seat = players.findIndex((player) => player.id === id)
    const player = players[seat]

    return player === undefined
      ? []
      : [{ id, isYours: id === youId, nickname: player.nickname, seat, word }]
  }
  const aloneChips = singles.flatMap((group) =>
    group.authors.flatMap((id) =>
      chipOf({ id, word: group.text }).map((chip) => ({
        ...chip,
        id: group.key
      }))
    )
  )
  const blankChips = blanks.flatMap((player) =>
    chipOf({ id: player.id, word: null })
  )
  const footOrder = ranked.length
  const { endExitOf: endFootExitOf, rows: foot } = useLeavingRows({
    exitAnimation: ROW_LEAVING_ANIMATION,
    rows: [
      { chips: aloneChips, id: ALONE_ROW },
      { chips: blankChips, id: BLANK_ROW }
    ].filter((row) => row.chips.length > 0)
  })

  useRowsTravel({
    isOrderedByStyle: true,
    list: table,
    order: [...ranked.map((row) => row.key), ...foot.map((row) => row.id)].join(
      ' '
    ),
    pace: 'gather'
  })
  useFittedFont({
    box: section,
    list: table,
    signature: [
      ...ranked.map((row) => `${row.key}:${row.authors.length}`),
      ...singles.map((group) => group.key),
      blanks.length
    ].join(' ')
  })

  return (
    <section
      className='think-alike-piles'
      data-face-up={isFaceUp || undefined}
      data-regrouped={isRegrouped || undefined}
      ref={section}
    >
      <ol className='table' ref={table}>
        {shared.toSorted(byFirstDrawn).map((row) => {
          const rank = ranked.indexOf(row)

          return (
            <li
              className='row'
              data-arriving={(isRegrouped && row.isArriving) || undefined}
              data-key={row.key}
              data-leaving={row.isLeaving || undefined}
              data-yours={
                (youId !== null && row.authors.includes(youId)) || undefined
              }
              key={row.key}
              onAnimationEnd={row.isLeaving ? endExitOf(row.key) : undefined}
              style={{ '--order': rank, '--turn': ranked.length - rank }}
            >
              <span aria-hidden className='count' key={row.authors.length}>
                {row.authors.length}
              </span>
              <p className='word'>
                {row.text}
                <VisuallyHidden elementType='span'>
                  {`, ${translate('thinkalike.reveal.crowd', { count: row.authors.length })}`}
                </VisuallyHidden>
              </p>
              <Chips
                chips={row.authors.flatMap((id) => chipOf({ id, word: null }))}
              />
              <PayPill points={row.points} />
            </li>
          )
        })}
        {foot.map((row) => (
          <li
            className='row'
            data-alone={row.id === ALONE_ROW || undefined}
            data-arriving={(isRegrouped && row.isArriving) || undefined}
            data-blank={row.id === BLANK_ROW || undefined}
            data-key={row.id}
            data-leaving={row.isLeaving || undefined}
            key={row.id}
            onAnimationEnd={row.isLeaving ? endFootExitOf(row.id) : undefined}
            style={{
              '--order': footOrder + (row.id === BLANK_ROW ? 1 : 0),
              '--turn': 0
            }}
          >
            {row.id === ALONE_ROW ? (
              <span aria-hidden className='count'>
                1
              </span>
            ) : (
              <p className='word'>{translate('thinkalike.reveal.blank')}</p>
            )}
            <Chips chips={row.chips} />
          </li>
        ))}
      </ol>
    </section>
  )
}
