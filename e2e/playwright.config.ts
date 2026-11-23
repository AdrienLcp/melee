import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { defineConfig, devices } from '@playwright/test'

import { E2E_PORTS } from './support/worktree-ports.ts'

/**
 * Its own ports, never the dev stack's: an end-to-end run must not borrow a
 * server someone left running against the real catalogue, and it must not take
 * the ports of one they are still using — nor another worktree's run.
 */
const APP_PORT = E2E_PORTS.app
const SERVER_PORT = E2E_PORTS.server
const CATALOGUE_PORT = E2E_PORTS.catalogue

// `127.0.0.1`, not `localhost`: the Worker is bound to IPv4 only, and the
// readiness probe resolves `localhost` to `::1` first and never falls back.
const APP_URL = `http://127.0.0.1:${APP_PORT}`
const CATALOGUE_URL = `http://127.0.0.1:${CATALOGUE_PORT}`
const SERVER_URL = `http://127.0.0.1:${SERVER_PORT}`

const WORKER_STATE = mkdtempSync(join(tmpdir(), 'melee-e2e-'))

const LAYOUT_SPECS = 'choice-fits.spec.ts'

const CHROMIUM = {
  ...devices['Desktop Chrome'],
  // The room plays a clip at a stored volume defaulting to 80%, and a run
  // started headed would play it out loud. Muted at the process rather than
  // through the store, so no journey can forget.
  launchOptions: { args: ['--mute-audio'] },
  // Pinned: the locators read accessible names, and those are translated.
  locale: 'en-US'
}

export default defineConfig({
  expect: { timeout: 10_000 },
  forbidOnly: Boolean(process.env.CI),
  // Lets `--shard` split a spec by test rather than by file: CI spreads
  // `choice-fits` over several runners, and over every worker of each.
  fullyParallel: true,
  // Runs once the three servers answer: the app's modules are compiled before
  // the first test asks for them.
  globalSetup: './support/warm-app.ts',
  // Explicit, or a run started from the repository root drops `test-results/`
  // there rather than beside the specs — which is the one thing moving this
  // config into `e2e/` was for.
  outputDir: './test-results',
  // Journeys first: workers take tests in project order, and listed second
  // they waited for every layout test before starting, one at a time.
  projects: [
    {
      name: 'journeys',
      testIgnore: LAYOUT_SPECS,
      use: CHROMIUM,
      // One server process holds every room, and one journey asserts that a
      // given code is held by nobody. Two of them at once could invent exactly
      // that code. CI runs them in parallel by `--shard` instead, each shard
      // with servers of its own.
      workers: 1
    },
    {
      // Answers its socket in the page and never opens a room on the server,
      // so its tests share nothing and take every worker the machine has.
      name: 'layouts',
      testMatch: LAYOUT_SPECS,
      use: CHROMIUM
    }
  ],
  reporter: 'list',
  testDir: '.',
  timeout: 60_000,
  use: { baseURL: APP_URL, trace: 'retain-on-failure' },
  webServer: [
    {
      command: 'pnpm exec tsx support/deezer-stub.ts',
      reuseExistingServer: false,
      url: `${CATALOGUE_URL}/chart/0/tracks`
    },
    {
      // The Worker under the Workers runtime, so every journey crosses the
      // Durable Object the deployed room lives in. A state directory of the
      // run's own, or a room from the last run would still hold its code.
      command: [
        `pnpm --filter @melee/server exec wrangler d1 migrations apply OBSERVABILITY --local --persist-to ${WORKER_STATE} &&`,
        'pnpm --filter @melee/server exec wrangler dev',
        `--ip 127.0.0.1 --port ${SERVER_PORT}`,
        `--persist-to ${WORKER_STATE}`,
        `--var ALLOWED_ORIGINS:${APP_URL}`,
        `--var DEEZER_API_URL:${CATALOGUE_URL}`
      ].join(' '),
      reuseExistingServer: false,
      timeout: 120_000,
      // Any room code answers `{ exists: false }`, which is all a probe needs.
      url: `${SERVER_URL}/api/rooms/AAAA`
    },
    {
      command: 'pnpm --filter @melee/game dev',
      env: {
        VITE_DEV_PORT: String(APP_PORT),
        VITE_SERVER_ORIGIN: SERVER_URL
      },
      reuseExistingServer: false,
      timeout: 120_000,
      url: APP_URL
    }
  ]
})
