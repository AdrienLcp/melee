/** A list's direct children that carry a `data-key`, in the order the DOM holds them. */
export const keyedRowsOf = (list: HTMLElement): HTMLElement[] =>
  [...list.children].filter(
    (child): child is HTMLElement =>
      child instanceof HTMLElement && child.dataset.key !== undefined
  )

/**
 * Runs `onDrawn` once the list's keyed rows stand in `order` — their keys joined
 * by a space — at once when they already do. react-aria's collections write a
 * reorder to the DOM a commit after the render that asked for it; a mutation
 * callback still lands before that frame is painted. Returns the cancel.
 */
export const whenRowsDrawn = ({
  list,
  order,
  onDrawn
}: {
  list: HTMLElement
  order: string
  onDrawn: () => void
}): (() => void) => {
  const isDrawn = () =>
    keyedRowsOf(list)
      .map((row) => row.dataset.key)
      .join(' ') === order

  if (isDrawn()) {
    onDrawn()

    return () => {}
  }

  const observer = new MutationObserver(() => {
    if (isDrawn()) {
      observer.disconnect()
      onDrawn()
    }
  })

  observer.observe(list, { childList: true })

  return () => {
    observer.disconnect()
  }
}
