import { type RefObject, useLayoutEffect, useState } from 'react'

import { type RankingFold, rankingFold } from '@/helpers/ranking-fold'

/** A row's floor and ceiling, in root ems: `--text-xs` on its line, and a size read from across the room. */
const FLOOR_ROW_REM = 1.25
const CEILING_ROW_REM = 3.5
/** One character of a calculation at the `--text-xs` floor, and what the rank and the pawn take from its line. */
const STEP_CHARACTER_REM = 0.875 * 0.56
const STEPS_INDENT_REM = 3.5
/** A row's font as `.rank-row` sets it: a share of its height, between `--text-xs` and `--text-xl`. */
const ROW_FONT_SHARE = 0.42
const ROW_FONT_FLOOR_REM = 0.875
const ROW_FONT_CEILING_REM = 1.75
const COLUMN_GAP_REM = 1
/** The rank, the pawn, the value with its stamp, the pay and the gaps beside a name, in the row's font size. */
const ROW_CHROME_EM = 11.5
/** The height a column keeps back, since a row is laid out at a fraction of a pixel the packing does not see. */
const PACKING_SLACK_PX = 3

export type MeasuredFold = RankingFold & {
  /** The room a name has on its row, in the row's own font size. */
  nameRoomEm: number
  /** How many lines each row's calculation takes, in rank order. */
  stepLines: number[]
  /** The width a calculation line has, in pixels. */
  stepsRoom: number
}

const isSameFold = ({
  fold,
  next
}: {
  fold: MeasuredFold | null
  next: MeasuredFold | null
}): boolean => JSON.stringify(fold) === JSON.stringify(next)

/**
 * How the ranking in `list` gives way in its own box (`rankingFold`), read
 * again on every resize — or `null` where the stylesheet lets the list scroll
 * instead, beside a wall and on a phone running the table, where every row
 * keeps its calculation. Two columns only where the list says it may, with
 * `--rank-can-split: 1`.
 */
export const useRankingFold = ({
  list,
  stepCharacters
}: {
  list: RefObject<HTMLElement | null>
  /** How long each row's calculation is written, in rank order; 0 for none. */
  stepCharacters: readonly number[]
}): MeasuredFold | null => {
  const [fold, setFold] = useState<MeasuredFold | null>(null)
  const written = stepCharacters.join(' ')

  useLayoutEffect(() => {
    const element = list.current

    if (element === null) {
      return
    }

    const characters = written === '' ? [] : written.split(' ').map(Number)
    const measure = () => {
      const style = getComputedStyle(element)
      const remPx =
        Number.parseFloat(
          getComputedStyle(document.documentElement).fontSize
        ) || 16
      const scrolls = style.overflowY === 'auto' || style.overflowY === 'scroll'
      const roomFor = (columns: 1 | 2): number =>
        element.clientWidth / columns - STEPS_INDENT_REM * remPx
      const stepLinesFor = (columns: 1 | 2): number[] =>
        characters.map((count) =>
          count === 0
            ? 0
            : Math.min(
                2,
                Math.ceil(
                  (count * STEP_CHARACTER_REM * remPx) / roomFor(columns)
                )
              )
        )
      const laid = scrolls
        ? null
        : rankingFold({
            canSplit: style.getPropertyValue('--rank-can-split').trim() === '1',
            ceilingRowPx: CEILING_ROW_REM * remPx,
            count: characters.length,
            floorRowPx: FLOOR_ROW_REM * remPx,
            height: element.clientHeight - PACKING_SLACK_PX,
            stepLinesFor
          })
      const next =
        laid === null
          ? null
          : {
              ...laid,
              nameRoomEm:
                (element.clientWidth / laid.columns -
                  (laid.columns - 1) * COLUMN_GAP_REM * remPx) /
                  Math.min(
                    ROW_FONT_CEILING_REM * remPx,
                    Math.max(
                      ROW_FONT_FLOOR_REM * remPx,
                      laid.rowPx * ROW_FONT_SHARE
                    )
                  ) -
                ROW_CHROME_EM,
              stepLines: stepLinesFor(laid.columns),
              stepsRoom: Math.floor(roomFor(laid.columns))
            }

      setFold((current) =>
        isSameFold({ fold: current, next }) ? current : next
      )
    }
    const observer = new ResizeObserver(measure)

    measure()
    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [list, written])

  return fold
}
