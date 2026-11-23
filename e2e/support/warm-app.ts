import { readdirSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

import { E2E_PORTS } from './worktree-ports.ts'

const APP_ROOT = resolve(import.meta.dirname, '..', '..', 'apps', 'game')
const SOURCE_ROOT = join(APP_ROOT, 'src')

const MODULE_PATTERN = /\.(sass|ts|tsx)$/
const SKIPPED_PATTERN = /\.(d|test)\.tsx?$/

const CONCURRENT_REQUESTS = 8

/** A partial only compiles inside the stylesheet that `@use`s it. */
const isPartial = (fileName: string): boolean => fileName.startsWith('_')

const sourceModules = (): string[] =>
  readdirSync(SOURCE_ROOT, { recursive: true, withFileTypes: true })
    .filter(
      (entry) =>
        entry.isFile() &&
        MODULE_PATTERN.test(entry.name) &&
        !SKIPPED_PATTERN.test(entry.name) &&
        !isPartial(entry.name)
    )
    .map(
      (entry) =>
        `/${relative(APP_ROOT, join(entry.parentPath, entry.name)).replaceAll('\\', '/')}`
    )

/**
 * Has Vite transform every module of the app before the first test runs.
 * Vite compiles a module on its first request, React Compiler included, and
 * on a machine running other sessions' suites the first visit to a route
 * took longer than the test's own timeout: the first spec of a run failed
 * on a page still saying _Loading…_, and passed on every later visit.
 * A status is not checked — a module no page imports alone may refuse to be
 * served alone, and the browser will ask for it the way the app does.
 */
const warmApp = async (): Promise<void> => {
  const pending = sourceModules()
  const origin = `http://127.0.0.1:${E2E_PORTS.app}`

  const drain = async (): Promise<void> => {
    for (let path = pending.pop(); path !== undefined; path = pending.pop()) {
      const response = await fetch(`${origin}${path}`)
      await response.arrayBuffer()
    }
  }

  await Promise.all(Array.from({ length: CONCURRENT_REQUESTS }, drain))
}

export default warmApp
