import {
  OWN_LINE_UPS_HEIGHT_KEY,
  RECENT_TABLES_KEY,
  SAVED_EVENINGS_KEY
} from './preferences-storage'
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

type StoredHeight = {
  key: string
  /** Set on the root element to the height stored under `key`, in pixels. */
  property: string
}

/** The custom property the own line-ups' held list reads its height from. */
export const HELD_OWN_LINE_UPS_PROPERTY = '--held-own-line-ups'

const STORED_HEIGHT: StoredHeight = {
  key: OWN_LINE_UPS_HEIGHT_KEY,
  property: HELD_OWN_LINE_UPS_PROPERTY
}

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

// A height drawn at another width says nothing about this one, where the
// tickets wrap differently: the held row then keeps its one-line floor.
const holdStoredHeight = ({ key, property }: StoredHeight): void => {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(key) ?? 'null')

    if (
      typeof stored === 'object' &&
      stored !== null &&
      'height' in stored &&
      'width' in stored &&
      typeof stored.height === 'number' &&
      stored.width === window.innerWidth
    ) {
      document.documentElement.style.setProperty(property, `${stored.height}px`)
    }
  } catch {
    // Storage refused or a blob unreadable: the floor holds.
  }
}

/**
 * Run inline in the head of every prerendered document, before anything is
 * painted, so the page holds room for what this device stored — its own
 * line-ups, as tall as they were last drawn at this width, a table it may
 * resume — instead of the app pushing them in a second later. Presence and a
 * height only: the app still reads each list through its schema. Written from
 * the functions' own source, which is why they close over nothing and are
 * handed their keys.
 */
export const STORED_SHELVES_SCRIPT = `(${markStoredShelves.toString()})(${JSON.stringify(STORED_SHELVES)});(${holdStoredHeight.toString()})(${JSON.stringify(STORED_HEIGHT)})`
