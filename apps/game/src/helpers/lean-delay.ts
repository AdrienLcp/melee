/**
 * How often an answer being built on screen saves where it stands. A trailing
 * throttle rather than a debounce: a picker dragged without a pause until the
 * clock runs out would never settle long enough for a debounce to send.
 */
export const LEAN_INTERVAL_MS = 300

/**
 * How long before this screen's clock runs out the last change held back is
 * sent anyway, and from when every change goes out at once. The screen's clock
 * trails the server's by the trip the snapshot made, the lean has that trip to
 * make again, and the server pays only what reached it before its own clock.
 */
export const LAST_LEAN_LEAD_MS = 250

/**
 * How long a change waits before it is sent: the throttle's interval, cut
 * short so it never lands after the round has closed. `closesInMs` is what is
 * left of the round's clock, `null` while nothing counts down.
 */
export const leanDelayMs = (closesInMs: number | null): number =>
  closesInMs === null
    ? LEAN_INTERVAL_MS
    : Math.min(LEAN_INTERVAL_MS, Math.max(0, closesInMs - LAST_LEAN_LEAD_MS))
