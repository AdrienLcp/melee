import type { GameSettings } from '@melee/protocol/game'
import type { LineUpDeal, RoomSettings } from '@melee/protocol/room'

import { capabilitiesOf } from './game-capabilities'

/**
 * What an entry is dealt to when nobody said: a game serving its own content
 * plays its row and is drawn past the rows, one whose content the host brings
 * plays its row alone — it is played out after one round, so a draw could
 * never land on it twice.
 */
export const defaultDealOf = (entry: GameSettings): LineUpDeal =>
  capabilitiesOf(entry.kind).servesItsOwnContent ? 'both' : 'row'

/** What each entry of `lineUp` is dealt to, its default where `deals` is short. */
export const dealsOf = ({
  deals,
  lineUp
}: {
  deals: readonly LineUpDeal[]
  lineUp: readonly GameSettings[]
}): LineUpDeal[] => lineUp.map((entry, at) => deals[at] ?? defaultDealOf(entry))

/** Whether an entry dealt `deal` is owed a planned row. */
export const isDealtARow = (deal: LineUpDeal | undefined): boolean =>
  deal !== 'chance'

/** Whether an entry dealt `deal` is among the rounds drawn past the rows. */
export const isInTheDraw = (deal: LineUpDeal | undefined): boolean =>
  deal === 'chance' || deal === 'both'

/**
 * Whether every entry may be dealt what it is: only a game serving its own
 * content may sit in the draw, and there are no more deals than entries.
 */
export const dealsHold = ({
  deals,
  lineUp
}: {
  deals: readonly LineUpDeal[]
  lineUp: readonly GameSettings[]
}): boolean =>
  deals.length <= lineUp.length &&
  lineUp.every(
    (entry, at) =>
      (deals[at] ?? 'row') === 'row' ||
      capabilitiesOf(entry.kind).servesItsOwnContent
  )

/**
 * The settings with the entry `at` dealt `deal`, or as they were when that
 * entry may not be — see `dealsHold`.
 */
export const withEntryDealt = ({
  at,
  deal,
  settings
}: {
  at: number
  deal: LineUpDeal
  settings: RoomSettings
}): RoomSettings => {
  const deals = dealsOf({
    deals: settings.lineUpDeals,
    lineUp: settings.lineUp
  })

  if (at >= deals.length) {
    return settings
  }

  const lineUpDeals = deals.with(at, deal)

  return dealsHold({ deals: lineUpDeals, lineUp: settings.lineUp })
    ? { ...settings, lineUpDeals }
    : settings
}
