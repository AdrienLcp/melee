import { AriaRouterProvider } from '@adrienlcp/react-router'
import type React from 'react'
import { Outlet } from 'react-router'

import { withPageTransition } from '@/infrastructure/router/navigation'
import { AppMenu } from '@/presentation/components/app-menu'
import { SkipLink } from '@/presentation/components/skip-link'
import { ConnectionProvider } from '@/presentation/connection/connection-provider'
import { ReconnectingNotice } from '@/presentation/connection/reconnecting-notice'
import { useResumeLandingArrival } from '@/presentation/landing-arrival'
import { RoomActionsProvider } from '@/presentation/room-actions/room-actions-provider'
import { useFocusMainOnNavigation } from '@/presentation/use-focus-main-on-navigation'
import { usePublishShownHeight } from '@/presentation/use-shown-height'

import './app-shell.sass'

/**
 * The router provider is what makes an `href` on a `Link` a client-side
 * navigation. Without it the browser reloads the page, which on the player
 * screen means dropping the socket and re-claiming the seat.
 */
export const AppShell: React.FC = () => {
  useFocusMainOnNavigation()
  useResumeLandingArrival()
  usePublishShownHeight()

  return (
    <AriaRouterProvider navigateDefaults={withPageTransition}>
      <ConnectionProvider>
        <RoomActionsProvider>
          <div className='app-shell'>
            <SkipLink />
            <AppMenu />
            <Outlet />
            <ReconnectingNotice />
          </div>
        </RoomActionsProvider>
      </ConnectionProvider>
    </AriaRouterProvider>
  )
}
