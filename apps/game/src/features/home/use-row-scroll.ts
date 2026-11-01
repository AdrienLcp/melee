import { useEffect, useRef, useState } from 'react'

type RowEnds = {
  /** Nothing further to scroll back to; with `isAtEnd`, the row fits whole. */
  isAtStart: boolean
  isAtEnd: boolean
}

/** A pixel of slack, for a scroll position the browser rounds. */
const END_SLACK_PX = 1

/**
 * A row of lids that scrolls sideways: which end it rests against, and a page
 * either way for the arrows a mouse needs. A page is the row's width less its
 * scroll padding, and the row's mandatory snap lands it on a lid's edge; the
 * stylesheet decides whether that travel is smooth.
 */
export const useRowScroll = () => {
  const scrollerRef = useRef<HTMLUListElement>(null)
  const [ends, setEnds] = useState<RowEnds>({ isAtEnd: true, isAtStart: true })

  useEffect(() => {
    const scroller = scrollerRef.current

    if (scroller === null) {
      return
    }

    let frame = 0
    const measure = () => {
      const furthest = scroller.scrollWidth - scroller.clientWidth

      setEnds({
        isAtEnd: scroller.scrollLeft >= furthest - END_SLACK_PX,
        isAtStart: scroller.scrollLeft <= END_SLACK_PX
      })
    }
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measure)
    }
    const observer = new ResizeObserver(measure)

    observer.observe(scroller)
    scroller.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      scroller.removeEventListener('scroll', onScroll)
    }
  }, [])

  const page = (direction: -1 | 1) => {
    const scroller = scrollerRef.current

    if (scroller === null) {
      return
    }

    const padding =
      Number.parseFloat(getComputedStyle(scroller).scrollPaddingInlineStart) ||
      0

    scroller.scrollBy({
      left: direction * (scroller.clientWidth - padding * 2)
    })
  }

  return { ...ends, page, scrollerRef }
}
