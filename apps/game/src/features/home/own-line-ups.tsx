import type React from 'react'
import { useEffect, useRef, useState } from 'react'

import {
  gamesOfPlayedLineUp,
  type HomeLineUp,
  homeLineUps,
  isSameLineUp,
  type PlayedLineUp,
  type RecentTable,
  savedEveningOfRecent,
  withoutTablesOf,
  withTablePlayed
} from '@melee/core/room/recent-tables'
import { isSameName, type SavedEvening } from '@melee/core/room/saved-evening'

import { useSavedEvenings } from '@/features/host/use-saved-evenings'
import { viewportWidth } from '@/infrastructure/browser'
import { calendarDaysBetween, nowMs } from '@/infrastructure/clock'
import {
  readStoredRecentTables,
  writeStoredOwnLineUpsHeight,
  writeStoredRecentTables
} from '@/infrastructure/storage/preferences-storage'
import { Button } from '@/presentation/components/button'
import { StarIcon } from '@/presentation/components/icons'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { useIsPrerendering } from '@/presentation/use-is-prerendering'

import {
  LineUpTicket,
  type TicketRemoval,
  type TicketStar
} from './line-up-ticket'
import type { CreateRoom } from './use-create-room'
import { useLineUpFace } from './use-line-up-face'
import { type Fold, useUnfoldingList } from './use-unfolding-list'

import './own-line-ups.sass'

/** How many tickets the folded row shows before _and N more_. */
const TICKETS_SHOWN_FOLDED = 6

/**
 * The fewest a fold may hide: a press revealing a single ticket takes as
 * much room as the ticket itself.
 */
const FEWEST_TICKETS_FOLDED = 2

type OwnLineUpsProps = {
  /** The home page's one room opener, shared with every ticket and the door. */
  createRoom: CreateRoom
}

const storedRecents = (): readonly RecentTable[] => {
  const stored = readStoredRecentTables()

  return stored.status === 'success' ? stored.data : []
}

/** What removing a ticket forgot, kept for as long as the page offers it back. */
type Removal = {
  /** The saved line-up it forgot, or `null` when it was not starred. */
  kept: SavedEvening | null
  tables: readonly RecentTable[]
}

const hiddenCountOf = (lineUps: number): number =>
  lineUps - TICKETS_SHOWN_FOLDED >= FEWEST_TICKETS_FOLDED
    ? lineUps - TICKETS_SHOWN_FOLDED
    : 0

type OwnLineUpsHeadingProps = {
  /** The served page's copy, which names nothing: the app's own row carries the ids. */
  isHeld: boolean
}

const OwnLineUpsHeading: React.FC<OwnLineUpsHeadingProps> = ({ isHeld }) => {
  const translate = useTranslate()

  return (
    <div className='shelf-heading'>
      <h2
        className='shelf-title'
        id={isHeld ? undefined : 'own-line-ups-title'}
      >
        {translate('home.yourLineUps.title')}
      </h2>
      <p className='shelf-hint' id={isHeld ? undefined : 'own-line-ups-hint'}>
        {translate('home.yourLineUps.hint')}
      </p>
    </div>
  )
}

/** Remembers how tall the folded tickets are drawn, for the next visit's served page to hold. */
const useFoldedHeightRemembered = ({
  fold,
  list
}: {
  fold: Fold
  list: React.RefObject<HTMLOListElement | null>
}) => {
  useEffect(() => {
    const element = list.current

    if (fold !== 'folded' || element === null) {
      return
    }

    let frame = 0
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        writeStoredOwnLineUpsHeight({
          height: element.getBoundingClientRect().height,
          width: viewportWidth()
        })
      })
    })

    observer.observe(element)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [fold, list])
}

/**
 * The host's own line-ups, one paper ticket each: the ones they starred
 * first, then the tables this device played, latest first — a line-up starred
 * and played shows once, as the saved one, with when it was last played.
 * Absent until there is one.
 *
 * The tickets wrap, and past the first six the row folds: _and N more_
 * unfolds the rest in place. The order is dealt once, as the page opens: a
 * star pressed here takes or gives back the line-up's place on the next
 * visit, so no ticket moves under the finger. A row of plays with no saved
 * line-up in it ends on an empty socket that says what the star is for.
 *
 * The served page cannot know any of them, so it is written with the row
 * held open and empty: shown only when the script ahead of the first paint
 * finds line-ups stored, and as tall as the folded tickets were last drawn at
 * that width, so they land in it rather than pushing the page down when the
 * app arrives.
 */
