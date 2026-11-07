import { AriaRouterProvider } from '@adrienlcp/react-router'
import type React from 'react'
import { ViewTransition } from 'react'
import { Outlet } from 'react-router'

import { usePageKey } from '@/infrastructure/router/navigation'
import { AppMenu } from '@/presentation/components/app-menu'
import { SkipLink } from '@/presentation/components/skip-link'
import { ConnectionProvider } from '@/presentation/connection/connection-provider'
import { ReconnectingNotice } from '@/presentation/connection/reconnecting-notice'
import { useResumeLandingArrival } from '@/presentation/landing-arrival'
import { RoomActionsProvider } from '@/presentation/room-actions/room-actions-provider'
import { useFocusMainOnNavigation } from '@/presentation/use-focus-main-on-navigation'
import { usePublishShownViewport } from '@/presentation/use-shown-viewport'

import './app-shell.sass'

/**
 * The router provider is what makes an `href` on a `Link` a client-side
 * navigation. Without it the browser reloads the page, which on the player
 * screen means dropping the socket and re-claiming the seat.
 *
 * A change of page is a view transition React starts around the outlet: the
 * page left lifts off above the one arriving (`page-leaving` and
 * `page-arriving` in `globals.sass`), and nothing else on a page animates
 * through it (`default='none'`).
 */
export const AppShell: React.FC = () => {
  const pageKey = usePageKey()
  useFocusMainOnNavigation()
  useResumeLandingArrival()
  usePublishShownViewport()

  return (
    <AriaRouterProvider>
      <ConnectionProvider>
        <RoomActionsProvider>
          <div className='app-shell'>
            <SkipLink />
            <AppMenu />
            <ViewTransition
              default='none'
              enter='page-arriving'
              exit='page-leaving'
              key={pageKey}
            >
              <Outlet />
            </ViewTransition>
            <ReconnectingNotice />
          </div>
        </RoomActionsProvider>
      </ConnectionProvider>
    </AriaRouterProvider>
  )
}
