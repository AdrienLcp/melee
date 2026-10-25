import type React from 'react'

import './main.sass'

const MAIN_ID = 'main'

/** Where the skip link sends keyboard focus: the page's own landmark. */
export const MAIN_HREF = `#${MAIN_ID}`

const keepBackgroundClicksInert = (
  event: React.MouseEvent<HTMLElement>
): void => {
  if (event.target === event.currentTarget) {
    event.preventDefault()
  }
}

/**
 * The one `<main>` of a page: the skip link's target and where focus lands
 * after a navigation. Focusable by script, never by Tab.
 */
export const Main: React.FC<
  Omit<React.ComponentProps<'main'>, 'id' | 'onMouseDown' | 'tabIndex'>
> = (props) => (
  <main
    {...props}
    id={MAIN_ID}
    onMouseDown={keepBackgroundClicksInert}
    tabIndex={-1}
  />
)

/** Moves focus to the page's landmark, as a navigation does. */
export const focusMain = (options?: FocusOptions): void => {
  document.getElementById(MAIN_ID)?.focus(options)
}

const TABBABLE_SELECTOR = [
  'a[href]',
  'button:not(:disabled)',
  'input:not(:disabled)',
  'select:not(:disabled)',
  'textarea:not(:disabled)',
  '[tabindex]:not([tabindex="-1"])'
].join(', ')

const isReachableByTab = (element: HTMLElement): boolean =>
  element.tabIndex >= 0 &&
  element.closest('[inert]') === null &&
  element.checkVisibility({ visibilityProperty: true })

/**
 * Moves focus to the page's first control, as the skip link does: the landmark
 * itself draws no ring, so landing there would leave nothing on screen to say
 * where the keyboard went. A page with no control falls back to the landmark.
 */
export const focusFirstControlInMain = (): void => {
  const main = document.getElementById(MAIN_ID)
  const firstControl = [
    ...(main?.querySelectorAll<HTMLElement>(TABBABLE_SELECTOR) ?? [])
  ].find(isReachableByTab)

  if (firstControl === undefined) {
    focusMain()
    return
  }

  firstControl.focus()
}
