import type React from 'react'
import { lazy, Suspense, useRef, useState } from 'react'
import { DialogTrigger, Button as ReactAriaButton } from 'react-aria-components'

import { fetchHealth } from '@/infrastructure/api/melee-api'
import { usePathname } from '@/infrastructure/router/navigation'
import { holdWhileReloading } from '@/infrastructure/stale-build'
import { useConnection } from '@/presentation/connection/connection-provider'
import { useI18n } from '@/presentation/i18n/i18n-provider'

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

const preloadLeaflet = (): void => {
  void loadLeaflet()
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
  // Open on one page only: a console handed over becomes the wall under a menu
  // still open on the square that handed it, in front of the whole room.
  const pathname = usePathname()
  const [openOn, setOpenOn] = useState<string | null>(null)

  useMenuWidth(trigger)

  const alert =
    connection === null || connection.status === 'open'
      ? ''
      : translate(connectionStatusKey(connection.status))

  // Asked for on the first open rather than at mount: nobody needs it during a
  // game, and a player waking a sleeping instance would spend their first
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
          onHoverStart={preloadLeaflet}
          onPressStart={preloadLeaflet}
          ref={trigger}
        >
          {connection !== null && <ConnectionDot status={connection.status} />}
          <MenuIcon />
          <span className='trigger-label'>{translate('menu.label')}</span>
        </ReactAriaButton>

        {/* Mounted from the first open on, so a close still plays out. */}
        {hasOpened && (
          <Suspense fallback={null}>
            <LoadedLeaflet build={build} />
          </Suspense>
        )}
      </DialogTrigger>
    </div>
  )
}
