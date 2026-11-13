import type React from 'react'
import { useRef } from 'react'

import type { PlayerId } from '@melee/protocol/identifiers'
import type { PublicPlayer, RoundView } from '@melee/protocol/room'

import {
  chipFit,
  initialsOf,
  type LadderSeat,
  ladderOf,
  wordsOf
} from '@/helpers/make-number-ladder'
import { makeNumberContent } from '@/helpers/round-content'
import { CheckIcon } from '@/presentation/components/icons'
import { Pawn } from '@/presentation/components/pawn'
import { VisuallyHidden } from '@/presentation/components/visually-hidden'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { type GroupBox, useGroupBoxes } from './use-group-boxes'
import { usePiecesTravel } from './use-pieces-travel'

import './make-number-ladder.sass'

/** The chips' floor and ceiling, in root ems: `--text-xs`, then a size read from across the room. */
const CHIP_FLOOR_REM = 0.875
const CHIP_CEILING_REM = 1.5

type Seat = { id: PlayerId; name: string; seat: number }

type ChipKind = 'exact' | 'valued' | 'waiting'

/** How wide a chip's figure is, in characters: its value, a check, or nothing. */
const FIGURE_LENGTH = {
  exact: () => 2,
  valued: ({ value }) => String(value ?? '').length,
  waiting: () => 0
} as const satisfies Record<
  ChipKind,
  (seat: { value: number | null }) => number
>

/** A rung's share of the ruler: an empty one keeps its mark, a crowded one the room to stack. */
const rungWeightOf = (crowd: number): string =>
  crowd === 0
    ? 'minmax(0, 0.6fr)'
    : `minmax(0, ${1 + Math.min(3, Math.ceil(crowd / 3))}fr)`

const ChipGroup: React.FC<{
  box: GroupBox | undefined
  className: string
  group: string
  kind: ChipKind
  remPx: number
  seats: readonly LadderSeat<Seat>[]
  target: number
}> = ({ box, className, group, kind, remPx, seats, target }) => {
  const translate = useTranslate()
  const fit = chipFit({
    capPx: CHIP_CEILING_REM * remPx,
    chips: seats.map(({ name, value }) => ({
      figureLength: FIGURE_LENGTH[kind]({ value }),
      wordLengths: wordsOf(name).map((word) => [...word].length)
    })),
    floorPx: CHIP_FLOOR_REM * remPx,
    height: box?.height ?? 0,
    width: box?.width ?? 0
  })

  return (
    <ul
      className={`chips ${className}`}
      data-group={group}
      data-held={seats.length > 0 || undefined}
      style={{
        '--chip-font': `${fit.fontPx}px`,
        '--chips-per-line': fit.perLine
      }}
    >
      {seats.map(({ id, name, seat, value }, at) => (
        <li
          className='chip'
          data-exact={kind === 'exact' || undefined}
          data-key={id}
          data-look={box === undefined ? 'named' : (fit.looks[at] ?? 'pawn')}
          data-owed={kind === 'waiting' || undefined}
          key={id}
        >
          <Pawn seat={seat} />
          <span aria-hidden className='name'>
            {wordsOf(name)
              .slice(0, box === undefined ? undefined : fit.wordCounts[at])
              .map((word, position) => ({ position, word }))
              .map(({ position, word }) => (
                <span key={position}>{word}</span>
              ))}
          </span>
          <span aria-hidden className='initials'>
            {initialsOf(name)}
          </span>
          {kind === 'valued' && (
            <b aria-hidden className='figure'>
              {value}
            </b>
          )}
          {kind === 'exact' && <CheckIcon aria-hidden className='stamp' />}
          <VisuallyHidden elementType='span'>
            {kind === 'exact'
              ? translate('makenumber.ladder.exact', { name })
              : kind === 'waiting' || value === null
                ? translate('makenumber.ladder.waitingSeat', { name })
                : translate('makenumber.ladder.seat', {
                    distance: Math.abs(value - target),
                    name,
                    value
                  })}
          </VisuallyHidden>
        </li>
      ))}
    </ul>
  )
}

