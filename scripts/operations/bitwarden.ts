import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

import { Result } from '@adrienlcp/result'

import { readCommand, readCommandAfterPrompt } from './shell.ts'

/**
 * The personal account's own Bitwarden CLI profile. On a machine whose default
 * profile is logged in to another account, the personal one lives here, and
 * the scripts never touch the default.
 */
export const PERSONAL_PROFILE_DIR = join(homedir(), 'bitwarden-personal')

const SETUP_DOC = 'docs/operations/secrets.md'

/** `BITWARDENCLI_APPDATA_DIR` if set, else the personal profile if it exists, else the CLI's default. */
const resolveProfileDir = () => {
  const configured = process.env.BITWARDENCLI_APPDATA_DIR
  if (configured) return configured

  return existsSync(PERSONAL_PROFILE_DIR) ? PERSONAL_PROFILE_DIR : undefined
}

const profileDir = resolveProfileDir()
const profileLabel = profileDir ?? 'the default Bitwarden CLI profile'

const profileEnv = (session: string | undefined): NodeJS.ProcessEnv => ({
  ...process.env,
  ...(profileDir && { BITWARDENCLI_APPDATA_DIR: profileDir }),
  ...(session && { BW_SESSION: session })
})

type VaultStatus = 'locked' | 'unauthenticated' | 'unknown' | 'unlocked'

const isVaultStatus = (value: unknown): value is VaultStatus =>
  value === 'locked' || value === 'unauthenticated' || value === 'unlocked'

const readVaultStatus = (session: string | undefined): VaultStatus => {
  const { ok, stdout } = readCommand('bw status --nointeraction', {
    env: profileEnv(session)
  })
  if (!ok) return 'unknown'

  const status = stdout.match(/"status":"(\w+)"/)?.[1]

  return isVaultStatus(status) ? status : 'unknown'
}

/** Asks for the master password on the terminal, once per run. */
const unlockVault = (): Result<string, string> => {
  if (!process.stdin.isTTY) {
    return Result.failure(
      `Bitwarden is locked (${profileLabel}) and there is no terminal to ask the master password: set BW_SESSION, see ${SETUP_DOC}`
    )
  }

  process.stderr.write(`Bitwarden: unlocking ${profileLabel}\n`)
  const { ok, stdout } = readCommandAfterPrompt('bw unlock --raw', {
    env: profileEnv(undefined)
  })

  return ok && stdout
    ? Result.success(stdout)
    : Result.failure('Bitwarden did not unlock: wrong master password?')
}

let cachedSession: string | undefined = process.env.BW_SESSION

type VaultSession = {
  token: string | undefined
}

const openSession = (): Result<VaultSession, string> => {
  const status = readVaultStatus(cachedSession)

  if (status === 'unlocked') return Result.success({ token: cachedSession })
  if (status === 'unknown') {
    return Result.failure(
      `the Bitwarden CLI did not answer: is it installed (\`pnpm add -g @bitwarden/cli\`)? See ${SETUP_DOC}`
    )
  }
  if (status === 'unauthenticated') {
    return Result.failure(
      `Bitwarden is logged out (${profileLabel}): log in once, see ${SETUP_DOC}`
    )
  }

  const unlocked = unlockVault()
  if (unlocked.status === 'failure') return unlocked
  cachedSession = unlocked.data

  return Result.success({ token: cachedSession })
}

const getPassword = (entry: string, session: string | undefined) =>
  readCommand(`bw get password "${entry}" --nointeraction`, {
    env: profileEnv(session)
  })

/**
 * Reads the password field of a Bitwarden entry of the personal account.
 * The value goes from the CLI to the caller: never printed, never written.
 */
export const readSecret = (entry: string): Result<string, string> => {
  process.stderr.write(`Bitwarden: reading "${entry}" from ${profileLabel}\n`)
  const session = openSession()
  if (session.status === 'failure') return session

  const { token } = session.data
  const found = getPassword(entry, token)
  if (found.ok && found.stdout) return Result.success(found.stdout)

  readCommand('bw sync --nointeraction', { env: profileEnv(token) })
  const afterSync = getPassword(entry, token)

  return afterSync.ok && afterSync.stdout
    ? Result.success(afterSync.stdout)
    : Result.failure(
        `no Bitwarden entry named "${entry}" with a password in ${profileLabel}: see ${SETUP_DOC}`
      )
}
