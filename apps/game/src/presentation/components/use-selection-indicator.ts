import { type RefObject, useLayoutEffect } from 'react'

const SELECTED_SEGMENT = '.segment[data-selected]'

/** Reading a box flushes every style written before it, so what is written next is a change from them. */
const flushStyles = (element: HTMLElement): void => {
  element.getBoundingClientRect()
}

/**
 * Offsets rather than client rects: they ignore the transforms a strip rises
 * through as its page is laid down, so a strip measured mid-entrance is not
 * measured shrunk.
 */
const coverSegment = ({
  indicator,
  segment
}: {
  indicator: HTMLElement
  segment: HTMLElement
}): void => {
  indicator.style.setProperty('--indicator-x', `${segment.offsetLeft}px`)
  indicator.style.setProperty('--indicator-y', `${segment.offsetTop}px`)
  indicator.style.setProperty('--indicator-width', `${segment.offsetWidth}px`)
  indicator.style.setProperty('--indicator-height', `${segment.offsetHeight}px`)
}

type SelectionIndicatorOptions = {
  /** The piece drawn under the chosen segment, a direct child of `.segments`; `null` for a strip that chooses several. */
  indicator: RefObject<HTMLElement | null>
  /** The segments' values joined: a different set is measured afresh. */
  segmentKeys: string
}

/**
 * A strip that holds one answer draws the chosen stamp as one piece that
 * travels to the next choice, instead of a colour that leaves one segment and
 * lands on another. Measured rather than laid out in CSS because a strip is a
 * row, a column or a grid depending on its container, and the piece has to
 * follow it into all three.
 *
 * It reads `data-selected` off the DOM rather than a prop: react-aria writes it
 * for a controlled strip and an uncontrolled one alike, and the server echoing
 * another console's change glides it the same way a press does.
 *
 * Only a new choice glides. A strip changing shape under its container query,
 * its first placement and a choice made where there was none are set down in
 * place — a piece crossing the strip because the window was resized is motion
 * nobody caused.
 */
export const useSelectionIndicator = ({
  indicator,
  segmentKeys
}: SelectionIndicatorOptions): void => {
  useLayoutEffect(() => {
    const piece = indicator.current

    if (piece === null || segmentKeys === '') {
      return
    }

    const segments = piece.parentElement

    if (segments === null) {
      return
    }

    let coveredSegment: HTMLElement | null = null

    const place = ({ glides }: { glides: boolean }): void => {
      const segment = segments.querySelector<HTMLElement>(SELECTED_SEGMENT)

      if (segment === null) {
        piece.removeAttribute('data-shown')
        coveredSegment = null

        return
      }

      piece.toggleAttribute(
        'data-gliding',
        glides && coveredSegment !== null && coveredSegment !== segment
      )
      coverSegment({ indicator: piece, segment })
      piece.toggleAttribute('data-shown', true)
      coveredSegment = segment
    }

    place({ glides: false })
    flushStyles(piece)
    piece.toggleAttribute('data-placed', true)

    const selection = new MutationObserver(() => place({ glides: true }))

    selection.observe(segments, {
      attributeFilter: ['data-selected'],
      subtree: true
    })

    const layout = new ResizeObserver(() => place({ glides: false }))

    layout.observe(segments)

    for (const segment of segments.querySelectorAll('.segment')) {
      layout.observe(segment)
    }

    return () => {
      selection.disconnect()
      layout.disconnect()
    }
  }, [indicator, segmentKeys])
}
