import { useState } from 'react'

import {
  type SavedEvening,
  withEveningSaved,
  withEveningsImported,
  withoutEvening
} from '@melee/core/room/saved-evening'

import {
  readStoredSavedEvenings,
  writeStoredSavedEvenings
} from '@/infrastructure/storage/preferences-storage'

const storedEvenings = (): readonly SavedEvening[] => {
  const stored = readStoredSavedEvenings()

  return stored.status === 'success' ? stored.data : []
}

/**
 * The evenings this host kept on this machine, and the ways the list
 * changes. Written through on every change, so a console closed straight after
 * keeping one has kept it.
 */
export const useSavedEvenings = () => {
  const [evenings, setEvenings] = useState(storedEvenings)

  const keep = (next: readonly SavedEvening[]) => {
    setEvenings(next)
    writeStoredSavedEvenings(next)
  }

  return {
    evenings,
    forget: (name: string) => {
      keep(withoutEvening({ evenings, name }))
    },
    importEvenings: (imported: readonly SavedEvening[]) => {
      keep(withEveningsImported({ evenings, imported }))
    },
    save: (evening: SavedEvening) => {
      keep(withEveningSaved({ evening, evenings }))
    }
  }
}
