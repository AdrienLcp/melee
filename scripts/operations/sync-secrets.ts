import { readSecret } from './bitwarden.ts'
import { HOSTING } from './hosting.ts'
import { SECRET_ENTRIES } from './secret-entries.ts'
import { exitWithError, printStep, readCommand, runCommand } from './shell.ts'

/**
 * `pnpm secrets:sync` — writes the repository secrets the CI deploy reads,
 * from the personal Bitwarden account. Run it after renewing a token.
 */

const SCOPE = 'secrets:sync'

const unwrap = (secret: ReturnType<typeof readSecret>) =>
  secret.status === 'success' ? secret.data : exitWithError(SCOPE, secret.error)

const githubToken = unwrap(readSecret(SECRET_ENTRIES.githubToken))
const cloudflareToken = unwrap(readSecret(SECRET_ENTRIES.cloudflareToken))

const githubEnv = { ...process.env, GH_TOKEN: githubToken }

/** The value reaches `gh` on stdin: never on a command line, never printed. */
const setRepositorySecret = (name: string, value: string) => {
  const { ok } = readCommand(
    `gh secret set ${name} -R ${HOSTING.githubRepository}`,
    { env: githubEnv, input: value }
  )
  if (!ok) {
    exitWithError(
      SCOPE,
      `could not set ${name}: does "${SECRET_ENTRIES.githubToken}" still have access to ${HOSTING.githubRepository}?`
    )
  }
  printStep(SCOPE, `${name} set`)
}

setRepositorySecret('CLOUDFLARE_ACCOUNT_ID', HOSTING.cloudflareAccountId)
setRepositorySecret('CLOUDFLARE_API_TOKEN', cloudflareToken)

runCommand(`gh secret list -R ${HOSTING.githubRepository}`, { env: githubEnv })
