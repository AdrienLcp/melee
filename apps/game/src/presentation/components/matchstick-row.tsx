import type React from 'react'

import type { StickMove } from '@melee/protocol/matchsticks'

import {
  isSamePlace,
  layoutOf,
  poseOf,
  STICK_LENGTH,
  STICK_THICKNESS,
  type StickPose,
  spokenGlyphs
} from '@/helpers/matchstick-geometry'

import './matchstick-row.sass'

type MatchstickRowProps = {
  glyphs: string
  /**
   * The move that made these glyphs, drawn as the stick travelling from its
   * old place to its new one; `null` for a puzzle still to solve.
   */
  move?: StickMove | null
}

const HEAD_RADIUS = STICK_THICKNESS * 0.62
const HALF_LENGTH = STICK_LENGTH / 2

const transformOf = (pose: StickPose): string =>
  `translate(${pose.x} ${pose.y}) rotate(${pose.angle})`

const cssTransformOf = (pose: StickPose): string =>
  `translate(${pose.x}px, ${pose.y}px) rotate(${pose.angle}deg)`

const Groove: React.FC<{ className: string; pose: StickPose }> = ({
  className,
  pose
}) => (
  <rect
    className={className}
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
  glyphs,
  move = null
}) => {
  const layout = layoutOf(glyphs)
  const sticks = layout.sticks.filter(
    (stick) => move === null || !isSamePlace({ left: stick, right: move.to })
  )

  return (
    <svg
      aria-label={spokenGlyphs(glyphs)}
      className='matchstick-row'
      role='img'
      viewBox={layout.viewBox}
    >
      {layout.empties.map((empty) => (
        <Groove
          className='groove'
          key={`${empty.glyphIndex}${empty.slot}`}
          pose={empty.pose}
        />
      ))}
      {move !== null && (
        <Groove
          className='groove left'
          pose={poseOf({ glyphs, place: move.from })}
        />
      )}
      {layout.bars.map((bar) => (
        <g
          className='match'
          key={`${bar.x}:${bar.y}`}
          transform={transformOf(bar)}
        >
          <Match isBar />
        </g>
      ))}
      {sticks.map((stick) => (
        <g
          className='match'
          key={`${stick.glyphIndex}${stick.slot}`}
          transform={transformOf(stick.pose)}
        >
          <Match />
        </g>
      ))}
      {move !== null && (
        <g
          className='match moved'
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