type MakeNumberLadderProps = {
  players: readonly PublicPlayer[]
  round: RoundView
}

/**
 * Every seat's nearest value as a pin on a ruler standing under the target:
 * a rung per unit off, the seats under the target on one side and over it on
 * the other, ten away or more parked at the far end, the exact ones stamped
 * beside the target — and never a calculation. Each crowded rung gives way
 * by itself: stacked, then names cut to whole words, initials, pawns.
 */
export const MakeNumberLadder: React.FC<MakeNumberLadderProps> = ({
  players,
  round
}) => {
  const translate = useTranslate()
  const ladderBox = useRef<HTMLElement>(null)
  const { boxes, remPx } = useGroupBoxes(ladderBox)
  const content = makeNumberContent(round)
  const target = content?.target ?? 0
  const seats = players
    .map((player, seat) => ({
      id: player.id,
      name: player.nickname,
      seat,
      value:
        content?.values.find((held) => held.playerId === player.id)?.value ??
        null
    }))
    .filter(({ id }) => round.openedWithPlayerIds?.includes(id) ?? true)
  const ladder = ladderOf({ seats, target })

  usePiecesTravel({
    container: ladderBox,
    placement: seats.map(({ id, value }) => `${id}:${value}`).join(' ')
  })

  if (content === null) {
    return null
  }

  const crowdOf = (rung: (typeof ladder.rungs)[number]): number =>
    Math.max(rung.under.length, rung.over.length)

  return (
    <section
      aria-label={translate('makenumber.ladder.label')}
      className='make-number-ladder'
      ref={ladderBox}
      style={{
        '--ladder-rows': [
          `minmax(clamp(2.5rem, 13cqh, 7rem), ${2 + Math.min(2, Math.ceil(ladder.exact.under.length / 3))}fr)`,
          ...ladder.rungs.map((rung) => rungWeightOf(crowdOf(rung)))
        ].join(' ')
      }}
    >
      <p aria-hidden className='sides'>
        <span>{translate('makenumber.ladder.below')}</span>
        <span>{translate('makenumber.ladder.above')}</span>
      </p>
      <ol className='rungs'>
        <li className='rung' data-distance='0'>
          <ChipGroup
            box={boxes.get('0-under')}
            className='side under'
            group='0-under'
            kind='exact'
            remPx={remPx}
            seats={ladder.exact.under}
            target={target}
          />
          <span aria-hidden className='mid'>
            <span className='target'>{target}</span>
          </span>
          <ChipGroup
            box={boxes.get('0-over')}
            className='side over'
            group='0-over'
            kind='exact'
            remPx={remPx}
            seats={ladder.exact.over}
            target={target}
          />
        </li>
        {ladder.rungs.map((rung) => (
          <li
            className='rung'
            data-distance={rung.distance}
            data-held={crowdOf(rung) > 0 || undefined}
            key={rung.distance}
          >
            <ChipGroup
              box={boxes.get(`${rung.distance}-under`)}
              className='side under'
              group={`${rung.distance}-under`}
              kind='valued'
              remPx={remPx}
              seats={rung.under}
              target={target}
            />
            <span aria-hidden className='mid'>
              <span className='mark'>
                {rung.distance === 'far'
                  ? translate('makenumber.ladder.far')
                  : translate('makenumber.distance', {
                      distance: rung.distance
                    })}
              </span>
            </span>
            <ChipGroup
              box={boxes.get(`${rung.distance}-over`)}
              className='side over'
              group={`${rung.distance}-over`}
              kind='valued'
              remPx={remPx}
              seats={rung.over}
              target={target}
            />
          </li>
        ))}
      </ol>
      <div
        className='waiting'
        data-empty={ladder.waiting.length === 0 || undefined}
      >
        <p aria-hidden className='label'>
          {translate('makenumber.ladder.waiting')}
        </p>
        <ChipGroup
          box={boxes.get('waiting')}
          className='owed'
          group='waiting'
          kind='waiting'
          remPx={remPx}
          seats={ladder.waiting}
          target={target}
        />
      </div>
    </section>
  )
}
