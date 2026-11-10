import { useEffect, useState } from 'react'

import type { SavedEvening } from '@melee/core/room/saved-evening'

import { eveningUrlFor } from '@/infrastructure/router/navigation'
import { useI18n } from '@/presentation/i18n/i18n-provider'

/**
 * The link each kept evening is shared by, by name, written before anybody
 * presses: deflating it takes a promise, and a clipboard written after one has
 * left the press that allowed it, which Safari refuses. An evening is missing
 * until its link is written.
 */
export const useEveningLinks = (
  evenings: readonly SavedEvening[]
): ReadonlyMap<string, string> => {
  const { locale } = useI18n()
  const [links, setLinks] = useState<ReadonlyMap<string, string>>(
    () => new Map()
  )

  useEffect(() => {
    const controller = new AbortController()

    void Promise.all(
      evenings.map(
        async (evening) =>
          [evening.name, await eveningUrlFor({ evening, locale })] as const
      )
    ).then((written) => {
      if (!controller.signal.aborted) {
        setLinks(new Map(written))
      }
    })

    return () => {
      controller.abort()
    }
  }, [evenings, locale])

  return links
}
