import type React from 'react'
import { useLayoutEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'

import { NotFoundPage } from '@/features/not-found/not-found-page'
import {
  localeFreePathUnder,
  localeInPath,
  localizedPathFor
} from '@/infrastructure/router/navigation'
import { useI18n } from '@/presentation/i18n/i18n-provider'

/**
 * Sends a page whose URL names no language to the one this device reads in. `/`
 * arrives here as the front door — the URL `hreflang="x-default"` points at, so
 * it has to answer with a language rather than with nothing — and every other
 * path arrives as a link written back when the languages shared one URL.
 */
export const NegotiatedLocaleRedirect: React.FC = () => {
  const { locale } = useI18n()
  const { pathname } = useLocation()

  return <Navigate replace to={localizedPathFor({ locale, pathname })} />
}

/**
 * Wraps every page that names its language, and makes the URL the one that
 * decides: a first segment that is not a locale is a URL from before this stage
 * and takes the negotiated prefix instead of rendering.
 *
 * `useLocation` rather than `useParams`, because a layout route with no path of
 * its own has matched no parameter yet and would read the segment as absent —
 * which here is indistinguishable from a redirect that has to happen, and loops.
 */
export const LocalePrefixedRoutes: React.FC = () => {
  const { pathname } = useLocation()
  const localeInUrl = localeInPath(pathname)
  const { locale, setLocale } = useI18n()

  // Going back across `/fr` → `/en` moves the URL without passing through the
  // control that moved it, so the URL is followed rather than trusted to agree.
  // Before paint, or the language the reader just left shows for a frame.
  useLayoutEffect(() => {
    if (localeInUrl !== null && localeInUrl !== locale) {
      setLocale(localeInUrl)
    }
  }, [locale, localeInUrl, setLocale])

  if (localeInUrl === null) {
    return <NegotiatedLocaleRedirect />
  }

  if (localeFreePathUnder(pathname) !== null) {
    return <LocaleFreeRedirect />
  }

  return <Outlet />
}

/**
 * Drops the language from a room or pairing path written under one. Mounted on
 * both sides, because `/fr/wall` reaches the prefixed branch as a game while
 * `/fr/play/ABCD` matches nothing there and lands on the catch-all.
 */
const LocaleFreeRedirect: React.FC = () => {
  const { hash, pathname, search } = useLocation()
  const localeFreePath = localeFreePathUnder(pathname) ?? pathname

  return <Navigate replace to={{ hash, pathname: localeFreePath, search }} />
}

/** The 404, unless the path is a room's or a pairing's under a language. */
export const UnmatchedPathPage: React.FC = () => {
  const { pathname } = useLocation()

  return localeFreePathUnder(pathname) === null ? (
    <NotFoundPage />
  ) : (
    <LocaleFreeRedirect />
  )
}
