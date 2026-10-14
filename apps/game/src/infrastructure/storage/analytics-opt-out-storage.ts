import { Result } from '@adrienlcp/result'
import {
  readStoredText,
  removeStored,
  type StorageUnavailable,
  type StorageWriteError,
  writeStoredText
} from '@adrienlcp/safe-storage'

/** The key and value the analytics tracker reads before it counts a visit. */
export const ANALYTICS_OPT_OUT_KEY = 'analytics:ignore'

const OPTED_OUT = 'true'

/** Whether this browser refused audience measurement on this site. */
export const readAnalyticsOptOut = (): Result<boolean, StorageUnavailable> => {
  const stored = readStoredText(ANALYTICS_OPT_OUT_KEY)

  if (stored.status === 'failure') {
    return stored
  }

  return Result.success(stored.data === OPTED_OUT)
}

/** Refuses measurement in this browser, or removes the refusal to resume it. */
export const writeAnalyticsOptOut = (
  isOptedOut: boolean
): Result<void, StorageWriteError> =>
  isOptedOut
    ? writeStoredText({ key: ANALYTICS_OPT_OUT_KEY, text: OPTED_OUT })
    : removeStored(ANALYTICS_OPT_OUT_KEY)
