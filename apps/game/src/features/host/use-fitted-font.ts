import { type RefObject, useLayoutEffect, useRef } from 'react'

const SMALLEST_PX = 4
const LARGEST_PX = 160
const SEARCH_STEPS = 9

/**
 * A still copy of the list laid in its box out of sight: what it holds once
 * every row and chip leaving has gone, with nothing moving. The list itself
 * is measured mid-regroup — a row closing, a travel holding a row at its old
 * height — and read there a font did not change what it measured.
 */
const settledCopyOf = ({
  content,
  frame
}: {
  content: HTMLElement
  frame: HTMLElement
}): HTMLElement => {
  const copy = content.cloneNode(true)

  if (!(copy instanceof HTMLElement)) {
    throw new TypeError('A cloned element is an element')
  }

  for (const leaving of copy.querySelectorAll('[data-leaving]')) {
    leaving.remove()
  }

  for (const piece of [copy, ...copy.querySelectorAll<HTMLElement>('*')]) {
    piece.style.animation = 'none'
    piece.style.transition = 'none'
  }

  copy.removeAttribute('id')
  copy.setAttribute('aria-hidden', 'true')
  copy.style.inlineSize = `${content.offsetWidth}px`
  copy.style.insetBlockStart = '0'
  copy.style.insetInlineStart = '0'
  copy.style.pointerEvents = 'none'
  copy.style.position = 'absolute'
  copy.style.visibility = 'hidden'
  frame.append(copy)

  return copy
}

/**
 * Sets `--fitted-size` on `list` to the largest font its box holds it at
 * whole, the stylesheet clamping it between the floor and the ceiling it
 * gives, read off a still copy of the list. When what the list holds
 * changed, the list eases from the size drawn before to the one found — a
 * regroup grows or shrinks the table, never jumps it — and it is set at once
 * when the box alone changed, which a window resized follows.
 */
export const useFittedFont = ({
  box,
  list,
  signature
}: {
  /** The box with a height of its own the list has to fit in. */
  box: RefObject<HTMLElement | null>
  list: RefObject<HTMLElement | null>
  /** What the list holds, joined: a change is what fits it again. */
  signature: string
}): void => {
  const fittedFor = useRef<string | null>(null)

  useLayoutEffect(() => {
    const frame = box.current
    const content = list.current

    if (frame === null || content === null) {
      return
    }

    const isRefilled =
      fittedFor.current !== null && fittedFor.current !== signature

    fittedFor.current = signature

    const fit = ({ eases }: { eases: boolean }) => {
      const drawn = content.style.getPropertyValue('--fitted-size')
      const room = frame.clientHeight
      const copy = settledCopyOf({ content, frame })
      const fitsAt = (px: number): boolean => {
        copy.style.setProperty('--fitted-size', `${px}px`)

        return copy.offsetHeight <= room
      }

      let fits = SMALLEST_PX
      let overflows = LARGEST_PX

      for (let step = 0; step < SEARCH_STEPS; step += 1) {
        const middle = (fits + overflows) / 2

        if (fitsAt(middle)) {
          fits = middle
        } else {
          overflows = middle
        }
      }

      copy.remove()

      const found = `${Math.floor(fits)}px`

      if (found === drawn) {
        return
      }

      if (eases && drawn !== '') {
        content.style.setProperty('--fitted-size', found)

        return
      }

      content.style.transition = 'none'
      content.style.setProperty('--fitted-size', found)
      content.getBoundingClientRect()
      content.style.removeProperty('transition')
    }

    fit({ eases: isRefilled })

    let isFirstObservation = true
    // An observer reports the box once as it starts, which the fit above
    // already answered: fitting again there would cut its ease short.
    const observer = new ResizeObserver(() => {
      if (isFirstObservation) {
        isFirstObservation = false

        return
      }

      fit({ eases: false })
    })

    observer.observe(frame)

    return () => {
      observer.disconnect()
    }
  }, [box, list, signature])
}
