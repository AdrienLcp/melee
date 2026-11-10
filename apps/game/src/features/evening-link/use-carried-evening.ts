import { useEffect, useState } from 'react'

import { eveningCarriedBy } from '@melee/core/room/evening-link'
import type { SavedEvening } from '@melee/core/room/saved-evening'

import { useLocationHash } from '@/infrastructure/router/navigation'
import { savedEveningSchema } from '@/infrastructure/storage/preferences-storage'

/** What the link this page was opened on carries. */
export type CarriedEvening =
  | { evening: SavedEvening; status: 'read' }
  | { status: 'reading' }
  | { status: 'unreadable' }

type ReadFragment = { carried: CarriedEvening; hash: string }

/**
 * The evening in the address's fragment, read through the same lenient schema
 * a kept evening is: a link outlives the build that wrote it, so an entry whose
 * settings changed shape still comes back as its game. A fragment that is
 * missing, cut short or of a later shape is `unreadable`.
 */
export const useCarriedEvening = (): CarriedEvening => {
  const hash = useLocationHash()
  const [read, setRead] = useState<ReadFragment | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    void eveningCarriedBy(hash).then((carried) => {
      if (controller.signal.aborted) {
        return
      }

      const evening = savedEveningSchema.safeParse(carried)

      setRead({
        carried: evening.success
          ? { evening: evening.data, status: 'read' }
          : { status: 'unreadable' },
        hash
      })
    })

    return () => {
      controller.abort()
    }
  }, [hash])

  return read?.hash === hash ? read.carried : { status: 'reading' }
}
