import type React from 'react'
import { useEffect, useState } from 'react'
import { useRouteError } from 'react-router'

import { fetchHealth } from '@/infrastructure/api/melee-api'
import { reloadPage } from '@/infrastructure/browser'
import { reportUnrenderedError } from '@/infrastructure/diagnostics'
import { homePathFor } from '@/infrastructure/router/navigation'
import { Button } from '@/presentation/components/button'
import { Link } from '@/presentation/components/link'
import { Main } from '@/presentation/components/main'
import { useI18n, useTranslate } from '@/presentation/i18n/i18n-provider'

import './error-screen.sass'
import unstyledFallback from './error-screen-fallback.css?raw'

/** `TypeError: e.toSorted is not a function` — what a person reads out to us. */
const describe = (error: unknown): string =>
  error instanceof Error ? `${error.name}: ${error.message}` : String(error)

/** The deployed build, so a report names the code that failed; `null` until it answers. */
const useDeployedBuild = (): string | null => {
  const [build, setBuild] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    void fetchHealth({ signal: controller.signal }).then((health) => {
      if (health.status === 'success') {
        setBuild(health.data.build)
      }
    })

    return () => {
      controller.abort()
    }
  }, [])

  return build
}

/**
 * The root route's boundary, so anything that throws below it — a render, a
 * lazy chunk, a router loader — lands here instead of on a white page.
 *
 * It replaces the shell rather than sitting inside it: the menu reads a
 * connection a broken screen may no longer have, and a fallback that renders
 * chrome it cannot trust is a second crash waiting to happen.
 *
 * **Reload, not retry.** The most likely way to reach this screen is a lazy
 * chunk that no longer exists because the site redeployed under an open tab,
 * and re-rendering asks for the same missing file. A "try again" that cannot
 * work is worse than one button that does.
 *
 * It carries its own few rules for a browser that read none of the
 * stylesheets, and prints the error and the build at its foot, because a
 * screen nobody can describe is a bug nobody can fix.
 */
export const ErrorScreen: React.FC = () => {
  const { locale } = useI18n()
  const translate = useTranslate()
  const error = useRouteError()
  const build = useDeployedBuild()

  reportUnrenderedError(error)

  return (
    <Main className='error-screen'>
      <style>{unstyledFallback}</style>
      <h1>{translate('error.screen.title')}</h1>
      <p>{translate('error.screen.description')}</p>
      <div className='ways-out'>
        <Button onPress={reloadPage} size='large'>
          {translate('error.screen.reload')}
        </Button>
        <Link href={homePathFor(locale)} variant='underlined'>
          {translate('menu.home')}
        </Link>
      </div>
      <p className='report'>
        <span>{translate('error.screen.report')}</span>
        <code>
          {build === null
            ? describe(error)
            : `${translate('error.screen.build', { build })} · ${describe(error)}`}
        </code>
      </p>
    </Main>
  )
}
