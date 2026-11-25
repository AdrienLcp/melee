/** Where the game is hosted. docs/operations/hosting.md describes each piece. */
export const HOSTING = {
  cloudflareAccountId: '431a529079f2d76802b95056e39950f0',
  /** The `adrienlcp.com` zone, home of every personal project. */
  cloudflareZoneId: '7287a21bea71667f9344cb4f80087729',
  githubRepository: 'AdrienLcp/melee',
  /** Deployed by `deploy-production.yaml`, run by hand. */
  productionDomain: 'melee.adrienlcp.com',
  /** Deployed by every green push to `main`: what `pnpm ship` waits for. */
  stagingDomain: 'staging.melee.adrienlcp.com'
} as const
