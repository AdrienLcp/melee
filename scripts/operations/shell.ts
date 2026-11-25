import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

export const REPOSITORY_ROOT = fileURLToPath(new URL('../../', import.meta.url))

type CommandOptions = {
  cwd?: string
  env?: NodeJS.ProcessEnv
  input?: string
}

type CommandOutput = {
  ok: boolean
  stdout: string
}

/**
 * Commands go through the platform shell so `pnpm`, `npx`, `bw` and `gh`
 * resolve to their `.cmd` shims on Windows, from PowerShell, cmd and Git Bash.
 */
const spawnInShell = (
  command: string,
  stdio: 'inherit' | 'pipe',
  { cwd = REPOSITORY_ROOT, env = process.env, input }: CommandOptions
) =>
  spawnSync(command, {
    cwd,
    encoding: 'utf8',
    env,
    input,
    shell: true,
    stdio: input === undefined ? stdio : ['pipe', stdio, stdio]
  })

/** Runs `command` with its output on the console; true when it exits with 0. */
export const runCommand = (command: string, options: CommandOptions = {}) =>
  spawnInShell(command, 'inherit', options).status === 0

/** Runs `command` silently and hands back what it printed. */
export const readCommand = (
  command: string,
  options: CommandOptions = {}
): CommandOutput => {
  const result = spawnInShell(command, 'pipe', options)

  return { ok: result.status === 0, stdout: (result.stdout ?? '').trim() }
}

/** Like `readCommand`, but the command can prompt on the terminal: only its stdout is captured. */
export const readCommandAfterPrompt = (
  command: string,
  { env = process.env }: Pick<CommandOptions, 'env'> = {}
): CommandOutput => {
  const result = spawnSync(command, {
    cwd: REPOSITORY_ROOT,
    encoding: 'utf8',
    env,
    shell: true,
    stdio: ['inherit', 'pipe', 'inherit']
  })

  return { ok: result.status === 0, stdout: (result.stdout ?? '').trim() }
}

export const exitWithError = (scope: string, message: string): never => {
  process.stderr.write(`${scope}: ${message}\n`)
  process.exit(1)
}

export const printStep = (scope: string, message: string) => {
  process.stdout.write(`${scope}: ${message}\n`)
}
