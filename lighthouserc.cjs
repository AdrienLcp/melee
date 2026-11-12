const ORIGIN = 'http://localhost:3100'

/**
 * A code no room is opened under in CI: the player's page loads the same
 * chunks in front of it as in front of a lobby, and asks for no live room.
 * Upper case, because the QR code encodes the link that way (`scannedUrlOf`).
 */
const PLAYER_ARRIVAL = `${ORIGIN}/PLAY/XXXX`

const FRONT_DOORS = ['/en', '/en/blindtest', '/en/credits', '/en/legal']

module.exports = {
  ci: {
    assert: {
      assertMatrix: [
        {
          aggregationMethod: 'median',
          assertions: {
            'categories:accessibility': ['error', { minScore: 1 }],
            'categories:best-practices': ['error', { minScore: 1 }]
          },
          matchingUrlPattern: '.*'
        },
        {
          aggregationMethod: 'median',
          assertions: {
            'categories:seo': ['error', { minScore: 1 }],
            // Opened by the host ahead of the table, once, usually on a
            // machine with time to spare: a regression the size of a library
            // pulled in by mistake still trips it, a feature does not.
            'resource-summary:script:size': [
              'error',
              { maxNumericValue: 330_000 }
            ]
          },
          matchingUrlPattern: `^${ORIGIN}/(en|fr)(/|$)`
        },
        {
          aggregationMethod: 'median',
          assertions: {
            // A scanned QR code on a mid-range phone over a venue's Wi-Fi,
            // with the table waiting: set just above the 432 kB measured on
            // 12/11/2026, so it cannot grow while it is being slimmed.
            'resource-summary:script:size': [
              'error',
              { maxNumericValue: 440_000 }
            ]
          },
          matchingUrlPattern: '/PLAY/'
        }
      ]
    },
    collect: {
      numberOfRuns: 3,
      startServerCommand: 'pnpm --filter @melee/server dev',
      startServerReadyPattern: 'Ready on',
      url: [...FRONT_DOORS.map((path) => `${ORIGIN}${path}`), PLAYER_ARRIVAL]
    },
    upload: {
      outputDir: '.lighthouseci',
      target: 'filesystem'
    }
  }
}
