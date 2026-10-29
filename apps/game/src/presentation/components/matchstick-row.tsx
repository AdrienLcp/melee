import type React from 'react'

import type { StickMove, StickPlace } from '@melee/protocol/matchsticks'

import { applyMove } from '@melee/core/matchsticks/one-move'

import {
  isSamePlace,
  movedLayoutOf,
  poseOf,
  STICK_LENGTH,
  STICK_THICKNESS,
  type StickPose,
  spokenGlyphs
} from '@/helpers/matchstick-geometry'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './matchstick-row.sass'

type MatchstickRowProps = {
  /** A place drawn as the one a press or a drop would land on. */
  aimed?: StickPlace | null
  /** The puzzle as dealt: a move is drawn on top of it, never read from what it made. */
  glyphs: string
  /**
   * Where the held stick is drawn instead of raised off its place: under a
   * pointer dragging it, turned to the place it would land on.
   */
  heldAt?: StickPose | null
  /**
   * Drawn where it lands at once rather than travelling there: a row of
   * moves side by side, or a move the reader made themselves.
   */
  isStill?: boolean
  /** The stick a player is holding, drawn raised off its place. */
  lifted?: StickPlace | null
  /**
   * One stick moved, drawn as the stick travelling from its old place to its
   * new one, whatever the sticks then read as; `null` for a puzzle still to
   * solve.
   */
  move?: StickMove | null
}

const HEAD_RADIUS = STICK_THICKNESS * 0.62
const HALF_LENGTH = STICK_LENGTH / 2
/** How far a held stick rises off its place, in the drawing's units. */
const LIFT = 'translate(-2 -5) '

const transformOf = (pose: StickPose): string =>
  `translate(${pose.x} ${pose.y}) rotate(${pose.angle})`

const translateOf = (pose: StickPose): string =>
  `translate(${pose.x} ${pose.y})`

const cssTransformOf = (pose: StickPose): string =>
  `translate(${pose.x}px, ${pose.y}px) rotate(${pose.angle}deg)`

const isAt = (place: StickPlace, other: StickPlace | null): boolean =>
  other !== null && isSamePlace({ left: place, right: other })

const Groove: React.FC<{
  className: string
  isAimed?: boolean
  pose: StickPose
}> = ({ className, isAimed = false, pose }) => (
  <rect
    className={className}
    data-aimed={isAimed || undefined}
    height={STICK_THICKNESS}
    rx={STICK_THICKNESS / 2}
    transform={transformOf(pose)}
    width={STICK_LENGTH}
    x={-HALF_LENGTH}
    y={-STICK_THICKNESS / 2}
  />
)

/** A match lying along its own x axis, head to the right; the caller places it. */
const Match: React.FC<{ isBar?: boolean }> = ({ isBar = false }) => (
  <>
    <rect
      className='wood'
      height={STICK_THICKNESS}
      rx={STICK_THICKNESS / 2}
      width={STICK_LENGTH}
      x={-HALF_LENGTH}
      y={-STICK_THICKNESS / 2}
    />
    {!isBar && (
      <circle
        className='head'
        cx={HALF_LENGTH - HEAD_RADIUS}
        cy={0}
        r={HEAD_RADIUS}
      />
    )}
  </>
)

/**
 * A matchstick puzzle drawn in sticks, seven-segment digits and the signs
 * between them, with every place a stick could go printed as a groove. Sized
 * by its container's width, and as tall as that width allows.
 */
export const MatchstickRow: React.FC<MatchstickRowProps> = ({
  aimed = null,
  glyphs,
  heldAt = null,
  isStill = false,
  lifted = null,
  move = null
}) => {
  const translate = useTranslate()
  const layout = movedLayoutOf({ glyphs, move })
  const made = move === null ? glyphs : applyMove({ glyphs, move })
  const isTravelling = (place: StickPlace): boolean =>
    move !== null && isAt(place, move.to) && !isAt(place, lifted)
  // The held stick last, so it lies over every other while it travels.
  const sticks = layout.sticks
    .filter((stick) => !isTravelling(stick))
    .toSorted(
      (left, right) => Number(isAt(left, lifted)) - Number(isAt(right, lifted))
    )

  return (
    <svg
      aria-label={
        made === null
          ? translate('matchsticks.move.unreadable')
          : spokenGlyphs(made)
      }
      className='matchstick-row'
      data-holding={lifted !== null || undefined}
      data-still={isStill || undefined}
      role='img'
      viewBox={layout.viewBox}
    >
      {layout.empties.map((empty) => (
        <Groove
          className={
            move !== null && isAt(empty, move.from) ? 'groove left' : 'groove'
          }
          isAimed={isAt(empty, aimed)}
          key={`${empty.glyphIndex}${empty.slot}`}
          pose={empty.pose}
        />
      ))}
      {layout.bars.map((bar) => (
        <g
          className='match'
          key={`${bar.x}:${bar.y}`}
          transform={transformOf(bar)}
        >
          <Match isBar />
        </g>
      ))}
      {sticks.map((stick) => {
        const isLifted = isAt(stick, lifted)
        const pose = isLifted && heldAt !== null ? heldAt : stick.pose

        return (
          <g
            className='match'
            data-aimed={isAt(stick, aimed) || undefined}
            data-dragged={(isLifted && heldAt !== null) || undefined}
            data-lifted={isLifted || undefined}
            key={`${stick.glyphIndex}${stick.slot}`}
            transform={`${isLifted && heldAt === null ? LIFT : ''}${translateOf(pose)}`}
          >
            <g className='turn' style={{ '--turn': `${pose.angle}deg` }}>
              <Match />
            </g>
          </g>
        )
      })}
      {move !== null && !isAt(move.to, lifted) && (
        <g
          className='match moved'
          data-aimed={isAt(move.to, aimed) || undefined}
          style={{
            '--from': cssTransformOf(poseOf({ glyphs, place: move.from })),
            '--to': cssTransformOf(poseOf({ glyphs, place: move.to }))
          }}
        >
          <Match />
        </g>
      )}
    </svg>
  )
}
