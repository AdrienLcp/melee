import type { RefCallback } from 'react'

/**
 * The host-away band is fixed over the top of the wall, and the page makes
 * room for it while it is shown rather than letting it cover the header — a
 * stylesheet cannot know how tall it is, since its line wraps on a narrow
 * wall. Written on the root element, as the menu's width is.
 */
export const publishHostAwayHeight: RefCallback<HTMLElement> = (element) => {
  if (element === null) {
    return
  }

  const observer = new ResizeObserver(() => {
    document.documentElement.style.setProperty(
      '--host-away-height',
      `${Math.ceil(element.getBoundingClientRect().height)}px`
    )
  })

  observer.observe(element)

  return () => {
    observer.disconnect()
    document.documentElement.style.removeProperty('--host-away-height')
  }
}
