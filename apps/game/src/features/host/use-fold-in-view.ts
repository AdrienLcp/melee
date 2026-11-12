import type React from 'react'
import { useEffect, useRef } from 'react'

const SCROLLS = /auto|scroll/
const STAYS_ON_SCREEN = new Set(['fixed', 'sticky'])

const scrollerOf = (element: Element): Element => {
  for (
    let parent = element.parentElement;
    parent !== null;
    parent = parent.parentElement
  ) {
    if (
      SCROLLS.test(getComputedStyle(parent).overflowY) &&
      parent.scrollHeight > parent.clientHeight
    ) {
      return parent
    }
  }

  return document.scrollingElement ?? document.documentElement
}

/** Where the scroller's content first shows: below its edge and below whatever stays stuck over it. */
const shownTopOf = ({
  content,
  scroller
}: {
  content: Element
  scroller: Element
}): number => {
  const edge =
    scroller === document.scrollingElement
      ? 0
      : scroller.getBoundingClientRect().top + scroller.clientTop
  const x = content.getBoundingClientRect().left + 1

  return document
    .elementsFromPoint(x, edge + 1)
    .filter(
      (over) =>
        !over.contains(content) &&
        STAYS_ON_SCREEN.has(getComputedStyle(over).position)
    )
    .reduce(
      (top, over) => Math.max(top, over.getBoundingClientRect().bottom),
      edge
    )
}

type FoldInView = {
  /** Call before the rows past `firstFolded` start closing. */
  fold: (firstFolded: Element) => void
  /** Lets go of the scroll, for an open press made while it is held. */
  release: () => void
}

/**
 * Holds a long list's toggle where it was pressed while the rows above it
 * fold, the scroll following the rows' own curve — or, where the rows kept
 * would land above what the scroller shows, carries the toggle down along
 * that curve until they land in sight. Left to Chromium, the scroll sat still
 * while fifty rows closed above it, then clamped, and the kept rows ended up
 * behind the panel's top edge.
 */
export const useFoldInView = ({
  list,
  toggle
}: {
  list: React.RefObject<HTMLElement | null>
  toggle: React.RefObject<HTMLElement | null>
}): FoldInView => {
  const frame = useRef<number | null>(null)

  const release = () => {
    if (frame.current !== null) {
      cancelAnimationFrame(frame.current)
      frame.current = null
    }
  }

  useEffect(
    () => () => {
      if (frame.current !== null) {
        cancelAnimationFrame(frame.current)
      }
    },
    []
  )

  const fold = (firstFolded: Element) => {
    const listElement = list.current
    const toggleElement = toggle.current

    if (listElement === null || toggleElement === null) {
      return
    }

    release()

    const scroller = scrollerOf(listElement)
    const head = listElement.closest('section') ?? listElement
    const listBox = listElement.getBoundingClientRect()
    const openHeight = listBox.height
    const foldedHeight = firstFolded.getBoundingClientRect().top - listBox.top
    const closing = openHeight - foldedHeight
    const from = toggleElement.getBoundingClientRect().top
    const toggleBelowHead = from - head.getBoundingClientRect().top - closing
    const breathing = Number.parseFloat(getComputedStyle(head).rowGap) || 0
    const to = Math.max(
      from,
      shownTopOf({ content: head, scroller }) + breathing + toggleBelowHead
    )

    if (closing <= 0) {
      return
    }

    const follow = () => {
      const closed =
        (openHeight - listElement.getBoundingClientRect().height) / closing
      const progress = Math.min(1, Math.max(0, closed))
      const wanted = from + (to - from) * progress
      const drift = toggleElement.getBoundingClientRect().top - wanted

      scroller.scrollTo({
        behavior: 'instant',
        top: scroller.scrollTop + drift
      })
      frame.current = progress < 1 ? requestAnimationFrame(follow) : null
    }

    frame.current = requestAnimationFrame(follow)
  }

  return { fold, release }
}
