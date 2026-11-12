import type React from 'react'
import { lazy, Suspense, use, useEffect, useRef, useState } from 'react'
import { DialogTrigger, Button as ReactAriaButton } from 'react-aria-components'

import { fetchHealth } from '@/infrastructure/api/melee-api'
import { onceIdle } from '@/infrastructure/browser'
import { usePathname } from '@/infrastructure/router/navigation'
import { holdWhileReloading } from '@/infrastructure/stale-build'
import { useConnection } from '@/presentation/connection/connection-provider'
import { useI18n } from '@/presentation/i18n/i18n-provider'
import { useRoomActions } from '@/presentation/room-actions/room-actions-provider'

import type { DeployedBuild } from './app-menu-leaflet'
import { ConnectionDot, connectionStatusKey } from './connection-status'
import { MenuIcon } from './icons'
import { useMenuWidth } from './use-menu-width'

import './app-menu.sass'

const loadLeaflet = () => import('./app-menu-leaflet')

const LoadedLeaflet = lazy(
  holdWhileReloading(async () => ({
    default: (await loadLeaflet()).AppMenuLeaflet
  }))
)

type MenuSeatRowsModule = typeof import('./menu-seat-rows')

let loadedSeatRows: MenuSeatRowsModule | null = null
let seatRowsLoading: Promise<MenuSeatRowsModule> | null = null

const importSeatRows = holdWhileReloading(() => import('./menu-seat-rows'))

/**
 * Fetches the menu's seat rows once: a fetch that failed is asked again by the
 * next caller rather than kept as the answer.
 */
const loadMenuSeatRows = (): Promise<MenuSeatRowsModule> => {
  seatRowsLoading ??= importSeatRows().then(
    (rows) => {
      loadedSeatRows = rows
      return rows
    },
    (error: unknown) => {
      seatRowsLoading = null
      throw error
    }
  )

  return seatRowsLoading
}

/**
 * The seat rows, drawn at once when the idle fetch has landed them, and
 * suspending the whole menu otherwise rather than popping in under it. Only
 * a screen in a room draws them, and its room page has already loaded the
 * pawn picker and the invitation square they are made of.
 */
const LoadedMenuSeatRows: React.FC = () => {
  const { MenuSeatRows } = loadedSeatRows ?? use(loadMenuSeatRows())

  return <MenuSeatRows />
}

const preloadMenu = ({ hasSeatRows }: { hasSeatRows: boolean }): void => {
  void loadLeaflet()

  if (hasSeatRows) {
    void loadMenuSeatRows()
  }
}

/**
 * The one piece of chrome on every screen, including the ones a player reaches
 * straight from a QR code: a player who never passes through the home page
 * still needs to switch language, and everyone needs a way out of a room.
 *
 * A healthy socket says nothing beyond the dot on the trigger. Any other state
 * tints the trigger and is announced, and takes no room from the game.
 */
export const AppMenu: React.FC = () => {
  const { translate } = useI18n()
  const connection = useConnection()
  const [build, setBuild] = useState<DeployedBuild | null>(null)
  const [hasOpened, setHasOpened] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const { invitation, pawnRoom, rename } = useRoomActions()
  const hasSeatRows =
    invitation !== null || pawnRoom !== null || rename !== null
  // Open on one page only: a console handed over becomes the wall under a menu
  // still open on the square that handed it, in front of the whole room.
  const pathname = usePathname()
  const [openOn, setOpenOn] = useState<string | null>(null)

  useMenuWidth(trigger)

  // A touch screen has no hover, and a player's first press mid-round waited
  // on twenty chunks with nothing on screen: in a room, the menu is fetched
  // once the page is quiet. A front door waits for the press, which the
  // cached hashed chunks and the seat rows left out make a short wait — and
  // fetching it there unasked cost each front door an eighth of its script.
  useEffect(
    () =>
      hasSeatRows ? onceIdle(() => preloadMenu({ hasSeatRows })) : undefined,
    [hasSeatRows]
  )

  const preload = (): void => {
    preloadMenu({ hasSeatRows })
  }

  const alert =
    connection === null || connection.status === 'open'
      ? ''
      : translate(connectionStatusKey(connection.status))

  // Asked for on the first open, unlike the menu's code: nobody needs it during
  // a game, and a player waking a sleeping instance would spend their first
  // request on this instead of on joining.
  const loadBuild = async (): Promise<void> => {
    const health = await fetchHealth()

    if (health.status === 'success') {
      setBuild({
        commit: health.data.build,
        committedAt: health.data.committedAt
      })
    }
  }

  return (
    <div className='app-menu' data-connection={connection?.status}>
      {/* Always mounted, empty when all is well: a live region that appears
          together with its first message is a message nobody hears. */}
      <p className='alert' role='status'>
        {alert}
      </p>

      <DialogTrigger
        isOpen={openOn === pathname}
        onOpenChange={(isOpen) => {
          setOpenOn(isOpen ? pathname : null)

          if (isOpen) {
            setHasOpened(true)
          }

          if (isOpen && build === null) {
            void loadBuild()
          }
        }}
      >
        <ReactAriaButton
          className='trigger'
          onHoverStart={preload}
          onPressStart={preload}
          ref={trigger}
        >
          {connection !== null && <ConnectionDot status={connection.status} />}
          <MenuIcon />
          <span className='trigger-label'>
            <span>{translate('menu.label')}</span>
          </span>
        </ReactAriaButton>

        {/* Mounted from the first open on, so a close still plays out. */}
        {hasOpened && (
          <Suspense fallback={null}>
            <LoadedLeaflet
              build={build}
              seatRows={hasSeatRows ? <LoadedMenuSeatRows /> : null}
            />
          </Suspense>
        )}
      </DialogTrigger>
    </div>
  )
}
