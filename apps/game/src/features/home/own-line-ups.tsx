import type React from 'react'
import { useState } from 'react'

import type { GameKind } from '@melee/protocol/game'

import {
  gamesOfPlayedLineUp,
  type HomeLineUp,
  homeLineUps,
  isSameLineUp,
  type PlayedLineUp,
  type RecentTable,
  savedEveningOfRecent
} from '@melee/core/room/recent-tables'
import { isSameName, type SavedEvening } from '@melee/core/room/saved-evening'

import { useSavedEvenings } from '@/features/host/use-saved-evenings'
import { calendarDaysBetween, nowMs } from '@/infrastructure/clock'
import { readStoredRecentTables } from '@/infrastructure/storage/preferences-storage'
import { StarIcon } from '@/presentation/components/icons'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { type LidStar, LineUpLid } from './line-up-lid'
import { LineUpRow } from './line-up-row'
import type { CreateRoom } from './use-create-room'
import { useLineUpFace, useRoundsText } from './use-line-up-face'

import './own-line-ups.sass'

type OwnLineUpsProps = {
  /** The home page's one room opener, shared with every lid and the door. */
  createRoom: CreateRoom
}

const storedRecents = (): readonly RecentTable[] => {
  const stored = readStoredRecentTables()

  return stored.status === 'success' ? stored.data : []
}

/**
 * The host's own line-ups, one lid each: the ones they starred first, then
 * the tables this device played, latest first — a line-up starred and played
 * shows once, as the saved one, with how its last table went. Absent until
 * there is one.
 *
 * The order is dealt once, as the page opens: a star pressed here takes or
 * gives back the line-up's place on the next visit, so no lid moves under the
 * finger. A row of plays with no saved line-up in it ends on an empty socket that
 * says what the star is for.
 */
export const OwnLineUps: React.FC<OwnLineUpsProps> = ({ createRoom }) => {
  const translate = useTranslate()
  const face = useLineUpFace()
  const roundsText = useRoundsText()
  const saved = useSavedEvenings()
  const [shelf] = useState(() => {
    const lineUps = homeLineUps({
      evenings: saved.evenings,
      recents: storedRecents()
    })

    return {
      lineUps,
      now: nowMs(),
      teachesStar: lineUps.length > 0 && saved.evenings.length === 0
    }
  })
  const { isOpeningAny, lineUpOpening, openLineUp } = createRoom

  if (shelf.lineUps.length === 0) {
    return null
  }

  const keptAs = (lineUp: PlayedLineUp): SavedEvening | undefined =>
    saved.evenings.find((evening) =>
      isSameLineUp({ left: evening, right: lineUp })
    )

  const starOf = (lineUp: HomeLineUp, name: string): LidStar => {
    if (lineUp.evening !== null) {
      const { evening } = lineUp

      return {
        isOn: saved.evenings.some((kept) =>
          isSameName(kept.name, evening.name)
        ),
        onChange: (isOn) => {
          if (isOn) {
            saved.save(evening)
          } else {
            saved.forget(evening.name)
          }
        }
      }
    }

    const { recent } = lineUp
    const kept = keptAs(recent)

    return {
      isOn: kept !== undefined,
      onChange: (isOn) => {
        if (isOn) {
          saved.save(savedEveningOfRecent({ name, recent }))
        } else if (kept !== undefined) {
          saved.forget(kept.name)
        }
      }
    }
  }

  const nameOf = (lineUp: HomeLineUp, gamesText: string): string => {
    if (lineUp.evening !== null) {
      return lineUp.evening.name
    }

    const { readyMade } = lineUp.recent

    return readyMade === null
      ? gamesText
      : translate(`readyMade.lineUps.${readyMade}.name`)
  }

  const lidOf = (lineUp: HomeLineUp) => {
    const played: PlayedLineUp = lineUp.evening ?? lineUp.recent
    const games = gamesOfPlayedLineUp(played)
    const gamesText = face.gamesText(games)
    const { recent } = lineUp
    const name = nameOf(lineUp, gamesText)
    const key =
      lineUp.evening === null
        ? `recent:${lineUp.recent.roomCode}`
        : `evening:${lineUp.evening.name}`

    return (
      <LineUpLid
        band={played.lineUp.map(gameOfSavedEntry)}
        caption={
          recent === null
            ? null
            : face.roundsPlayed({
                roundCount: recent.roundCount,
                roundsPlayed: recent.roundsPlayed
              })
        }
        games={name === gamesText ? null : gamesText}
        isDisabled={isOpeningAny && lineUpOpening !== key}
        isOpening={lineUpOpening === key}
        key={key}
        meta={
          recent === null
            ? roundsText(played.roundCount)
            : face.playedAgo(
                calendarDaysBetween({ from: recent.playedAt, to: shelf.now })
              )
        }
        name={name}
        onOpen={() => {
          void openLineUp({
            evening:
              lineUp.evening === null
                ? savedEveningOfRecent({ name, recent: lineUp.recent })
                : lineUp.evening,
            key
          })
        }}
        star={starOf(lineUp, name)}
      />
    )
  }

  return (
    <LineUpRow
      count={shelf.lineUps.length}
      hint={translate('home.yourLineUps.hint')}
      id='own-line-ups'
      title={translate('home.yourLineUps.title')}
    >
      {shelf.lineUps.map(lidOf)}
      {shelf.teachesStar && (
        <li className='star-socket'>
          <span aria-hidden='true' className='hole'>
            <StarIcon />
          </span>
          <p>{translate('home.yourLineUps.starHint')}</p>
        </li>
      )}
    </LineUpRow>
  )
}

const gameOfSavedEntry = (entry: SavedEvening['lineUp'][number]): GameKind =>
  typeof entry === 'string' ? entry : entry.kind
