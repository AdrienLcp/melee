import type React from 'react'
import { Suspense, use, useEffect, useRef, useState } from 'react'
import { DialogTrigger, Button as ReactAriaButton } from 'react-aria-components'

import { fetchHealth } from '@/infrastructure/api/melee-api'
import { lazyModule } from '@/infrastructure/lazy-module'
import { usePathname } from '@/infrastructure/router/navigation'
import { useConnection } from '@/presentation/connection/connection-provider'
import { useI18n } from '@/presentation/i18n/i18n-provider'
import { useRoomActions } from '@/presentation/room-actions/room-actions-provider'

import type { AppMenuLeaflet, DeployedBuild } from './app-menu-leaflet'
import { ConnectionDot, connectionStatusKey } from './connection-status'
import { MenuIcon } from './shell-icons'
import { Spinner } from './spinner'
import { useMenuWidth } from './use-menu-width'

import './app-menu.sass'

const leafletModule = lazyModule(() => import('./app-menu-leaflet'))

/**
 * The menu itself, read through `lazyModule` rather than `React.lazy`: a lazy
 * component suspends its first render even on a chunk already fetched, and
 * React then holds the content back 300ms behind the empty fallback — the
 * "loads on the first press" the idle fetch alone never cured.
 */
const LoadedLeaflet: React.FC<React.ComponentProps<typeof AppMenuLeaflet>> = (
  props
) => {
  const leaflet = use(leafletModule.load())

  return <leaflet.AppMenuLeaflet {...props} />
}

const seatRowsModule = lazyModule(() => import('./menu-seat-rows'))

/**
 * The seat rows, drawn at once when the idle fetch has landed them, and
 * suspending the whole menu otherwise rather than popping in under it. Only
 * a screen in a room draws them, and its room page has already loaded the
 * pawn picker and the invitation square they are made of.
 */
const LoadedMenuSeatRows: React.FC = () => {
  const { MenuSeatRows } = use(seatRowsModule.load())

  return <MenuSeatRows />
}

const musicChoiceModule = lazyModule(() => import('./menu-music-choice'))

/** The console's choice of soundtrack, under the same rule as the seat rows. */
const LoadedMenuMusicChoice: React.FC = () => {
  const { MenuMusicChoice } = use(musicChoiceModule.load())

  return <MenuMusicChoice />
}

/** The parts a screen's menu draws beside the leaflet every screen has. */
type MenuParts = { hasMusicChoice: boolean; hasSeatRows: boolean }

const loadMenu = async ({
  hasMusicChoice,
  hasSeatRows
}: MenuParts): Promise<void> => {
  await Promise.all([
    leafletModule.load(),
    hasSeatRows ? seatRowsModule.load() : null,
    hasMusicChoice ? musicChoiceModule.load() : null
  ])
}

const isMenuLoaded = ({ hasMusicChoice, hasSeatRows }: MenuParts): boolean =>
  leafletModule.loaded() !== null &&
  (!hasSeatRows || seatRowsModule.loaded() !== null) &&
  (!hasMusicChoice || musicChoiceModule.loaded() !== null)

const preloadMenu = (parts: MenuParts): void => {
  loadMenu(parts).catch(() => undefined)
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
  const [isWaitingForMenu, setIsWaitingForMenu] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const { invitation, pawnRoom, rename, soundtrack } = useRoomActions()
  const hasSeatRows =
    invitation !== null || pawnRoom !== null || rename !== null
  const hasMusicChoice = soundtrack !== null
  // Open on one page only: a console handed over becomes the wall under a menu
  // still open on the square that handed it, in front of the whole room.
  const pathname = usePathname()
  const [openOn, setOpenOn] = useState<string | null>(null)

  useMenuWidth(trigger)

  // Fetched as the page arrives: the press on the menu is often the first
  // thing a hand does on a page, so waiting for a gesture or a quiet moment
  // left that press paying the download — 1.4s on a front door.
  useEffect(() => {
    preloadMenu({ hasMusicChoice, hasSeatRows })
  }, [hasMusicChoice, hasSeatRows])

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
          if (!isOpen) {
            setOpenOn(null)
            return
          }

          if (build === null) {
            void loadBuild()
          }

          const open = () => {
            setOpenOn(pathname)
            setHasOpened(true)
          }

          // Opened once the menu's code is in hand, never on a suspended
          // render: React holds what a fallback stood in for 300ms past it.
          if (isMenuLoaded({ hasMusicChoice, hasSeatRows })) {
            open()
            return
          }

          setIsWaitingForMenu(true)
          void loadMenu({ hasMusicChoice, hasSeatRows })
            .catch(() => undefined)
            .then(() => {
              setIsWaitingForMenu(false)
              open()
            })
        }}
      >
        <ReactAriaButton
          className='trigger'
          isPending={isWaitingForMenu}
          ref={trigger}
        >
          {connection !== null && <ConnectionDot status={connection.status} />}
          <MenuIcon />
          <span className='trigger-label'>
            <span>{translate('menu.label')}</span>
          </span>
          <Spinner />
        </ReactAriaButton>

        {/* Mounted from the first open on, so a close still plays out. */}
        {hasOpened && (
          <Suspense fallback={null}>
            <LoadedLeaflet
              build={build}
              musicChoice={hasMusicChoice ? <LoadedMenuMusicChoice /> : null}
              seatRows={hasSeatRows ? <LoadedMenuSeatRows /> : null}
            />
          </Suspense>
        )}
      </DialogTrigger>
    </div>
  )
}
