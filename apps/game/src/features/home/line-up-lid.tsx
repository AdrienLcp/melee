import type React from 'react'
import { useEffect, useRef } from 'react'
import { Button, ToggleButton } from 'react-aria-components'

import type { GameKind } from '@melee/protocol/game'

import { Button as ControlButton } from '@/presentation/components/button'
import {
  ArrowIcon,
  CrossIcon,
  GameIcon,
  StarIcon
} from '@/presentation/components/icons'
import { Spinner } from '@/presentation/components/spinner'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './line-up-lid.sass'

/** The star a host puts on a lid to keep its line-up at the head of the row. */
export type LidStar = {
  isOn: boolean
  onChange: (isOn: boolean) => void
}

/**
 * How a lid of the host's own row is taken off it and put back. A removed lid
 * keeps its place as a socket offering it back, so no other lid moves.
 */
export type LidRemoval = {
  isRemoved: boolean
  onPutBack: () => void
  onRemove: () => void
}

type LineUpLidProps = {
  /** Each entry's game, in order: one segment of the band each. */
  band: readonly GameKind[]
  /** One muted line under the games, or none. */
  caption: string | null
  /** The games it plays, named; `null` when the name already says them. */
  games: string | null
  /** Another table is opening. */
  isDisabled: boolean
  /** This lid's table is opening: its arrow turns into the spinner. */
  isOpening: boolean
  /** The foot's left half: how long it runs, or when it was played. */
  meta: string
  name: string
  onOpen: () => void
  /** `null` for a lid nobody removes — the ones the app ships. */
  removal: LidRemoval | null
  /** `null` for a lid nobody stars — the ones the app ships. */
  star: LidStar | null
}

/**
 * One line-up as a box lid: a band of its entries' spines on top — three blind
 * tests read as three — its name in the lid's face, its games and a caption,
 * and a ruled foot. One press opens a table on it.
 *
 * The star is a token set on the lid, a press of its own beside the lid's and
 * never inside it, so a host aiming at one cannot land on the other.
 */
export const LineUpLid: React.FC<LineUpLidProps> = ({
  band,
  caption,
  games,
  isDisabled,
  isOpening,
  meta,
  name,
  onOpen,
  removal,
  star
}) => {
  const translate = useTranslate()
  const lidRef = useRef<HTMLButtonElement>(null)
  const removedRef = useRef<HTMLDivElement>(null)
  const isRemoved = removal?.isRemoved ?? false
  const wasRemoved = useRef(isRemoved)

  // The press that removed or put back the lid has just gone invisible under
  // the finger, so the focus follows to what took its place.
  useEffect(() => {
    if (wasRemoved.current === isRemoved) {
      return
    }

    wasRemoved.current = isRemoved
    const takesFocus = isRemoved
      ? removedRef.current?.querySelector('button')
      : lidRef.current
    takesFocus?.focus()
  }, [isRemoved])

  return (
    <li
      className='line-up-lid'
      data-has-star={star !== null || undefined}
      data-removable={removal !== null || undefined}
      data-removed={isRemoved || undefined}
    >
      <Button
        className='lid'
        isDisabled={isDisabled}
        onPress={onOpen}
        ref={lidRef}
      >
        <span aria-hidden='true' className='band'>
          {segmentsOf(band).map(({ game, key }) => (
            <span
              className='segment'
              key={key}
              style={{
                '--spine': `var(--spine-${game})`,
                '--spine-ink': `var(--on-spine-${game})`
              }}
            >
              <GameIcon game={game} />
            </span>
          ))}
        </span>
        <span className='body'>
          <span className='name'>{name}</span>
          {games !== null && <span className='games'>{games}</span>}
          {caption !== null && <span className='caption'>{caption}</span>}
        </span>
        <span className='foot'>
          <span className='meta'>{meta}</span>
          <span className='go'>
            {translate('readyMade.open')}
            {isOpening ? <Spinner /> : <ArrowIcon />}
          </span>
        </span>
      </Button>
      {star !== null && (
        <ToggleButton
          aria-label={translate('home.saveLineUp', { name })}
          className='star'
          isDisabled={isDisabled}
          isSelected={star.isOn}
          onChange={star.onChange}
        >
          <StarIcon />
        </ToggleButton>
      )}
      {removal !== null && (
        <>
          <Button
            aria-label={translate('home.yourLineUps.remove', { name })}
            className='remove'
            isDisabled={isDisabled}
            onPress={removal.onRemove}
          >
            <CrossIcon />
          </Button>
          <div className='removed' ref={removedRef}>
            <p>{translate('home.yourLineUps.removed', { name })}</p>
            <ControlButton
              isDisabled={isDisabled}
              onPress={removal.onPutBack}
              size='small'
              variant='underlined'
            >
              {translate('home.yourLineUps.putBack')}
            </ControlButton>
          </div>
        </>
      )}
    </li>
  )
}

const NO_BREAK_SPACE = '\u00a0'

/**
 * An empty lid as tall as one whose name takes two lines over its games and a
 * caption, the tallest a host's own row commonly holds. It is all a row the
 * served page holds open contains, and it sits under the first lid of the row
 * the app draws, so that row is never shorter than the space held for it.
 */
export const LidStrut: React.FC = () => (
  <li aria-hidden='true' className='line-up-lid lid-strut'>
    <span className='lid'>
      <span className='band' />
      <span className='body'>
        <span className='name'>
          {NO_BREAK_SPACE}
          <br />
          {NO_BREAK_SPACE}
        </span>
        <span className='games'>{NO_BREAK_SPACE}</span>
        <span className='caption'>{NO_BREAK_SPACE}</span>
      </span>
      <span className='foot'>{NO_BREAK_SPACE}</span>
    </span>
  </li>
)

/** A segment per entry, keyed by its place: the band never reorders. */
const segmentsOf = (band: readonly GameKind[]) =>
  band.map((game, index) => ({ game, key: index }))
