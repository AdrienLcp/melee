import type React from 'react'

import type { GameSettings } from '@melee/protocol/game'
import type { RoomPhase } from '@melee/protocol/room'

import { capabilitiesOf } from '@melee/core/room/game-capabilities'
import { isPlayedOut } from '@melee/core/room/next-game'
import { isRoundInPlay } from '@melee/core/room/room-phase'

import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './evening-stamp.sass'

/**
 * The one fact a host acts on about a round of the evening, at most:
 * - `now` — its round is the one under way
 * - `first` / `next` — the next round opens on it, before the game or after one
 * - `played` — a round the host brought, played and fixed
 * - `count` — a game that fills the evening, and how often it has
 * - `once` — a round the host brings, still to come
 * - `beyond` — a round of an evening in order placed after its count's last
 */
export type EveningStampKind =
  | 'beyond'
  | 'count'
  | 'first'
  | 'next'
  | 'now'
  | 'once'
  | 'played'

export const eveningStampOf = ({
  entry,
  isEveningOver,
  isNext,
  isOnlyEntry,
  phase,
  played
}: {
  entry: GameSettings
  /** The round on screen is the evening's last, so nothing comes next. */
  isEveningOver: boolean
  /** The next round opens on this entry. */
  isNext: boolean
  /** A room of one game, where being next says nothing. */
  isOnlyEntry: boolean
  phase: RoomPhase
  played: number
}): EveningStampKind | null => {
  if (isNext && !isOnlyEntry && !isEveningOver) {
    if (isRoundInPlay(phase)) {
      return 'now'
    }

    return phase === 'lobby' ? 'first' : 'next'
  }

  if (isPlayedOut({ entry, played })) {
    return 'played'
  }

  if (!capabilitiesOf(entry.kind).servesItsOwnContent) {
    return 'once'
  }

  return played > 0 ? 'count' : null
}

type EveningStampProps = {
  kind: EveningStampKind
  /** How many rounds the entry has opened, printed by `count`. */
  played: number
}

export const EveningStamp: React.FC<EveningStampProps> = ({ kind, played }) => {
  const translate = useTranslate()

  return (
    <span className='evening-stamp' data-stamp={kind}>
      {kind === 'count'
        ? translate('host.evening.stamp.count', { count: played })
        : translate(`host.evening.stamp.${kind}`)}
    </span>
  )
}
