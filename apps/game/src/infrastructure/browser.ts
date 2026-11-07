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

/**
 * Safari on an iPhone keeps fullscreen for a video and refuses it to a page,
 * and an installed app already fills the screen it was given, so the press
 * would change nothing either way. A page the press itself made fullscreen
 * matches `display-mode: fullscreen` too, and must still be offered the way out.
 */
export const canGoFullscreen = (): boolean =>
  isFullscreen() ||
  (document.fullscreenEnabled === true &&
    !isStandaloneDisplay() &&
    !matchMedia('(display-mode: fullscreen)').matches)

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

/** What the screen shows of the page, in CSS pixels at the page's own zoom. */
export type ShownViewport = {
  /** The height shown, which an on-screen keyboard or the browser's bars take from. */
  heightPx: number
  /**
   * How far down the layout viewport the shown band sits. An engine that lays
   * its keyboard over the page pans the band down to bring the field above
   * it, and leaves it there; zero while pinch-zoomed, where panning is the
   * reader's own.
   */
  offsetTopPx: number
}

/**
 * Calls `listener` now and again whenever an on-screen keyboard, the browser's
 * bars or a pan change what the screen shows. Safari on iOS and the WebView a
 * messaging app opens a link in leave the layout viewport whole under their
 * keyboard, so `dvh` never shrinks there and only the visual viewport says
 * what is left, and where. Times its scale, so a pinch-zoom is not read as a
 * keyboard.
 */
export const onShownViewportChange = (
  listener: (shown: ShownViewport) => void
): (() => void) => {
  const viewport = window.visualViewport

  if (viewport === null) {
    return () => {}
  }

  const publish = () => {
    const isZoomed = Math.abs(viewport.scale - 1) > 0.01

    listener({
      heightPx: viewport.height * viewport.scale,
      offsetTopPx: isZoomed ? 0 : viewport.offsetTop
    })
  }

  publish()
  viewport.addEventListener('resize', publish)
  viewport.addEventListener('scroll', publish)

  return () => {
    viewport.removeEventListener('resize', publish)
    viewport.removeEventListener('scroll', publish)
  }
}

export const prefersReducedMotion = (): boolean =>
  matchMedia('(prefers-reduced-motion: reduce)').matches

let viewTransitionsRunning = 0

const markViewTransitionEnded = (): void => {
  viewTransitionsRunning -= 1
}

/**
 * Wraps every view transition the page starts, the router's included, for two
 * jobs. Chromium rejects a transition's `ready` when the viewport changes
 * before the new screen is captured — an address bar retracting as a page is
 * left — and, against the spec, leaves the rejection unhandled: the transition
 * is skipped and the page lands either way, so the line is taken out of the
 * console. And it counts the transitions still playing, which `replaceScreen`
 * reads so as not to skip one.
 */
export const watchViewTransitions = (): void => {
  if (typeof document.startViewTransition !== 'function') {
    return
  }

  const start = document.startViewTransition.bind(document)

  document.startViewTransition = (update) => {
    const transition = start(update)
    viewTransitionsRunning += 1
    transition.ready.catch(() => undefined)
    transition.finished.then(markViewTransitionEnded, markViewTransitionEnded)

    return transition
  }
}

const LAYOUT_MOVED_EVENT = 'melee:layout-moved'

const LAYOUT_MOVE_ATTRIBUTE = 'data-layout-move'

let layoutMovesRunning = 0

const markLayoutMoveEnded = (): void => {
  layoutMovesRunning -= 1

  if (layoutMovesRunning === 0) {
    document.documentElement.removeAttribute(LAYOUT_MOVE_ATTRIBUTE)
  }
}

/**
 * Plays a change of layout as one move from the old screen to the new, where
 * the browser can and the visitor has not asked for less motion. `update` must
 * reach the DOM before it returns, so a React state change goes in `flushSync`.
 *
 * The root carries `data-layout-move` for as long as a move runs, and only
 * then do the panel, the stage and the board's cases take a transition name of
 * their own: on a page change they stay in the page's picture, which the page
 * being left fades over, rather than each fading in on the browser's default.
 */
export const moveLayout = (update: () => void): void => {
  if (
    prefersReducedMotion() ||
    typeof document.startViewTransition !== 'function'
  ) {
    update()

    return
  }

  layoutMovesRunning += 1
  document.documentElement.setAttribute(LAYOUT_MOVE_ATTRIBUTE, '')

  const transition = document.startViewTransition(() => {
    update()
    window.dispatchEvent(new Event(LAYOUT_MOVED_EVENT))
  })

  transition.finished.then(markLayoutMoveEnded, markLayoutMoveEnded)
}

/**
 * Plays one screen replaced by another inside a page the way a page change
 * plays: the screen being left fades over the new one, which lays itself
 * down. Unlike `moveLayout`, nothing takes a transition name of its own, so a
 * piece only the new screen holds arrives with it rather than fading in on
 * the browser's default above the screen being left. `update` must reach the
 * DOM before it returns.
 *
 * A transition already playing — a page being left — is never cut for it:
 * starting another skips the one running, and the update lands inside it.
 */
export const replaceScreen = (update: () => void): void => {
  if (
    prefersReducedMotion() ||
    typeof document.startViewTransition !== 'function' ||
    viewTransitionsRunning > 0
  ) {
    update()

    return
  }

  document.startViewTransition(update)
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
