import { useEffect, useEffectEvent, useRef, useSyncExternalStore } from 'react'
import { UNSTABLE_ToastQueue as ToastQueue } from 'react-aria-components'

import type { PlainTranslationKey } from '@/presentation/i18n/translation'

/** The one press a notice may carry: what fixes what it says. */
export type NoticeAction = {
  label: PlainTranslationKey
  onPress: () => void
}

/**
 * A line laid over every screen, above whatever page is open. It holds keys,
 * read in the locale of the moment it is drawn, so a language switched while
 * it stands is followed.
 * - `fault` — something on this screen is wrong and stays wrong until it is
 *   fixed: stamped in danger
 * - `news` — something happened, and nothing has to be done about it
 */
export type Notice = {
  /** A press that fixes the fault, or `null`. */
  action: NoticeAction | null
  /** What to do about it, or `null` when the title says enough. */
  description: PlainTranslationKey | null
  title: PlainTranslationKey
  tone: 'fault' | 'news'
}

/** How long a passing notice stays when nothing takes it down sooner. */
export const PASSING_NOTICE_MS = 6_000

/**
 * The longest a leaving notice is waited on before it is taken out anyway:
 * its exit is a keyframe whose `animationend` a hidden tab never sends.
 */
const LEAVE_FALLBACK_MS = 1_000

/** Three fit at a phone's width below the menu; a fourth waits its turn. */
export const noticeQueue = new ToastQueue<Notice>({ maxVisibleToasts: 3 })

const subscribeToNotices = (listener: () => void): (() => void) =>
  noticeQueue.subscribe(listener)

const readHasNotices = (): boolean => noticeQueue.visibleToasts.length > 0

const readNoNotices = (): boolean => false

/** Whether any notice is drawn or leaving, which is when the region is needed at all. */
export const useHasNotices = (): boolean =>
  useSyncExternalStore(subscribeToNotices, readHasNotices, readNoNotices)

let leaving: ReadonlySet<string> = new Set()
const leavingListeners = new Set<() => void>()

const setLeaving = (next: ReadonlySet<string>): void => {
  leaving = next

  for (const listener of leavingListeners) {
    listener()
  }
}

const subscribeToLeaving = (listener: () => void): (() => void) => {
  leavingListeners.add(listener)

  return () => {
    leavingListeners.delete(listener)
  }
}

const readLeaving = (): ReadonlySet<string> => leaving

/** The notices playing their exit, kept drawn until it ends. */
export const useLeavingNotices = (): ReadonlySet<string> =>
  useSyncExternalStore(subscribeToLeaving, readLeaving, readLeaving)

/** Takes a notice out of the queue once its exit has played. */
export const removeNotice = (key: string): void => {
  noticeQueue.close(key)

  if (leaving.has(key)) {
    const next = new Set(leaving)

    next.delete(key)
    setLeaving(next)
  }
}

/** Plays a notice's exit, then removes it; one still waiting its turn goes at once. */
export const dismissNotice = (key: string): void => {
  const isDrawn = noticeQueue.visibleToasts.some((toast) => toast.key === key)

  if (!isDrawn) {
    noticeQueue.close(key)

    return
  }

  if (leaving.has(key)) {
    return
  }

  setLeaving(new Set(leaving).add(key))
  window.setTimeout(() => {
    removeNotice(key)
  }, LEAVE_FALLBACK_MS)
}

const isSameNotice = (left: Notice, right: Notice): boolean =>
  left.tone === right.tone &&
  left.title === right.title &&
  left.description === right.description &&
  left.action?.label === right.action?.label

/**
 * Says something that happened, and takes it down after `PASSING_NOTICE_MS`.
 * The same notice already on screen is not stacked a second time, and its
 * key is the one handed back, for whoever wants it gone sooner.
 */
export const showPassingNotice = (notice: Notice): string => {
  const shown = noticeQueue.visibleToasts.find(
    (toast) => !leaving.has(toast.key) && isSameNotice(toast.content, notice)
  )

  if (shown !== undefined) {
    return shown.key
  }

  const key = noticeQueue.add(notice)

  window.setTimeout(() => {
    dismissNotice(key)
  }, PASSING_NOTICE_MS)

  return key
}

const signatureOf = (notice: Notice | null): string | null =>
  notice === null
    ? null
    : [notice.tone, notice.title, notice.description, notice.action?.label]
        .map((part) => part ?? '')
        .join('\n')

/**
 * A notice that stands for as long as `notice` is not `null` — a state, not
 * an event — and leaves when it turns `null`. A change of words replaces it;
 * its press always runs the latest `onPress` handed here.
 */
export const useStandingNotice = (notice: Notice | null): void => {
  const pressRef = useRef(notice?.action?.onPress)
  const signature = signatureOf(notice)
  const readNotice = useEffectEvent(() => notice)

  useEffect(() => {
    pressRef.current = notice?.action?.onPress
  })

  useEffect(() => {
    const shown = signature === null ? null : readNotice()

    if (shown === null) {
      return
    }

    const key = noticeQueue.add({
      ...shown,
      action:
        shown.action === null
          ? null
          : {
              label: shown.action.label,
              onPress: () => {
                pressRef.current?.()
              }
            }
    })

    return () => {
      dismissNotice(key)
    }
  }, [signature])
}
