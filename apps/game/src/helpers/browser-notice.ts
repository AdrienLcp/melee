/**
 * What the browser raises on `window` when a `ResizeObserver` callback resized
 * something already measured that frame: Chromium, Firefox and WebKit say the
 * first, an older Chromium the second. The measurement is delivered a frame
 * later and nothing breaks, so it belongs in a report's trail, never in a
 * report of its own.
 */
const RESIZE_LOOP_NOTICE =
  /^(Uncaught )?ResizeObserver loop (completed with undelivered notifications|limit exceeded)/

/**
 * Says whether a `window` `error` is a browser notice rather than a fault. A
 * notice arrives as a bare message with no `Error` behind it: an `Error` that
 * happens to say the same words was thrown by somebody, and is reported.
 */
export const isBrowserNotice = (error: unknown): boolean =>
  typeof error === 'string' && RESIZE_LOOP_NOTICE.test(error)
