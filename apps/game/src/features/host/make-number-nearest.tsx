import type React from 'react'
import { useRef, useState } from 'react'

import type { PlayerId } from '@melee/protocol/identifiers'
import type { PublicPlayer, RoundView } from '@melee/protocol/room'

import {
  type Arrivals,
  arrivalsOf,
  type NearestRow,
  nearestFirst
} from '@/helpers/make-number-nearest'
import { makeNumberContent } from '@/helpers/round-content'
import { CheckIcon } from '@/presentation/components/icons'
import { Pawn, usePawnPiece } from '@/presentation/components/pawn'
import { useRowsTravel } from '@/presentation/components/use-rows-travel'
import { VisuallyHidden } from '@/presentation/components/visually-hidden'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { useLeavingRows } from './use-leaving-rows'
import { useNearestLayout } from './use-nearest-layout'

import './make-number-nearest.sass'

type Seat = { id: PlayerId; name: string; seat: number; value: number | null }

type Row = NearestRow<Seat>

const NO_ARRIVALS: Arrivals = new Map()

/**
 * A row's CSS `order`: the rows stay in the table's order in the document, so
 * a move never replays a row's entrance, and every rank takes an even place,
 * so a leaving row holds the odd one before the row that took its rank.
 */
const orderOf = (rank: number): number => rank * 2

type Drawn = { isLeaving: boolean; row: Row }

/**
 * The rows in the document, in the table's order: a seat that left still
 * holds the place it had, ahead of the seat that moved up into it, since
 * the document moving a row would replay what it plays.
 */
const inTheTablesOrder = (one: Drawn, other: Drawn): number =>
  one.row.seat - other.row.seat ||
  Number(other.isLeaving) - Number(one.isLeaving)

const signatureOf = (rows: readonly Row[]): string =>
  rows.map(({ id, rank, value }) => `${id}:${rank}:${value}`).join(' ')

const NearestRowItem: React.FC<{
  onAnimationEnd?: React.AnimationEventHandler
  order: number
  row: Row
  isLeaving?: boolean
}> = ({ isLeaving = false, onAnimationEnd, order, row }) => {
  const translate = useTranslate()
  const { band, distance, id, name, rank, seat, value } = row
  const seatPiece = usePawnPiece({ seat })
  // A seat that left takes its place in the roster with it: the row keeps
  // the piece it stood as while it fades out.
  const [piece, setPiece] = useState(seatPiece)

  if (
    !isLeaving &&
    (seatPiece.colour !== piece.colour || seatPiece.head !== piece.head)
  ) {
    setPiece(seatPiece)
  }

  return (
    <li
      className='row'
      data-band={band}
      data-key={isLeaving ? undefined : id}
      data-leaving={isLeaving || undefined}
      onAnimationEnd={onAnimationEnd}
      style={{ '--order': order, '--rank': rank }}
    >
      <Pawn colour={piece.colour} head={piece.head} />
      <span aria-hidden className='name'>
        {name}
      </span>
      <b aria-hidden className='figure' key={value ?? 'none'}>
        {value}
      </b>
      <span aria-hidden className='gap'>
        <CheckIcon className='stamp' />
        <span className='gap-text' key={value ?? 'none'}>
          {distance === null
            ? translate('makenumber.nearest.waiting')
            : distance === 0
              ? translate('makenumber.nearest.exact')
              : translate('makenumber.distance', { distance })}
        </span>
      </span>
      <VisuallyHidden elementType='span'>
        {distance === null || value === null
          ? translate('makenumber.nearest.waitingSeat', { name })
          : distance === 0
            ? translate('makenumber.nearest.exactSeat', { name })
            : translate('makenumber.nearest.seat', { distance, name, value })}
      </VisuallyHidden>
    </li>
  )
}

type MakeNumberNearestProps = {
  players: readonly PublicPlayer[]
  round: RoundView
}

/**
 * Every seat's value — sent or still on its screen — on a row of its own,
 * nearest the target first: the name, the value large and how far it stands
 * written out, each row coloured by its band — exact, close enough to be
 * paid, past it — and the seats holding no number yet waiting at the end,
 * dashed. A row slides to its new place as its value comes nearer, and the
 * rows fill the height in the columns that give them the largest type.
 * Never a calculation.
 */
export const MakeNumberNearest: React.FC<MakeNumberNearestProps> = ({
  players,
  round
}) => {
  const translate = useTranslate()
  const list = useRef<HTMLOListElement>(null)
  const content = makeNumberContent(round)
  const seats: Seat[] = players
    .map((player, seat) => ({
      id: player.id,
      name: player.nickname,
      seat,
      value:
        content?.values.find((held) => held.playerId === player.id)?.value ??
        null
    }))
    .filter(({ id }) => round.openedWithPlayerIds?.includes(id) ?? true)
  const [arrivals, setArrivals] = useState(NO_ARRIVALS)
  const nextArrivals = arrivalsOf({ arrivals, seats })

  if (nextArrivals !== arrivals) {
    setArrivals(nextArrivals)
  }

  const rows = nearestFirst({
    arrivals: nextArrivals,
    seats,
    target: content?.target ?? 0
  })
  const { endsExitOf, leaving } = useLeavingRows({
    rows,
    signature: signatureOf(rows)
  })

  useNearestLayout({ count: rows.length + leaving.length, list })
  useRowsTravel({
    isOrderedByStyle: true,
    list,
    // A row done leaving hands its place to the rows after it: the order
    // names it until then, so its going is a change that travels.
    order: [...rows, ...leaving].map(({ id }) => id).join(' '),
    pace: 'gather'
  })

  if (content === null) {
    return null
  }

  return (
    <ol
      aria-label={translate('makenumber.nearest.label')}
      className='make-number-nearest'
      ref={list}
      style={{ '--nearest-count': rows.length + leaving.length }}
    >
      {[
        ...rows.map((row) => ({ isLeaving: false, row })),
        ...leaving.map((row) => ({ isLeaving: true, row }))
      ]
        .toSorted(inTheTablesOrder)
        .map(({ isLeaving, row }) => (
          <NearestRowItem
            isLeaving={isLeaving}
            key={row.id}
            onAnimationEnd={isLeaving ? endsExitOf(row.id) : undefined}
            order={orderOf(row.rank) - (isLeaving ? 1 : 0)}
            row={row}
          />
        ))}
    </ol>
  )
}
