import { Result } from '@adrienlcp/result'
import { useSyncExternalStore } from 'react'

import { isAppleMobile, isStandaloneDisplay } from '@/infrastructure/browser'

/**
 * Chromium fires `beforeinstallprompt` once, early, and only to a listener
 * already in place: the listener goes in at startup and the event is kept
 * until somebody asks for it.
 */
let deferred: BeforeInstallPromptEvent | null = null
let isInstalled = false
const listeners = new Set<() => void>()

const notify = () => {
  for (const listener of listeners) listener()
}

export const listenForInstallPrompt = (): void => {
  isInstalled = isStandaloneDisplay()
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferred = event
    notify()
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    isInstalled = true
    notify()
  })
}

/**
 * - `'installed'` — running as the app already
 * - `'offered'` — the browser holds an install dialog for us to open
 * - `'manual'` — iPhone or iPad: only the browser's Share menu installs
 * - `'unoffered'` — this browser offers no install the page can lead to
 */
export type InstallState = 'installed' | 'manual' | 'offered' | 'unoffered'

const readInstallState = (): InstallState => {
  if (isInstalled) return 'installed'
  if (deferred !== null) return 'offered'

  return isAppleMobile() ? 'manual' : 'unoffered'
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

export const useInstallState = (): InstallState =>
  useSyncExternalStore(subscribe, readInstallState, () => 'unoffered')

/** The browser's own install dialog; each event opens it once. */
export const promptInstall = async (): Promise<
  Result<'accepted' | 'dismissed', 'unoffered'>
> => {
  const event = deferred

  if (event === null) return Result.failure('unoffered')

  deferred = null
  notify()
  await event.prompt()
  const choice = await event.userChoice

  return Result.success(choice.outcome)
}