export const OwnLineUps: React.FC<OwnLineUpsProps> = ({ createRoom }) => {
  const isPrerendering = useIsPrerendering()

  if (isPrerendering) {
    return (
      <section aria-hidden='true' className='own-line-ups' data-held>
        <OwnLineUpsHeading isHeld />
        <ol className='tickets' />
      </section>
    )
  }

  return <OwnTickets createRoom={createRoom} />
}

const OwnTickets: React.FC<OwnLineUpsProps> = ({ createRoom }) => {
  const translate = useTranslate()
  const face = useLineUpFace()
  const saved = useSavedEvenings()
  const listRef = useRef<HTMLOListElement>(null)
  const pressRef = useRef<HTMLButtonElement>(null)
  const { fold, hasUnfolded, toggle } = useUnfoldingList({
    list: listRef,
    press: pressRef
  })
  const [removals, setRemovals] = useState<
    Readonly<Partial<Record<string, Removal>>>
  >({})
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

  useFoldedHeightRemembered({ fold, list: listRef })

  if (shelf.lineUps.length === 0) {
    return null
  }

  const hiddenCount = hiddenCountOf(shelf.lineUps.length)

  const keptAs = (lineUp: PlayedLineUp): SavedEvening | undefined =>
    saved.evenings.find((evening) =>
      isSameLineUp({ left: evening, right: lineUp })
    )

  const starOf = (lineUp: HomeLineUp, name: string): TicketStar => {
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

  const removalOf = (lineUp: HomeLineUp, key: string): TicketRemoval => {
    const played: PlayedLineUp = lineUp.evening ?? lineUp.recent

    return {
      isRemoved: removals[key] !== undefined,
      onPutBack: () => {
        const removal = removals[key]

        if (removal === undefined) {
          return
        }

        writeStoredRecentTables(
          removal.tables.reduce(
            (recents, table) => withTablePlayed({ recents, table }),
            storedRecents()
          )
        )

        if (removal.kept !== null) {
          saved.save(removal.kept)
        }

        setRemovals((current) =>
          Object.fromEntries(
            Object.entries(current).filter(([removed]) => removed !== key)
          )
        )
      },
      onRemove: () => {
        const recents = storedRecents()
        const kept = keptAs(played) ?? null

        writeStoredRecentTables(withoutTablesOf({ lineUp: played, recents }))

        if (kept !== null) {
          saved.forget(kept.name)
        }

        setRemovals((current) => ({
          ...current,
          [key]: {
            kept,
            tables: recents.filter((recent) =>
              isSameLineUp({ left: recent, right: played })
            )
          }
        }))
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

  const ticketOf = (lineUp: HomeLineUp, index: number) => {
    const played: PlayedLineUp = lineUp.evening ?? lineUp.recent
    const name = nameOf(lineUp, face.gamesText(gamesOfPlayedLineUp(played)))
    const { recent } = lineUp
    const key =
      lineUp.evening === null
        ? `recent:${lineUp.recent.roomCode}`
        : `evening:${lineUp.evening.name}`
    const unfoldOrder = index - TICKETS_SHOWN_FOLDED

    return (
      <LineUpTicket
        isDisabled={isOpeningAny && lineUpOpening !== key}
        isOpening={lineUpOpening === key}
        key={key}
        meta={
          recent === null
            ? null
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
        removal={removalOf(lineUp, key)}
        star={starOf(lineUp, name)}
        unfolding={
          hiddenCount > 0 && unfoldOrder >= 0
            ? { fromEnd: hiddenCount - 1 - unfoldOrder, order: unfoldOrder }
            : null
        }
      />
    )
  }

  return (
    <section
      aria-describedby='own-line-ups-hint'
      aria-labelledby='own-line-ups-title'
      className='own-line-ups'
    >
      <OwnLineUpsHeading isHeld={false} />
      <ol
        aria-labelledby='own-line-ups-title'
        className='tickets'
        data-fold={fold}
        id='own-line-ups-list'
        ref={listRef}
      >
        {shelf.lineUps.map(ticketOf)}
        {hiddenCount > 0 && (
          <li
            className='unfold'
            data-refolded={(hasUnfolded && fold === 'folded') || undefined}
            style={{ '--unfold-order': hiddenCount }}
          >
            <Button
              aria-controls='own-line-ups-list'
              aria-expanded={fold !== 'folded'}
              onPress={toggle}
              ref={pressRef}
              size='small'
              variant='underlined'
            >
              {fold === 'folded'
                ? translate('home.yourLineUps.more', { count: hiddenCount })
                : translate('home.yourLineUps.fewer')}
            </Button>
          </li>
        )}
        {shelf.teachesStar && (
          <li className='star-socket'>
            <span aria-hidden='true' className='hole'>
              <StarIcon />
            </span>
            <p>{translate('home.yourLineUps.starHint')}</p>
          </li>
        )}
      </ol>
    </section>
  )
}
