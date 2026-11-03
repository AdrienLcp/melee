import { RECENT_TABLES_KEY, SAVED_EVENINGS_KEY } from './preferences-storage'
import { HOST_TOKENS_KEY } from './session-storage'

type StoredShelf = {
  /** Set on the root element when any of `keys` holds a non-empty list. */
  attribute: string
  keys: readonly string[]
}

const STORED_SHELVES: readonly StoredShelf[] = [
  {
    attribute: 'data-holds-line-ups',
    keys: [RECENT_TABLES_KEY, SAVED_EVENINGS_KEY]
  },
  { attribute: 'data-holds-table', keys: [HOST_TOKENS_KEY] }
]

const markStoredShelves = (shelves: readonly StoredShelf[]): void => {
  try {
    for (const { attribute, keys } of shelves) {
      for (const key of keys) {
        const stored: unknown = JSON.parse(localStorage.getItem(key) ?? '[]')

        if (Array.isArray(stored) && stored.length > 0) {
          document.documentElement.setAttribute(attribute, '')
        }
      }
    }
  } catch {
    // Storage refused or a blob unreadable: the page holds no room, as for a
    // first visit.
  }
}

/**
 * Run inline in the head of every prerendered document, before anything is
 * painted, so the page holds room for what this device stored — its own
 * line-ups, a table it may resume — instead of the app pushing them in a
 * second later. Presence only: the app still reads each list through its
 * schema. Written from the function's own source, which is why it closes over
 * nothing and is handed its keys.
 */
export const STORED_SHELVES_SCRIPT = `(${markStoredShelves.toString()})(${JSON.stringify(STORED_SHELVES)})`
