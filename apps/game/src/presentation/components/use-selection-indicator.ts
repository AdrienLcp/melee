import { type RefObject, useLayoutEffect } from 'react'

const SELECTED_SEGMENT = '.segment[data-selected]'

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
  const { offsetHeight, offsetLeft, offsetTop, offsetWidth } = segment

  indicator.style.setProperty('--indicator-x', `${offsetLeft}px`)
  indicator.style.setProperty('--indicator-y', `${offsetTop}px`)
  indicator.style.setProperty('--indicator-width', `${offsetWidth}px`)
  indicator.style.setProperty('--indicator-height', `${offsetHeight}px`)
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
 *
 * **Nothing is read while the strip mounts.** The first placement waits for
 * the `ResizeObserver`'s first answer, which the browser gives after its own
 * layout and before it paints, so the piece is down in the strip's first
 * frame with no layout forced ahead of it. Read in the commit instead, every
 * offset restyled the whole page the panel had just been added to — the
 * menu's two strips cost a sixth of its open on a phone. A new choice is read
 * on the next frame, with the layout that frame does anyway.
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
    let isPlaced = false
    let placedFrame: number | null = null
    let choiceFrame: number | null = null

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

    const layout = new ResizeObserver(() => {
      place({ glides: false })

      if (isPlaced) {
        return
      }

      isPlaced = true
      // A frame later, once the first placement is styled: a transition on
      // from the start plays the piece in from the strip's corner.
      placedFrame = requestAnimationFrame(() => {
        piece.toggleAttribute('data-placed', true)
      })
    })

    layout.observe(segments)

    for (const segment of segments.querySelectorAll('.segment')) {
      layout.observe(segment)
    }

    const selection = new MutationObserver(() => {
      if (!isPlaced || choiceFrame !== null) {
        return
      }

      choiceFrame = requestAnimationFrame(() => {
        choiceFrame = null
        place({ glides: true })
      })
    })

    selection.observe(segments, {
      attributeFilter: ['data-selected'],
      subtree: true
    })

    return () => {
      selection.disconnect()
      layout.disconnect()

      for (const frame of [placedFrame, choiceFrame]) {
        if (frame !== null) {
          cancelAnimationFrame(frame)
        }
      }
    }
  }, [indicator, segmentKeys])
}
