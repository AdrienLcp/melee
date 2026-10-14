import { useState, useSyncExternalStore } from 'react'

import { sendsGlobalPrivacyControl } from '@/infrastructure/browser'
import {
  readAnalyticsOptOut,
  writeAnalyticsOptOut
} from '@/infrastructure/storage/analytics-opt-out-storage'

/**
 * Whether this browser's visits are counted: by the visitor's choice here,
 * by Global Privacy Control, or not at all where storage is blocked.
 */
export type MeasurementChoice =
  | 'counted'
  | 'refused'
  | 'refused-by-browser'
  | 'storage-blocked'

const readMeasurementChoice = (): MeasurementChoice => {
  if (sendsGlobalPrivacyControl()) {
    return 'refused-by-browser'
  }

  const optOut = readAnalyticsOptOut()

  if (optOut.status === 'failure') {
    return 'storage-blocked'
  }

  return optOut.data ? 'refused' : 'counted'
}

/**
 * The prerender has no browser to read, and storage failing there would serve
 * every visitor a page saying their browser blocks it. A visitor who never
 * chose is counted, so that is what the served document says until the app
 * reads the real answer.
 */
const PRERENDERED_CHOICE: MeasurementChoice = 'counted'

const choiceListeners = new Set<() => void>()

const subscribeToChoice = (onChange: () => void): (() => void) => {
  choiceListeners.add(onChange)

  return () => {
    choiceListeners.delete(onChange)
  }
}

export const useMeasurementChoice = () => {
  const choice = useSyncExternalStore(
    subscribeToChoice,
    readMeasurementChoice,
    () => PRERENDERED_CHOICE
  )
  const [hasSaveFailed, setHasSaveFailed] = useState(false)

  const setCounted = (isCounted: boolean): void => {
    const saved = writeAnalyticsOptOut(!isCounted)

    setHasSaveFailed(saved.status === 'failure')

    for (const listener of choiceListeners) {
      listener()
    }
  }

  return { choice, hasSaveFailed, setCounted }
}
