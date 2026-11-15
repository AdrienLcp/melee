import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  dismissNotice,
  type Notice,
  noticeQueue,
  PASSING_NOTICE_MS,
  showPassingNotice
} from './notices'

const PLAYING: Notice = {
  action: null,
  description: null,
  title: 'blindtest.audio.playing',
  tone: 'news'
}

const shownContents = (): Notice[] =>
  noticeQueue.visibleToasts.map((toast) => toast.content)

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('window', globalThis)
})

afterEach(() => {
  for (const toast of noticeQueue.visibleToasts) {
    noticeQueue.close(toast.key)
  }

  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('showPassingNotice', () => {
  it('[notice] holds the key, so the words follow a locale switched while it stands', () => {
    showPassingNotice(PLAYING)

    expect(shownContents()).toEqual([PLAYING])
  })

  it('[notice] does not stack the same notice twice', () => {
    showPassingNotice(PLAYING)
    showPassingNotice({ ...PLAYING })

    expect(shownContents()).toHaveLength(1)
  })

  it('[notice] starts leaving once its time is up', () => {
    showPassingNotice(PLAYING)
    const [shown] = noticeQueue.visibleToasts

    vi.advanceTimersByTime(PASSING_NOTICE_MS + 1_000)

    expect(noticeQueue.visibleToasts.some((toast) => toast === shown)).toBe(
      false
    )
  })

  it('[notice] a dismissed notice can be said again', () => {
    showPassingNotice(PLAYING)
    const [shown] = noticeQueue.visibleToasts

    if (shown !== undefined) {
      dismissNotice(shown.key)
    }
    vi.advanceTimersByTime(1_000)
    showPassingNotice(PLAYING)

    expect(shownContents()).toEqual([PLAYING])
  })
})
