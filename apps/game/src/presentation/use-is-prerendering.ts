import { useSyncExternalStore } from 'react'

const subscribeToNothing = (): (() => void) => () => undefined

const inTheBrowser = (): boolean => false

const atBuildTime = (): boolean => true

/**
 * `true` while the build writes a page into its served document, which knows
 * nothing of the device that will open it, and `false` in every browser
 * render: the app mounts with `createRoot` rather than hydrating, so the
 * server snapshot is never read there.
 */
export const useIsPrerendering = (): boolean =>
  useSyncExternalStore(subscribeToNothing, inTheBrowser, atBuildTime)
