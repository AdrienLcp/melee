import { PopoverSheet } from '@adrienlcp/react-aria'
import type React from 'react'
import {
  Dialog,
  type DialogProps,
  type PopoverProps
} from 'react-aria-components'

import { WIDE_SCREEN_QUERY } from '@/presentation/styles/wide-screen'

import './leaflet.sass'

type LeafletProps = {
  /** Names the leaflet for assistive technology; nothing on it repeats the name. */
  'aria-label': string
  /** The leaflet's controls, or a function handed `close` for one that ends the visit. */
  children: DialogProps['children']
  /** The surface's own class, on the popover and the sheet alike. */
  className: string
  /** The popover's tallest, in pixels, on a wide screen. The sheet stops short of the screen's top instead. */
  maxHeight?: PopoverProps['maxHeight']
  /** Where the popover opens from its trigger on a wide screen. */
  placement: PopoverProps['placement']
}

/**
 * The rulebook leaflet a trigger opens, inside a `DialogTrigger`: a popover
 * beside the trigger past the split, a sheet rising from the bottom edge below
 * it, pulled down by its grabber or put away by a press on the board above it.
 * `PopoverSheet` holds both faces; the leaflet gives them the split and the
 * rulebook's material.
 */
export const Leaflet: React.FC<LeafletProps> = ({
  'aria-label': label,
  children,
  className,
  maxHeight,
  placement
}) => (
  <PopoverSheet
    className={className}
    maxHeight={maxHeight}
    placement={placement}
    wideQuery={WIDE_SCREEN_QUERY}
  >
    <Dialog aria-label={label}>{children}</Dialog>
  </PopoverSheet>
)
