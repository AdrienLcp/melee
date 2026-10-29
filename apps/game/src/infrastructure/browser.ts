import { Result } from '@adrienlcp/result'

/**
 * The socket shares the page's origin: in dev the Vite proxy forwards `/ws` to
 * the server, in production the same host serves both. That is what lets the
 * QR code encode `location.origin` and keeps CORS out of the picture.
 */
export const socketOrigin = (): string =>
  `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}`

/** Most-preferred first, as BCP-47 tags — `['fr-FR', 'fr', 'en-US']`. */
export const preferredLocales = (): readonly string[] => navigator.languages

/**
 * The path the document was served at, which is where the language it is
 * written in is named. Read here rather than through the router because the
 * attribute on `<html>` has to be right before the router exists.
 */
export const servedPath = (): string => location.pathname

export { canShareLinks, reloadPage, shareLink } from '@adrienlcp/browser'

/** The thumb landing, and the server's answer to it one round trip later. */
export type BuzzMoment = 'lost' | 'press' | 'won'

/**
 * Written as a set because what tells a thumb which of these it is holding is
 * the contrast between them, never the length of any one: an acknowledging
 * tick, one firm thud at three times its length for the floor, and two shorter
 * knocks for a refusal — a shape no single pulse can be mistaken for, on a
 * motor this coarse.
 */
const BUZZ_PATTERNS: Record<BuzzMoment, VibratePattern> = {
  lost: [45, 65, 45],
  press: 30,
  won: 100
}

/**
 * Absent on iOS Safari, and silently so. Nothing may be built on top of it —
 * it confirms a buzz that the screen already confirmed.
 */
export const buzzFeedback = (moment: BuzzMoment): void => {
  navigator.vibrate?.(BUZZ_PATTERNS[moment])
}

/** A round about to run out under a thumb still in it, and running out. */
export type ClockMoment = 'closing' | 'timeUp'

/**
 * Apart from the buzz's set on purpose: a light double tap reads as a warning
 * rather than an answer, and one long hold as the end of something.
 */
const CLOCK_PATTERNS: Record<ClockMoment, VibratePattern> = {
  closing: [20, 90, 20],
  timeUp: 250
}

/** Absent on iOS Safari like `buzzFeedback`, and the screen says it all too. */
export const clockFeedback = (moment: ClockMoment): void => {
  navigator.vibrate?.(CLOCK_PATTERNS[moment])
}

/**
 * The browser sends Global Privacy Control: the visitor refused measurement
 * once, for every site. Not in TypeScript's DOM types yet.
 */
export const sendsGlobalPrivacyControl = (): boolean =>
  'globalPrivacyControl' in navigator && navigator.globalPrivacyControl === true

/** Opened as an installed app rather than in a browser tab. */
export const isStandaloneDisplay = (): boolean =>
  matchMedia('(display-mode: standalone)').matches ||
  navigator.standalone === true

/**
 * iPhone and iPad install from the Share menu and never fire an install
 * prompt. iPadOS reports itself as a Mac, so a touch screen is what tells.
 */
export const isAppleMobile = (): boolean =>
  /iPhone|iPad|iPod/.test(navigator.userAgent) ||
  (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1)

/** Safari on an iPhone keeps fullscreen for a video and refuses it to a page. */
export const canGoFullscreen = (): boolean => document.fullscreenEnabled

export const isFullscreen = (): boolean => document.fullscreenElement !== null

/** Leaving by Escape or the browser's own control is announced here too. */
export const onFullscreenChange = (listener: () => void): (() => void) => {
  document.addEventListener('fullscreenchange', listener)

  return () => {
    document.removeEventListener('fullscreenchange', listener)
  }
}

export const toggleFullscreen = async (): Promise<void> => {
  if (isFullscreen()) {
    await document.exitFullscreen()

    return
  }

  await document.documentElement.requestFullscreen()
}

export const prefersReducedMotion = (): boolean =>
  matchMedia('(prefers-reduced-motion: reduce)').matches

const LAYOUT_MOVED_EVENT = 'melee:layout-moved'

/**
 * Plays a change of layout as one move from the old screen to the new, where
 * the browser can and the visitor has not asked for less motion. `update` must
 * reach the DOM before it returns, so a React state change goes in `flushSync`.
 */
export const moveLayout = (update: () => void): void => {
  if (
    prefersReducedMotion() ||
    typeof document.startViewTransition !== 'function'
  ) {
    update()

    return
  }

  document.startViewTransition(() => {
    update()
    window.dispatchEvent(new Event(LAYOUT_MOVED_EVENT))
  })
}

/**
 * The browser holds every `ResizeObserver` back until a transition has
 * captured the new screen, so whatever lays itself out by measuring measures
 * again here, or it is captured at its old size and jumps once the move ends.
 */
export const onLayoutMoved = (listener: () => void): (() => void) => {
  window.addEventListener(LAYOUT_MOVED_EVENT, listener)

  return () => {
    window.removeEventListener(LAYOUT_MOVED_EVENT, listener)
  }
}

/** Hands `text` to the browser as a file to save under `name`. */
export const saveTextFile = ({
  name,
  text
}: {
  name: string
  text: string
}): void => {
  const url = URL.createObjectURL(
    new Blob([text], { type: 'application/json' })
  )
  const link = document.createElement('a')

  link.download = name
  link.href = url
  link.click()
  // Safari drops a download whose URL is revoked in the same task as the click.
  setTimeout(() => {
    URL.revokeObjectURL(url)
  })
}

/** The text of a file the visitor picked; `unreadable` when the browser refuses it. */
export const readFileText = async (
  file: File
): Promise<Result<string, 'unreadable'>> => {
  try {
    return Result.success(await file.text())
  } catch {
    return Result.failure('unreadable')
  }
}
