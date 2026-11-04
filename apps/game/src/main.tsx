import { StrictMode } from 'react'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'

import { replaceScreen, watchViewTransitions } from '@/infrastructure/browser'
import { listenForInstallPrompt } from '@/infrastructure/install-prompt'
import { routes } from '@/infrastructure/router/routes'
import { reloadOnStaleBuild } from '@/infrastructure/stale-build'
import { AppProviders } from '@/presentation/app-providers'
import { i18n } from '@/presentation/i18n/i18n'
import { applyInitialLocale } from '@/presentation/i18n/initial-locale'
import { holdLandingArrival } from '@/presentation/landing-arrival'
import { RouteFallback } from '@/presentation/route-fallback'

import '@/presentation/styles/globals.sass'

reloadOnStaleBuild()
listenForInstallPrompt()
watchViewTransitions()

// Before `root.render`, because the attribute has to be right before there is
// any text on the page for a browser to sniff.
const initialLocale = applyInitialLocale()

// A failed load leaves the page in English, which is what it would show anyway.
await i18n.load(initialLocale).catch(() => undefined)

const container = document.getElementById('root')

if (container == null) {
  throw new Error('Missing #root in index.html')
}

const router = createBrowserRouter(routes)

holdLandingArrival()

/**
 * `createRoot` over the prerendered markup rather than `hydrateRoot`, and that
 * is a decision rather than an oversight. The document is written at build time
 * and cannot know this device's theme, which is read from storage at first
 * render — hydrating would either mismatch on every load or push the theme into
 * an effect, which is a flash of the wrong palette on every page instead of
 * none. Nothing on these pages comes from a loader, so hydration would buy the
 * reuse of a few dozen nodes and nothing else.
 */
const root = createRoot(container)

const App: React.FC = () => (
  <StrictMode>
    <AppProviders locale={initialLocale}>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>
)

const Loading: React.FC = () => (
  <StrictMode>
    <AppProviders locale={initialLocale}>
      <RouteFallback />
    </AppProviders>
  </StrictMode>
)

const renderApp = (): void => {
  root.render(<App />)
}

const whenRouterInitialized = (then: () => void): void => {
  const unsubscribe = router.subscribe((state) => {
    if (state.initialized) {
      unsubscribe()
      then()
    }
  })
}

/**
 * A prerendered document is already showing this page, and React's first commit
 * cannot: every route is `lazy`, so until the chunk resolves the router is
 * uninitialized and would render `RouteFallback` over it. Measured on the home
 * page at 200 ms of loader replacing a page painted at 456 ms — throwing away
 * the paint the document was written to make.
 *
 * Waiting costs nothing there, because what it waits behind is the screen being
 * rendered. A room is the other case and needs the opposite: `/host/:code` and
 * the `/play/:code` a QR code lands on are served the empty SPA fallback, so
 * `#root` has no children, and the loader is the only thing that screen has to
 * show. It is rendered here rather than by the router, so the page replacing it
 * is one screen change: the loader fades over the page being laid down, where
 * the router's swap cut it out.
 */
if (router.state.initialized) {
  renderApp()
} else if (container.hasChildNodes()) {
  whenRouterInitialized(renderApp)
} else {
  root.render(<Loading />)
  whenRouterInitialized(() => {
    replaceScreen(() => {
      flushSync(renderApp)
    })
  })
}
