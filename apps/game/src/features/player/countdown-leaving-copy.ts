import { fadeOffAStillCopy } from '@/presentation/still-copy'

/**
 * Fades off a still copy of the screen counting in over the round it counted
 * in, out of the flow: the round takes presses from its first frame, which a
 * swap of the screen would hold. The whole shell, not the page: a round held
 * to the viewport is laid out wider than the column the countdown stood in,
 * and a copy of the countdown's box, then of its page, left the rest of the
 * round cut in around it.
 */
export const fadeOffTheCountdown = (): void => {
  const shell = document.querySelector('.player-page')?.closest('.app-shell')

  if (shell instanceof HTMLElement) {
    fadeOffAStillCopy({
      className: 'countdown-leaving-copy',
      element: shell,
      isFramed: true
    })
  }
}
